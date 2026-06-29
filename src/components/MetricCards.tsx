"use client";

import { Heart, Footprints, Moon, Activity, Zap } from "lucide-react";
import type { HealthSummary } from "@/lib/healthParser";

interface Props {
  summary: HealthSummary;
}

interface CardDef {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  target?: string;
}

export function MetricCards({ summary }: Props) {
  const cards: CardDef[] = [
    {
      label: "Avg Steps",
      value: summary.avgSteps.toLocaleString(),
      unit: "steps/day",
      icon: <Footprints size={20} />,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      target: "Goal: 10,000 steps",
    },
    {
      label: "Avg Heart Rate",
      value: summary.avgHeartRate > 0 ? String(summary.avgHeartRate) : "—",
      unit: "bpm",
      icon: <Heart size={20} />,
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
      target: "Normal: 60–100 bpm",
    },
    {
      label: "Avg Sleep",
      value: summary.avgSleepHours > 0 ? String(summary.avgSleepHours) : "—",
      unit: "hrs/day",
      icon: <Moon size={20} />,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      target: "Recommended: 7–9 hrs",
    },
    {
      label: "Avg HRV",
      value: summary.avgHRV > 0 ? String(summary.avgHRV) : "—",
      unit: "ms",
      icon: <Activity size={20} />,
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
      target: "Higher = better recovery",
    },
    {
      label: "Active Energy",
      value: summary.avgActiveEnergy > 0 ? summary.avgActiveEnergy.toLocaleString() : "—",
      unit: "kcal/day",
      icon: <Zap size={20} />,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
      target: "Goal: 500 kcal",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border p-4 ${card.bg} flex flex-col gap-2`}
        >
          <div className={`flex items-center gap-2 ${card.color} text-sm font-medium`}>
            {card.icon}
            {card.label}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{card.value}</span>
            <span className="text-xs text-gray-400">{card.unit}</span>
          </div>
          {card.target && (
            <div className="text-xs text-gray-500">{card.target}</div>
          )}
        </div>
      ))}
    </div>
  );
}
