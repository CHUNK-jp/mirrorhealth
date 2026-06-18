import { NextRequest } from "next/server";
import { OLLAMA_BASE_URL, DEFAULT_MODEL, buildHealthPrompt } from "@/lib/ollama";
import { buildHealthContextText } from "@/lib/healthParser";
import type { HealthSummary } from "@/lib/healthParser";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const summary: HealthSummary = body.summary;
    const model: string = body.model ?? DEFAULT_MODEL;
    const language: "ja" | "en" = body.language ?? "ja";

    if (!summary) {
      return new Response("No health summary provided", { status: 400 });
    }

    const contextText = buildHealthContextText(summary);
    const prompt = buildHealthPrompt(contextText, language);

    // Stream from Ollama
    const ollamaRes = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: true,
      }),
    });

    if (!ollamaRes.ok) {
      const errorText = await ollamaRes.text();
      return new Response(
        `Ollama error: ${ollamaRes.status} — ${errorText}\n\nOllamaが起動していることを確認してください: ollama serve`,
        { status: 502 }
      );
    }

    // Transform Ollama's NDJSON stream into plain text stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = ollamaRes.body!.getReader();
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter(Boolean);
            for (const line of lines) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.response) {
                  controller.enqueue(encoder.encode(parsed.response));
                }
                if (parsed.done) {
                  controller.close();
                  return;
                }
              } catch {
                // skip malformed JSON lines
              }
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return new Response("Internal server error: " + (error as Error).message, {
      status: 500,
    });
  }
}

// Check Ollama status + list available models
export async function GET() {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      return Response.json({ running: false, models: [] });
    }
    const data = await res.json();
    return Response.json({ running: true, models: data.models ?? [] });
  } catch {
    return Response.json({ running: false, models: [] });
  }
}
