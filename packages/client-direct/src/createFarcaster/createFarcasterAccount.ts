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

const publicClient = createPublicClient({
    chain: optimism,
    transport: http(),
});

const createFarcasterAccount = async ({ FID, username }) => {
    try {
        let deadline: any = 0;
        let requested_user_custody_address = "";
        let signature = "";

        const latest_deadline = getDeadline() as any;
        deadline = parseInt(latest_deadline);
        console.log("\ndeadline: ", deadline);

        const mnemonic = bip39.generateMnemonic();
        console.log("\nGenerated mnemonic: ", mnemonic);

        const requestedUserAccount = mnemonicToAccount(mnemonic);
        const requestedUserAccountSigner = new ViemLocalEip712Signer(
            requestedUserAccount
        );

        console.log(
            "\nrequested_user_custody_address: ",
            requestedUserAccount.address
        );
        requested_user_custody_address = requestedUserAccount.address;

        const requestedUserNonce = await publicClient.readContract({
            address: ID_REGISTRY_ADDRESS,
            abi: idRegistryABI,
            functionName: "nonces",
            args: [requestedUserAccount.address],
        });

        console.log("\nfid: ", parseInt(FID));

        const requestedUserSignature =
            (await requestedUserAccountSigner.signTransfer({
                fid: BigInt(FID),
                to: requestedUserAccount.address,
                nonce: requestedUserNonce,
                deadline,
            })) as unknown as { value: any };

        console.log(
            "\nsignature: ",
            bytesToHex(requestedUserSignature?.value),
            "\n"
        );
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
        console.log("newUser: ", newUser);

        return {
            ...registeredUser,
        };
    } catch (error) {
        console.log("error: ", error);
    }
};

export default createFarcasterAccount;
