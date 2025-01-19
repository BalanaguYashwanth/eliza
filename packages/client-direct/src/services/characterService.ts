import { Repository } from "typeorm";
import { AppDataSource } from "../config/db";
import { Character } from "../models/character";

export class CharacterService {
    private characterRepository: Repository<Character>;

    constructor() {
        this.characterRepository = AppDataSource.getRepository(Character);
    }

    async createCharacter(characterData: Partial<Character>) {
        const agent = this.characterRepository.create({ data: characterData });
        return await this.characterRepository.save(agent);
    }

    async getAllCharacters() {
        return await this.characterRepository.find();
    }
}
