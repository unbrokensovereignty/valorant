/**
 * Small charts drawn with the theme's colors: stacked bars, a line, and a study calendar. Bars grow
 * and lines draw in when they first appear; every point has a tooltip.
 */
import type { ComponentChildren } from 'preact';
import { fmt, pct } from '../../core/util.ts';

export type ChartTone = 'knew' | 'almost' | 'again' | 'accent' | 'muted';

export interface BarPoint {
  key: string;
  /** The label under the bar ('' for none). */
  label: string;
  /** Stacked from the bottom. */
  parts: readonly { value: number; tone: ChartTone }[];
  tip: string;
  /** Drawn highlighted (today). */
  now?: boolean;
  /** A day to point out (a test): its label stands out. */
  mark?: boolean;
}

const niceMax = (n: number): number => {
  if (n <= 5) return 5;
  const p = Math.pow(10, Math.floor(Math.log10(n)));
  const m = n / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
};

export function BarChart({ bars, goal, height = 160, label, empty }: { bars: readonly BarPoint[]; goal?: number; height?: number; label: string; empty?: ComponentChildren }) {
  const total = (b: BarPoint) => b.parts.reduce((n, p) => n + p.value, 0);
  const top = niceMax(Math.max(1, goal ?? 0, ...bars.map(total)));
  const none = bars.every((b) => total(b) === 0);
  // what a screen reader hears in place of the bars
  const sum = bars.reduce((n, b) => n + total(b), 0), best = bars.reduce<BarPoint | null>((m, b) => (!m || total(b) > total(m) ? b : m), null);
  const said = none || !best ? `${label}: none yet` : `${label}: ${fmt(sum)} in all. Busiest: ${best.tip}.`;
  return (
    // an empty chart holds a link, so it can't be a picture
    <div class="chart" role={none && empty ? undefined : 'img'} aria-label={none && empty ? undefined : said}>
      <div class="chart-plot" style={{ height: `${height}px` }}>
        <span class="chart-axis top">{fmt(top)}</span>
        <span class="chart-axis zero">0</span>
        {goal ? <span class="chart-goal" style={{ bottom: `${(goal / top) * 100}%` }} /> : null}
        {/* the word sits in the number column, clear of the bars and of the 0 and top numbers */}
        {goal ? <span class="chart-axis goal" style={{ bottom: `clamp(12px, calc(${(goal / top) * 100}% + 2px), calc(100% - 26px))` }}>Goal</span> : null}
        <div class={`chart-bars${bars.length > 40 ? ' dense' : ''}`}>
          {bars.map((b, i) => (
            <div key={b.key} class={`chart-col${b.now ? ' now' : ''}${b.mark ? ' mark' : ''}`} data-tip={b.tip} style={{ '--i': i }}>
              <div class="chart-stack">
                {b.parts.map((p, j) => (p.value > 0 ? <span key={j} class={`seg ${p.tone}`} style={{ height: `${(p.value / top) * 100}%` }} /> : null))}
              </div>
            </div>
          ))}
        </div>
        {none && empty && <div class="chart-empty"><p>{empty}</p></div>}
      </div>
      <div class={`chart-labels${bars.length > 40 ? ' dense' : ''}`} aria-hidden="true">
        {bars.map((b) => <span key={b.key} class={b.mark ? 'mark' : undefined}>{b.label}</span>)}
      </div>
    </div>
  );
}

/** A line from 0 to `max` (gaps where a value is null). */
export function LineChart({ points, max = 100, height = 140, label, unit = '%' }: { points: readonly { key: string; value: number | null; tip: string }[]; max?: number; height?: number; label: string; unit?: string }) {
  const n = points.length;
  const x = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 100 - (Math.min(max, Math.max(0, v)) / max) * 100;
  let d = '', pen = false;
  points.forEach((p, i) => {
    if (p.value == null) { pen = false; return; }
    d += `${pen ? 'L' : 'M'}${x(i).toFixed(2)},${y(p.value).toFixed(2)} `;
    pen = true;
  });
  const last = [...points].reverse().find((p) => p.value != null);
  const area = d ? `${d} L${x(n - 1)},100 L${x(points.findIndex((p) => p.value != null))},100 Z` : '';
  return (
    <div class="chart line" role="img" aria-label={label}>
      <div class="chart-plot" style={{ height: `${height}px` }}>
        <span class="chart-axis top">{max}{unit}</span>
        <span class="chart-axis zero">0</span>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="line-svg" aria-hidden="true">
          {area && <path d={area} class="line-area" />}
          {d && <path d={d} class="line-path" pathLength={1} vector-effect="non-scaling-stroke" />}
        </svg>
        <div class="line-hits">{points.map((p) => <span key={p.key} data-tip={p.tip} />)}</div>
        {last && <span class="line-last" style={{ top: `${y(last.value ?? 0)}%` }}>{last.value}{unit}</span>}
      </div>
    </div>
  );
}

export interface CalDay { key: string; level: 0 | 1 | 2 | 3 | 4; goal: boolean; rest: boolean; today: boolean; future: boolean; tip: string }

/** A calendar of weeks (columns) by weekday (rows), with month names above. */
export function Calendar({ weeks, months, label }: { weeks: readonly (readonly (CalDay | null)[])[]; months: readonly { col: number; name: string }[]; label: string }) {
  return (
    <div class="calendar" role="img" aria-label={label}>
      <div class="cal-months" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }} aria-hidden="true">
        {months.map((m) => <span key={m.col} style={{ gridColumn: `${m.col + 1} / span 3` }}>{m.name}</span>)}
      </div>
      <div class="cal-body">
      <div class="cal-days" aria-hidden="true">{['Mon', '', 'Wed', '', 'Fri', '', ''].map((d, i) => <span key={i}>{d}</span>)}</div>
      <div class="cal-grid" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
        {weeks.map((w, i) => (
          <div key={i} class="cal-week">
            {w.map((d, j) => d
              ? <span key={d.key} class={`cal-day l${d.level}${d.goal ? ' is-goal' : ''}${d.rest ? ' is-rest' : ''}${d.today ? ' is-today' : ''}${d.future ? ' is-future' : ''}`} data-tip={d.tip} />
              : <span key={j} class="cal-day is-blank" />)}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

/** One bar split by share, with a legend underneath. */
export function SplitBar({ parts, label }: { parts: readonly { value: number; tone: ChartTone; name: string }[]; label: string }) {
  const total = parts.reduce((n, p) => n + p.value, 0);
  return (
    <div class="split" role="img" aria-label={`${label}: ${parts.map((p) => `${p.value} ${p.name}`).join(', ')}`}>
      <div class="split-bar">
        {total > 0 && parts.map((p) => (p.value > 0 ? <span key={p.name} class={`seg ${p.tone}`} style={{ flexGrow: p.value }} data-tip={`${p.name}: ${fmt(p.value)} (${pct(p.value / total)})`} /> : null))}
      </div>
      <div class="split-legend">
        {parts.map((p) => <span key={p.name}><i class={`dot ${p.tone}`} />{p.name} <b>{fmt(p.value)}</b></span>)}
      </div>
    </div>
  );
}
