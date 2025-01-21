import { Repository } from "typeorm";
import { AppDataSource } from "../config/db";
import { Token } from "../models/token";
import { Agent } from "../models/agent";

export class TokenService {
    private tokenRepository: Repository<Token>;

    constructor() {
        this.tokenRepository = AppDataSource.getRepository(Token);
    }

    async createToken(tokenData: Partial<Token>) {

        if(await this.getTokenByListing(tokenData.listing)) {
            throw new Error("Token already exists");
        }

        const token = this.tokenRepository.create(tokenData);
        return await this.tokenRepository.save(token);
    }

    async getTokenByListing(listing: string) {
        return await this.tokenRepository.findOne({ where: { listing } });
    }

    async updateTokenAta(wallet_address: string, user_ata: string) {
        return await this.tokenRepository.update({ wallet_address }, { user_ata });
    }

    async getAllTokens() {
        return await this.tokenRepository.find();
    }

    async getTokenByWalletAddress(wallet_address: string) {
        return await this.tokenRepository.findOne({ where: { wallet_address } });
    }

    async getTokenByAgentId(agent: Agent) {
        return await this.tokenRepository.findOne({where: {agent_id: agent}})
    }
}
