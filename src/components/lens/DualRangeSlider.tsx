"use client";

import React from "react";

type DualRangeSliderProps = {
  min: number;
  max: number;
  low: number;
  high: number;
  onChange: (range: { low: number; high: number }) => void;
  step?: number;
  label: string;
  formatValue?: (value: number) => string;
  formatLowValue?: (value: number) => string;
  formatHighValue?: (value: number) => string;
};

export function DualRangeSlider({
  min,
  max,
  low,
  high,
  onChange,
  step = 1,
  label,
  formatValue = (v) => String(v),
  formatLowValue,
  formatHighValue,
}: DualRangeSliderProps) {
  function handleLowChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newLow = Math.min(Number(e.target.value), high);
    onChange({ low: newLow, high });
  }

  function handleHighChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newHigh = Math.max(Number(e.target.value), low);
    onChange({ low, high: newHigh });
  }

  // Position de la bande highlight en pourcentage
  const range = max - min || 1;
  const lowPercent = ((low - min) / range) * 100;
  const highPercent = ((high - min) / range) * 100;
  // Défensif : éviter left > right ou width négative
  const leftP = Math.min(lowPercent, highPercent);
  const widthP = Math.max(highPercent - lowPercent, 0);
  const lowLabel = (formatLowValue ?? formatValue)(low);
  const highLabel = (formatHighValue ?? formatValue)(high);

  return (
    <div className="dual-range-slider">
      <div className="dual-range-slider-header">
        <span className="dual-range-slider-label">{label}</span>
        <span className="dual-range-slider-values">
          {lowLabel} — {highLabel}
        </span>
      </div>
      <div className="dual-range-slider-track">
        {/* Barre de fond */}
        <div className="dual-range-slider-track-bg" />
        {/* Barre highlight entre les deux poignées */}
        <div
          className="dual-range-slider-highlight"
          style={{
            left: `${leftP}%`,
            width: `${widthP}%`,
          }}
        />
        {/* Poignée basse (min) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={handleLowChange}
          className="dual-range-slider-input dual-range-slider-input-low"
          aria-label={`${label} — valeur minimale`}
        />
        {/* Poignée haute (max) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={handleHighChange}
          className="dual-range-slider-input dual-range-slider-input-high"
          aria-label={`${label} — valeur maximale`}
        />
      </div>
    </div>
  );
}
