"use client";

import { useState, useRef, useEffect } from "react";

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer text-sm text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        Besoin d&apos;aide ?
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-4 text-sm shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-3 font-medium">Contacter le support</p>
          <a
            href="mailto:contact@laminacards.com"
            className="block break-all text-blue-600 underline dark:text-blue-400"
          >
            contact@laminacards.com
          </a>
          <a
            href="https://wa.me/33745195309"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-blue-600 underline dark:text-blue-400"
          >
            WhatsApp : 07 45 19 53 09
          </a>
        </div>
      )}
    </div>
  );
}
