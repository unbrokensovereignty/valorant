/**
 * A map's minimap with callouts, and a play's routes drawn on it: one color per step, an arrow
 * where each player ends up, a ring where a player holds, and a dashed start from spawn. A route
 * keeps to the floor between its callouts (core/kb/floor.ts), so it goes round walls, not through
 * them. The minimap always sits on a dark frame (like in the game), so the route colors read in
 * both themes.
 *
 * How callouts show is the same on every minimap (useMapView): a dot at each callout's middle, and
 * names at the size chosen. A zoomable minimap also zooms (the wheel, the buttons, or + and − when
 * it has focus), moves (dragging, or the arrow keys) and fills the screen. Everything on it (names,
 * dots and marks) grows and shrinks with the map, so it always covers the same share of it; and it
 * can show the map's layers: ultimate orbs and features (core/kb/features.ts).
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { featuresOf, FEATURE_KINDS, type FeatureKind, type MapFeature } from '../../core/kb/features.ts';
import { walk, type Spot } from '../../core/kb/floor.ts';
import { mapById, spotName, type MapInfo } from '../../core/kb/maps.ts';
import { agentArtOf, minimapOf } from '../art.tsx';
import { agentById } from '../../core/kb/agents.ts';
import { useView } from '../state.ts';
import { IconButton } from './controls.tsx';

/** A route on the minimap, and who takes it (agent ids), drawn where it ends. */
export interface Route { route: readonly string[]; label?: string; who?: readonly string[] }

let seq = 0;
const isSpawn = (name: string) => / Side Spawn$/.test(name);

/** The number of route colors; steps past it reuse them. */
export const ROUTE_COLORS = 5;

/** Callout name sizes, as a share of the size a printed sheet uses. */
export const TEXT_SIZES = [['s', 'Small', 0.45], ['m', 'Medium', 0.58], ['l', 'Large', 0.72], ['xl', 'Extra large', 0.9]] as const;
export type TextSize = (typeof TEXT_SIZES)[number][0];
/** How far a minimap zooms in, at most, and each step of the buttons and keys. */
export const ZOOM = { most: 5, step: 1.4 };

/** How callouts show on the minimaps, as the viewer last chose: kept like the other views. */
export function useMapView() {
  const yes = (v: string) => v === 'yes' || v === 'no';
  const [dots, setDots] = useView<'yes' | 'no'>('map.dots', 'yes', yes);
  const [text, setText] = useView<TextSize>('map.text', 'm', (v) => TEXT_SIZES.some(([id]) => id === v));
  const [orbs, setOrbs] = useView<'yes' | 'no'>('map.orbs', 'yes', yes);
  const [features, setFeatures] = useView<'yes' | 'no'>('map.features', 'yes', yes);
  return {
    dots: dots === 'yes', setDots: (v: boolean) => setDots(v ? 'yes' : 'no'),
    text, setText, scale: TEXT_SIZES.find(([id]) => id === text)![2],
    orbs: orbs === 'yes', setOrbs: (v: boolean) => setOrbs(v ? 'yes' : 'no'),
    features: features === 'yes', setFeatures: (v: boolean) => setFeatures(v ? 'yes' : 'no'),
  };
}

export function Minimap({ map: id, routes = [], focus = -1, labels = 'routes', label, onFocus, zoomable = false, layers = [], plain = false }: {
  map: string;
  routes?: readonly Route[];
  /** The step to bring forward (the others fade), or -1 for none. */
  focus?: number;
  /** Which callouts get names: those on the routes, all of them, or none. */
  labels?: 'routes' | 'all' | 'none';
  label?: string;
  onFocus?: (i: number) => void;
  /** Zoom and move it. */
  zoomable?: boolean;
  /** The layers to show over the callouts. */
  layers?: readonly ('orbs' | 'features')[];
  /** Ignore the viewer's choices (a printed sheet): names a size that reads on paper, with dots. */
  plain?: boolean;
}) {
  const uid = useMemo(() => `mm${++seq}`, []);
  const view = useMapView();
  const scale = plain ? 1 : view.scale, dots = plain || view.dots;
  const [z, setZ] = useState(1);
  const [pan, setPan] = useState<Spot>([0, 0]);
  const [full, setFull] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; pan: Spot } | null>(null);
  const map = mapById(id);
  const art = minimapOf(id);
  // a new map starts zoomed out
  useEffect(() => { setZ(1); setPan([0, 0]); }, [id]);
  // full screen ends with Escape too, so follow the browser
  useEffect(() => {
    if (!zoomable) return;
    const onChange = () => setFull(!!wrap.current && document.fullscreenElement === wrap.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [zoomable]);
  const canFull = zoomable && typeof document !== 'undefined' && !!document.fullscreenEnabled;
  const toggleFull = () => {
    if (!canFull) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void wrap.current?.requestFullscreen().then(() => box.current?.focus({ preventScroll: true })).catch(() => {});
  };

  /** Keeps the minimap covering its frame: the pan, in shares of the frame, for zoom `k`. */
  const clampPan = (p: Spot, k: number): Spot => [Math.min(0, Math.max(1 - k, p[0])), Math.min(0, Math.max(1 - k, p[1]))];
  /** Zooms to `k`, keeping the point at (`fx`, `fy`) of the frame where it is. */
  const zoomTo = (k: number, fx = 0.5, fy = 0.5) => {
    const next = Math.min(ZOOM.most, Math.max(1, k));
    setPan((p) => clampPan([fx - ((fx - p[0]) * next) / z, fy - ((fy - p[1]) * next) / z], next));
    setZ(next);
  };
  const moveBy = (dx: number, dy: number) => setPan((p) => clampPan([p[0] + dx, p[1] + dy], z));

  // the wheel zooms (a listener of its own, so it can keep the page from scrolling)
  useEffect(() => {
    const el = box.current;
    if (!zoomable || !el) return;
    const onWheel = (e: WheelEvent) => {
      const k = z * (e.deltaY < 0 ? ZOOM.step ** 0.5 : 1 / ZOOM.step ** 0.5);
      if ((k < 1 && z === 1) || (k > ZOOM.most && z === ZOOM.most)) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomTo(k, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  if (!map) return null;
  const at = (name: string) => map.callouts.find((c) => c.name === name);
  const named = labels === 'all' ? map.callouts.map((c) => c.name) : labels === 'routes' ? [...new Set(routes.flatMap((r) => r.route))] : [];
  const spots = named.map((n) => at(n)).filter((c) => !!c);
  // names, dots and marks are drawn in the map's own units, so they grow with it as it zooms
  const k = scale, dot = dots ? DOT * k : 0;
  const faces = facesOf(routes, map);
  const shown = layers.length ? featuresOf(map.id).filter((f) => layers.includes(FEATURE_KINDS.find((x) => x.kind === f.kind)!.layer)) : [];

  const onKey = (e: KeyboardEvent) => {
    const step = 0.12 / z;
    const keys: Record<string, () => void> = {
      '+': () => zoomTo(z * ZOOM.step), '=': () => zoomTo(z * ZOOM.step), '-': () => zoomTo(z / ZOOM.step), '0': () => zoomTo(1), f: toggleFull,
      ArrowLeft: () => moveBy(step * z, 0), ArrowRight: () => moveBy(-step * z, 0), ArrowUp: () => moveBy(0, step * z), ArrowDown: () => moveBy(0, -step * z),
    };
    const run = keys[e.key];
    if (!run || e.ctrlKey || e.metaKey || e.altKey || (e.key.startsWith('Arrow') && z === 1)) return;
    e.preventDefault();
    run();
  };
  const onDown = (e: PointerEvent) => {
    if (!zoomable || z === 1 || e.button !== 0) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, pan };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    const d = drag.current, el = box.current;
    if (!d || d.id !== e.pointerId || !el) return;
    const r = el.getBoundingClientRect();
    setPan(clampPan([d.pan[0] + (e.clientX - d.x) / r.width, d.pan[1] + (e.clientY - d.y) / r.height], z));
  };
  const onUp = (e: PointerEvent) => { if (drag.current?.id === e.pointerId) drag.current = null; };

  const name = label ?? `Minimap of ${map.name}`;
  const stage = (
    <div class="minimap-stage" style={z === 1 ? undefined : { transform: `translate(${pan[0] * 100}%, ${pan[1] * 100}%) scale(${z})` }}>
      {art ? <img src={art} alt="" draggable={false} /> : <span class="minimap-none">{map.name}</span>}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id={`${uid}-face`} clipPathUnits="objectBoundingBox"><circle cx="0.5" cy="0.5" r="0.5" /></clipPath>
          {Array.from({ length: ROUTE_COLORS }, (_, i) => (
            <marker key={i} id={`${uid}-a${i}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse">
              <path d="M0 0 10 5 0 10z" class={`route-fill r${i}`} />
            </marker>
          ))}
        </defs>
        {shown.map((f, i) => <Feature key={i} f={f} />)}
        {routes.map((r, i) => <RoutePath key={i} r={r} i={i} uid={uid} map={map} dim={focus >= 0 && focus !== i} onFocus={onFocus} />)}
        {faces.map((f) => <FaceMark key={`${f.i}-${f.id}`} f={f} uid={uid} dim={focus >= 0 && focus !== f.i} />)}
        {dots && spots.map((c) => <circle key={c.name} cx={c.x * 100} cy={c.y * 100} r={dot} class="minimap-dot" style={{ strokeWidth: `${0.3 * dot}px` }} />)}
        {placeLabels(spots.map((c) => ({ text: shortName(c.name), x: c.x * 100, y: c.y * 100, clear: clearOf(faces, c.name, c.x * 100) })), k, dots ? dot : -1, [...shown.flatMap((f) => [f.at, ...(f.to ? [f.to] : [])]).map(([x, y]) => [x * 100, y * 100, 1.2] as const), ...faces.map((f) => [f.x, f.y, FACE + 0.3] as const)]).map((l) => (
          <text key={l.text} x={l.x} y={l.y} class="minimap-label" text-anchor={l.anchor} style={{ fontSize: `${3 * k}px`, strokeWidth: `${0.7 * k}px` }}>{l.text}</text>
        ))}
      </svg>
    </div>
  );
  if (!zoomable) return <div class="minimap" role="img" aria-label={name}>{stage}</div>;
  return (
    <div ref={wrap} class={`minimap-wrap${full ? ' full' : ''}`}>
      <div
        ref={box} class={`minimap zoomable${z > 1 ? ' zoomed' : ''}`} tabIndex={0} role="group"
        aria-label={`${name}. Zoom with plus and minus, move with the arrow keys, and 0 zooms back out.${canFull ? ' F fills the screen.' : ''}`}
        onKeyDown={onKey} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        onDblClick={(e) => { const r = box.current!.getBoundingClientRect(); zoomTo(z * ZOOM.step, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); }}>
        {stage}
      </div>
      <div class="minimap-zoom">
        <IconButton icon="plus" label="Zoom in" size="sm" disabled={z >= ZOOM.most} onClick={() => zoomTo(z * ZOOM.step)} />
        <IconButton icon="minus" label="Zoom out" size="sm" disabled={z <= 1} onClick={() => zoomTo(z / ZOOM.step)} />
        <IconButton icon="expand" label="Show the whole map" size="sm" disabled={z <= 1} onClick={() => zoomTo(1)} />
        {canFull && <IconButton icon={full ? 'fullscreen-exit' : 'fullscreen'} label={full ? 'Leave full screen' : 'Fill the screen'} size="sm" onClick={toggleFull} />}
      </div>
    </div>
  );
}

/** The kinds of feature a map has on the layers shown, for a legend. */
export function featureKindsOn(map: string, layers: readonly ('orbs' | 'features')[]): typeof FEATURE_KINDS {
  const have = new Set(featuresOf(map).map((f) => f.kind));
  return FEATURE_KINDS.filter((k) => have.has(k.kind) && layers.includes(k.layer));
}

/** A feature's mark, as the legend draws it too, turned by its `angle`. */
function Feature({ f }: { f: MapFeature }) {
  const [x, y] = [f.at[0] * 100, f.at[1] * 100];
  const to = f.to && ([f.to[0] * 100, f.to[1] * 100] as const);
  return (
    <g class={`feature ${f.kind}`}>
      <title>{f.about}</title>
      {to && (f.kind === 'rope' || f.kind === 'zipline') && <line x1={x} y1={y} x2={to[0]} y2={to[1]} class="feature-link" style={{ strokeWidth: '0.45px' }} />}
      <FeatureMark kind={f.kind} x={x} y={y} angle={f.angle} />
      {to && <FeatureMark kind={f.kind} x={to[0]} y={to[1]} angle={f.angle} />}
    </g>
  );
}

/** A mark's shape in the map's units (`size` 1 is its size on the minimap), turned `angle` degrees clockwise. */
function FeatureMark({ kind, x, y, size = 1, angle }: { kind: FeatureKind; x: number; y: number; size?: number; angle?: number | undefined }) {
  const shape = markShape(kind, x, y, size);
  return angle ? <g transform={`rotate(${angle} ${x} ${y})`}>{shape}</g> : shape;
}

/**
 * Each kind's shape: symbols about two units across (a fiftieth of the map), whatever the size of
 * the thing in the game, so none stands out over the others. Doors, breakable and droppable walls
 * are bars, told apart by color and thickness.
 */
function markShape(kind: FeatureKind, x: number, y: number, size: number) {
  const u = size, line = { strokeWidth: `${0.25 * u}px` };
  const bar = (h: number) => <rect x={x - 1.1 * u} y={y - (h / 2) * u} width={2.2 * u} height={h * u} rx={Math.min(0.25, h / 2) * u} class="feature-mark" style={line} />;
  switch (kind) {
    case 'orb': return <path d={`M${x} ${y - 0.95 * u}L${x + 0.95 * u} ${y}L${x} ${y + 0.95 * u}L${x - 0.95 * u} ${y}Z`} class="feature-mark" style={line} />;
    case 'door': return bar(0.85);
    case 'breakable': case 'wall': return bar(0.5);
    case 'teleporter': return <circle cx={x} cy={y} r={0.85 * u} class="feature-mark ring" style={{ strokeWidth: `${0.35 * u}px` }} />;
    case 'drop': return <rect x={x - 0.75 * u} y={y - 0.75 * u} width={1.5 * u} height={1.5 * u} rx={0.15 * u} class="feature-mark" style={line} />;
    default: return <circle cx={x} cy={y} r={0.6 * u} class="feature-mark" style={line} />;
  }
}

/** A feature kind's mark on its own, for a legend. */
export function FeatureSwatch({ kind }: { kind: FeatureKind }) {
  return (
    <svg class={`feature-swatch feature ${kind}`} viewBox="-3 -3 6 6" aria-hidden="true">
      {(kind === 'rope' || kind === 'zipline') && <line x1="-2.6" y1="0" x2="2.6" y2="0" class="feature-link" style={{ strokeWidth: '0.45px' }} />}
      <FeatureMark kind={kind} x={0} y={0} size={2} />
    </svg>
  );
}

interface Label { text: string; x: number; y: number; anchor: 'middle' | 'start' | 'end' }

/** A callout's dot, as its radius for 3-unit names (it grows and shrinks with them). */
const DOT = 0.8;
/** The space between a name and its spot's dot, for 3-unit names (a capital letter is about 2.2 units tall). */
const LABEL_GAP = 0.9;

/**
 * Puts each name above its spot, or below, right or left when that would cover a name already
 * placed or a mark (`marks`, each as its middle and how far it reaches), a little way from the spot's
 * dot (`dot` is its radius). Without dots (`dot` below 0) a name sits right on its spot. Sizes are
 * in the map's 0 to 100 units, for 3-unit text times `k`.
 */
function placeLabels(spots: readonly { text: string; x: number; y: number; clear?: readonly [number, number] }[], k = 1, dot = 0, marks: readonly (readonly [number, number, number])[] = []): Label[] {
  const boxes = marks.map(([x, y, r]) => ({ l: x - r, r: x + r, t: y - r, b: y + r }));
  const out: Label[] = [];
  const gap = LABEL_GAP * k + Math.max(0, dot);
  for (const s of spots) {
    const w = (s.text.length * 1.6 + 1) * k, h = 3.4 * k;
    // faces at the spot push the name out past them
    const [up, side] = s.clear ? [Math.max(gap, s.clear[0]), Math.max(gap, s.clear[1])] : [gap, gap];
    const tries: Label[] = dot < 0 && !s.clear ? [{ text: s.text, x: s.x, y: s.y + 1.1 * k, anchor: 'middle' }] : [
      { text: s.text, x: s.x, y: s.y - up, anchor: 'middle' },
      { text: s.text, x: s.x, y: s.y + 2.2 * k + up, anchor: 'middle' },
      { text: s.text, x: s.x + side, y: s.y + 1.1 * k, anchor: 'start' },
      { text: s.text, x: s.x - side, y: s.y + 1.1 * k, anchor: 'end' },
    ];
    const boxOf = (t: Label) => {
      const l = t.anchor === 'middle' ? t.x - w / 2 : t.anchor === 'start' ? t.x : t.x - w;
      return { l, r: l + w, t: t.y - h + 0.6 * k, b: t.y + 0.6 * k };
    };
    // the first way that covers nothing, or else the one that covers least
    const covered = (t: Label) => { const b = boxOf(t); return boxes.reduce((n, o) => n + Math.max(0, Math.min(b.r, o.r) - Math.max(b.l, o.l)) * Math.max(0, Math.min(b.b, o.b) - Math.max(b.t, o.t)), 0); };
    const free = tries.map((t) => ({ t, n: covered(t) })).reduce((a, b) => (b.n < a.n ? b : a)).t;
    boxes.push(boxOf(free));
    out.push(free);
  }
  return out;
}

/** Short names for a small map: "Attack spawn", and "Arches" for "Defender Side Arches". */
const shortName = (name: string): string => spotName(name).replace(/^(Attacker|Defender) Side /, '');

/** The line through a route's spots, along the floor from each one to the next. */
const along = (map: string, spots: readonly Spot[]): Spot[] => spots.flatMap((s, i) => (i === 0 ? [s] : walk(map, spots[i - 1]!, s).slice(1)));

/** A face's radius on the minimap, in the map's units. */
const FACE = 2.3;
/** A player's face on the minimap: who, on which route (`i`), at the end of it (`spot`), and where it's drawn. */
interface Face { id: string; i: number; spot: string; x: number; y: number }

/** Where each player's face goes: where their route ends, side by side with anyone else who ends there. */
function facesOf(routes: readonly Route[], map: MapInfo): Face[] {
  const at = new Map<string, { id: string; i: number }[]>();
  routes.forEach((r, i) => {
    const end = r.route[r.route.length - 1];
    if (end && r.who?.length) at.set(end, [...(at.get(end) ?? []), ...r.who.map((id) => ({ id, i }))]);
  });
  return [...at].flatMap(([name, who]) => {
    const c = map.callouts.find((x) => x.name === name);
    return c ? who.map((w, j) => ({ ...w, spot: name, x: c.x * 100 + (j - (who.length - 1) / 2) * FACE * 2.15, y: c.y * 100 })) : [];
  });
}

/** How far a name keeps from its spot, up or down and to the side, to clear the faces there (none: no faces). */
function clearOf(faces: readonly Face[], spot: string, x: number): [number, number] | undefined {
  const here = faces.filter((f) => f.spot === spot);
  if (!here.length) return undefined;
  return [FACE + 0.6, Math.max(...here.map((f) => Math.abs(f.x - x))) + FACE + 0.6];
}

/** A player's face where their route ends, ringed in the route's color. */
function FaceMark({ f, uid, dim }: { f: Face; uid: string; dim: boolean }) {
  const art = agentArtOf(f.id), name = agentById(f.id)?.name ?? f.id;
  return (
    <g class={`route-face r${f.i % ROUTE_COLORS}${dim ? ' dim' : ''}`}>
      <title>{name}</title>
      <circle cx={f.x} cy={f.y} r={FACE + 0.3} class="route-face-ring" />
      {art
        ? <image href={art} x={f.x - FACE} y={f.y - FACE} width={FACE * 2} height={FACE * 2} clip-path={`url(#${uid}-face)`} preserveAspectRatio="xMidYMid slice" />
        : <text x={f.x} y={f.y + 0.9} class="route-face-initial" text-anchor="middle">{[...name][0]}</text>}
    </g>
  );
}

function RoutePath({ r, i, uid, map, dim, onFocus }: { r: Route; i: number; uid: string; map: MapInfo; dim: boolean; onFocus?: (i: number) => void }) {
  const pts = r.route.map((n) => map.callouts.find((c) => c.name === n)).filter((c) => !!c).map((c): Spot => [c.x, c.y]);
  const color = i % ROUTE_COLORS;
  const cls = `route r${color}${dim ? ' dim' : ''}`;
  const hover = onFocus ? { onMouseEnter: () => onFocus(i), onMouseLeave: () => onFocus(-1) } : {};
  if (!pts.length) return null;
  if (pts.length === 1) {
    const [x, y] = pts[0]!;
    return <g class={cls} {...hover}><circle cx={x * 100} cy={y * 100} r="2.4" class="route-hold" /><circle cx={x * 100} cy={y * 100} r="0.9" class="route-fill" /></g>;
  }
  // the walk out of spawn is only a direction, so it's dashed and the line proper starts after it
  const fromSpawn = isSpawn(r.route[0]!);
  const main = fromSpawn ? pts.slice(1) : pts;
  const line = (ps: readonly Spot[]) => along(map.id, ps).map(([x, y]) => `${(x * 100).toFixed(2)},${(y * 100).toFixed(2)}`).join(' ');
  const arrow = `url(#${uid}-a${color})`;
  return (
    <g class={cls} {...hover}>
      {fromSpawn && <polyline points={line(pts.slice(0, 2))} class="route-line spawn" marker-end={main.length === 1 ? arrow : undefined} />}
      {main.length > 1 && <polyline points={line(main)} class="route-line" marker-end={arrow} />}
      {main.length > 1 && <circle cx={main[0]![0] * 100} cy={main[0]![1] * 100} r="1.1" class="route-fill" />}
      {main.length === 1 && <circle cx={main[0]![0] * 100} cy={main[0]![1] * 100} r="2.4" class="route-hold" />}
    </g>
  );
}
