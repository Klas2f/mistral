
import React, { useMemo, useRef, useState } from "react";

const WEEKS = ["Oct 01","Oct 08","Oct 15","Oct 22","Oct 29","Nov 05","Nov 12","Nov 19","Nov 26","Dec 03","Dec 10","Dec 17","Dec 24","Dec 31","Jan 07","Jan 14","Jan 21","Jan 28","Feb 04","Feb 11","Feb 18","Feb 25","Mar 04","Mar 11","Mar 18","Mar 25"];

const DATA = [
  [4.1,13.2,12.7,11.5,9.2,8.1,9.0,13.1],
  [7.5,8.8,8.9,9.0,7.8,9.2,8.4,7.3],
  [8.0,4.9,6.2,7.6,4.1,9.4,5.8,6.7],
  [6.9,7.3,7.0,8.6,3.3,9.7,8.6,10.1],
  [2.0,7.7,8.2,8.8,3.4,5.8,7.5,5.6],
  [0.2,7.0,4.0,9.1,6.1,4.9,7.9,2.5],
  [4.2,8.4,3.3,4.6,-0.6,3.9,0.9,2.5],
  [4.6,4.2,1.8,0.3,-2.3,-1.8,-2.0,null],
  [-0.5,0.8,-6.7,1.4,-4.3,3.8,3.5,null],
  [2.7,4.1,-8.9,-5.0,-8.1,-2.5,5.1,null],
  [1.7,3.3,1.8,-9.5,-2.3,-1.4,5.5,null],
  [2.3,4.8,-1.4,0.1,0.8,1.5,3.4,null],
  [1.4,0.9,-4.6,-1.7,-4.0,4.4,-0.5,null],
  [3.3,0.1,-0.6,-2.0,-8.8,-7.4,-4.7,null],
  [2.7,-1.5,-1.0,2.6,-3.6,-0.9,-5.1,null],
  [4.5,-3.4,1.3,1.3,-9.4,3.0,0.9,null],
  [3.8,-0.4,-0.9,-1.4,0.6,1.8,-3.7,null],
  [2.4,-7.6,-2.8,-0.7,2.6,0.1,-9.2,null],
  [1.1,-9.1,1.5,-0.2,-4.3,-0.4,-7.1,null],
  [2.9,-5.8,1.4,1.6,-1.4,-4.9,-8.2,null],
  [3.9,2.2,-1.3,-0.9,1.5,-0.5,-4.7,null],
  [0.5,5.4,1.3,1.7,2.6,3.4,2.2,null],
  [1.9,-1.0,1.0,-4.1,0.9,6.7,4.4,null],
  [2.7,1.8,2.4,-1.6,3.1,-0.1,4.5,null],
  [2.6,3.9,5.5,4.3,1.2,4.4,6.2,null],
  [3.9,7.6,2.6,-3.2,4.7,7.3,5.0,null],
];

const YEARS = ["2020","2021","2022","2023","2024","2025","2026","2027"];
const SEASON_NAMES = ["2019/20","2020/21","2021/22","2022/23","2023/24","2024/25","2025/26","2026/27 (to Nov 18)"];
// Sequential blue ramp: oldest = lightest, most recent = darkest; current partial season in orange
const COLORS = ["#c6dbef","#9ecae1","#6baed6","#4292c6","#2171b5","#08519c","#08306b","#f28e2b"];
const DASHED = [false,false,false,false,false,false,false,true];

// ---- chart geometry ----
const W = 900, H = 460, ML = 55, MR = 24, MT = 16, MB = 48;
const PW = W - ML - MR, PH = H - MT - MB;
const TMIN = -12, TMAX = 16;
const weekW = PW / 26;
const xFor = (i) => ML + (i + 0.5) * weekW;
const yFor = (t) => MT + ((TMAX - t) / (TMAX - TMIN)) * PH;
const tForY = (y) => TMAX - ((y - MT) / PH) * (TMAX - TMIN);

const fmt = (v) => v.toFixed(1);

export default function App() {
  const svgRef = useRef(null);
  const [drag, setDrag] = useState(null); // {x0,y0,x1,y1} svg px
  const [sel, setSel] = useState(null);   // {w0,w1,tmin,tmax}

  const toSvg = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * W,
      y: ((e.clientY - r.top) / r.height) * H,
    };
  };

  const onDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = toSvg(e);
    setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  };
  const onMove = (e) => {
    if (!drag) return;
    const p = toSvg(e);
    setDrag({ ...drag, x1: Math.max(ML, Math.min(W - MR, p.x)), y1: Math.max(MT, Math.min(MT + PH, p.y)) });
  };
  const onUp = () => {
    if (!drag) return;
    const dx = Math.abs(drag.x1 - drag.x0), dy = Math.abs(drag.y1 - drag.y0);
    if (dx < 8 || dy < 8) { setSel(null); setDrag(null); return; } // click clears
    const xa = Math.max(ML, Math.min(drag.x0, drag.x1));
    const xb = Math.min(W - MR, Math.max(drag.x0, drag.x1));
    const ta = Math.min(drag.y0, drag.y1), tbv = Math.max(drag.y0, drag.y1);
    const w0 = Math.max(0, Math.min(25, Math.ceil((xa - ML) / weekW - 0.5)));
    const w1 = Math.max(0, Math.min(25, Math.floor((xb - ML) / weekW - 0.5)));
    setSel({ w0, w1, tmin: tForY(tbv), tmax: tForY(ta) });
    setDrag(null);
  };

  const stats = useMemo(() => {
    if (!sel) return null;
    const pts = [];
    DATA.forEach((row, i) => {
      if (i < sel.w0 || i > sel.w1) return;
      row.forEach((v, j) => {
        if (v != null && v >= sel.tmin - 1e-9 && v <= sel.tmax + 1e-9) pts.push({ i, j, v });
      });
    });
    if (pts.length === 0) return { pts, avg: null };
    const avg = pts.reduce((s, p) => s + p.v, 0) / pts.length;
    const perSeason = YEARS.map((y, j) => {
      const s = pts.filter((p) => p.j === j).map((p) => p.v);
      return { j, n: s.length, avg: s.length ? s.reduce((a, b) => a + b, 0) / s.length : null };
    }).filter((s) => s.n > 0);
    return { pts, avg, perSeason };
  }, [sel]);

  const ticks = [];
  for (let t = TMIN; t <= TMAX; t += 4) ticks.push(t);

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="px-2 pb-1">
        <h1 className="text-lg font-semibold text-slate-800">
          Uppsala cold seasons: weekly mean temperature (Oct-Mar)
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          One line per season. Older lines are light, newer lines dark; the 2026/27
          season is dashed in orange and stops at Nov 18, 2026 (latest observation).
          <span className="font-medium text-slate-600">
            {" "}Drag a box anywhere on the chart to calculate the average of all
            points inside it.
          </span>{" "}
          Data: SMHI station Uppsala (Aut), daily means aggregated into 26 weeks of
          7 days from Oct 1.
        </p>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full select-none"
          style={{ cursor: "crosshair", touchAction: "none" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
        >
          {/* grid */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={ML} x2={W - MR} y1={yFor(t)} y2={yFor(t)} stroke="#e2e8f0" strokeDasharray="3 3" />
              <text x={ML - 8} y={yFor(t) + 4} textAnchor="end" fontSize={11} fill="#64748b">
                {t}°C
              </text>
            </g>
          ))}
          {WEEKS.map((w, i) =>
            i % 2 === 0 ? (
              <text key={w} x={xFor(i)} y={MT + PH + 20} textAnchor="middle" fontSize={10} fill="#64748b">
                {w}
              </text>
            ) : null
          )}
          <text x={(ML + W - MR) / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="#94a3b8">
            Week of season (Oct 1 - Mar 31)
          </text>

          {/* selection rectangle (while dragging) */}
          {drag && (
            <rect
              x={Math.min(drag.x0, drag.x1)}
              y={Math.min(drag.y0, drag.y1)}
              width={Math.abs(drag.x1 - drag.x0)}
              height={Math.abs(drag.y1 - drag.y0)}
              fill="#08306b"
              fillOpacity={0.08}
              stroke="#08306b"
              strokeDasharray="4 3"
            />
          )}

          {/* series lines */}
          {YEARS.map((y, j) => {
            const d = DATA.map((row, i) =>
              row[j] == null ? null : `${xFor(i)},${yFor(row[j])}`
            );
            let path = "", open = false;
            d.forEach((p) => {
              if (p == null) { open = false; return; }
              if (!open) { path += ` M${p}`; open = true; } else { path += ` L${p}`; }
            });
            return (
              <path
                key={y}
                d={path.trim()}
                fill="none"
                stroke={COLORS[j]}
                strokeWidth={2.4}
                strokeDasharray={DASHED[j] ? "6 4" : undefined}
              />
            );
          })}

          {/* committed selection: fill + highlighted points */}
          {sel && (
            <g>
              <rect
                x={xFor(sel.w0) - weekW / 2}
                y={yFor(sel.tmax)}
                width={(sel.w1 - sel.w0 + 1) * weekW}
                height={yFor(sel.tmin) - yFor(sel.tmax)}
                fill="#0f172a"
                fillOpacity={0.07}
                stroke="#0f172a"
                strokeDasharray="4 3"
              />
              {stats?.pts.map((p) => (
                <circle key={`${p.i}-${p.j}`} cx={xFor(p.i)} cy={yFor(p.v)} r={3} fill="#fff" stroke={COLORS[p.j]} strokeWidth={1.8} />
              ))}
            </g>
          )}
        </svg>

        {/* results panel */}
        {sel && stats && (
          <div className="absolute right-3 top-3 w-60 rounded-lg border border-slate-200 bg-white/95 p-3 text-xs shadow-lg backdrop-blur">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Selection</span>
              <button
                className="rounded px-1.5 py-0.5 text-slate-500 hover:bg-slate-100"
                onClick={() => setSel(null)}
              >
                Clear ✕
              </button>
            </div>
            <div className="text-slate-500">
              Weeks {WEEKS[sel.w0]} - {WEEKS[sel.w1]} ({sel.w1 - sel.w0 + 1} wks)
              <br />
              Band {fmt(sel.tmin)} to {fmt(sel.tmax)} °C
            </div>
            {stats.avg == null ? (
              <div className="mt-2 font-medium text-slate-500">No points inside</div>
            ) : (
              <>
                <div className="mt-2 text-base font-semibold text-slate-800">
                  {fmt(stats.avg)} °C
                  <span className="ml-1 text-xs font-normal text-slate-500">
                    avg of {stats.pts.length} pts
                  </span>
                </div>
                <div className="mt-2 space-y-0.5">
                  {stats.perSeason.map((s) => (
                    <div key={s.j} className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: COLORS[s.j] }} />
                      <span className="w-24 truncate text-slate-600">{SEASON_NAMES[s.j]}</span>
                      <span className="font-medium text-slate-800">{fmt(s.avg)} °C</span>
                      <span className="text-slate-400">({s.n})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between px-2 text-xs text-slate-400">
        <span>Weeks run Oct 1 - Mar 31 (26 x 7 days). Drag to select; click to clear.</span>
        <div className="flex items-center gap-1.5">
          <span>older</span>
          {COLORS.map((c, i) => (
            <span key={i} className="h-3 w-4 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span>newer</span>
        </div>
      </div>
    </div>
  );
}