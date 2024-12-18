import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";

@Entity("users")
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false, unique: true })
    fid: string;

    @Column({ nullable: false, unique: true })
    username: string;

    @Column({ nullable: false, unique: true })
    mnemonic: string;

    @Column({ nullable: false, unique: true })
    signer_uuid: string;

    @Column({ nullable: false, unique: true })
    public_key: string;

    @Column({ nullable: false })
    status: string;

    @Column({ type: "text", array: true, nullable: false })
    permissions: string[];

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date;
}
