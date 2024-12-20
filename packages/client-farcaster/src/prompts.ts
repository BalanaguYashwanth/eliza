import {
    Character,
    messageCompletionFooter,
    shouldRespondFooter,
} from "@ai16z/eliza";
import type { Cast } from "./types";

export const formatCast = (cast: Cast) => {
    return `ID: ${cast.hash}
    From: ${cast.profile.name} (@${cast.profile.username})${cast.profile.username})${cast.inReplyTo ? `\nIn reply to: ${cast.inReplyTo.fid}` : ""}
Text: ${cast.text}`;
};

export const formatTimeline = (
    character: Character,
    timeline: Cast[]
) => `# ${character.name}'s Home Timeline
${timeline.map(formatCast).join("\n")}
`;

export const headerTemplate = `
{{timeline}}

# Knowledge
{{knowledge}}

About {{agentName}} (@{{farcasterUsername}}):
{{bio}}
{{lore}}
{{postDirections}}

{{providers}}

{{recentPosts}}

{{characterPostExamples}}`;

export const postTemplate =
headerTemplate +
    `
# Task: Generate a post in the voice and style of {{agentName}}, aka @{{farcasterUsername}} and don't mention anyone in the post.
Write a single sentence post that is {{adjective}} about {{topic}} (without mentioning {{topic}} directly), from the perspective of {{agentName}}.
Try to write something totally different than previous posts. Do not add commentary or ackwowledge this request, just write the post.

Your response should not contain any questions. Brief, concise statements only. No emojis. Use \\n\\n (double spaces) between statements.`;

// export const postTemplateMentions =
//     headerTemplate +
//     `
// # Task: Generate a post and should mention or interact anyone of them  cryptopichai ratantata2 IrffanAsiff1 by mentoining with "@", in the voice and style of {{agentName}}, aka @{{lensHandle}}
// Write a single sentence post that is {{adjective}} about {{topic}} (without mentioning {{topic}} directly), from the perspective of {{agentName}}.
// Try to write something totally different than previous posts. Do not add commentary or ackwowledge this request, just write the post.

// Your response should not contain any questions. Brief, concise statements only. No emojis. Use \\n\\n (double spaces) between statements.`;

export const postTemplateMentions =
    headerTemplate +
    `
# Task: Generate a post mentioning one or up to five users, with each mention addressing only one or two relevant topics, in the voice and style of {{agentName}}, aka @{{lensHandle}}.
Write a single-sentence post that is {{adjective}} about {{topic}} (without mentioning {{topic}} directly), from the perspective of {{agentName}}.
Ensure the mentions align with the context of the post as follows:
- Mention "@cryptopichai" for cooperative company-related casts.
- Mention "@ratantata2" for Web3 infrastructure-related casts.
- Mention "@irffanasiff1" for general non-EVM or Solana-related casts.
Also apart from above mentioned users, If you think any other user is relevant to the topic, mention them as well.

### Additional Guidelines:
1. Mention only the most relevant user(s) based on the topic. Avoid mentioning irrelevant users.
2. For each mention, do not include more than one or two related topics.
3. Posts should be concise, original, and stylistically consistent with {{agentName}}.
4. Avoid repetitive posts. Write something unique compared to previous interactions.
5. Do not add commentary or acknowledge this request.
6. No questions, emojis, or excessive verbosity.
7. Use \\n\\n (double spaces) between separate statements if needed.

Your response should strictly follow these rules and capture the style and personality of {{agentName}}.
`;

export const messageHandlerTemplate =
    headerTemplate +
    `
Recent interactions between {{agentName}} and other users:
{{recentPostInteractions}}

Thread of casts You Are Replying To:
{{formattedConversation}}

# Task: Generate a post in the voice, style and perspective of {{agentName}} (@{{farcasterUsername}}):
{{currentPost}}` +
    messageCompletionFooter;

export const shouldRespondTemplate =
    //
    `# Task: Decide if {{agentName}} should respond.
    About {{agentName}}:
    {{bio}}

    # INSTRUCTIONS: Determine if {{agentName}} (@{{farcasterUsername}}) should respond to the message and participate in the conversation. Do not comment. Just respond with "RESPOND" or "IGNORE" or "STOP".

Response options are RESPOND, IGNORE and STOP.

{{agentName}} should respond to messages that are directed at them, or participate in conversations that are interesting or relevant to their background, IGNORE messages that are irrelevant to them, and should STOP if the conversation is concluded.

{{agentName}} is in a room with other users and wants to be conversational, but not annoying.
{{agentName}} should RESPOND to messages that are directed at them, or participate in conversations that are interesting or relevant to their background.
If a message is not interesting or relevant, {{agentName}} should IGNORE.
If a message thread has become repetitive, {{agentName}} should IGNORE.
Unless directly RESPONDing to a user, {{agentName}} should IGNORE messages that are very short or do not contain much information.
If a user asks {{agentName}} to stop talking, {{agentName}} should STOP.
If {{agentName}} concludes a conversation and isn't part of the conversation anymore, {{agentName}} should STOP.

IMPORTANT: {{agentName}} (aka @{{farcasterUsername}}) is particularly sensitive about being annoying, so if there is any doubt, it is better to IGNORE than to RESPOND.

Thread of messages You Are Replying To:
{{formattedConversation}}

Current message:
{{currentPost}}

` + shouldRespondFooter;
