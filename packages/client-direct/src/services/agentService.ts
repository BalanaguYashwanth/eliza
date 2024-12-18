import { Repository } from "typeorm";
import { Agent } from "../models/agents";
import { AppDataSource } from "../config/db";

export class AgentService {
    private agentRepository: Repository<Agent>;

    constructor() {
      this.agentRepository = AppDataSource.getRepository(Agent);
    }

    async createAgent(agentData: Partial<Agent>) {
        const agent = this.agentRepository.create({data: agentData});
        return await this.agentRepository.save(agent);
    }

    async getAllAgents() {
        return await this.agentRepository.find();
    }

}

