import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";

@Entity("agents")
export class Agent extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "jsonb", nullable: false })
    data: object;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date;
}