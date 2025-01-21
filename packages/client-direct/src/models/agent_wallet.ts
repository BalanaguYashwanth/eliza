import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BaseEntity,
    JoinColumn,
    ManyToOne,
} from "typeorm";
import { Agent } from "./agent";
import { CHAIN_TYPE, WALLET_TYPE } from "../config/constantTypes";

@Entity("agent_wallet")
export class AgentWallet extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Agent, (agent) => agent.id, { onDelete: "CASCADE" })
    @JoinColumn({ name: "agent_id" })
    agent_id: Agent;

    @Column({ type: "int", nullable: false, default: CHAIN_TYPE.SOLANA })
    chain_type: CHAIN_TYPE;

    @Column({ type: "int", nullable: false, default: WALLET_TYPE.TURNKEY })
    wallet_type: WALLET_TYPE;

    @Column({ type: "text", nullable: false, unique: true })
    wallet_id: string;

    @Column({ type: "text", nullable: false, unique: true })
    wallet_address: string;

    @Column({ type: "text", nullable: true, unique: true  })
    wallet_name: string;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date;
}
