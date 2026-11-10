"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clamp01, shapeAreaM2 } from "@/lib/geo";
import { M2_TO_SQFT, SURFACE_META, SURFACE_TYPES, type Point, type Shape, type SurfaceType } from "@/lib/types";

const V = 1000; // SVG viewBox units per image side
const ZOOMS = [1, 1.5, 2, 3];

interface Props {
  imageUrl: string;
  imageSpanM: number;
  shapes: Shape[];
  /** Called once before a change that should be undoable. */
  onBeginEdit: () => void;
  onChange: (shapes: Shape[]) => void;
  onUndo: () => void;
  canUndo: boolean;
  measuring: boolean;
  onImageError: () => void;
}

const uid = () => `s-${Math.random().toString(36).slice(2, 9)}`;

function centroid(points: Point[]): Point {
  const n = points.length || 1;
  return [points.reduce((s, p) => s + p[0], 0) / n, points.reduce((s, p) => s + p[1], 0) / n];
}

export function SurfaceEditor({
  imageUrl,
  imageSpanM,
  shapes,
  onBeginEdit,
  onChange,
  onUndo,
  canUndo,
  measuring,
  onImageError,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawing, setDrawing] = useState<{ type: SurfaceType; points: Point[] } | null>(null);
  const [cursor, setCursor] = useState<Point | null>(null);
  const [zoom, setZoom] = useState(1);
  const [unit, setUnit] = useState(2); // viewBox units per screen pixel
  const shapesRef = useRef(shapes);
  shapesRef.current = shapes;

  const selected = shapes.find((s) => s.id === selectedId) ?? null;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const measure = () => setUnit(V / Math.max(1, svg.getBoundingClientRect().width));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(svg);
    return () => ro.disconnect();
  }, []);

  // Keep the view centred when the zoom level changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
  }, [zoom]);

  const toPoint = useCallback((clientX: number, clientY: number): Point => {
    const rect = svgRef.current!.getBoundingClientRect();
    return [clamp01((clientX - rect.left) / rect.width), clamp01((clientY - rect.top) / rect.height)];
  }, []);

  const finishDrawing = useCallback(() => {
    setDrawing((d) => {
      if (d && d.points.length >= 3) {
        const shape: Shape = { id: uid(), type: d.type, points: d.points };
        onBeginEdit();
        onChange([...shapesRef.current, shape]);
        setSelectedId(shape.id);
      }
      return null;
    });
    setCursor(null);
  }, [onBeginEdit, onChange]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    onBeginEdit();
    onChange(shapesRef.current.filter((s) => s.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, onBeginEdit, onChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Escape") {
        setDrawing(null);
        setCursor(null);
      } else if (e.key === "Enter" && drawing) {
        e.preventDefault();
        finishDrawing();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        onUndo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawing, finishDrawing, onUndo]);

  function movePoint(shapeId: string, index: number, p: Point) {
    onChange(
      shapesRef.current.map((s) =>
        s.id === shapeId ? { ...s, points: s.points.map((q, i) => (i === index ? p : q)) } : s,
      ),
    );
  }

  function startDrag(e: React.PointerEvent, shapeId: string, index: number, insert?: Point) {
    e.stopPropagation();
    e.preventDefault();
    onBeginEdit();
    if (insert) {
      onChange(
        shapesRef.current.map((s) =>
          s.id === shapeId ? { ...s, points: [...s.points.slice(0, index), insert, ...s.points.slice(index)] } : s,
        ),
      );
    }
    const move = (ev: PointerEvent) => movePoint(shapeId, index, toPoint(ev.clientX, ev.clientY));
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  }

  function removePoint(shapeId: string, index: number) {
    const shape = shapesRef.current.find((s) => s.id === shapeId);
    if (!shape || shape.points.length <= 3) return;
    onBeginEdit();
    onChange(
      shapesRef.current.map((s) => (s.id === shapeId ? { ...s, points: s.points.filter((_, i) => i !== index) } : s)),
    );
  }

  function onCanvasClick(e: React.MouseEvent) {
    if (!drawing) {
      setSelectedId(null);
      return;
    }
    const p = toPoint(e.clientX, e.clientY);
    const first = drawing.points[0];
    if (first && drawing.points.length >= 3) {
      const dist = Math.hypot((p[0] - first[0]) * V, (p[1] - first[1]) * V);
      if (dist < 22 * unit) {
        finishDrawing();
        return;
      }
    }
    setDrawing({ ...drawing, points: [...drawing.points, p] });
  }

  const pts = (points: Point[]) => points.map(([x, y]) => `${x * V},${y * V}`).join(" ");
  const r = 8 * unit;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {SURFACE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className="btn btn-quiet btn-sm"
            aria-pressed={drawing?.type === type}
            disabled={measuring}
            onClick={() => {
              setSelectedId(null);
              setDrawing({ type, points: [] });
            }}
          >
            <span className="h-3 w-3 rounded-sm" style={{ background: SURFACE_META[type].color }} aria-hidden="true" />
            <span className="sr-only">Add</span>
            <span aria-hidden="true">+</span> {SURFACE_META[type].label.replace("City s", "S")}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-2">
          <button type="button" className="btn btn-quiet btn-sm" onClick={onUndo} disabled={!canUndo}>
            Undo
          </button>
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            aria-label="Zoom out"
            disabled={zoom === ZOOMS[0]}
            onClick={() => setZoom(ZOOMS[Math.max(0, ZOOMS.indexOf(zoom) - 1)])}
          >
            −
          </button>
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            aria-label="Zoom in"
            disabled={zoom === ZOOMS[ZOOMS.length - 1]}
            onClick={() => setZoom(ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS.indexOf(zoom) + 1)])}
          >
            +
          </button>
        </span>
      </div>

      <div
        ref={scrollRef}
        className="relative aspect-square w-full overflow-auto rounded-[16px] border border-line bg-night"
      >
        <div className="relative" style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Satellite view of your property"
            className="absolute inset-0 h-full w-full select-none"
            draggable={false}
            onError={onImageError}
          />
          <svg
            ref={svgRef}
            viewBox={`0 0 ${V} ${V}`}
            className={`absolute inset-0 h-full w-full ${drawing ? "cursor-crosshair" : ""}`}
            onClick={onCanvasClick}
            onPointerMove={(e) => drawing && setCursor(toPoint(e.clientX, e.clientY))}
            onPointerLeave={() => setCursor(null)}
            role="group"
            aria-label="Outlines of the areas we will clear"
          >
            {shapes.map((s) => {
              const color = SURFACE_META[s.type].color;
              const isSel = s.id === selectedId;
              const c = centroid(s.points);
              const sqft = Math.round(shapeAreaM2(s.points, imageSpanM) * M2_TO_SQFT);
              return (
                <g key={s.id}>
                  <polygon
                    points={pts(s.points)}
                    fill={color}
                    fillOpacity={isSel ? 0.45 : 0.32}
                    stroke={color}
                    strokeWidth={(isSel ? 3 : 2) * unit}
                    strokeLinejoin="round"
                    className={drawing ? "" : "cursor-pointer"}
                    onClick={(e) => {
                      if (drawing) return;
                      e.stopPropagation();
                      setSelectedId(s.id);
                    }}
                  />
                  {isSel && !drawing && (
                  <text
                    x={c[0] * V}
                    y={c[1] * V}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={12 * unit}
                    fontWeight={700}
                    fill="#fff"
                    stroke="#0f1a24"
                    strokeWidth={3 * unit}
                    paintOrder="stroke"
                    pointerEvents="none"
                  >
                    {sqft} sq ft
                  </text>
                  )}
                </g>
              );
            })}

            {selected && !drawing && (
              <g>
                {selected.points.map((p, i) => {
                  const next = selected.points[(i + 1) % selected.points.length];
                  const mid: Point = [(p[0] + next[0]) / 2, (p[1] + next[1]) / 2];
                  return (
                    <g key={`m-${i}`} style={{ touchAction: "none" }} className="cursor-copy">
                      <circle
                        cx={mid[0] * V}
                        cy={mid[1] * V}
                        r={14 * unit}
                        fill="transparent"
                        onPointerDown={(e) => startDrag(e, selected.id, i + 1, mid)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <circle
                        cx={mid[0] * V}
                        cy={mid[1] * V}
                        r={r * 0.6}
                        fill="#fff"
                        fillOpacity={0.75}
                        stroke="#0f1a24"
                        strokeWidth={unit}
                        pointerEvents="none"
                      />
                    </g>
                  );
                })}
                {selected.points.map((p, i) => (
                  <g key={`v-${i}`} style={{ touchAction: "none" }} className="cursor-grab">
                    <circle
                      cx={p[0] * V}
                      cy={p[1] * V}
                      r={20 * unit}
                      fill="transparent"
                      tabIndex={0}
                      role="button"
                      aria-label={`Corner ${i + 1} of ${SURFACE_META[selected.type].label}. Arrow keys move it, Delete removes it.`}
                      onPointerDown={(e) => startDrag(e, selected.id, i)}
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        removePoint(selected.id, i);
                      }}
                      onKeyDown={(e) => {
                        const step = e.shiftKey ? 0.01 : 0.002;
                        const d: Record<string, Point> = {
                          ArrowLeft: [-step, 0],
                          ArrowRight: [step, 0],
                          ArrowUp: [0, -step],
                          ArrowDown: [0, step],
                        };
                        if (d[e.key]) {
                          e.preventDefault();
                          if (!e.repeat) onBeginEdit();
                          movePoint(selected.id, i, [clamp01(p[0] + d[e.key][0]), clamp01(p[1] + d[e.key][1])]);
                        } else if (e.key === "Delete" || e.key === "Backspace") {
                          e.preventDefault();
                          removePoint(selected.id, i);
                        }
                      }}
                    />
                    <circle
                      cx={p[0] * V}
                      cy={p[1] * V}
                      r={r}
                      fill="#fff"
                      stroke="#0f1a24"
                      strokeWidth={2 * unit}
                      pointerEvents="none"
                    />
                  </g>
                ))}
              </g>
            )}

            {drawing && (
              <g pointerEvents="none">
                <polyline
                  points={pts(cursor ? [...drawing.points, cursor] : drawing.points)}
                  fill={SURFACE_META[drawing.type].color}
                  fillOpacity={0.25}
                  stroke={SURFACE_META[drawing.type].color}
                  strokeWidth={2.5 * unit}
                  strokeDasharray={`${6 * unit} ${4 * unit}`}
                />
                {drawing.points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p[0] * V}
                    cy={p[1] * V}
                    r={i === 0 && drawing.points.length >= 3 ? r * 1.4 : r * 0.8}
                    fill="#fff"
                    stroke="#0f1a24"
                    strokeWidth={2 * unit}
                  />
                ))}
              </g>
            )}
          </svg>

          {measuring && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden bg-night/35">
              <div className="scanline absolute inset-x-0 top-0 h-[10%] bg-gradient-to-b from-transparent via-sidewalk/50 to-transparent" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 min-h-12 text-sm text-ink-soft" aria-live="polite">
        {measuring ? (
          <p className="font-semibold text-ink">Measuring your driveway, sidewalk and walkway. This takes up to half a minute.</p>
        ) : drawing ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink">
              Tap each corner of the {SURFACE_META[drawing.type].label.toLowerCase()}, going around its edge.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={drawing.points.length < 3}
              onClick={finishDrawing}
            >
              Finish outline
            </button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setDrawing(null)}>
              Cancel
            </button>
          </div>
        ) : selected ? (
          <div className="flex flex-wrap items-center gap-2">
            <p>
              <strong className="text-ink">{SURFACE_META[selected.type].label} selected.</strong> Drag a corner to
              move it. Drag a small dot to add a corner. Double-tap a corner to remove it.
            </p>
            <label className="sr-only" htmlFor="shape-type">
              Change what this area is
            </label>
            <select
              id="shape-type"
              className="field !min-h-11 !w-auto text-sm"
              value={selected.type}
              onChange={(e) => {
                onBeginEdit();
                onChange(shapes.map((s) => (s.id === selected.id ? { ...s, type: e.target.value as SurfaceType } : s)));
              }}
            >
              {SURFACE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SURFACE_META[t].label}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-quiet btn-sm" onClick={deleteSelected}>
              Delete this area
            </button>
          </div>
        ) : shapes.length ? (
          <p>Does this look right? Tap an outline to adjust it, or add an area we missed.</p>
        ) : (
          <p>No areas outlined yet. Use the buttons above to outline your driveway, sidewalk and walkway.</p>
        )}
      </div>
    </div>
  );
}
