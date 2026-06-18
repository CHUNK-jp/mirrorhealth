import { parseStringPromise } from "xml2js";
import { format, subDays } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DailyMetric {
  date: string; // "YYYY-MM-DD"
  value: number;
}

export interface HealthSummary {
  // 7-day averages
  avgSteps: number;
  avgHeartRate: number;
  avgSleepHours: number;
  avgHRV: number;
  avgActiveEnergy: number;

  // 30-day daily series
  steps: DailyMetric[];
  heartRate: DailyMetric[];
  sleep: DailyMetric[];
  hrv: DailyMetric[];
  activeEnergy: DailyMetric[];

  // metadata
  exportDate: string;
  dateRange: { from: string; to: string };
  totalDays: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_TYPE = "HKQuantityTypeIdentifierStepCount";
const HR_TYPE = "HKQuantityTypeIdentifierHeartRate";
const SLEEP_TYPE = "HKCategoryTypeIdentifierSleepAnalysis";
const HRV_TYPE = "HKQuantityTypeIdentifierHeartRateVariabilitySDNN";
const ENERGY_TYPE = "HKQuantityTypeIdentifierActiveEnergyBurned";

// Sleep category values that count as "asleep"
const SLEEP_VALUES = new Set(["HKCategoryValueSleepAnalysisAsleep", "1", "2", "3", "4", "5"]);

// ─── Parser ───────────────────────────────────────────────────────────────────

export async function parseAppleHealthXML(xmlContent: string): Promise<HealthSummary> {
  const result = await parseStringPromise(xmlContent, {
    explicitArray: false,
    mergeAttrs: true,
  });

  const data = result.HealthData;
  const exportDateRaw: string = data.ExportDate?.value ?? new Date().toISOString();

  // Normalize records to array
  const records: Record<string, string>[] = Array.isArray(data.Record)
    ? data.Record
    : data.Record
    ? [data.Record]
    : [];

  // ── Bucket by type and date ────────────────────────────────────────────────
  const stepsByDate: Record<string, number> = {};
  const hrByDate: Record<string, number[]> = {};
  const sleepByDate: Record<string, number> = {}; // minutes asleep per day
  const hrvByDate: Record<string, number[]> = {};
  const energyByDate: Record<string, number> = {};

  for (const rec of records) {
    const type: string = rec.type ?? "";
    const startDateRaw: string = rec.startDate ?? rec.creationDate ?? "";
    const endDateRaw: string = rec.endDate ?? startDateRaw;
    const valueRaw: string = rec.value ?? "0";

    if (!startDateRaw) continue;

    // Parse date — Apple Health format: "2024-01-15 08:30:00 +0900"
    const dateStr = startDateRaw.substring(0, 10); // "YYYY-MM-DD"
    const value = parseFloat(valueRaw);

    if (isNaN(value) && type !== SLEEP_TYPE) continue;

    switch (type) {
      case STEP_TYPE:
        stepsByDate[dateStr] = (stepsByDate[dateStr] ?? 0) + value;
        break;

      case HR_TYPE:
        if (!hrByDate[dateStr]) hrByDate[dateStr] = [];
        hrByDate[dateStr].push(value);
        break;

      case SLEEP_TYPE: {
        // Calculate sleep duration in hours from start/end dates
        const sleepValue: string = rec.value ?? "";
        if (!SLEEP_VALUES.has(sleepValue)) break;
        const start = new Date(startDateRaw.replace(" +", "+").replace(/ (\d{2})(\d{2})$/, " +$1:$2"));
        const end = new Date(endDateRaw.replace(" +", "+").replace(/ (\d{2})(\d{2})$/, " +$1:$2"));
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        if (durationHours > 0 && durationHours < 20) {
          // Attribute sleep to the morning date (end date)
          const sleepDate = endDateRaw.substring(0, 10);
          sleepByDate[sleepDate] = (sleepByDate[sleepDate] ?? 0) + durationHours;
        }
        break;
      }

      case HRV_TYPE:
        if (!hrvByDate[dateStr]) hrvByDate[dateStr] = [];
        hrvByDate[dateStr].push(value);
        break;

      case ENERGY_TYPE:
        energyByDate[dateStr] = (energyByDate[dateStr] ?? 0) + value;
        break;
    }
  }

  // ── Build 30-day daily series ──────────────────────────────────────────────
  const today = new Date();
  const dates: string[] = Array.from({ length: 90 }, (_, i) =>
    format(subDays(today, 89 - i), "yyyy-MM-dd")
  );

  const steps: DailyMetric[] = dates.map((date) => ({
    date,
    value: Math.round(stepsByDate[date] ?? 0),
  }));

  const heartRate: DailyMetric[] = dates.map((date) => ({
    date,
    value: hrByDate[date]?.length
      ? Math.round(hrByDate[date].reduce((a, b) => a + b, 0) / hrByDate[date].length)
      : 0,
  }));

  const sleep: DailyMetric[] = dates.map((date) => ({
    date,
    value: parseFloat((sleepByDate[date] ?? 0).toFixed(1)),
  }));

  const hrv: DailyMetric[] = dates.map((date) => ({
    date,
    value: hrvByDate[date]?.length
      ? parseFloat(
          (hrvByDate[date].reduce((a, b) => a + b, 0) / hrvByDate[date].length).toFixed(1)
        )
      : 0,
  }));

  const activeEnergy: DailyMetric[] = dates.map((date) => ({
    date,
    value: Math.round(energyByDate[date] ?? 0),
  }));

  // ── 7-day averages ─────────────────────────────────────────────────────────
  const last7 = dates.slice(-7);
  const avg = (arr: DailyMetric[]) => {
    const vals = arr.filter((d) => last7.includes(d.date) && d.value > 0).map((d) => d.value);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  };
  const avgSleepRaw = (() => {
    const vals = sleep
      .filter((d) => last7.includes(d.date) && d.value > 0)
      .map((d) => d.value);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  })();

  // ── Date range ─────────────────────────────────────────────────────────────
  const allDates = Object.keys({
    ...stepsByDate,
    ...hrByDate,
    ...sleepByDate,
  }).sort();

  return {
    avgSteps: avg(steps),
    avgHeartRate: avg(heartRate),
    avgSleepHours: parseFloat(avgSleepRaw.toFixed(1)),
    avgHRV: avg(hrv),
    avgActiveEnergy: avg(activeEnergy),
    steps,
    heartRate,
    sleep,
    hrv,
    activeEnergy,
    exportDate: exportDateRaw.substring(0, 10),
    dateRange: {
      from: allDates[0] ?? dates[0],
      to: allDates[allDates.length - 1] ?? dates[dates.length - 1],
    },
    totalDays: allDates.length,
  };
}

// ─── Text summary for LLM context ─────────────────────────────────────────────

export function buildHealthContextText(summary: HealthSummary): string {
  const last30Steps = summary.steps.slice(-30).filter((d) => d.value > 0);
  const last30Sleep = summary.sleep.slice(-30).filter((d) => d.value > 0);
  const last30HR = summary.heartRate.slice(-30).filter((d) => d.value > 0);
  const last30HRV = summary.hrv.slice(-30).filter((d) => d.value > 0);

  const stepsMax = Math.max(...last30Steps.map((d) => d.value));
  const stepsMin = Math.min(...last30Steps.map((d) => d.value));
  const sleepMax = Math.max(...last30Sleep.map((d) => d.value));
  const sleepMin = Math.min(...last30Sleep.map((d) => d.value));

  return `
## 健康データサマリー（直近30日）
- 平均歩数: ${summary.avgSteps.toLocaleString()} 歩/日（最大: ${stepsMax.toLocaleString()}, 最小: ${stepsMin.toLocaleString()}）
- 平均心拍数: ${summary.avgHeartRate} bpm
- 平均睡眠時間: ${summary.avgSleepHours} 時間/日（最大: ${sleepMax}h, 最小: ${sleepMin}h）
- 平均HRV（心拍変動）: ${summary.avgHRV} ms
- 平均アクティブエネルギー: ${summary.avgActiveEnergy} kcal/日
- データ期間: ${summary.dateRange.from} ～ ${summary.dateRange.to}（${summary.totalDays}日分）

## 直近7日の日別データ
${summary.steps
  .slice(-7)
  .map(
    (d, i) =>
      `${d.date}: 歩数=${d.value.toLocaleString()}, 心拍=${summary.heartRate[summary.heartRate.length - 7 + i]?.value ?? "N/A"}bpm, 睡眠=${summary.sleep[summary.sleep.length - 7 + i]?.value ?? "N/A"}h, HRV=${summary.hrv[summary.hrv.length - 7 + i]?.value ?? "N/A"}ms`
  )
  .join("\n")}
`.trim();
}
