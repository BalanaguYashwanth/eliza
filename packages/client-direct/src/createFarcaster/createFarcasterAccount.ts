import { mnemonicToAccount } from "viem/accounts";
import {
    ID_REGISTRY_ADDRESS,
    ViemLocalEip712Signer,
    idRegistryABI,
} from "@farcaster/hub-nodejs";
import * as bip39 from "bip39";
import { bytesToHex, createPublicClient, http } from "viem";
import { optimism } from "viem/chains";
import { getDeadline, getRegisteredUser } from "./helper";
import UserService from "../services/userService";
import ENV_CONFIG from "../config/env";

const publicClient = createPublicClient({
    chain: optimism,
    transport: http(),
});

const getRandomImageUrl = () => {
    return `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 10000)}`;
}

const updateProfile = async ({signer_uuid, username, name}) => {
    try {
        const url = `${ENV_CONFIG?.FARCASTER_HUB_URL}/user`;
        const options = {
        method: 'PATCH',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'x-api-key': ENV_CONFIG?.FARCASTER_NEYNAR_API_KEY
        },
        body: JSON.stringify({
            pfp_url: getRandomImageUrl(),
            signer_uuid,
            username,
            display_name: name
        })
        };

        const response = await fetch(url, options)
        await response.json();
    } catch (error) {
        console.log("error: ", error);
    }
}

//todo - handle errors or error logs - correctly
const createFarcasterAccount = async ({ FID, username, name }) => {
    try {
        let deadline: any = 0;
        let requested_user_custody_address = "";
        let signature = "";

        const latest_deadline = getDeadline() as any;
        deadline = parseInt(latest_deadline);
        const mnemonic = bip39.generateMnemonic();
        const requestedUserAccount = mnemonicToAccount(mnemonic);
        const requestedUserAccountSigner = new ViemLocalEip712Signer(
            requestedUserAccount
        );
        requested_user_custody_address = requestedUserAccount.address;

        const requestedUserNonce = await publicClient.readContract({
            address: ID_REGISTRY_ADDRESS,
            abi: idRegistryABI,
            functionName: "nonces",
            args: [requestedUserAccount.address],
        });

        const requestedUserSignature =
            (await requestedUserAccountSigner.signTransfer({
                fid: BigInt(FID),
                to: requestedUserAccount.address,
                nonce: requestedUserNonce,
                deadline,
            })) as unknown as { value: any };

        signature = bytesToHex(requestedUserSignature.value);

        const registeredUser = await getRegisteredUser(
            deadline,
            requested_user_custody_address,
            FID,
            signature,
            username
        );

        const {
            signer: { signer_uuid, public_key, status, permissions },
        } = registeredUser;
        const userService = new UserService();

        const newUser = await userService.createUser({
            fid: FID,
            username,
            mnemonic,
            signer_uuid,
            public_key,
            status,
            permissions,
        });

        await updateProfile({signer_uuid, username, name});

        return {
            ...registeredUser,
            user_db_id: newUser.id
        };
    } catch (error) {
        console.log("error: ", error);
    }
};

export default createFarcasterAccount;
