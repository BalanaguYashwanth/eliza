import { mnemonicToAccount } from "viem/accounts";
import {
    ID_REGISTRY_ADDRESS,
    ViemLocalEip712Signer,
    idRegistryABI,
} from "@farcaster/hub-nodejs";
import * as bip39 from "bip39";
import { optimism } from "viem/chains";
import { bytesToHex, createPublicClient, http } from "viem";
import { getRegisteredUser } from "../api/farcaster.action";
import { getDeadline } from "../scrapeTwitter/utils";
import { updateFarcasterProfile } from "../api/farcaster.action";
import { saveAgent } from "../dbHandler";

// this code imported from neynar docs
const createAndSaveFarcasterAccountAndWallet = async ({ FID, username, name, user_fk }) => {
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
        const farcasterPublicClient = createPublicClient({
            chain: optimism,
            transport: http(),
        });
        const requestedUserNonce = await farcasterPublicClient.readContract({
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

        //todo - check this signature part do we need to save it in db?
        console.log(
            "\n todo - check this signature part do we need to save it in db? signature: ",
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

        const agent = await saveAgent({ registeredUser, FID, username, mnemonic, user_fk });
        await updateFarcasterProfile({ signer_uuid: registeredUser?.signer?.signer_uuid, username, name });


        return {signer_uuid: registeredUser?.signer?.signer_uuid, agentId: agent?.pk};
    } catch (error) {
        console.log("error: ", error);
    }
};

export default createAndSaveFarcasterAccountAndWallet;