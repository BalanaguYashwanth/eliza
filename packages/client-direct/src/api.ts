import dotenv from "dotenv";
dotenv.config();
import "reflect-metadata";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import {
    AgentRuntime,
    elizaLogger,
    validateCharacterConfig,
} from "@ai16z/eliza";
import { REST, Routes } from "discord.js";
import {
    getOwnerWalletAddress,
    hasUserExists,
    runPipelineInWorker,
} from "./scrapeTwitter/utils";
import { OWNER_TYPE } from "./config/constantTypes";
import { TokenService } from "./services/tokenServices";
import {
    buyToken,
    createToken,
    createWallet,
    sellToken,
    transferSol,
} from "./api/contract.action";
import createAndSaveFarcasterAccountAndWallet from "./createFarcaster/createFarcasterAccount";
import { getUserByFid, getWalletByOwnerId, saveToken, saveUser, saveWallet } from "./dbHandler";
import { checkAvailableFid } from "./api/farcaster.action";
import { getRandomFid } from "./api/farcaster.action";
import FarcasterAccountService from "./services/farcasterAccountService";

export function createApiRouter(
    agents: Map<string, AgentRuntime>,
    directClient
) {
    const router = express.Router();

    router.use(cors());
    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded({ extended: true }));

    router.get("/", (req, res) => {
        res.send("Welcome, this is the REST API!");
    });

    router.get("/hello", (req, res) => {
        res.json({ message: "Hello World!" });
    });

    router.get("/agents", (req, res) => {
        const agentsList = Array.from(agents.values()).map((agent) => ({
            id: agent.agentId,
            name: agent.character.name,
            clients: Object.keys(agent.clients),
        }));
        res.json({ agents: agentsList });
    });

    router.get("/agents/:agentId", (req, res) => {
        const agentId = req.params.agentId;
        const agent = agents.get(agentId);

        if (!agent) {
            res.status(404).json({ error: "Agent not found" });
            return;
        }

        res.json({
            id: agent.agentId,
            character: agent.character,
        });
    });

    router.post("/agents/:agentId/set", async (req, res) => {
        const agentId = req.params.agentId;
        let agent: AgentRuntime = agents.get(agentId);

        // update character
        if (agent) {
            // stop agent
            agent.stop();
            directClient.unregisterAgent(agent);
            // if it has a different name, the agentId will change
        }

        // load character from body
        const character = req.body;
        try {
            validateCharacterConfig(character);
        } catch (e) {
            elizaLogger.error(`Error parsing character: ${e}`);
            res.status(400).json({
                success: false,
                message: e.message,
            });
            return;
        }

        // start it up (and register it)
        agent = await directClient.startAgent(character);
        elizaLogger.log(`${character.name} started`);

        res.json({
            id: character.id,
            character: character,
        });
    });

    router.get("/agents/:agentId/channels", async (req, res) => {
        const agentId = req.params.agentId;
        const runtime = agents.get(agentId);

        if (!runtime) {
            res.status(404).json({ error: "Runtime not found" });
            return;
        }

        const API_TOKEN = runtime.getSetting("DISCORD_API_TOKEN") as string;
        const rest = new REST({ version: "10" }).setToken(API_TOKEN);

        try {
            const guilds = (await rest.get(Routes.userGuilds())) as Array<any>;

            res.json({
                id: runtime.agentId,
                guilds: guilds,
                serverCount: guilds.length,
            });
        } catch (error) {
            console.error("Error fetching guilds:", error);
            res.status(500).json({ error: "Failed to fetch guilds" });
        }
    });

    const createAndSaveWallet = async ({ownerFk, ownerType}: {ownerFk: bigint, ownerType: OWNER_TYPE}) => {
        const { walletName, walletId, walletAddress } = await createWallet();
        await saveWallet({  ownerFk, ownerType, walletName, walletId, walletAddress });
        return {walletName, walletId, walletAddress};
    }


    const loadBalanceIntoWallet = async ({recipientWalletAddress, senderWalletAddress, amount}: {recipientWalletAddress: string, senderWalletAddress: string, amount: number}) => {
        await transferSol({senderWalletAddress, recipientWalletAddress, amount});
    }

    router.get("/wallet/:id", async (req, res) => {
        if(!req.params.id || !Number(req.params.id)) {
            return res.status(400).json({ error: "Fid is required" });
        }
        const id = Number(req.params.id);
        const user = await getUserByFid(id);
        console.log(user);
        if (!user?.pk) {
            return res.status(404).json({ error: "User not found" });
        }
        const wallet = await getWalletByOwnerId(user?.pk);
        res.json({ walletAddress: wallet?.wallet_address });
    });

    router.post("/launch-agent", async (req, res) => {
        try {
            const { username, name, language, twitterUsername: unOrganizedTwitterUsername, ownerFid } = req.body;
            const twitterUsername = unOrganizedTwitterUsername?.toLowerCase();
            const {ownerWalletAddress, userPk} = await getOwnerWalletAddress({fid: ownerFid});
            const lowerUsername = username?.toLowerCase();

            const fid = await getRandomFid();
            const isNameAvailable = await checkAvailableFid(lowerUsername);
            if (!isNameAvailable) {
                return res.status(400).json({ error: "Name not available" });
            }
            if (!lowerUsername || !name || !language || !twitterUsername) {
                return res
                    .status(400)
                    .json({ error: "All fields are required" });
            }
            const { signer_uuid, agentId } = await createAndSaveFarcasterAccountAndWallet({
                    FID: fid,
                    username: lowerUsername,
                    name,
                    user_fk: BigInt(userPk)
                });
            const wallet = await createAndSaveWallet({ownerFk: BigInt(agentId), ownerType: OWNER_TYPE.FARCASER_ACCOUNT});
            await loadBalanceIntoWallet({recipientWalletAddress: wallet.walletAddress, senderWalletAddress: ownerWalletAddress, amount: 0.1});
            const { txHash, mint, listing, mintVault, solVault, seed } =
                await createToken({ solAddress: wallet.walletAddress });
            await saveToken({
                farcasterAccountFk: BigInt(agentId),
                txHash,
                mint,
                listing,
                mintVault,
                solVault,
                seed,
                walletAddress: wallet.walletAddress,
            });
            runPipelineInWorker({
                username: lowerUsername,
                name,
                language,
                twitterUsername,
                signerUuid: signer_uuid,
                fid,
            });
            res.json({
                message:
                    "Agent launched successfully, Wait for few minutes to complete the process",
            });
        } catch (error) {
            console.error("Error: ", error);
            return res.status(500).json({ error: "Something went wrong" });
        }
    });

    router.post("/create-user", async (req, res) => {
        try {
            const { fid, username } = req.body;
            if (await hasUserExists(fid)) {
                return res.status(200).json({ status: "already exists" });
            }
            const { walletName, walletId, walletAddress } = await createWallet();
            const user = await saveUser({ fid, username });
            await saveWallet({ ownerFk: user.pk, ownerType: OWNER_TYPE.USER, walletName, walletId, walletAddress });
            return res.status(200).json({ status: "created" });
        } catch (error) {
            return res
                .status(400)
                .json({ error: error.message || "something went wrong" });
        }
    });

    router.post("/sell-token", async (req, res) => {
        const { fid, amount } = req.body;
        await sellToken({ fid, amount });
        return res.status(200).json({ message: "Token sold successfully" });
    });

    router.post("/buy-token", async (req, res) => {
        const { agentFid, ownerFid, amount } = req.body;
        await buyToken({ agentFid, ownerFid, amount });
        return res.status(200).json({ message: "Token bought successfully" });
    });

    router.post("/create-token", async (req, res) => {
        const { listing, mint, mint_vault, sol_vault, seed, user_ata } =
            req.body;
        const tokenService = new TokenService();
        const token = await tokenService.createToken({
            listing,
            mint,
            mint_vault,
            sol_vault,
            seed,
            user_ata,
        });
        return res.status(200).json({ token });
    });

    router.post("/update-token-ata", async (req, res) => {
        const { wallet_address, user_ata } = req.body;
        const tokenService = new TokenService();
        const token = await tokenService.updateTokenAta(
            wallet_address,
            user_ata
        );
        return res.status(200).json({ token });
    });

    router.get("/agent-ids", async (req, res) => {
        const farcasterAccountService = new FarcasterAccountService();
        const data = await farcasterAccountService.getFarcasterAccountIds();
        res.json({ data });
    });

    return router;
}
