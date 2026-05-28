import Anthropic from '@anthropic-ai/sdk';

interface AiComment {
  id: string;
  author: string;
  text: string;
}

export interface AiResult {
  likelihood: number;
  reasoning: string;
}

const MODEL = 'claude-haiku-4-5-20251001';
const BATCH_SIZE = 25;

const SYSTEM_PROMPT = `You are a bot-detection assistant for a social media intelligence tool.

You will be given a video title and a JSON array of YouTube comments in the form [{"id": string, "author": string, "text": string}].

For each comment, estimate the probability that it comes from an inauthentic, automated (bot), or coordinated/astroturfing account. Consider generic or low-effort praise, promotional/self-advertising language, coordinated talking points, spammy patterns, and off-topic engagement-farming.

Return ONLY a JSON array in the form:
[{"id": string, "likelihood": number, "reasoning": string}]

Where:
- "id" exactly matches the input comment id.
- "likelihood" is an integer 0-100 (0 = clearly authentic human, 100 = almost certainly a bot/coordinated account).
- "reasoning" is ONE short sentence explaining the score.

Output rules: respond with the raw JSON array only. No markdown, no code fences, no prose before or after the JSON.`;

function stripFences(s: string): string {
  let out = s.trim();
  if (out.startsWith('```')) {
    out = out.replace(/^```[a-zA-Z]*\s*/, '').replace(/```\s*$/, '');
  }
  return out.trim();
}

export async function aiScoreComments(
  comments: AiComment[],
  videoTitle: string
): Promise<Map<string, AiResult>> {
  const results = new Map<string, AiResult>();

  if (!process.env.ANTHROPIC_API_KEY) return results;
  if (comments.length === 0) return results;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  for (let i = 0; i < comments.length; i += BATCH_SIZE) {
    const batch = comments.slice(i, i + BATCH_SIZE);
    try {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: `Video title: ${JSON.stringify(
              videoTitle
            )}\n\nComments:\n${JSON.stringify(
              batch.map((c) => ({ id: c.id, author: c.author, text: c.text }))
            )}`,
          },
        ],
      });

      const block = message.content.find((b) => b.type === 'text');
      if (!block || block.type !== 'text') continue;

      const parsed: unknown = JSON.parse(stripFences(block.text));
      if (!Array.isArray(parsed)) continue;

      for (const row of parsed) {
        if (
          row &&
          typeof row === 'object' &&
          typeof (row as { id?: unknown }).id === 'string'
        ) {
          const r = row as {
            id: string;
            likelihood?: unknown;
            reasoning?: unknown;
          };
          const likelihood = Math.max(
            0,
            Math.min(100, Math.round(Number(r.likelihood) || 0))
          );
          const reasoning =
            typeof r.reasoning === 'string' ? r.reasoning : '';
          results.set(r.id, { likelihood, reasoning });
        }
      }
    } catch {
      // Skip this batch on any error — never throw out of this function
      continue;
    }
  }

  return results;
}
