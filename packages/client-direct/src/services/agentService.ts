import { Repository } from "typeorm";
import { AppDataSource } from "../config/db";
import { Agent } from "../models/agent";

class AgentService {
    private agentRepository: Repository<Agent>;

    constructor() {
        this.agentRepository = AppDataSource.getRepository(Agent);
    }

    async createAgent(agentData: Partial<Agent>) {
        try {
            const hasAgent = await this.agentRepository.findOne({
                where: { fid: agentData.fid },
            });
            if (hasAgent) {
                return hasAgent;
            }

            const agent = this.agentRepository.create(agentData);
            return await this.agentRepository.save(agent);
        } catch (error) {
            console.log("Postgresql db query error", error);
            throw new Error(error?.message);
        }
    }

    async findAgentByFid(fid: number) {
        return await this.agentRepository.findOne({
            where: { fid },
        });
    }

    async getFeedIds() {
        const jsonFidArr = (await this.agentRepository.find({
            select: {
                fid: true,
            },
        })) as Agent[];

        const fids = jsonFidArr.map(({ fid }) => fid);
        return fids;
    }

    async getAllAgents() {
        return await this.agentRepository.find();
    }
}

export default AgentService;
