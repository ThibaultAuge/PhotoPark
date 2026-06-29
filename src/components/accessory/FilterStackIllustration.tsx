import React from "react";
import type { Accessory, AccessoryLensReference } from "@/lib/accessory/types";

// ─── SVG constants ───────────────────────────────────────────────────────────

const SVG_W = 440;
const SVG_H = 400;
const CX = SVG_W / 2;

/** Map a real mm diameter to an SVG pixel width (child-drawing proportions).
 *  Scaled ~2.5× so rings and lens are nice and wide. */
function diaW(dia: number | null, fallback: number): number {
  if (dia === null || dia <= 0) return fallback * 2.5;
  return Math.round((28 + dia * 0.62) * 2.5);
}

// ─── Palette "child drawing" cartoon ─────────────────────────────────────────

const C = {
  lensBody: "#3a3a3a",
  lensBodyLight: "#4a4a4a",
  lensStroke: "#555",
  lensRing: "#666",
  lensGlass: "rgba(80,150,210,0.2)",
  lensGlassShine: "rgba(255,255,255,0.25)",
  lensText: "#aaa",
  threaded: {
    fill: "#ede5d8",
    stroke: "#a09080",
    thread: "#8a7a6a",
    shadow: "rgba(0,0,0,0.06)",
  },
  magnetic: {
    fill: "#dde5f0",
    stroke: "#7b8d9b",
    poleN: "#e74c3c",
    poleS: "#3498db",
  },
  filter: {
    fill: "rgba(160,210,255,0.2)",
    stroke: "#7b9bab",
    shine: "rgba(255,255,255,0.5)",
    rim: "#c0c8d0",
  },
  hood: { fill: "#e0d8cc", stroke: "#9b8b7b" },
  general: { fill: "#eaeaea", stroke: "#999" },
  label: "#777",
  labelDark: "#555",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

// ── Lens ─────────────────────────────────────────────────────────────────────

function LensDrawing({
  cx,
  topY,
  bottomY,
  width,
  label,
  filterDia,
}: {
  cx: number;
  topY: number;
  bottomY: number;
  width: number;
  label: string;
  filterDia: number | null;
}) {
  const hw = width / 2;
  const ringH = 14;
  const ringW = width + 16;

  return (
    <g className="svg-lens">
      {/* — Thread mount ring — */}
      <rect
        x={cx - ringW / 2}
        y={topY}
        width={ringW}
        height={ringH}
        rx={4}
        ry={4}
        fill={C.lensRing}
        stroke={C.lensStroke}
        strokeWidth={2.5}
      />
      {/* Thread dashes on mount ring */}
      {Array.from({ length: 7 }, (_, i) => {
        const x = cx - ringW / 2 + 8 + i * ((ringW - 16) / 6);
        return (
          <line
            key={`mth-${i}`}
            x1={x}
            y1={topY + 2}
            x2={x}
            y2={topY + ringH - 2}
            stroke={C.lensBody}
            strokeWidth={1.8}
            strokeLinecap="round"
            opacity={0.7}
          />
        );
      })}

      {/* — Lens body (rounded cylinder) — */}
      <path
        d={`M ${cx - hw} ${topY + ringH + 2}
            L ${cx - hw} ${bottomY - 4}
            Q ${cx - hw} ${bottomY} ${cx - hw + 4} ${bottomY}
            L ${cx + hw - 4} ${bottomY}
            Q ${cx + hw} ${bottomY} ${cx + hw} ${bottomY - 4}
            L ${cx + hw} ${topY + ringH + 2} Z`}
        fill={C.lensBody}
        stroke={C.lensStroke}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {/* — Slight highlight on left side — */}
      <path
        d={`M ${cx - hw + 4} ${topY + ringH + 6}
            L ${cx - hw + 4} ${bottomY - 8}
            Q ${cx - hw + 3} ${bottomY - 4} ${cx - hw + 8} ${bottomY - 4}`}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* — Front glass element — */}
      <ellipse
        cx={cx}
        cy={topY + ringH + 16}
        rx={hw - 6}
        ry={12}
        fill={C.lensGlass}
        stroke={C.lensStroke}
        strokeWidth={1.5}
      />
      {/* Glass shine */}
      <ellipse
        cx={cx - (hw - 6) * 0.3}
        cy={topY + ringH + 14}
        rx={(hw - 6) * 0.35}
        ry={5}
        fill={C.lensGlassShine}
      />

      {/* — Upper barrel ring (focus ring area) — */}
      <rect
        x={cx - hw + 2}
        y={topY + ringH + 32}
        width={width - 4}
        height={18}
        rx={2}
        fill={C.lensBodyLight}
        stroke={C.lensStroke}
        strokeWidth={1.5}
        opacity={0.6}
      />

      {/* — Focus ring grip dots — */}
      {Array.from({ length: 8 }, (_, i) => {
        const y = topY + ringH + 34 + (i % 3) * 5;
        const x = cx - hw + 6 + i * ((width - 12) / 7);
        return (
          <circle key={`dot-${i}`} cx={x} cy={y} r={1.5} fill={C.lensStroke} opacity={0.5} />
        );
      })}

      {/* — Barrel detail rings — */}
      {[0, 1, 2].map((i) => {
        const y = topY + ringH + 56 + i * 14;
        if (y > bottomY - 16) return null;
        return (
          <line
            key={`barrel-${i}`}
            x1={cx - hw + 6}
            y1={y}
            x2={cx + hw - 6}
            y2={y + (i % 2 === 0 ? 1 : -1)}
            stroke={C.lensStroke}
            strokeWidth={1.8}
            strokeLinecap="round"
            opacity={0.4}
          />
        );
      })}

      {/* — Mount index dot (small white dot typical on lenses) — */}
      {filterDia !== null && filterDia > 0 && (
        <circle cx={cx - hw - 2} cy={topY + ringH / 2} r={2.5} fill="#e8e0d0" stroke={C.lensStroke} strokeWidth={1} />
      )}

      {/* — Labels — */}
      <text
        x={cx}
        y={bottomY + 16}
        textAnchor="middle"
        fill={C.lensText}
        fontSize={10}
        fontFamily="sans-serif"
        fontWeight={600}
      >
        {label}
      </text>
      {filterDia !== null && filterDia > 0 && (
        <text
          x={cx}
          y={bottomY + 29}
          textAnchor="middle"
          fill={C.lensText}
          fontSize={8}
          fontFamily="sans-serif"
          opacity={0.6}
        >
          ⌀{filterDia} mm
        </text>
      )}
    </g>
  );
}

// ── Threaded Ring (two stacked rectangles with thread marks) ────────────────

function ThreadedRing({
  cx,
  y,
  width,
  height,
  rearDia,
  frontDia,
}: {
  cx: number;
  y: number;
  width: number;
  height: number;
  rearDia: number | null;
  frontDia: number | null;
}) {
  // Each ring is split into two stacked blocks, glued together
  const blockH = Math.round(height * 0.48);

  // Compute widths for rear (bottom) and front (top) interfaces
  const rearW = width;
  const rearHw = rearW / 2;
  const frontW =
    frontDia != null && rearDia != null && frontDia !== rearDia
      ? diaW(frontDia, width)
      : width;
  const frontHw = frontW / 2;

  const rearTopY = y + height - blockH + 1;
  const frontTopY = y;

  // Thread dash count
  const tCount = 6;

  return (
    <g className="svg-threaded">
      {/* ── Rear block (bottom, connects to lens or below) ── */}
      <rect
        x={cx - rearHw}
        y={rearTopY}
        width={rearW}
        height={blockH}
        rx={4}
        ry={4}
        fill={C.threaded.fill}
        stroke={C.threaded.stroke}
        strokeWidth={2.5}
      />
      {/* Shadow at bottom */}
      <rect
        x={cx - rearHw + 2}
        y={rearTopY + blockH - 4}
        width={rearW - 4}
        height={4}
        rx={2}
        fill={C.threaded.shadow}
      />
      {/* Rear thread dashes (left + right sides) */}
      {Array.from({ length: tCount }, (_, i) => {
        const x = cx - rearHw + (i + 1) * (rearW / (tCount + 1));
        return (
          <line
            key={`rt-${i}`}
            x1={x}
            y1={rearTopY + 4}
            x2={x}
            y2={rearTopY + blockH - 4}
            stroke={C.threaded.thread}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        );
      })}

      {/* ── Front block (top, connects to next accessory) ── */}
      <rect
        x={cx - frontHw}
        y={frontTopY}
        width={frontW}
        height={blockH}
        rx={4}
        ry={4}
        fill={C.threaded.fill}
        stroke={C.threaded.stroke}
        strokeWidth={2.5}
      />
      {/* Shadow at top */}
      <rect
        x={cx - frontHw + 2}
        y={frontTopY}
        width={frontW - 4}
        height={4}
        rx={2}
        fill={C.threaded.shadow}
      />
      {/* Front thread dashes */}
      {Array.from({ length: tCount }, (_, i) => {
        const x = cx - frontHw + (i + 1) * (frontW / (tCount + 1));
        return (
          <line
            key={`ft-${i}`}
            x1={x}
            y1={frontTopY + 4}
            x2={x}
            y2={frontTopY + blockH - 4}
            stroke={C.threaded.thread}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        );
      })}

      {/* ── Step transition when diameters differ ── */}
      {frontW !== rearW && frontW > rearW && (
        <>
          {/* Left step: outer wall */}
          <line x1={cx - frontHw} y1={rearTopY} x2={cx - rearHw} y2={rearTopY} stroke={C.threaded.stroke} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={cx - frontHw} y1={frontTopY} x2={cx - frontHw} y2={rearTopY} stroke={C.threaded.stroke} strokeWidth={2.5} strokeLinecap="round" />
          {/* Right step: outer wall */}
          <line x1={cx + frontHw} y1={rearTopY} x2={cx + rearHw} y2={rearTopY} stroke={C.threaded.stroke} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={cx + frontHw} y1={frontTopY} x2={cx + frontHw} y2={rearTopY} stroke={C.threaded.stroke} strokeWidth={2.5} strokeLinecap="round" />
        </>
      )}
      {frontW !== rearW && frontW < rearW && (
        <>
          {/* Left step: outer wall */}
          <line x1={cx - rearHw} y1={rearTopY} x2={cx - frontHw} y2={rearTopY} stroke={C.threaded.stroke} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={cx - frontHw} y1={frontTopY} x2={cx - frontHw} y2={rearTopY} stroke={C.threaded.stroke} strokeWidth={2.5} strokeLinecap="round" />
          {/* Right step: outer wall */}
          <line x1={cx + rearHw} y1={rearTopY} x2={cx + frontHw} y2={rearTopY} stroke={C.threaded.stroke} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={cx + frontHw} y1={frontTopY} x2={cx + frontHw} y2={rearTopY} stroke={C.threaded.stroke} strokeWidth={2.5} strokeLinecap="round" />
        </>
      )}

      {/* ── Diameter label ── */}
      <text
        x={cx}
        y={y + height / 2 + 4}
        textAnchor="middle"
        fill={C.label}
        fontSize={8}
        fontFamily="sans-serif"
        style={{ pointerEvents: "none" }}
        fontWeight={600}
      >
        {rearDia != null && frontDia != null && rearDia !== frontDia
          ? `${rearDia}→${frontDia}`
          : `⌀${rearDia ?? frontDia ?? ""}`}
      </text>
    </g>
  );
}

// ── Magnetic Ring (two stacked blocks with magnet symbols) ──────────────────

function MagneticRing({
  cx,
  y,
  width,
  height,
  rearDia,
  frontDia,
}: {
  cx: number;
  y: number;
  width: number;
  height: number;
  rearDia: number | null;
  frontDia: number | null;
}) {
  const blockH = Math.round(height * 0.48);

  const rearW = width;
  const rearHw = rearW / 2;
  const frontW =
    frontDia != null && rearDia != null && frontDia !== rearDia
      ? diaW(frontDia, width)
      : width;
  const frontHw = frontW / 2;

  const rearTopY = y + height - blockH + 1;
  const frontTopY = y;

  return (
    <g className="svg-magnetic">
      {/* ── Rear block (threaded side) ── use threaded style */}
      <rect
        x={cx - rearHw}
        y={rearTopY}
        width={rearW}
        height={blockH}
        rx={4}
        ry={4}
        fill={C.magnetic.fill}
        stroke={C.magnetic.stroke}
        strokeWidth={2.5}
      />
      {/* Thread dashes on rear (threaded side) */}
      {Array.from({ length: 5 }, (_, i) => {
        const x = cx - rearHw + (i + 1) * (rearW / 6);
        return (
          <line
            key={`mrt-${i}`}
            x1={x}
            y1={rearTopY + 4}
            x2={x}
            y2={rearTopY + blockH - 4}
            stroke={C.magnetic.stroke}
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.5}
          />
        );
      })}

      {/* ── Front block (magnetic side) ── dashed border */}
      <rect
        x={cx - frontHw}
        y={frontTopY}
        width={frontW}
        height={blockH}
        rx={4}
        ry={4}
        fill={C.magnetic.fill}
        stroke={C.magnetic.stroke}
        strokeWidth={2.5}
        strokeDasharray="5,4"
      />

      {/* ── Magnetic pole indicators (N / S) ── */}
      <text
        x={cx - frontHw * 0.35}
        y={frontTopY + blockH * 0.55}
        textAnchor="middle"
        fill={C.magnetic.poleN}
        fontSize={12}
        fontFamily="sans-serif"
        fontWeight={900}
        style={{ pointerEvents: "none" }}
      >
        N
      </text>
      <text
        x={cx + frontHw * 0.35}
        y={frontTopY + blockH * 0.55}
        textAnchor="middle"
        fill={C.magnetic.poleS}
        fontSize={12}
        fontFamily="sans-serif"
        fontWeight={900}
        style={{ pointerEvents: "none" }}
      >
        S
      </text>

      {/* ── Small horseshoe magnet icon at the seam ── */}
      <g transform={`translate(${cx}, ${rearTopY}) scale(0.35)`}>
        <path
          d="M -8,0 C -8,-10 8,-10 8,0 L 8,12 L 4,12 L 4,1 C 4,-5 -4,-5 -4,1 L -4,12 L -8,12 Z"
          fill="none"
          stroke={C.magnetic.poleN}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="-3" y="10" fontSize="10" fill={C.magnetic.poleN} fontWeight={900}>N</text>
        <text x="1" y="10" fontSize="10" fill={C.magnetic.poleS} fontWeight={900}>S</text>
      </g>

      {/* ── Step transition when diameters differ ── */}
      {frontW !== rearW && frontW > rearW && (
        <>
          <line x1={cx - frontHw} y1={rearTopY} x2={cx - rearHw} y2={rearTopY} stroke={C.magnetic.stroke} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={cx - frontHw} y1={frontTopY} x2={cx - frontHw} y2={rearTopY} stroke={C.magnetic.stroke} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={cx + frontHw} y1={rearTopY} x2={cx + rearHw} y2={rearTopY} stroke={C.magnetic.stroke} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={cx + frontHw} y1={frontTopY} x2={cx + frontHw} y2={rearTopY} stroke={C.magnetic.stroke} strokeWidth={2.5} strokeLinecap="round" />
        </>
      )}
      {frontW !== rearW && frontW < rearW && (
        <>
          <line x1={cx - rearHw} y1={rearTopY} x2={cx - frontHw} y2={rearTopY} stroke={C.magnetic.stroke} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={cx - frontHw} y1={frontTopY} x2={cx - frontHw} y2={rearTopY} stroke={C.magnetic.stroke} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={cx + rearHw} y1={rearTopY} x2={cx + frontHw} y2={rearTopY} stroke={C.magnetic.stroke} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={cx + frontHw} y1={frontTopY} x2={cx + frontHw} y2={rearTopY} stroke={C.magnetic.stroke} strokeWidth={2.5} strokeLinecap="round" />
        </>
      )}

      {/* ── Label ── */}
      <text
        x={cx}
        y={y + height / 2 + 4}
        textAnchor="middle"
        fill={C.label}
        fontSize={8}
        fontFamily="sans-serif"
        style={{ pointerEvents: "none" }}
        fontWeight={600}
      >
        {rearDia != null && frontDia != null && rearDia !== frontDia
          ? `${rearDia}→${frontDia}`
          : `⌀${rearDia ?? frontDia ?? ""}`}
      </text>
    </g>
  );
}

// ── Filter Disk ─────────────────────────────────────────────────────────────

function FilterDisk({
  cx,
  y,
  width,
  height,
  label,
}: {
  cx: number;
  y: number;
  width: number;
  height: number;
  label: string;
}) {
  const hw = width / 2;
  return (
    <g className="svg-filter">
      {/* Rim */}
      <rect
        x={cx - hw}
        y={y}
        width={width}
        height={height}
        rx={3}
        ry={3}
        fill={C.filter.rim}
        stroke={C.filter.stroke}
        strokeWidth={2.5}
      />
      {/* Glass inner */}
      <rect
        x={cx - hw + 4}
        y={y + 4}
        width={width - 8}
        height={height - 8}
        rx={2}
        ry={2}
        fill={C.filter.fill}
        stroke="none"
      />
      {/* Shine reflection */}
      <line
        x1={cx - hw * 0.35}
        y1={y + 5}
        x2={cx + hw * 0.2}
        y2={y + height - 5}
        stroke={C.filter.shine}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <text
        x={cx}
        y={y + height / 2 + 4}
        textAnchor="middle"
        fill={C.label}
        fontSize={7.5}
        fontFamily="sans-serif"
        style={{ pointerEvents: "none" }}
      >
        {label.length > 14 ? label.slice(0, 12) + "…" : label}
      </text>
    </g>
  );
}

// ── Hood ────────────────────────────────────────────────────────────────────

function HoodDraw({
  cx,
  y,
  width,
  height,
  bottomWidth,
  label,
}: {
  cx: number;
  y: number;
  width: number;
  height: number;
  bottomWidth: number;
  label: string;
}) {
  const bw = bottomWidth / 2;
  const tw = width / 2;
  return (
    <g className="svg-hood">
      <path
        d={`M ${cx - bw} ${y + height}
            L ${cx - tw} ${y + 2}
            Q ${cx - tw} ${y} ${cx - tw + 2} ${y}
            L ${cx + tw - 2} ${y}
            Q ${cx + tw} ${y} ${cx + tw} ${y + 2}
            L ${cx + bw} ${y + height}
            Z`}
        fill={C.hood.fill}
        stroke={C.hood.stroke}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* Petal/vent lines */}
      {[-0.3, 0.3].map((offset) => (
        <line
          key={`hood-line-${offset}`}
          x1={cx + offset * tw}
          y1={y + 8}
          x2={cx + offset * bw}
          y2={y + height - 4}
          stroke={C.hood.stroke}
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={0.4}
        />
      ))}
      <text
        x={cx}
        y={y + height / 2 + 4}
        textAnchor="middle"
        fill={C.label}
        fontSize={8}
        fontFamily="sans-serif"
        style={{ pointerEvents: "none" }}
      >
        {label.length > 14 ? label.slice(0, 12) + "…" : label}
      </text>
    </g>
  );
}

// ── Generic / fallback ──────────────────────────────────────────────────────

function GenericBlock({
  cx,
  y,
  width,
  height,
  label,
}: {
  cx: number;
  y: number;
  width: number;
  height: number;
  label: string;
}) {
  const hw = width / 2;
  return (
    <g className="svg-generic">
      <rect
        x={cx - hw}
        y={y}
        width={width}
        height={height}
        rx={4}
        ry={4}
        fill={C.general.fill}
        stroke={C.general.stroke}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <text
        x={cx}
        y={y + height / 2 + 4}
        textAnchor="middle"
        fill={C.label}
        fontSize={8}
        fontFamily="sans-serif"
        style={{ pointerEvents: "none" }}
      >
        {label.length > 16 ? label.slice(0, 14) + "…" : label}
      </text>
    </g>
  );
}

// ── Connector line between elements ─────────────────────────────────────────

function SVGConnector({
  cx,
  y1,
  y2,
  mountType,
  diameter,
}: {
  cx: number;
  y1: number;
  y2: number;
  mountType: Accessory["rearMountType"] | "none";
  diameter: number | null;
}) {
  if (mountType === "none") return null;
  const isThreaded = mountType === "threaded";
  const dash = isThreaded ? "none" : "6,4";
  const color = isThreaded ? C.threaded.stroke : C.magnetic.stroke;
  const midY = (y1 + y2) / 2;
  return (
    <g>
      <line
        x1={cx}
        y1={y1}
        x2={cx}
        y2={y2}
        stroke={color}
        strokeWidth={2}
        strokeDasharray={dash}
        strokeLinecap="round"
        opacity={0.6}
      />
      {isThreaded ? (
        <>
          <line x1={cx - 5} y1={midY - 2} x2={cx + 5} y2={midY + 2} stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
          <line x1={cx - 5} y1={midY + 2} x2={cx + 5} y2={midY - 2} stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
        </>
      ) : (
        <circle cx={cx} cy={midY} r={2.5} fill={C.magnetic.stroke} opacity={0.5} />
      )}
      {diameter != null && (
        <>
          {isThreaded ? (
            <text x={cx + 14} y={midY + 3} textAnchor="start" fill={C.label} fontSize={7} fontFamily="sans-serif" opacity={0.6}>
              ⌀{diameter}
            </text>
          ) : (
            <g transform={`translate(${cx + 14}, ${midY - 4}) scale(0.5)`}>
              <path d="M0,0 L0,10 Q0,14 4,14 L6,14 Q10,14 10,10 L10,0 Z" fill={C.magnetic.stroke} stroke="none" />
              <rect x="0" y="0" width="10" height="3" rx="1" fill="#fff" opacity={0.5} />
            </g>
          )}
        </>
      )}
    </g>
  );
}

// ─── Main SVG Component ──────────────────────────────────────────────────────

export function FilterStackIllustration({
  lens,
  mountedChain,
  filterDiameterMm,
}: {
  lens: Pick<AccessoryLensReference, "label">;
  mountedChain: Accessory[];
  filterDiameterMm: number | null;
}) {
  const lensDia = filterDiameterMm ?? 52;
  const lensWidth = diaW(lensDia, 80);

  // ─── Layout ──────────────────────────────────────────────────────────────
  const ACC_H = 60; // taller to show two stacked blocks
  const GAP = 10;

  const chainH = mountedChain.length * (ACC_H + GAP);
  const lensH = 130;
  const padTop = 30;
  const totalH = padTop + chainH + lensH + 40;

  const svgH = Math.max(SVG_H, Math.ceil(totalH / 20) * 20);

  const lensBottomY = svgH - 10;
  const lensTopY = lensBottomY - lensH;

  // Accessories from bottom (index 0 = on lens) to top
  const accPositions: { acc: Accessory; topY: number; width: number }[] = [];
  let curY = lensTopY - GAP;
  for (let i = 0; i < mountedChain.length; i++) {
    const acc = mountedChain[i];
    const topY = curY - ACC_H;
    const w = diaW(acc.rearDiameterMm ?? acc.frontDiameterMm, 70);
    accPositions.push({ acc, topY, width: w });
    curY = topY - GAP;
  }

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${svgH}`}
      className="filter-stack-svg"
      aria-label="Illustration de la pile de montage"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x={0} y={0} width={SVG_W} height={svgH} fill="transparent" rx={8} ry={8} />

      {/* Connectors between accessories */}
      {accPositions.map((pos, i) => {
        const prevY = i === 0 ? lensTopY : accPositions[i - 1].topY;
        const acc = pos.acc;
        return (
          <SVGConnector
            key={`svg-conn-${acc.id}`}
            cx={CX}
            y1={prevY}
            y2={pos.topY + ACC_H}
            mountType={acc.rearMountType}
            diameter={acc.rearDiameterMm}
          />
        );
      })}

      {/* Accessories */}
      {accPositions.map((pos) => {
        const acc = pos.acc;
        const { width, topY } = pos;

        switch (acc.filterRole) {
          case "filter":
            return (
              <FilterDisk
                key={`svg-acc-${acc.id}`}
                cx={CX}
                y={topY}
                width={width}
                height={ACC_H}
                label={acc.label}
              />
            );
          case "hood":
            return (
              <HoodDraw
                key={`svg-acc-${acc.id}`}
                cx={CX}
                y={topY}
                width={width + 20}
                height={ACC_H}
                bottomWidth={width}
                label={acc.label}
              />
            );
          case "adapter": {
            const isMag = acc.frontMountType === "magnetic" || acc.rearMountType === "magnetic";
            if (isMag) {
              return (
                <MagneticRing
                  key={`svg-acc-${acc.id}`}
                  cx={CX}
                  y={topY}
                  width={width}
                  height={ACC_H}
                  rearDia={acc.rearDiameterMm}
                  frontDia={acc.frontDiameterMm}
                />
              );
            }
            return (
              <ThreadedRing
                key={`svg-acc-${acc.id}`}
                cx={CX}
                y={topY}
                width={width}
                height={ACC_H}
                rearDia={acc.rearDiameterMm}
                frontDia={acc.frontDiameterMm}
              />
            );
          }
          default:
            return (
              <GenericBlock
                key={`svg-acc-${acc.id}`}
                cx={CX}
                y={topY}
                width={width}
                height={ACC_H}
                label={acc.label}
              />
            );
        }
      })}

      {/* Lens */}
      <LensDrawing
        cx={CX}
        topY={lensTopY}
        bottomY={lensBottomY}
        width={lensWidth}
        label={lens.label}
        filterDia={filterDiameterMm}
      />

      {/* Empty state hint */}
      {mountedChain.length === 0 && lensDia > 0 && (
        <>
          <line x1={CX} y1={lensTopY - 18} x2={CX} y2={lensTopY - 6} stroke={C.label} strokeWidth={2} strokeLinecap="round" opacity={0.3} />
          <line x1={CX - 6} y1={lensTopY - 12} x2={CX + 6} y2={lensTopY - 12} stroke={C.label} strokeWidth={2} strokeLinecap="round" opacity={0.3} />
        </>
      )}
    </svg>
  );
}
