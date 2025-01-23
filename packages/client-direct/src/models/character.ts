import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";

@Entity("character")
export class Character extends BaseEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    pk: bigint;

    @Column({ type: "jsonb", nullable: false })
    data: object;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date;
}