import { Repository } from "typeorm";
import { AppDataSource } from "../config/db";
import { AgentWallet } from "../models/agent_wallet";

export class AgentWalletService {
    private walletRepository: Repository<AgentWallet>;

    constructor() {
        this.walletRepository = AppDataSource.getRepository(AgentWallet);
    }

    async createAgentWallet(walletData: Partial<AgentWallet>) {
        const wallet = this.walletRepository.create(walletData);
        return await this.walletRepository.save(wallet);
    }

    async getAllAgentWallets() {
        return await this.walletRepository.find();
    }
}
