import axios from 'axios'
import ENV_CONFIG from '../config/env';

export const getDeadline = () => {
    const now = Math.floor(Date.now() / 1000);
    const oneHour = 60 * 60;
    return BigInt(now + oneHour);
};

export const checkAvailableFid = async (fname) => {
    try{
        const url = `${ENV_CONFIG.FARCASTER_HUB_URL}/fname/availability?fname=${fname}`;
        const options = {
        method: 'GET',
        headers: {accept: 'application/json', 'x-api-key': ENV_CONFIG.FARCASTER_NEYNAR_API_KEY}
        };

        const response = await fetch(url, options);
        const data = await response.json();
        return data?.available || false
    } catch(err){
        throw new Error(err?.message || 'Error checking FID availability')
    }
}

export const getRandomFid = async () => {
    try {
        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `${ENV_CONFIG.FARCASTER_HUB_URL}/user/fid`,
            headers: {
                'api_key': ENV_CONFIG.FARCASTER_NEYNAR_API_KEY
            }
    };

        const response = await axios.request(config);
        return response.data.fid;
    } catch (error) {
        console.error('Error fetching FID:', error);
        throw error;
    }
};


export const getRegisteredUser = async (deadline, requested_user_custody_address, fid, signature, fname) => {
    try{
        const data = JSON.stringify({
            "deadline": deadline,
            "requested_user_custody_address": requested_user_custody_address,
            "fid": fid,
            "signature": signature,
            "fname": fname
        });

        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${ENV_CONFIG.FARCASTER_HUB_URL}/user`,
            headers: {
                'api_key': ENV_CONFIG.FARCASTER_NEYNAR_API_KEY,
                'Content-Type': 'application/json'
            },
            data : data
        };

        const response = await axios.request(config);
        return response.data;
    } catch(error) {
        console.log(error);
    };
}