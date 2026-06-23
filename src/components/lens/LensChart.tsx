"use client";

import React, { useRef, useEffect, useLayoutEffect, useCallback } from "react";
import * as d3 from "d3";
import type { Lens } from "@/lib/lens/types";
import { DEFAULT_CHART_COLOR } from "@/lib/lens/chart-colors";
import { isPrimeLens } from "@/lib/lens/lens-utils";

const CHART_WIDTH = 820;
const CHART_HEIGHT = 360;
const MARGIN = 46;
const ZOOM_SCALE_EXTENT: [number, number] = [1, 20];
const MIN_CIRCLE_R = 2;
const LABEL_ROTATION = -18;
const PRIME_MARKER_RADIUS = 6.5;
const PRIME_SELECTED_MARKER_RADIUS = 8;
const ZOOM_TRIANGLE_BASE_HALF = 3;
const ZOOM_TRIANGLE_DEPTH = 3.5;
const ZOOM_SELECTED_TRIANGLE_BASE_HALF = 4;
const ZOOM_SELECTED_TRIANGLE_DEPTH = 4.5;
// Pixels to shorten the line at each end so the round cap doesn't
// poke past the triangle's flat base.
const LINE_CAP_OFFSET = 2.5;

/**
 * Counter-scale markers and labels so they stay a constant visual size
 * regardless of zoom level.
 */
function counterScaleDecorations(
  root: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  k: number,
) {
  root
    .selectAll<SVGGElement, unknown>(".chart-marker")
    .attr("transform", function () {
      const node = d3.select(this);
      const x = parseFloat(node.attr("data-x") || "0");
      const y = parseFloat(node.attr("data-y") || "0");
      const angle = parseFloat(node.attr("data-angle") || "0");
      return `translate(${x} ${y}) rotate(${angle}) scale(${1 / k})`;
    });

  root
    .selectAll<SVGCircleElement, unknown>(".chart-marker circle")
    .attr("r", function () {
      const base = parseFloat(d3.select(this).attr("data-base-r") || "5");
      return Math.max(MIN_CIRCLE_R, base);
    });

  root
    .selectAll<SVGTextElement, unknown>(".chart-label")
    .attr("transform", `rotate(${LABEL_ROTATION}) scale(${1 / k})`)
    .attr("stroke-width", 1 / k);

  root
    .selectAll<SVGGElement, unknown>(".chart-label-anchor")
    .attr("transform", function () {
      const node = d3.select(this);
      const x = parseFloat(node.attr("data-x") || "0");
      const y = parseFloat(node.attr("data-y") || "0");
      return `translate(${x} ${y})`;
    });
}

function getTrianglePoints(baseHalf: number, depth: number) {
  return `0,${-baseHalf} 0,${baseHalf} ${depth},0`;
}

export function LensChart({
  lenses,
  selectedIds,
  onToggleSelected,
  lensColors,
}: {
  lenses: Lens[];
  selectedIds: string[];
  onToggleSelected: (id: string) => void;
  lensColors: Record<string, string>;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Data scales — recalculated on each render (React handles updates)
  const maxFocal = Math.max(200, ...lenses.map((lens) => lens.focalMaxMm));
  const minAperture = Math.min(
    1,
    ...lenses.map((lens) =>
      Math.min(lens.maxApertureAtMinFocal, lens.maxApertureAtMaxFocal),
    ),
  );
  const maxAperture = Math.max(
    8,
    ...lenses.map((lens) =>
      Math.max(lens.maxApertureAtMinFocal, lens.maxApertureAtMaxFocal),
    ),
  );

  const xScale = (focal: number) =>
    MARGIN + (focal / maxFocal) * (CHART_WIDTH - MARGIN * 1.6);

  const yScale = (aperture: number) =>
    CHART_HEIGHT -
    MARGIN -
    ((aperture - minAperture) / (maxAperture - minAperture || 1)) *
      (CHART_HEIGHT - MARGIN * 1.8);

  // Initialise D3 zoom behaviour once on mount
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent(ZOOM_SCALE_EXTENT)
      .extent([
        [0, 0],
        [CHART_WIDTH, CHART_HEIGHT],
      ])
      .translateExtent([
        [0, 0],
        [CHART_WIDTH, CHART_HEIGHT],
      ])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        d3.select(gRef.current).attr(
          "transform",
          event.transform.toString(),
        );

        counterScaleDecorations(svg, event.transform.k);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    return () => {
      svg.on(".zoom", null);
      d3.select(window).on(".zoom", null);
    };
  }, []);

  // Re-sync marker sizes and labels when data or selection changes
  useLayoutEffect(() => {
    if (!gRef.current || !svgRef.current) return;
    const k = d3.zoomTransform(svgRef.current).k;
    counterScaleDecorations(d3.select(svgRef.current), k);
  }, [lenses, selectedIds, lensColors]);

  // Smoothly reset zoom to identity view
  const resetZoom = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomRef.current.transform, d3.zoomIdentity);
  }, []);

  const hasData = lenses.length > 0;

  return (
    <section className="card chart-card">
      <div className="section-title">
        <div>
          <h2>Carte optique</h2>
          <p>Molette&nbsp;: zoomer — Glisser&nbsp;: déplacer — Cliquer&nbsp;: ajouter ou retirer de la comparaison</p>
        </div>
        <div className="chart-actions">
          <button
            className="ghost-button"
            onClick={resetZoom}
            type="button"
          >
            Réinitialiser
          </button>
        </div>
      </div>
      <div className="chart-scroll">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          role="img"
          aria-label="Graphique interactif des objectifs par focale et ouverture maximale. Molette pour zoomer, glisser pour déplacer, cliquer pour ajouter ou retirer de la comparaison."
          className="chart-svg"
        >
          <g ref={gRef}>
            {/* Axes */}
            <line
              x1={MARGIN}
              y1={CHART_HEIGHT - MARGIN}
              x2={CHART_WIDTH - MARGIN / 2}
              y2={CHART_HEIGHT - MARGIN}
              className="axis"
            />
            <line
              x1={MARGIN}
              y1={MARGIN / 2}
              x2={MARGIN}
              y2={CHART_HEIGHT - MARGIN}
              className="axis"
            />
            <text
              x={CHART_WIDTH / 2}
              y={CHART_HEIGHT - 8}
              className="axis-label"
              textAnchor="middle"
            >
              Focale (mm)
            </text>
            <text x={8} y={24} className="axis-label">
              Ouverture f/
            </text>

            {/* X ticks */}
            {[24, 35, 50, 70, 100, 135, 200, 300, 400]
              .filter((tick) => tick <= maxFocal)
              .map((tick) => (
                <g key={`xtick-${tick}`}>
                  <line
                    x1={xScale(tick)}
                    y1={CHART_HEIGHT - MARGIN}
                    x2={xScale(tick)}
                    y2={CHART_HEIGHT - MARGIN + 5}
                    className="axis"
                  />
                  <text
                    x={xScale(tick)}
                    y={CHART_HEIGHT - 24}
                    className="tick"
                    textAnchor="middle"
                  >
                    {tick}
                  </text>
                </g>
              ))}

            {/* Y ticks */}
            {[1.4, 2, 2.8, 4, 5.6, 8]
              .filter((tick) => tick >= minAperture && tick <= maxAperture)
              .map((tick) => (
                <g key={`ytick-${tick}`}>
                  <line
                    x1={MARGIN - 5}
                    y1={yScale(tick)}
                    x2={MARGIN}
                    y2={yScale(tick)}
                    className="axis"
                  />
                  <text x={10} y={yScale(tick) + 4} className="tick">
                    f/{tick}
                  </text>
                </g>
              ))}

            {/* Lens lines and markers */}
            {lenses.map((lens) => {
              const selected = selectedIds.includes(lens.id);
              const color = lensColors[lens.id] ?? DEFAULT_CHART_COLOR;
              const x1 = xScale(lens.focalMinMm);
              const x2 = xScale(lens.focalMaxMm);
              const y1 = yScale(lens.maxApertureAtMinFocal);
              const y2 = yScale(lens.maxApertureAtMaxFocal);
              const prime = isPrimeLens(lens);
              const lineAngle = (Math.atan2(y2 - y1, x2 - x1 || 1) * 180) / Math.PI;
              const labelX = prime ? x1 + 10 : (x1 + x2) / 2 + 6;
              const labelY = prime ? y1 - 12 : (y1 + y2) / 2 - 10;
              const trianglePoints = getTrianglePoints(
                selected ? ZOOM_SELECTED_TRIANGLE_BASE_HALF : ZOOM_TRIANGLE_BASE_HALF,
                selected ? ZOOM_SELECTED_TRIANGLE_DEPTH : ZOOM_TRIANGLE_DEPTH,
              );
              // Shorten line ends so the round cap doesn't exceed the triangle base
              let lineX1 = x1, lineY1 = y1, lineX2 = x2, lineY2 = y2;
              if (!prime && x1 !== x2) {
                const dx = x2 - x1;
                const dy = y2 - y1;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const ux = dx / len;
                const uy = dy / len;
                lineX1 = x1 + ux * LINE_CAP_OFFSET;
                lineY1 = y1 + uy * LINE_CAP_OFFSET;
                lineX2 = x2 - ux * LINE_CAP_OFFSET;
                lineY2 = y2 - uy * LINE_CAP_OFFSET;
              }

              return (
                <g key={lens.id} className="chart-item">
                  <line
                    x1={lineX1}
                    y1={lineY1}
                    x2={lineX2}
                    y2={lineY2}
                    stroke={color}
                    strokeWidth={selected ? 5 : 3}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    className={selected ? "chart-line-selected" : undefined}
                    onClick={() => onToggleSelected(lens.id)}
                  />
                  <g
                    className="chart-marker"
                    data-x={x1}
                    data-y={y1}
                    data-angle={prime ? 0 : lineAngle}
                  >
                    {prime ? (
                      <circle
                        r={selected ? PRIME_SELECTED_MARKER_RADIUS : PRIME_MARKER_RADIUS}
                        data-base-r={selected ? PRIME_SELECTED_MARKER_RADIUS : PRIME_MARKER_RADIUS}
                        fill={color}
                        stroke={selected ? "#ffffff" : "none"}
                        strokeWidth={selected ? 2 : 0}
                        onClick={() => onToggleSelected(lens.id)}
                      />
                    ) : (
                      <polygon
                        points={trianglePoints}
                        fill={color}
                        stroke={selected ? "#ffffff" : "none"}
                        strokeWidth={selected ? 2 : 0}
                        onClick={() => onToggleSelected(lens.id)}
                      />
                    )}
                  </g>
                  {x1 !== x2 && !prime && (
                    <g
                      className="chart-marker"
                      data-x={x2}
                      data-y={y2}
                      data-angle={lineAngle + 180}
                    >
                      <polygon
                        points={trianglePoints}
                        fill={color}
                        stroke={selected ? "#ffffff" : "none"}
                        strokeWidth={selected ? 2 : 0}
                        onClick={() => onToggleSelected(lens.id)}
                      />
                    </g>
                  )}
                  <g
                    className="chart-label-anchor"
                    data-x={labelX}
                    data-y={labelY}
                  >
                    <text
                      className="chart-label"
                      fill={color}
                      stroke="rgba(255,255,255,0.92)"
                      paintOrder="stroke"
                      onClick={() => onToggleSelected(lens.id)}
                    >
                      {lens.label}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Empty state */}
            {!hasData && (
              <text
                x={CHART_WIDTH / 2}
                y={CHART_HEIGHT / 2}
                className="empty-chart-text"
                textAnchor="middle"
              >
                Aucun objectif à afficher
              </text>
            )}
          </g>
        </svg>
      </div>
    </section>
  );
}
