export const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

export const DEFAULT_MODEL =
  process.env.OLLAMA_MODEL ?? "llama3.2";

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

export async function listOllamaModels(): Promise<OllamaModel[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.models ?? [];
  } catch {
    return [];
  }
}

export async function isOllamaRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function buildHealthPrompt(contextText: string, language: "ja" | "en" = "ja"): string {
  if (language === "ja") {
    return `あなたは優秀な健康コーチです。以下のユーザーの健康データを分析し、日本語でパーソナライズされたインサイトとアドバイスを提供してください。

重要: あなたはデータを見るだけで、データはあなたのデバイス内にのみ存在します。

${contextText}

以下の観点で分析してください：
1. **全体的な健康状態の評価** — データから読み取れる総合評価
2. **良い点** — 継続すべき習慣や改善が見られる点
3. **改善ポイント** — 注意が必要なトレンドや具体的な改善提案
4. **今週の優先アクション** — 今すぐ取り組める具体的な行動3つ

医師への受診を勧める必要がある場合は明記してください。
回答は読みやすいMarkdown形式で、絵文字を適度に使って親しみやすくしてください。`;
  } else {
    return `You are an expert health coach. Analyze the following health data and provide personalized insights and advice in English.

Note: All data processing happens locally on your device — no data leaves your machine.

${contextText}

Please analyze from these angles:
1. **Overall Health Assessment** — Summary evaluation from the data
2. **Strengths** — Habits to continue or improvements noted
3. **Areas for Improvement** — Concerning trends and specific suggestions
4. **This Week's Priority Actions** — 3 concrete actions to take now

Note if medical consultation is recommended.
Format your response in readable Markdown with appropriate emojis.`;
  }
}
