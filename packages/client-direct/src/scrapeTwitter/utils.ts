import { Worker } from "worker_threads";
import { PrivyClient } from '@privy-io/server-auth';
import ENV_CONFIG from "../config/env";
import { addAgent } from "../common/api.action";
import { agentTemplate } from "../common/agentTemplate";
import {generateCharacter} from './generateCharacter'
import { UserPrivyWalletService } from "../services/privywalletuserService";

const privy = new PrivyClient(ENV_CONFIG.PRIVY_APP_ID, ENV_CONFIG.PRIVY_APP_SECRET );

export const getJsonl = (jsonlFilePath: string) => {
    const data = fs?.readFileSync(jsonlFilePath, "utf8") as any;
    const result = data
        .split("\n")
        .filter((line) => line.trim() !== "") // Remove empty lines
        .map((line) => JSON.parse(line)); // Parse each line into JSON objects
    return result;
};

const savePrivyUser = async (user) => {
    const userPrivyWallet = new UserPrivyWalletService();
    await userPrivyWallet.createUserPrivyWallet(user)
}

export const getFarcasterWalletAddressFromFid = async (fid) => {
    const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-neynar-experimental': 'false',
          'x-api-key': ENV_CONFIG.FARCASTER_NEYNAR_API_KEY
        }
      };

    const res = await fetch(`${ENV_CONFIG.FARCASTER_HUB_URL}/user/bulk?fids=${fid}`, options)
    const data = await res.json();
    return data;
}

export const createEmbeddedWallet = async ({type, username, fid, ownerAddress, user_db_id}) => {
    const privyUser = await privy.importUser({
        linkedAccounts:[
            {
                type,
                fid,
                ownerAddress,
                username,
            }
        ],
        createSolanaWallet: true,
        customMetadata: {
            username,
            isVerified: true,
          },
    }) as any;
    await savePrivyUser({address: privyUser?.linkedAccounts[0]?.address, privy_id: privyUser.id, chain_type: privyUser?.linkedAccounts[0]?.chainType, user: {id: user_db_id}, fid, chain_id: privyUser?.linkedAccounts[0]?.chainId});
    return privyUser
}

export const runPipelineInWorker = ({ username, name, language, twitterUsername, signerUuid, fid}) => {
    const worker = new Worker(
        `${ENV_CONFIG.FILE_Path}/packages/client-direct/src/scrapeTwitter/pipelineWorker.js`,
        {
            workerData: { username, twitterUsername },
        }
    );

    worker.on("message", async (message) => {
        try {
            //here tweets gets scraped successfully
            if (message.status === "completed") {
                const { createdAt } = message;
                const character = await generateCharacter({username, twitterUsername, name, date: createdAt})
                const newAgent = agentTemplate({
                    name,
                    username,
                    language,
                    farcasterFid: fid,
                    farcasterNeynarSignerUuid: signerUuid,
                    character
                });

                await addAgent(newAgent);
                console.log("successfully added agent");
            } else if (message.status === "failed") {
                console.log("worker failed", message);
            }
        } catch(err){
            console.log("worker agent message error", err);
        }
    });

    worker.on("error", (error) => {
        console.log("worker error;", error);
    });

    worker.on("exit", (code) => {
        if (code !== 0) {
            console.error(`Worker exited with code ${code}`);
        }
    });
};
