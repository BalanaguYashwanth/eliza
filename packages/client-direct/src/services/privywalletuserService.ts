import { Repository } from "typeorm";
import { AppDataSource } from "../config/db";
import { UserPrivyWallet } from "../models/user_privy_wallet";

export class UserPrivyWalletService {
    private walletRepository: Repository<UserPrivyWallet>;

    constructor() {
      this.walletRepository = AppDataSource.getRepository(UserPrivyWallet);
    }
    async createUserPrivyWallet(walletData: Partial<UserPrivyWallet>) {
        const wallet = this.walletRepository.create(walletData);
        return await this.walletRepository.save(wallet);
    }

    async getAllWallets() {
        return await this.walletRepository.find();
    }

}

