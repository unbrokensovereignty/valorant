/**
 * A map's minimap with callouts, and a play's routes drawn on it: one color per step, an arrow
 * where each player ends up, a ring where a player holds, and a dashed start from spawn. The
 * minimap always sits on a dark frame (like in the game), so the route colors read in both themes.
 */
import { useMemo } from 'preact/hooks';
import { mapById, spotName, type MapInfo } from '../../core/kb/maps.ts';
import { minimapOf } from '../art.tsx';

export interface Route { route: readonly string[]; label?: string }

let seq = 0;
const isSpawn = (name: string) => / Side Spawn$/.test(name);

/** The number of route colors; steps past it reuse them. */
export const ROUTE_COLORS = 5;

export function Minimap({ map: id, routes = [], focus = -1, labels = 'routes', label, onFocus }: {
  map: string;
  routes?: readonly Route[];
  /** The step to bring forward (the others fade), or -1 for none. */
  focus?: number;
  /** Which callouts get names: those on the routes, all of them, or none. */
  labels?: 'routes' | 'all' | 'none';
  label?: string;
  onFocus?: (i: number) => void;
}) {
  const uid = useMemo(() => `mm${++seq}`, []);
  const map = mapById(id);
  const art = minimapOf(id);
  if (!map) return null;
  const at = (name: string) => map.callouts.find((c) => c.name === name);
  const named = labels === 'all' ? map.callouts.map((c) => c.name) : labels === 'routes' ? [...new Set(routes.flatMap((r) => r.route))] : [];
  return (
    <div class="minimap" role="img" aria-label={label ?? `Minimap of ${map.name}`}>
      {art ? <img src={art} alt="" draggable={false} /> : <span class="minimap-none">{map.name}</span>}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          {Array.from({ length: ROUTE_COLORS }, (_, i) => (
            <marker key={i} id={`${uid}-a${i}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse">
              <path d="M0 0 10 5 0 10z" class={`route-fill r${i}`} />
            </marker>
          ))}
        </defs>
        {routes.map((r, i) => <RoutePath key={i} r={r} i={i} uid={uid} map={map} dim={focus >= 0 && focus !== i} onFocus={onFocus} />)}
        {placeLabels(named.map((n) => at(n)).filter((c) => !!c).map((c) => ({ text: shortName(c.name), x: c.x * 100, y: c.y * 100 }))).map((l) => (
          <text key={l.text} x={l.x} y={l.y} class="minimap-label" text-anchor={l.anchor}>{l.text}</text>
        ))}
      </svg>
    </div>
  );
}

interface Label { text: string; x: number; y: number; anchor: 'middle' | 'start' | 'end' }

/**
 * Puts each name above its spot, or below, right or left when that would cover a name already
 * placed (sizes in the map's 0 to 100 units, for 3-unit text).
 */
function placeLabels(spots: readonly { text: string; x: number; y: number }[]): Label[] {
  const boxes: { l: number; r: number; t: number; b: number }[] = [];
  const out: Label[] = [];
  for (const s of spots) {
    const w = s.text.length * 1.6 + 1, h = 3.4;
    const tries: Label[] = [
      { text: s.text, x: s.x, y: s.y - 2.4, anchor: 'middle' },
      { text: s.text, x: s.x, y: s.y + 4.6, anchor: 'middle' },
      { text: s.text, x: s.x + 2.4, y: s.y + 1, anchor: 'start' },
      { text: s.text, x: s.x - 2.4, y: s.y + 1, anchor: 'end' },
    ];
    const boxOf = (t: Label) => {
      const l = t.anchor === 'middle' ? t.x - w / 2 : t.anchor === 'start' ? t.x : t.x - w;
      return { l, r: l + w, t: t.y - h + 0.6, b: t.y + 0.6 };
    };
    const free = tries.find((t) => { const b = boxOf(t); return !boxes.some((o) => b.l < o.r && b.r > o.l && b.t < o.b && b.b > o.t); }) ?? tries[0]!;
    boxes.push(boxOf(free));
    out.push(free);
  }
  return out;
}

/** Short names for a small map: "Attack spawn", and "Arches" for "Defender Side Arches". */
const shortName = (name: string): string => spotName(name).replace(/^(Attacker|Defender) Side /, '');

function RoutePath({ r, i, uid, map, dim, onFocus }: { r: Route; i: number; uid: string; map: MapInfo; dim: boolean; onFocus?: (i: number) => void }) {
  const pts = r.route.map((n) => map.callouts.find((c) => c.name === n)).filter((c) => !!c).map((c) => [c.x * 100, c.y * 100] as const);
  const color = i % ROUTE_COLORS;
  const cls = `route r${color}${dim ? ' dim' : ''}`;
  const hover = onFocus ? { onMouseEnter: () => onFocus(i), onMouseLeave: () => onFocus(-1) } : {};
  if (!pts.length) return null;
  if (pts.length === 1) {
    const [x, y] = pts[0]!;
    return <g class={cls} {...hover}><circle cx={x} cy={y} r="2.4" class="route-hold" /><circle cx={x} cy={y} r="0.9" class="route-fill" /></g>;
  }
  // the walk out of spawn is only a direction, so it's dashed and the line proper starts after it
  const fromSpawn = isSpawn(r.route[0]!);
  const main = fromSpawn ? pts.slice(1) : pts;
  const line = (ps: readonly (readonly [number, number])[]) => ps.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const arrow = `url(#${uid}-a${color})`;
  return (
    <g class={cls} {...hover}>
      {fromSpawn && <polyline points={line(pts.slice(0, 2))} class="route-line spawn" marker-end={main.length === 1 ? arrow : undefined} />}
      {main.length > 1 && <polyline points={line(main)} class="route-line" marker-end={arrow} />}
      {main.length > 1 && <circle cx={main[0]![0]} cy={main[0]![1]} r="1.1" class="route-fill" />}
      {main.length === 1 && <circle cx={main[0]![0]} cy={main[0]![1]} r="2.4" class="route-hold" />}
    </g>
  );
}
