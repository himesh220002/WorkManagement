import { averagePercent } from "@/utils/pipelineProgress";

export interface HistoryPoint {
  date: string;
  value: number;
}

export interface HistoryTriple {
  points: HistoryPoint[];
  deltas: number[];
}

/**
 * Builds the last-3-days triple (day-before -> yesterday -> today with
 * pairwise +deltas) for a set of pipelines from raw snapshot rows.
 * Missing days (weekends) are carried forward per pipeline; pipelines with
 * no history at all are skipped — so pairs never lie.
 */
export function tripleFromSnapshots(
  rows: Array<{ pipelineId: unknown; date: string; progress: number }>,
  pipelineIds: Array<string>
): HistoryTriple {
  const wanted = new Set(pipelineIds.map(String));
  const byPipe = new Map<string, { date: string; progress: number }[]>();
  for (const r of rows) {
    const key = String(r.pipelineId);
    if (!wanted.has(key)) continue;
    if (!byPipe.has(key)) byPipe.set(key, []);
    byPipe.get(key)!.push({ date: r.date, progress: Number(r.progress || 0) });
  }
  for (const arr of byPipe.values()) arr.sort((a, b) => (a.date < b.date ? -1 : 1));

  const dates = [...new Set(rows.filter((r) => wanted.has(String(r.pipelineId))).map((r) => r.date))]
    .sort()
    .reverse()
    .slice(0, 3)
    .reverse();

  const points = dates.map((d) => {
    const values: number[] = [];
    for (const arr of byPipe.values()) {
      const onDay = arr.find((a) => a.date === d);
      if (onDay) {
        values.push(onDay.progress);
      } else {
        const earlier = arr.filter((a) => a.date < d);
        if (earlier.length > 0) values.push(earlier[earlier.length - 1].progress);
      }
    }
    return { date: d, value: averagePercent(values) };
  });

  const deltas = points.slice(1).map((p, i) => p.value - points[i].value);
  return { points, deltas };
}

export function formatTriple(triple: HistoryTriple | null | undefined): string {
  if (!triple || triple.points.length === 0) return "no snapshots yet";
  return triple.points.map((p) => `${p.value}%`).join(" → ");
}
