export enum ModelProviderName {
    GROK = 'GROK'
}

export enum Clients {
    TWITTER = 'TWITTER'
}

export interface Character {
    clients: Clients[];
    credentials: Record<string, string>;
    modelProvider: ModelProviderName;
    name: string;
}

export const defaultCharacter: Partial<Character> = {};