"use client";

import { useState } from "react";
import { ColorSwatchPicker } from "@/components/ColorSwatchPicker";
import { adminInputClass } from "@/components/admin/adminFormClasses";

type StampDisplayStyle = "color" | "image" | "counter";

export function StampStyleFields({
  defaultStyle,
  defaultColor,
  currentImageUrl,
}: {
  defaultStyle: StampDisplayStyle;
  defaultColor: string;
  currentImageUrl: string | null;
}) {
  const [style, setStyle] = useState<StampDisplayStyle>(defaultStyle);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-100">
          Style d&apos;affichage des tampons
        </label>
        <select
          name="stampDisplayStyle"
          value={style}
          onChange={(e) => setStyle(e.target.value as StampDisplayStyle)}
          className={adminInputClass}
        >
          <option value="color">Couleur</option>
          <option value="image">Image</option>
          <option value="counter">Compteur uniquement</option>
        </select>
      </div>

      {/* Color is always submitted (even outside "color" mode) so switching
          styles never loses a previously chosen color -- see
          updateRestaurantStampStyle. Only hidden from view when not
          relevant to the currently selected style. */}
      <div className={style === "color" ? "flex flex-col gap-2" : "hidden"}>
        <label className="text-sm font-medium text-zinc-100">Couleur du tampon</label>
        <ColorSwatchPicker name="stampColor" defaultValue={defaultColor} />
      </div>

      {style === "image" && (
        <div className="flex flex-col gap-3 rounded-lg border border-white/10 p-3">
          {currentImageUrl && (
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/10 bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentImageUrl}
                  alt="Image de tampon actuelle"
                  className="h-full w-full object-cover"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <input type="checkbox" name="removeStampImage" className="h-4 w-4" />
                Supprimer l&apos;image (revenir à la couleur)
              </label>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-400">
              {currentImageUrl ? "Remplacer l'image (PNG)" : "Image du tampon (PNG)"}
            </label>
            <input
              type="file"
              name="stampImage"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setPreview(file ? URL.createObjectURL(file) : null);
              }}
              className={adminInputClass}
            />
          </div>

          {preview && (
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/10 bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Aperçu du nouveau tampon" className="h-full w-full object-cover" />
              </div>
              <span className="text-xs text-zinc-500">Aperçu dans un rond de tampon</span>
            </div>
          )}
        </div>
      )}

      {style === "counter" && (
        <p className="text-sm text-zinc-400">
          Les ronds de tampons seront masqués. Seule la progression X/X sera visible sur la carte.
        </p>
      )}
    </div>
  );
}
