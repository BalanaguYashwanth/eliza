import { Repository } from "typeorm";
import { AppDataSource } from "../config/db";
import { Wallet } from "../models/wallet";

export class WalletService {
    private walletRepository: Repository<Wallet>;

    constructor() {
        this.walletRepository = AppDataSource.getRepository(Wallet);
    }

    async createWallet(walletData: Partial<Wallet>) {
        const wallet = this.walletRepository.create(walletData);
        return await this.walletRepository.save(wallet);
    }

    async getAllWallets() {
        return await this.walletRepository.find();
    }

    async getWalletByOwnerId(ownerFk) {
        return await this.walletRepository.findOne({
            where: { owner_fk: ownerFk },
        });
    }
}
