import { generateCharacter } from "./generateCharacter";
import { Worker } from "worker_threads";
import ENV_CONFIG from "../config/env";
import { addAgent } from "../api/external.action";
import { agentTemplate } from "../common/agentTemplate";
import { PrivyClient } from "@privy-io/server-auth";
import { UserService } from "../services/userService";
import { getWalletByOwnerId } from "../dbHandler";
import { getUserByFid } from "../dbHandler";

export const getJsonl = (jsonlFilePath: string) => {
    const data = fs?.readFileSync(jsonlFilePath, "utf8") as any;
    const result = data
        .split("\n")
        .filter((line) => line.trim() !== "") // Remove empty lines
        .map((line) => JSON.parse(line)); // Parse each line into JSON objects
    return result;
};

export const runPipelineInWorker = ({
    username,
    name,
    language,
    signerUuid,
    fid,
    twitterUsername,
}) => {
    const worker = new Worker(
        `${ENV_CONFIG.FILE_Path}/packages/client-direct/src/scrapeTwitter/pipelineWorker.js`,
        {
            workerData: { username, twitterUsername },
        }
    );

    worker.on("message", async (message) => {
        try {
            if (message.status === "completed") {
                const { createdAt } = message;
                //todo - don't save character in file path once it pushed to db
                const character = await generateCharacter({
                    username,
                    twitterUsername,
                    name,
                    date: createdAt,
                });
                const newAgent = agentTemplate({
                    name,
                    username,
                    language,
                    farcasterFid: fid,
                    farcasterNeynarSignerUuid: signerUuid,
                    character,
                });
                const response = await addAgent(newAgent);
                console.log("successfully added agent", response);
            } else if (message.status === "failed") {
                console.log("worker failed", message);
            }
        } catch (err) {
            console.log("worker agent message error", err);
        }
    });

    worker.on("error", (error) => {
        console.log("worker error", error);
    });

    worker.on("exit", (code) => {
        if (code !== 0) {
            console.error(`Worker exited with code ${code}`);
        }
    });
};

const privy = new PrivyClient(
    ENV_CONFIG.PRIVY_APP_ID,
    ENV_CONFIG.PRIVY_APP_SECRET
);

export const hasUserExists = async (fid: number) => {
    const userService = new UserService();
    const user = await userService.getUserByFid(fid);
    return user?.fid ? true : false;
};


export const getRandomImageUrl = () => {
    return `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 10000)}`;
};

export const getDeadline = () => {
    const now = Math.floor(Date.now() / 1000);
    const oneHour = 60 * 60;
    return BigInt(now + oneHour);
};

export const solToLamports = (sol: number) => sol * 1_000_000_000;


export const getOwnerWalletAddress = async ({fid}: {fid: number}) => {
    const user = await getUserByFid(fid);
    const ownerWallet = await getWalletByOwnerId(user?.pk);
    const ownerWalletAddress = ownerWallet?.wallet_address;
    return {ownerWalletAddress, userPk: user?.pk};
}