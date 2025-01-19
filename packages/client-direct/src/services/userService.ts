import { Repository } from "typeorm";
import { AppDataSource } from "../config/db";
import { User } from "../models/user";

export class UserService {
    private userRepository: Repository<User>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
    }

    async createUser(userData: Partial<User>) {
        const user = this.userRepository.create(userData);
        return await this.userRepository.save(user);
    }

    async getUserByFid(fid: number) {
        return await this.userRepository.findOne({ where: { fid } });
    }

    async getAllUsers() {
        return await this.userRepository.find();
    }
}