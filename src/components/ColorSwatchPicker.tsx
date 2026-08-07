"use client";

import { useState } from "react";

const PRESETS = [
  "#27272a", // anthracite
  "#ffffff", // blanc
  "#71717a", // gris
  "#172554", // bleu marine
  "#7c2d12", // brique
  "#14532d", // vert forêt
  "#7f1d1d", // rouge
  "#581c87", // violet
  "#78350f", // marron
  "#134e4a", // sarcelle
  "#831843", // magenta
  "#000000", // noir
];

export function ColorSwatchPicker({ name, defaultValue }: { name: string; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <input
          type="color"
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded border border-zinc-300 dark:border-zinc-700"
        />
        <span className="text-sm text-zinc-500">{value}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setValue(preset)}
            style={{ backgroundColor: preset }}
            className="h-7 w-7 rounded-full border border-zinc-300 dark:border-zinc-700"
            aria-label={preset}
          />
        ))}
      </div>
    </div>
  );
}
