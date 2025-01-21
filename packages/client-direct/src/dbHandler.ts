import AgentService from "./services/agentService";
import { AgentWalletService } from "./services/agentWalletService";
import { TokenService } from "./services/tokenServices";

export const saveAgent = async ({
    registeredUser,
    FID,
    username,
    mnemonic,
}) => {
    const {
        signer: { signer_uuid, public_key, status, permissions },
    } = registeredUser;
    const agentService = new AgentService();

    const newUser = await agentService.createAgent({
        fid: FID,
        username,
        mnemonic,
        signer_uuid,
        public_key,
        status,
        permissions,
    });
    return newUser;
};


export const saveWallet = async ({agentId, walletName, walletId, walletAddress}) => {
    console.log('saveWallet---->', {agentId, walletName, walletId, walletAddress})
    const agentWalletService = new AgentWalletService()
    await agentWalletService.createAgentWallet({
        agent_id: agentId,
        wallet_name: walletName,
        wallet_id: walletId,
        wallet_address: walletAddress,
    })
}

export const saveToken = async ({agentId, txHash, mint, listing, mintVault, solVault, seed, wallet_address}) => {
    console.log('saveToken---->', {agentId, txHash, mint, listing, mintVault, solVault, seed, wallet_address})
    const tokenService = new TokenService()
    await tokenService.createToken({
        agent_id: agentId,
        transaction_hash: txHash,
        mint: mint.toBase58(),
        listing: listing.toBase58(),
        mint_vault: mintVault.toBase58(),
        sol_vault: solVault.toBase58(),
        seed: seed.toString(),
        wallet_address,
    })
}