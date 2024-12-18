

export const addAgent = async (agent: any) => {
    await fetch(`https://communityhouse-b50a0-default-rtdb.firebaseio.com/characters.json`, {
        method: 'POST',
        body: JSON.stringify(agent)
    })
}
