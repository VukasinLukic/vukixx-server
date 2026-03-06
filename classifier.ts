import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ClassificationResult {
  title: string;
  category: string;
  tags: string[];
}

const SYSTEM_PROMPT = `You are a prompt classifier. Given a user prompt, extract:
1. A short, descriptive title (max 60 chars)
2. A category (one of: frontend, backend, fullstack, devops, data, design, writing, marketing, business, other)
3. Up to 5 relevant tags (lowercase, single words or short hyphenated phrases)

Respond ONLY with valid JSON:
{"title": "...", "category": "...", "tags": ["...", "..."]}`;

export async function classifyWithGemini(
  text: string,
  apiKey: string
): Promise<ClassificationResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    { text: `Classify this prompt:\n\n${text.substring(0, 2000)}` },
  ]);

  const responseText = result.response.text().trim();

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return fallbackClassification(text);
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      title: parsed.title || text.substring(0, 60),
      category: parsed.category || 'other',
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
    };
  } catch {
    return fallbackClassification(text);
  }
}

export async function classifyWithOllama(
  text: string,
  ollamaUrl = 'http://localhost:11434'
): Promise<ClassificationResult> {
  const res = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2',
      prompt: `${SYSTEM_PROMPT}\n\nClassify this prompt:\n\n${text.substring(0, 2000)}`,
      stream: false,
    }),
  });

  if (!res.ok) {
    return fallbackClassification(text);
  }

  const data = await res.json();
  const responseText = data.response?.trim() || '';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return fallbackClassification(text);
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      title: parsed.title || text.substring(0, 60),
      category: parsed.category || 'other',
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
    };
  } catch {
    return fallbackClassification(text);
  }
}

function fallbackClassification(text: string): ClassificationResult {
  // Simple keyword-based fallback
  const lower = text.toLowerCase();
  let category = 'other';

  if (/react|css|html|tailwind|ui|component|frontend|next\.js/.test(lower)) category = 'frontend';
  else if (/api|server|database|sql|node|express|backend|rest/.test(lower)) category = 'backend';
  else if (/docker|ci\/cd|deploy|kubernetes|aws|devops/.test(lower)) category = 'devops';
  else if (/python|data|pandas|ml|ai|machine learning/.test(lower)) category = 'data';
  else if (/design|figma|logo|brand|color/.test(lower)) category = 'design';
  else if (/write|blog|article|copy|content/.test(lower)) category = 'writing';

  return {
    title: text.substring(0, 60).replace(/\n/g, ' ').trim(),
    category,
    tags: [],
  };
}
