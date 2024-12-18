import { Worker } from "worker_threads";
import ENV_CONFIG from "../config/env";
import { addAgent } from "../common/api.action";
import { agentTemplate } from "../common/agentTemplate";

export const getJsonl = (jsonlFilePath: string) => {
    const data = fs?.readFileSync(jsonlFilePath, "utf8") as any;
    const result = data
        .split("\n")
        .filter((line) => line.trim() !== "") // Remove empty lines
        .map((line) => JSON.parse(line)); // Parse each line into JSON objects
    return result;
};

export const runPipelineInWorker = ({ username, name, language, bio, lore, signerUuid, fid, twitterUsername}) => {
    const worker = new Worker(
        `${ENV_CONFIG.FILE_Path}/packages/client-direct/src/scrapeTwitter/pipelineWorker.js`,
        {
            workerData: { username: twitterUsername },
        }
    );

    worker.on("message", async (message) => {
        try {
            if (message.status === "completed") {
                const { result } = message;
                const newAgent = agentTemplate({
                    name,
                    username,
                    language,
                    farcasterFid: fid,
                    farcasterNeynarSignerUuid: signerUuid,
                    finetuningData: result,
                    bio,
                    lore,
                });
                const response = await addAgent(newAgent);
                console.log("successfully added agent", response);
            } else if (message.status === "failed") {
                console.log("worker failed", message);
            }
        } catch(err){
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
