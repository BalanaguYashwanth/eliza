export const agentTemplate = ({
    name,
    username,
    farcasterFid,
    farcasterNeynarSignerUuid,
    language,
    character
  }: {
    name: string;
    username: string;
    farcasterFid: string;
    farcasterNeynarSignerUuid: string;
    language: string;
    character:any
  }) => {
        return {
        ...character,
        name,
        username,
        "clients": [
            "farcaster"
        ],
        "modelProvider": "openai",
        settings: {
          secrets: {
            FARCASTER_FID: farcasterFid,
            FARCASTER_NEYNAR_SIGNER_UUID: farcasterNeynarSignerUuid
          },
          voice: { model: language }
        },
        system: 'Roleplay and generate interesting dialogue on behalf of user. Never use emojis or hashtags or cringe stuff like that. Never act like an assistant.',
    }

}