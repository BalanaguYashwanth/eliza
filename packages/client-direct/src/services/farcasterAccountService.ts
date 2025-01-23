import { Repository } from "typeorm";
import { AppDataSource } from "../config/db";
import { FarcasterAccount } from "../models/farcaster_account";

class FarcasterAccountService {
    private farcasterAccountRepository: Repository<FarcasterAccount>;

    constructor() {
        this.farcasterAccountRepository = AppDataSource.getRepository(FarcasterAccount);
    }

    async createFarcasterAccount(farcasterAccountData: Partial<FarcasterAccount>) {
        try {
            const hasFarcasterAccount = await this.farcasterAccountRepository.findOne({
                where: { fid: farcasterAccountData.fid },
            });
            if (hasFarcasterAccount) {
                return hasFarcasterAccount;
            }

            const farcasterAccount = this.farcasterAccountRepository.create(farcasterAccountData);
            return await this.farcasterAccountRepository.save(farcasterAccount);
        } catch (error) {
            console.log("Postgresql db query error", error);
            throw new Error(error?.message);
        }
    }

    async findFarcasterAccountByFid(fid: number) {
        const farcasterAccount = await this.farcasterAccountRepository.findOne({
            where: { fid },
        });
        return farcasterAccount;
    }

    async getFarcasterAccountIds() {
        const jsonFidArr = (await this.farcasterAccountRepository.find({
            select: {
                fid: true,
            },
        })) as FarcasterAccount[];

        const fids = jsonFidArr.map(({ fid }) => fid);
        return fids;
    }

    async getAllFarcasterAccounts() {
        return await this.farcasterAccountRepository.find();
    }
}

export default FarcasterAccountService;
