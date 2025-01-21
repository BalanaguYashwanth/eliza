import { Repository } from "typeorm";
import { AppDataSource } from "../config/db";
import { AgentWallet } from "../models/agent_wallet";
import { Agent } from "../models/agent";

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

    async getAgentWalletByAgentId(agent: Agent) {
        return await this.walletRepository.findOne({where: {agent_id: agent}})
    }
}
