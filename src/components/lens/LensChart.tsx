"use client";

import React, { useRef, useEffect, useLayoutEffect, useCallback } from "react";
import * as d3 from "d3";
import type { Lens } from "@/lib/lens/types";

const CHART_WIDTH = 820;
const CHART_HEIGHT = 360;
const MARGIN = 46;
const PALETTE = ["#2563eb", "#16a34a", "#9333ea", "#dc2626", "#0891b2", "#ca8a04", "#4f46e5"];
const ZOOM_SCALE_EXTENT: [number, number] = [1, 20];
const MIN_CIRCLE_R = 2;

/**
 * Counter-scale circle radii so they stay a constant visual size
 * regardless of zoom level.
 */
function counterScaleCircles(
  root: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  k: number,
) {
  root
    .selectAll<SVGCircleElement, unknown>(".chart-item circle")
    .attr("r", function () {
      const base = parseFloat(d3.select(this).attr("data-base-r") || "5");
      return Math.max(MIN_CIRCLE_R, base / k);
    });
}

export function LensChart({
  lenses,
  selectedIds,
  onToggleSelected,
}: {
  lenses: Lens[];
  selectedIds: string[];
  onToggleSelected: (id: string) => void;
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

        counterScaleCircles(svg, event.transform.k);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    return () => {
      svg.on(".zoom", null);
      d3.select(window).on(".zoom", null);
    };
  }, []);

  // Re-sync circle radii when data or selection changes
  useLayoutEffect(() => {
    if (!gRef.current || !svgRef.current) return;
    const k = d3.zoomTransform(svgRef.current).k;
    counterScaleCircles(d3.select(svgRef.current), k);
  }, [lenses, selectedIds]);

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

            {/* Lens lines and circles */}
            {lenses.map((lens, index) => {
              const selected = selectedIds.includes(lens.id);
              const color = selected
                ? "#f97316"
                : PALETTE[index % PALETTE.length];
              const x1 = xScale(lens.focalMinMm);
              const x2 = xScale(lens.focalMaxMm);
              const y1 = yScale(lens.maxApertureAtMinFocal);
              const y2 = yScale(lens.maxApertureAtMaxFocal);

              return (
                <g key={lens.id} className="chart-item">
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth={selected ? 5 : 3}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    onClick={() => onToggleSelected(lens.id)}
                  />
                  <circle
                    cx={x1}
                    cy={y1}
                    r={selected ? 7 : 5}
                    data-base-r={selected ? 7 : 5}
                    fill={color}
                    onClick={() => onToggleSelected(lens.id)}
                  />
                  {x1 !== x2 && (
                    <circle
                      cx={x2}
                      cy={y2}
                      r={selected ? 7 : 5}
                      data-base-r={selected ? 7 : 5}
                      fill={color}
                      onClick={() => onToggleSelected(lens.id)}
                    />
                  )}
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
