import dotenv from "dotenv";
dotenv.config();
import "reflect-metadata";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import {
    AgentRuntime,
    elizaLogger,
    getEnvVariable,
    validateCharacterConfig,
} from "@elizaos/core";

import { REST, Routes } from "discord.js";
import { DirectClient } from ".";
import { stringToUuid } from "@elizaos/core";
import createFarcasterAccount from "./createFarcaster/createFarcasterAccount";
import { checkAvailableFid, getRandomFid } from "./createFarcaster/helper";
import {  createEmbeddedWallet, getFarcasterWalletAddressFromFid, runPipelineInWorker } from "./scrapeTwitter/utils";
import UserService from "./services/userService";


export function createApiRouter(
    agents: Map<string, AgentRuntime>,
    directClient: DirectClient
) {
    const router = express.Router();

    router.use(cors());
    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded({ extended: true }));
    router.use(
        express.json({
            limit: getEnvVariable("EXPRESS_MAX_PAYLOAD") || "100kb",
        })
    );

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
        let agent:AgentRuntime = agents.get(agentId);

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

    router.get("/agents/:agentId/:roomId/memories", async (req, res) => {
        const agentId = req.params.agentId;
        const roomId = stringToUuid(req.params.roomId);
        let runtime = agents.get(agentId);

        // if runtime is null, look for runtime with the same name
        if (!runtime) {
            runtime = Array.from(agents.values()).find(
                (a) => a.character.name.toLowerCase() === agentId.toLowerCase()
            );
        }

        if (!runtime) {
            res.status(404).send("Agent not found");
            return;
        }

        try {
            const memories = await runtime.messageManager.getMemories({
                roomId,
            });
            const response = {
                agentId,
                roomId,
                memories: memories.map((memory) => ({
                    id: memory.id,
                    userId: memory.userId,
                    agentId: memory.agentId,
                    createdAt: memory.createdAt,
                    content: {
                        text: memory.content.text,
                        action: memory.content.action,
                        source: memory.content.source,
                        url: memory.content.url,
                        inReplyTo: memory.content.inReplyTo,
                        attachments: memory.content.attachments?.map(
                            (attachment) => ({
                                id: attachment.id,
                                url: attachment.url,
                                title: attachment.title,
                                source: attachment.source,
                                description: attachment.description,
                                text: attachment.text,
                                contentType: attachment.contentType,
                            })
                        ),
                    },
                    embedding: memory.embedding,
                    roomId: memory.roomId,
                    unique: memory.unique,
                    similarity: memory.similarity,
                })),
            };

            res.json(response);
        } catch (error) {
            console.error("Error fetching memories:", error);
            res.status(500).json({ error: "Failed to fetch memories" });
        }
    });

    router.post("/launch-agent", async (req, res) => {
        try {
            // todo - check the farcaster account is creating on username and training on twitterusername
            const username = req.body?.username?.toLowerCase();
            const { name, language, twitterUsername} = req.body;
            const fid = await getRandomFid();
            const isNameAvailable = await checkAvailableFid(username);
            if (!isNameAvailable) {
                 return res.status(400).json({ error: "Name not available" });
            }
            if(!username || !name || !language || !twitterUsername){
                 return res.status(400).json({ error: "All fields are required" });
            }
            const farcasterAccount = await createFarcasterAccount({
                    FID: fid,
                    username,
                    name
            });
            const signerUuid = farcasterAccount?.signer?.signer_uuid;
            const user_db_id = farcasterAccount?.user_db_id

            const owner = await getFarcasterWalletAddressFromFid(fid)
            const ownerAddress = owner?.users[0]?.custody_address

            runPipelineInWorker({ username, name, language, twitterUsername, signerUuid, fid});
            await createEmbeddedWallet({type: 'farcaster', fid, username, ownerAddress, user_db_id })
            res.json({ message: "Agent launched successfully, Wait for few minutes to complete the process" });
        } catch (error) {
            console.error("Error: ", error);
            return res.status(500).json({ error: "Something went wrong" });
        }
    });


    router.get("/feedIds", async (req, res) => {
        const userService = new UserService();
        const feedIds = await userService.getFeedIds();
        res.json({ feedIds });
    });

    return router;
}
