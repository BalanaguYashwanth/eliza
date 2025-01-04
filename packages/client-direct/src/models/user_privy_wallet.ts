import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./users";

@Entity("user_privy_wallets")
export class UserPrivyWallet extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "text", nullable: false, unique: true })
    privy_id: string

    @Column({ type: "int", nullable: false, unique: true })
    fid: number

    @Column({ type: "text", nullable: false, unique: true })
    address: string;

    @Column({ type: "text", nullable: false})
    chain_type: string;

    @Column({ type: "text", nullable: false })
    chain_id: string

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date;

    @ManyToOne(() => User, (user) => user.id, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user: User;
}
