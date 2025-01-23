import { WalletService } from "./services/walletService";
import FarcasterAccountService from "./services/farcasterAccountService";
import { TokenService } from "./services/tokenServices";
import { UserService } from "./services/userService";

export const saveAgent = async ({
    registeredUser,
    FID,
    username,
    mnemonic,
    user_fk
}) => {
    const {
        signer: { signer_uuid, public_key, permissions },
    } = registeredUser;
    const farcasterAccountService = new FarcasterAccountService();

    const newUser = await farcasterAccountService.createFarcasterAccount({
        fid: FID,
        username,
        mnemonic,
        signer_uuid,
        public_key,
        permissions,
        user_fk
    });
    return newUser;
};

export const saveWallet = async ({
    ownerFk,
    ownerType,
    walletName,
    walletId,
    walletAddress,
}) => {
    const walletService = new WalletService();
    return await walletService.createWallet({
        owner_fk: ownerFk,
        owner_type: ownerType,
        wallet_name: walletName,
        wallet_id: walletId,
        wallet_address: walletAddress,
    });
};

export const saveToken = async ({
    farcasterAccountFk,
    txHash,
    mint,
    listing,
    mintVault,
    solVault,
    seed,
    walletAddress,
}) => {
    const tokenService = new TokenService();
    await tokenService.createToken({
        farcaster_account_fk: farcasterAccountFk,
        transaction_hash: txHash,
        mint: mint.toBase58(),
        listing: listing.toBase58(),
        mint_vault: mintVault.toBase58(),
        sol_vault: solVault.toBase58(),
        seed: seed.toString(),
        wallet_address: walletAddress,
    });
};


export const saveUser = async (user) => {
    try {
        const userService = new UserService();
        return await userService.createUser(user);
    } catch (error) {
        console.log("saveUser error", error?.message);
        throw new Error(`Error occured`);
    }
};

export const getUserByFid = async (fid: number) => {
    const userService = new UserService();
    return await userService.getUserByFid(fid);
};

export const getWalletByOwnerId = async (ownerFk: bigint) => {
    const walletService = new WalletService();
    return await walletService.getWalletByOwnerId(ownerFk);
};