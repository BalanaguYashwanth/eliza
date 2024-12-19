/* eslint-disable */
import { parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import TwitterPipeline from './twitterPipeline.ts';
import ENV_CONFIG from "../config/env";

const constructPath = (username, date) => {
    const lowerUsername = username?.toLowerCase();
  return `${ENV_CONFIG.FILE_Path}/agent/pipeline/${lowerUsername}/${date}/processed/finetuning.json`;
};

export const getJsonl = (jsonlFilePath) => {
  const data = fs.readFileSync(jsonlFilePath, 'utf8');
  return data
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => JSON.parse(line));
};

export const runPipeline = async (username) => {
  try {
    const pipeline = new TwitterPipeline(username);
    await pipeline.run();

    const date = new Date();
    const formattedDate = date.toISOString().split('T')[0];
    const filePath = constructPath(username, formattedDate);

    const jsonl = getJsonl(filePath);

    // Send completion message to the parent thread
    parentPort?.postMessage({ username, status: 'completed', result: jsonl });
  } catch (error) {
    console.error(`Error in worker for ${username} job :`, error);

    // Notify parent thread of failure
    parentPort?.postMessage({ username, status: 'failed' });
  }
};

// Start the pipeline when the worker receives data
const { username } = workerData;
runPipeline(username);
