import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./user";

@Entity("farcaster_account")
export class FarcasterAccount extends BaseEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    pk: bigint;

    @ManyToOne(() => User, (user) => user.pk, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_fk" })
    user_fk: User;

    @Column({ nullable: false, unique: true })
    fid: number;

    @Column({ nullable: false, unique: true })
    username: string;

    @Column({ nullable: false, unique: true })
    mnemonic: string;

    @Column({ nullable: false, unique: true })
    signer_uuid: string;

    @Column({ nullable: false, unique: true })
    public_key: string;

    @Column({ type: "text", array: true, nullable: false })
    permissions: string[];

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date;
}
