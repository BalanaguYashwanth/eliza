import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, JoinColumn } from "typeorm";
import { Agent } from "./agent";

@Entity("agent_token")
export class Token extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Agent, (agent) => agent.id, { onDelete: "CASCADE" })
    @JoinColumn({ name: "agent_id" })
    agent_id: Agent;

    @Column({ nullable: false, unique: true })
    listing: string;

    @Column({ nullable: false, unique: true })
    mint: string;

    @Column({ nullable: false, unique: true })
    mint_vault: string;

    @Column({ nullable: false, unique: true })
    sol_vault: string;

    @Column({ nullable: false, unique: true })
    seed: string;

    @Column({ nullable: true })
    user_ata: string;

    @Column({ nullable: false })
    wallet_address: string;

    @Column({ nullable: false })
    transaction_hash: string;

    @Column({ nullable: false, unique: true })
    token_name: string;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date;
}
