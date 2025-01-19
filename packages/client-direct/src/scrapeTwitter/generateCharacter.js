import fs from "fs/promises";
import path from "path";
import { prompt } from './prompt.js';
import ENV_CONFIG from "../config/env";

class TweetProcessor {
  constructor({username, twitterUsername, name, date}) {
    this.username = username;
    this.name = name;
    this.date = date;
    this.baseDir = path.join(
      `${ENV_CONFIG.FILE_Path}/agent/pipeline`,
      twitterUsername,
      date
    );

    this.characterFile = path.join(`${ENV_CONFIG.FILE_Path}/agent/characters`, `${twitterUsername}.json`);
  }

    //todo - learn its very imp
    //todo - Implement cache
    async chunkText({tweets}){
        const chunks = [];
        const CHUNK_SIZE = 60000; // 50k tokens approx
        if (Array.isArray(tweets)) {
        for (let i = 0; i < tweets.length; i += 1000) {
            const tweetChunk = tweets.slice(i, i + 1000);
            const conversationThreads = await Promise.all(
            tweetChunk.map((tweet) => this.buildConversationThread(tweet, tweets))
            );

            let currentChunk = "";

            for (const thread of conversationThreads) {
            if (thread.length > CHUNK_SIZE) {
                chunks.push(thread);
                continue;
            }

            if (currentChunk.length + thread.length > CHUNK_SIZE) {
                chunks.push(currentChunk);
                currentChunk = "";
            }

            currentChunk += thread;
            }

            if (currentChunk.length > 0) {
            chunks.push(currentChunk);
            }
        }
        } else {
        console.error("Error: tweets is not an array");
        }
        return chunks;
    };

   async buildConversationThread(tweet, tweets){
    const thread = [];
    const visited = new Set();

    async function processThread(currentTweet) {
      if (!currentTweet || visited.has(currentTweet.id)) {
        return;
      }

      visited.add(currentTweet.id);
      thread.unshift(currentTweet);

      if (currentTweet.inReplyToStatusId) {
        const replyToTweet = tweets.find((t) => t.id === currentTweet.inReplyToStatusId);
        await processThread(replyToTweet);
      }
    }

    await processThread(tweet);

    // Format the thread into the desired string format
    return thread
      .map(
        (t) =>
          `From: ${t.username} (@${t.username})\n` +
          `Tweet ID: ${t.id}\n` +
          `Timestamp: ${new Date(t.timestamp).toLocaleString()}\n` +
          `Content:\n${t.text}\n` +
          "---\n"
      )
      .join("");
  };

  async parseJsonFromMarkdown(text) {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (error) {
        console.log(`Error occured at parseJsonFromMarkdown ${error}`)
      }
    }
    return null;
  };

   async runChatCompletion  (messages, useGrammar = false, model) {
    if (model === 'openai') {
      const modelName = 'gpt-4o';
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: messages,
        }),
      });

      // check for 429
      if (response.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 30000));
        return runChatCompletion(messages, useGrammar, model);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      const parsed = this.parseJsonFromMarkdown(content) || JSON.parse(content);
      return parsed;
    }
    else if (model === 'claude') {
      const modelName = 'claude-3-5-sonnet-20240620';
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: modelName,
          max_tokens: 8192,
          temperature: 0,
          messages: [
            {
              role: "user",
              content: messages[0].content
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(`HTTP error! status: ${response.status} and error data`, errorData)
        throw new Error(`Anthropic API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      const parsed = this.parseJsonFromMarkdown(content) || JSON.parse(content);
      return parsed;
    } else if(model === 'grok'){
        const modelName = process.env.XAI_MODEL;
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: modelName,
              temperature: 0,
              stream: false,
              messages: [
                    {
                    role: "user",
                    content: messages[0].content
                    }
                ],
                }),
            });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (response.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 30000));
            return runChatCompletion(messages, useGrammar, model);
        }


        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        const parsed = this.parseJsonFromMarkdown(content) || JSON.parse(content);
        return parsed;
    }
  };

  async extractInfo(name, username, chunk, chunkIndex, model){
    const basicUserInfo = ''
    const result = await this.runChatCompletion([{ role: 'user', content: prompt(name, username, basicUserInfo, chunk) }], true, model)
    return result;
  }

  async limitConcurrency(tasks, concurrencyLimit) {
    const results = [];
    const runningTasks = new Set();
    const queue = [...tasks];

    const runNext = async () => {
      if (queue.length === 0) return;
      const task = queue.shift();
      runningTasks.add(task);
      try {
        results.push(await task());
      } catch (error) {
        results.push(null);
        console.log(`Error occured in limit concurreny ${error}`)
      } finally {
        runningTasks.delete(task);
        await runNext();
      }
    };

    const initialTasks = Array(Math.min(concurrencyLimit, tasks.length))
      .fill()
      .map(() => runNext());

    await Promise.all(initialTasks);
    await Promise.all(Array.from(runningTasks));

    return results;
  };

  async combineAndDeduplicate (results) {
    if (results.length === 0) {
      return {
        bio: '',
        lore: [],
        adjectives: [],
        topics: [],
        style: {
          all: [],
          chat: [],
          post: [],
        },
        messageExamples: [],
        postExamples: [],
      };
    }

    const combined = {
      bio: results.flatMap(result => result.bio),
      lore: [...new Set(results.flatMap((result) => result?.lore || []))],
      adjectives: [...new Set(results.flatMap((result) => result?.adjectives || []))],
      topics: [...new Set(results.flatMap((result) => result?.topics || []))],
      style: {
        all: [...new Set(results.flatMap((result) => result?.style?.all || []))],
        chat: [...new Set(results.flatMap((result) => result?.style?.chat || []))],
        post: [...new Set(results.flatMap((result) => result?.style?.post || []))],
      },
      messageExamples: [...new Set(results.flatMap((result) => result?.messageExamples || []))],
      postExamples: [...new Set(results.flatMap((result) => result?.postExamples || []))],
    };
    return combined;
  };


 //todo - Implement cache (repo of characterfile)
  async createCharacterFromTweets({tweets, name}){
    const username = tweets[0].username
    const chunks = await this.chunkText({tweets});
    let progessPercentage = 0;
    const tasks = chunks.map((chunk, index) => async () => {
    const result = await this.extractInfo(name, username, chunk, index, 'openai');
        console.log(`Creating the character in ${progessPercentage} progress ${name}`)
        progessPercentage += 10;
        return result;
    });
    const results = await this.limitConcurrency(tasks, 3); // Process 3 chunks concurrently
    const validResults = results.filter(result => result !== null);
    const combined = await this.combineAndDeduplicate(validResults);
    const character = {
        ...combined,
    };

    return character;
  }

  async readJsonFile(filePath) {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  }

  async hasTweetFileAccess(tweetsPath){
    try {
        await fs.access(tweetsPath);
      } catch (error) {
        throw new Error(error, `No processed tweets found for ${this.username} on ${this.date}`);
      }
  }

  async processTweets() {
    try {
      console.log(`Processing tweets for ${this.username} from date ${this.date}`);
      const tweetsPath = path.join(
        this.baseDir,
        "raw",
        "tweets.json"
      );
      await this.hasTweetFileAccess(tweetsPath)
      const tweets = await this.readJsonFile(tweetsPath);
      console.log(`Read ${tweets.length} tweets from JSON file`);
      const character = await this.createCharacterFromTweets({tweets, name: this.name})
      console.log(`Character from tweets is ready`);
      return character;
    } catch (error) {
      console.error(`Failed to process tweets: ${error.message}`);
      throw error;
    }
  }
}

// Usage
export const generateCharacter = async ({username, twitterUsername, name, date}) => {
  console.log(`Generating character for ${username} from ${date}`);
  const processor = new TweetProcessor({username, twitterUsername, name, date});
  const character = await processor.processTweets();
  return character;
};