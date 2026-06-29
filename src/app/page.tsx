"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, ShieldCheck, FileHeart, Loader2, X, Github, RefreshCw } from "lucide-react";
import { MetricCards } from "@/components/MetricCards";
import { HealthCharts } from "@/components/HealthCharts";
import { AIInsights } from "@/components/AIInsights";
import type { HealthSummary } from "@/lib/healthParser";

type AppState = "idle" | "uploading" | "ready" | "error";

interface OllamaStatus {
  running: boolean;
  models: { name: string }[];
}

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({ running: false, models: [] });
  const [checkingOllama, setCheckingOllama] = useState(false);

  // Check Ollama on mount and when returning to ready state
  const checkOllama = useCallback(async () => {
    setCheckingOllama(true);
    try {
      const res = await fetch("/api/analyze");
      const data = await res.json();
      setOllamaStatus(data);
    } catch {
      setOllamaStatus({ running: false, models: [] });
    } finally {
      setCheckingOllama(false);
    }
  }, []);

  useEffect(() => {
    checkOllama();
  }, [checkOllama]);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".xml") && file.type !== "text/xml" && file.type !== "application/xml") {
      setError("Please upload the export.xml file exported from Apple Health.");
      setState("error");
      return;
    }

    setState("uploading");
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/parse-health", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to parse health data.");
      }

      const data: HealthSummary = await res.json();
      setSummary(data);
      setState("ready");
      checkOllama(); // Recheck Ollama when ready
    } catch (e) {
      setError((e as Error).message);
      setState("error");
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function reset() {
    setState("idle");
    setSummary(null);
    setError("");
  }

  const modelNames = ollamaStatus.models.map((m) => m.name);

  // ── Idle / Upload screen ───────────────────────────────────────────────────
  if (state === "idle" || state === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <FileHeart size={32} className="text-green-400" />
            <h1 className="text-3xl font-bold text-white">MirrorHealth</h1>
          </div>
          <p className="text-gray-400 max-w-sm">
            Your health data, analyzed by AI, entirely on your device.
            <br />
            <span className="text-green-400 font-medium">Never sent to the cloud.</span>
          </p>
        </div>

        {/* Drop zone */}
        <label
          htmlFor="health-file"
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`cursor-pointer w-full max-w-md rounded-2xl border-2 border-dashed p-10 flex flex-col items-center gap-4 transition-all ${
            dragging
              ? "border-green-400 bg-green-500/10"
              : "border-gray-700 hover:border-gray-500 bg-gray-900"
          }`}
        >
          <Upload size={40} className={dragging ? "text-green-400" : "text-gray-500"} />
          <div className="text-center">
            <p className="text-white font-medium">Drop export.xml here</p>
            <p className="text-gray-500 text-sm mt-1">or click to select a file</p>
          </div>
          <input
            id="health-file"
            type="file"
            accept=".xml"
            className="hidden"
            onChange={onInputChange}
          />
        </label>

        {state === "error" && (
          <div className="mt-4 max-w-md w-full bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* How to export */}
        <div className="mt-8 max-w-md w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-400 space-y-2">
          <p className="text-white font-medium text-sm flex items-center gap-2">
            <ShieldCheck size={15} className="text-green-400" /> How to export from Apple Health
          </p>
          <ol className="list-decimal pl-4 space-y-1 text-gray-400">
            <li>Open the Health app on your iPhone</li>
            <li>Tap your profile icon in the top right</li>
            <li>Tap "Export All Health Data"</li>
            <li>Unzip the file and upload <code className="bg-gray-800 px-1 rounded">export.xml</code></li>
          </ol>
        </div>

        <a
          href="https://github.com/YOUR_USERNAME/mirrorhealth"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
        >
          <Github size={16} />
          Star on GitHub
        </a>
      </div>
    );
  }

  // ── Uploading screen ───────────────────────────────────────────────────────
  if (state === "uploading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="text-green-400 animate-spin" />
        <p className="text-gray-300 font-medium">Parsing health data...</p>
        <p className="text-gray-500 text-sm">Large files may take a moment</p>
      </div>
    );
  }

  // ── Dashboard screen ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 md:p-6 max-w-6xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FileHeart size={24} className="text-green-400" />
          <h1 className="text-xl font-bold text-white">MirrorHealth</h1>
          <span className="text-xs text-gray-500">
            Exported {summary!.exportDate} · {summary!.totalDays} days of data
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={checkOllama}
            disabled={checkingOllama}
            className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <RefreshCw size={12} className={checkingOllama ? "animate-spin" : ""} />
            Ollama {ollamaStatus.running ? "✅" : "❌"}
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X size={12} />
            Open another file
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <section className="mb-6">
        <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-3">7-Day Average</h2>
        <MetricCards summary={summary!} />
      </section>

      {/* Charts */}
      <section className="mb-6">
        <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Trends</h2>
        <HealthCharts summary={summary!} />
      </section>

      {/* AI Insights */}
      <section className="mb-8">
        <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-3">AI Insights</h2>
        <AIInsights
          summary={summary!}
          ollamaRunning={ollamaStatus.running}
          availableModels={modelNames}
        />
      </section>

      <footer className="text-center text-xs text-gray-700 pb-4">
        MirrorHealth — All data processing happens entirely on your device
      </footer>
    </div>
  );
}
