import * as ai from 'ai';
import { OpenAI } from 'openai';

import * as fs from 'fs/promises';

async function renderCompletion(client, content) {
  const res = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    stream: true,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert software engineer, with deep Node.js and web development experience. You are succinct, brief, and to the point.',
      },
      {
        role: 'user',
        content,
      },
    ],
  });

  for await (const message of ai.OpenAIStream(res.response)) {
    process.stdout.write(message);
  }
  process.stdout.write('\n');
}

try {
  // This API client uses the node-fetch polyfill:
  const brokenClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log('Catching 💥');
  await renderCompletion(brokenClient, 'PING');
} catch (error) {
  console.log(error);
  console.log(`💥 caught!`);

  // This API client uses the built-in fetch support in Node v18:
  const workingClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    fetch: globalThis.fetch,
  });

  const currentSourceCode = await fs.readFile('./index.js', 'utf-8');
  const question = `Should the OpenAI library polyfill fetch, or should it use the global fetch on Node v18 and above?`;
  const prompt = `
\`\`\`javascript
${currentSourceCode}
\`\`\`

That code threw this error, as a result of the OpenAI API client named \`brokenClient\`.

The \`workingClient\` however works.

\`\`\`
${error}
\`\`\`

${question}
`;
  console.log(`${question}\n\n`);
  await renderCompletion(workingClient, prompt);
}
