"use client";

import { useState, useRef, useEffect } from "react";

// `direction="up"` is needed wherever the button sits near the bottom of the
// viewport (the sidebar footer, the mobile "Plus" sheet) -- opening downward
// there pushed the contact details off-screen and made them unreachable.
export function HelpButton({ direction = "down" }: { direction?: "down" | "up" } = {}) {
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
        <div
          className={`absolute left-0 z-50 w-72 rounded-xl border border-zinc-200 bg-white p-4 text-sm shadow-lg sm:left-auto sm:right-0 dark:border-zinc-800 dark:bg-zinc-900 ${
            direction === "up" ? "bottom-full mb-2" : "mt-2"
          }`}
        >
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
