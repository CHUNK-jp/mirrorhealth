"use client";

import { useState, useRef, useEffect } from "react";
import { Brain, Loader2, AlertCircle, ChevronDown, Globe } from "lucide-react";
import type { HealthSummary } from "@/lib/healthParser";

interface Props {
  summary: HealthSummary;
  ollamaRunning: boolean;
  availableModels: string[];
}

// Minimal markdown → HTML renderer (no external dep needed)
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
}

export function AIInsights({ summary, ollamaRunning, availableModels }: Props) {
  const [streaming, setStreaming] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [selectedModel, setSelectedModel] = useState(availableModels[0] ?? "llama3.2");
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll while streaming
  useEffect(() => {
    if (streaming && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text, streaming]);

  async function analyze() {
    setStreaming(true);
    setText("");
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, model: selectedModel, language }),
      });

      if (!res.ok) {
        const msg = await res.text();
        setError(msg);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setText((prev) => prev + decoder.decode(value));
      }
    } catch (e) {
      setError("分析に失敗しました: " + (e as Error).message);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-green-400" />
          <h2 className="font-semibold text-white">ローカルAI分析</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
            🔒 完全ローカル
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Language toggle */}
          <button
            onClick={() => setLanguage((l) => (l === "ja" ? "en" : "ja"))}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <Globe size={13} />
            {language === "ja" ? "日本語" : "English"}
          </button>

          {/* Model selector */}
          {availableModels.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                {selectedModel}
                <ChevronDown size={12} />
              </button>
              {showModelPicker && (
                <div className="absolute right-0 top-8 z-10 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-xl min-w-[160px]">
                  {availableModels.map((m) => (
                    <button
                      key={m}
                      onClick={() => { setSelectedModel(m); setShowModelPicker(false); }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-700 transition-colors ${
                        m === selectedModel ? "text-green-400" : "text-gray-300"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ollama status warning */}
      {!ollamaRunning && (
        <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Ollamaが見つかりません</p>
            <p className="text-yellow-400/70 text-xs mt-1">
              ターミナルで <code className="bg-gray-900 px-1 rounded">ollama serve</code> を実行してから再度お試しください。
              モデルが未インストールの場合: <code className="bg-gray-900 px-1 rounded">ollama pull llama3.2</code>
            </p>
          </div>
        </div>
      )}

      {/* Analyze button */}
      <button
        onClick={analyze}
        disabled={streaming || !ollamaRunning}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
      >
        {streaming ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            AIが分析中...
          </>
        ) : (
          <>
            <Brain size={16} />
            健康データをAIで分析する
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <pre className="whitespace-pre-wrap text-xs">{error}</pre>
        </div>
      )}

      {/* Streaming output */}
      {(text || streaming) && (
        <div
          ref={containerRef}
          className="prose-health bg-gray-950 rounded-xl p-4 max-h-[500px] overflow-y-auto text-sm text-gray-200 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(text) + (streaming ? '<span class="animate-pulse text-green-400">▋</span>' : '') }}
        />
      )}

      {/* Privacy note */}
      <p className="text-xs text-gray-600 text-center">
        🔒 このデータはあなたのデバイス内でのみ処理されます。外部サーバーには一切送信されません。
      </p>
    </div>
  );
}
