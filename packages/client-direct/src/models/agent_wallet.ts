import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BaseEntity,
    JoinColumn,
    ManyToOne,
} from "typeorm";
import { Agent } from "./agent";
import { WALLET_TYPE } from "../config/constantTypes";

@Entity("agent_wallet")
export class AgentWallet extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Agent, (agent) => agent.id, { onDelete: "CASCADE" })
    @JoinColumn({ name: "agent_id" })
    agentId: Agent;

    @Column({ type: "text", nullable: false })
    chain_type: string;

    @Column({ type: "text", nullable: false })
    chain_id: string;

    @Column({ type: "int", nullable: false })
    wallet_type: WALLET_TYPE;

    @Column({ type: "text", nullable: false, unique: true })
    wallet_id: string;

    @Column({ type: "text", nullable: false, unique: true })
    wallet_address: string;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date;
}
