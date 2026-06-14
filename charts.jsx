// Editorial chart primitives — custom built, no library defaults.
// Loads: IndiaTileMap, Beeswarm, DotGrid, EducationStack, IndustryTreemap,
//        Ridgeline, TypographicRanking, BignumGrid.

const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;

/* ──────────────────────────────────────────────────────────────────
   BIGNUM GRID — 2×2 huge Fraunces numbers
   ────────────────────────────────────────────────────────────────── */
function BignumGrid({ cells }) {
  return (
    <div className="bignum-grid">
      {cells.map((c, i) => (
        <div className="bignum" key={i}>
          <div className="num">{c.value}</div>
          <div className="lbl">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   TYPOGRAPHIC RANKING
   ────────────────────────────────────────────────────────────────── */
function TypographicRanking({ rows, caption, valFmt }) {
  return (
    <div>
      <div className="ranking">
        {rows.map((r, i) => (
          <div className="rank-row" key={i}>
            <span className="rk mono">{String(i + 1).padStart(2, '0')}</span>
            <span className="nm">{r.name}</span>
            <span className="vl mono">{valFmt ? valFmt(r.value) : r.value}</span>
          </div>
        ))}
      </div>
      {caption && <div className="ranking-caption">{caption}</div>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   INDIA TILE CARTOGRAM
   Editorial tile-grid map. Each state is one square on a 9×9 grid.
   Color intensity = founder count (4 quantile levels).
   ────────────────────────────────────────────────────────────────── */
const TILE_LAYOUT = [
  // [code, name, row, col]
  ['JK', 'Jammu & Kashmir', 1, 3],
  ['LA', 'Ladakh',          1, 4],
  ['PB', 'Punjab',          2, 3],
  ['HP', 'Himachal Pradesh',2, 4],
  ['UK', 'Uttarakhand',     2, 5],
  ['HR', 'Haryana',         3, 3],
  ['DL', 'Delhi',           3, 4],
  ['UP', 'Uttar Pradesh',   3, 5],
  ['BR', 'Bihar',           3, 6],
  ['SK', 'Sikkim',          3, 7],
  ['AR', 'Arunachal',       3, 8],
  ['RJ', 'Rajasthan',       4, 2],
  ['MP', 'Madhya Pradesh',  4, 4],
  ['JH', 'Jharkhand',       4, 6],
  ['WB', 'West Bengal',     4, 7],
  ['AS', 'Assam',           4, 8],
  ['NL', 'Nagaland',        4, 9],
  ['GJ', 'Gujarat',         5, 2],
  ['MH', 'Maharashtra',     5, 3],
  ['CG', 'Chhattisgarh',    5, 5],
  ['OD', 'Odisha',           5, 6],
  ['MG', 'Meghalaya',       5, 7],
  ['MN', 'Manipur',         5, 8],
  ['MZ', 'Mizoram',         5, 9],
  ['GA', 'Goa',             6, 3],
  ['TG', 'Telangana',       6, 4],
  ['AP', 'Andhra Pradesh',  6, 5],
  ['TR', 'Tripura',         6, 7],
  ['KA', 'Karnataka',       7, 3],
  ['TN', 'Tamil Nadu',      7, 5],
  ['KL', 'Kerala',          8, 3],
];

function IndiaTileMap({ stateCounts, totalLabel }) {
  // stateCounts: { stateName: count }
  const countByCode = useMemo(() => {
    const m = {};
    TILE_LAYOUT.forEach(([code, name]) => {
      m[code] = stateCounts[name] || 0;
    });
    return m;
  }, [stateCounts]);

  // Bucket counts into 5 levels: 0, low, mid, high, top
  const level = (n) => {
    if (n === 0) return 0;
    if (n >= 100) return 4;
    if (n >= 40)  return 3;
    if (n >= 15)  return 2;
    return 1;
  };

  const [hover, setHover] = useState(null);

  return (
    <div>
      <div className="cartogram" role="img" aria-label="India founder cartogram">
        {TILE_LAYOUT.map(([code, name, r, c]) => {
          const n = countByCode[code];
          const lv = level(n);
          return (
            <div
              key={code}
              className={`tile lvl-${lv}`}
              style={{ gridRow: r, gridColumn: c }}
              onMouseEnter={() => setHover({ code, name, n })}
              onMouseLeave={() => setHover(null)}
              title={`${name}: ${n}`}
            >
              <span>{code}</span>
              {n > 0 && <span className="count">{n}</span>}
            </div>
          );
        })}
      </div>
      <div className="cartogram-tooltip mono">
        {hover
          ? <>{hover.code} <span className="hl">{hover.name}</span> · {hover.n} founder{hover.n === 1 ? '' : 's'}</>
          : <>Founders by home state · {totalLabel || 'Maharashtra leads with 125'}</>}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   BEESWARM — D3-style force layout, but deterministic and dependency-free.
   Input: ageBuckets with counts per 5-year bucket from 20 to 95.
   We deterministically scatter dot ages within each bucket, then run a
   simple repulsion pass to push overlapping dots vertically.
   ────────────────────────────────────────────────────────────────── */
function Beeswarm({ buckets, median, width: extW }) {
  const wrapRef = useRef(null);
  const [w, setW] = useState(800);
  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const obs = new ResizeObserver(entries => {
      const cw = entries[0].contentRect.width;
      if (cw > 0) setW(cw);
    });
    obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  const h = 280;
  const padL = 12, padR = 12, padT = 16, padB = 28;
  const minAge = 20, maxAge = 95;
  const xScale = (age) => padL + ((age - minAge) / (maxAge - minAge)) * (w - padL - padR);
  const baseY = h - padB;
  const radius = 3.2;

  // 1) Generate ages from buckets deterministically
  const ages = useMemo(() => {
    let seed = 1;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const arr = [];
    buckets.forEach(b => {
      const [lo, hi] = b.bucket.split('–').map(Number);
      for (let i = 0; i < b.value; i++) {
        // Slightly cluster toward middle of bucket
        arr.push(lo + rand() * (hi - lo + 1));
      }
    });
    return arr;
  }, [buckets]);

  // 2) Compute beeswarm positions: simple x-bin packing
  const dots = useMemo(() => {
    // sort by age for stable layout
    const sorted = [...ages].sort((a, b) => a - b);
    const placed = []; // {x, y}
    sorted.forEach(age => {
      const x = xScale(age);
      // Try y positions stacking upward
      let y = baseY - radius;
      const cols = placed.filter(p => Math.abs(p.x - x) < radius * 2.1);
      cols.sort((a, b) => b.y - a.y);
      for (const p of cols) {
        if (Math.abs(p.y - y) < radius * 2.05) {
          y = p.y - radius * 2.05;
        }
      }
      placed.push({ x, y, age });
    });
    return placed;
  }, [ages, w]);

  const medianX = xScale(median);
  const xTicks = [20, 30, 40, 50, 60, 70, 80, 90];

  return (
    <div ref={wrapRef}>
      <div className="beeswarm-box">
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: 280 }}>
          {/* baseline rule */}
          <line x1={padL} y1={baseY} x2={w - padR} y2={baseY} stroke="var(--rule)" />
          {/* median line */}
          <line x1={medianX} y1={padT} x2={medianX} y2={baseY}
                stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 4" />
          <text x={medianX + 8} y={padT + 12}
                fontFamily="JetBrains Mono, monospace" fontSize="10.5"
                fill="var(--accent)" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Median · {median}
          </text>
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={radius}
                    fill="var(--ink)" fillOpacity="0.6">
              <title>{Math.floor(d.age)} years</title>
            </circle>
          ))}
        </svg>
        <div className="beeswarm-axis mono">
          {xTicks.map(t => <span key={t}>{t}</span>)}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   DOT GRID — every dot is a founder. Women highlighted in accent.
   Scattered deterministically.
   ────────────────────────────────────────────────────────────────── */
function DotGrid({ total, female, male }) {
  // Deterministically mark `female` out of `total` indices as female.
  const COLS = 60;
  const m = male != null ? male : total - female;
  const dots = useMemo(() => {
    if (total <= 0) return [];
    const arr = new Array(total).fill(0);
    if (female <= 0) return arr;
    let seed = 7;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const step = total / female;
    let pos = 0;
    for (let i = 0; i < female; i++) {
      let idx = Math.floor(pos + rand() * 0.8 * step);
      if (idx >= total) idx = total - 1;
      while (arr[idx] === 1 && idx < total - 1) idx++;
      arr[idx] = 1;
      pos += step;
    }
    return arr;
  }, [total, female]);

  return (
    <div>
      <div className="dotgrid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {dots.map((v, i) => <div key={i} className={v === 1 ? 'dot f' : 'dot'} />)}
      </div>
      <div className="dotgrid-legend">
        <span><span className="sw" style={{ background: 'var(--ink)' }} /> Men · {m.toLocaleString()}</span>
        <span><span className="sw" style={{ background: 'var(--accent)' }} /> Women · {female.toLocaleString()}</span>
        <span>n = {total.toLocaleString()} founders</span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   STACKED EDUCATION BAR — single horizontal bar, segments by level.
   ────────────────────────────────────────────────────────────────── */
function EducationStack({ levels }) {
  const total = levels.reduce((s, l) => s + l.value, 0);
  const shades = ['shade-0', 'shade-1', 'shade-2', 'shade-3', 'shade-4'];
  return (
    <div>
      <div className="stackbar">
        {levels.map((l, i) => {
          const pct = (l.value / total) * 100;
          const showInside = pct >= 6;
          return (
            <div key={i} className={`stackbar seg ${shades[i]}`}
                 style={{ width: `${pct}%`, background: getShadeColor(i), color: i < 3 ? 'var(--paper)' : 'var(--ink)' }}
                 title={`${l.name}: ${l.value} (${l.pct}%)`}>
              {showInside && <>
                <span className="lbl">{shortLevel(l.name)}</span>
                <span className="num">{l.value}</span>
              </>}
            </div>
          );
        })}
      </div>
      <div className="stackbar-callouts">
        {levels.map((l, i) => (
          <span className="co" key={i}>
            {l.name} <span className="v">{l.pct}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}
function shortLevel(n) {
  if (n.startsWith('Professional')) return 'Pro.';
  return n;
}
function getShadeColor(i) {
  const map = ['var(--ink)', '#4A4133', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];
  return map[i] || 'var(--chart-4)';
}

/* ──────────────────────────────────────────────────────────────────
   INDUSTRY TREEMAP — squarified algorithm, custom.
   ────────────────────────────────────────────────────────────────── */
function squarify(items, x, y, w, h) {
  // items: [{name, value}], returns rectangles [{name, value, x, y, w, h}]
  // Implements the "squarified treemap" of Bruls, Huijsen & Van Wijk (2000).
  const out = [];
  const total = items.reduce((s, i) => s + i.value, 0);
  const sorted = [...items].sort((a, b) => b.value - a.value);

  let rx = x, ry = y, rw = w, rh = h, rtotal = total;
  let remaining = sorted.slice();

  while (remaining.length) {
    const shortSide = Math.min(rw, rh);
    const row = [];
    let bestRatio = Infinity;

    while (remaining.length) {
      const candidate = [...row, remaining[0]];
      const sum = candidate.reduce((s, i) => s + i.value, 0);
      const areaScale = (rw * rh) / rtotal;
      const rowArea = sum * areaScale;
      const rowLen = rowArea / shortSide;
      // worst aspect ratio in candidate
      let worst = 0;
      for (const it of candidate) {
        const sideA = (it.value * areaScale) / rowLen;
        const ratio = Math.max(rowLen / sideA, sideA / rowLen);
        if (ratio > worst) worst = ratio;
      }
      if (worst > bestRatio) break;
      bestRatio = worst;
      row.push(remaining.shift());
    }

    // Layout this row along the short side
    const rowSum = row.reduce((s, i) => s + i.value, 0);
    const areaScale2 = (rw * rh) / rtotal;
    const rowArea2 = rowSum * areaScale2;
    const rowLen2 = rowArea2 / shortSide;
    if (rw <= rh) {
      // horizontal row along top
      let cx = rx;
      for (const it of row) {
        const segW = (it.value * areaScale2) / rowLen2;
        out.push({ ...it, x: cx, y: ry, w: segW, h: rowLen2 });
        cx += segW;
      }
      ry += rowLen2;
      rh -= rowLen2;
    } else {
      // vertical column along left
      let cy = ry;
      for (const it of row) {
        const segH = (it.value * areaScale2) / rowLen2;
        out.push({ ...it, x: rx, y: cy, w: rowLen2, h: segH });
        cy += segH;
      }
      rx += rowLen2;
      rw -= rowLen2;
    }
    rtotal -= rowSum;
  }
  return out;
}

function IndustryTreemap({ data }) {
  const wrapRef = useRef(null);
  const [w, setW] = useState(700);
  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const obs = new ResizeObserver(entries => {
      const cw = entries[0].contentRect.width;
      if (cw > 0) setW(cw);
    });
    obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  const h = w * (11 / 16);
  const tiles = useMemo(() => squarify(data, 0, 0, w, h), [data, w, h]);

  // Shade: top 3 darkest, rest spread.
  const sortedByValue = [...data].sort((a, b) => b.value - a.value);
  const rank = (name) => sortedByValue.findIndex(d => d.name === name);
  const shadeFor = (name) => {
    const r = rank(name);
    if (r === 0) return 'shade-0';
    if (r === 1) return 'shade-1';
    if (r === 2) return 'shade-2';
    if (r <= 5)  return 'shade-3';
    if (r <= 9)  return 'shade-4';
    return 'shade-5';
  };

  return (
    <div ref={wrapRef} className="treemap" style={{ height: h }}>
      {tiles.map((t, i) => {
        const small = t.w < 100 || t.h < 60;
        const tiny = t.w < 60 || t.h < 40;
        // Below this size the value digits can't fit the tile even with reduced
        // padding — render a bare colored sliver (hover title still has the data)
        // rather than letting the number overflow and collide with neighbours.
        const micro = t.w < 24 || t.h < 28;
        return (
          <div key={i}
               className={`treemap-tile ${shadeFor(t.name)}${small ? ' is-small' : ''}`}
               style={{ left: t.x, top: t.y, width: t.w, height: t.h }}
               title={`${t.name}: ${t.value}`}>
            {!tiny && <div className="nm" style={small ? { fontSize: 11 } : {}}>
              {small ? abbrev(t.name) : t.name}
            </div>}
            {!micro && <div className="vl">{t.value}</div>}
          </div>
        );
      })}
    </div>
  );
}
function abbrev(name) {
  return name.split(/[\s/]+/).map(w => w.slice(0, 4)).join(' ');
}

/* ──────────────────────────────────────────────────────────────────
   RIDGELINE — thin horizontal bars with name + count
   ────────────────────────────────────────────────────────────────── */
function Ridgeline({ data }) {
  const max = Math.max(...data.map(d => d.value));
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className="ridge">
      {data.map((d, i) => {
        const pct = animated ? (d.value / max) * 100 : 0;
        return (
          <div className="ridge-row" key={i}>
            <span className="nm">{d.name}</span>
            <div className="ridge-track">
              <div className="ridge-bar"
                   style={{ width: `${pct}%`, transitionDelay: `${i * 50}ms` }} />
            </div>
            <span className="vl">{d.value}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Reveal on scroll wrapper
   ────────────────────────────────────────────────────────────────── */
function Reveal({ children, stagger = false, as: As = 'div', className = '', ...rest }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const cls = `${stagger ? 'reveal-stagger' : 'reveal'}${seen ? ' in' : ''} ${className}`;
  return <As ref={ref} className={cls} {...rest}>{children}</As>;
}

Object.assign(window, {
  BignumGrid, TypographicRanking, IndiaTileMap, Beeswarm, DotGrid,
  EducationStack, IndustryTreemap, Ridgeline, Reveal
});
