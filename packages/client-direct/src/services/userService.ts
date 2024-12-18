import { Repository } from "typeorm";
import { User } from "../models/users";
import { AppDataSource } from "../config/db";

class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  async createUser(userData: Partial<User>) {
    try {
        const hasUser = await this.userRepository.findOne({
        where: { fid: userData.fid }
        });
        if(hasUser){
            return hasUser;
        }

      const user = this.userRepository.create(userData);
      return await this.userRepository.save(user);
    } catch (error) {
      console.log("Postgresql db query error", error);
      throw new Error(error?.message);
    }
  }

  async findUserByEmail(email: string) {
    return await this.userRepository.findOne({
      where: { fid: email }
    });
  }

  async getFeedIds() {
    return await this.userRepository.find({
      select: {
        fid: true,
      },
    });
  }

  async getAllUsers() {
    return await this.userRepository.find();
  }
}

export default UserService;