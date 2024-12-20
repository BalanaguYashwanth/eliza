import { v4 as uuidv4 } from 'uuid';

export const fetchCharacterAgents = async (): Promise<any> => {
    try {
        const response = await fetch(`https://communityhouse-b50a0-default-rtdb.firebaseio.com/characters.json`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching character agents:', error);
        return [];
    }
}

export const loadCharacterAgent = async () => {
    const arr = []
    try {
        const agents = await fetchCharacterAgents();
        for(let agent in agents) {
            agents[agent].id = uuidv4()
            arr.push((agents[agent]))
        }
        return arr
    } catch (error) {
        console.error('Error fetching character agents:', error);
        return [];
    }
}