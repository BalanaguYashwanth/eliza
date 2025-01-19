import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";

@Entity("user")
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false, unique: true })
    fid: number;

    @Column({ type: "text", nullable: false })
    chain_type: string;

    @Column({ type: "text", nullable: false })
    chain_id: string;

    @Column({ type: "int", nullable: false })
    wallet_type: number;

    @Column({ type: "text", nullable: false, unique: true })
    wallet_id: string;

    @Column({ type: "text", nullable: false, unique: true })
    wallet_address: string;

    @Column({ nullable: false, unique: true })
    username: string;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date;
}