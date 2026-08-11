import type { IconName } from "./nav-items";

// Minimal hand-rolled stroke icons (no icon library dependency in this
// project) -- one 20x20 path per nav item, sized/colored by the caller via
// className (currentColor).
const PATHS: Record<IconName, string> = {
  dashboard: "M3 13h6V3H3v10Zm0 4h6v-2H3v2Zm8 0h6V9h-6v8Zm0-14v2h6V3h-6Z",
  scan: "M3 3h5v2H5v3H3V3Zm9 0h5v5h-2V5h-3V3ZM3 12h2v3h3v2H3v-5Zm12 5v-2h3v-3h2v5h-5ZM3 9h14v2H3V9Z",
  clients:
    "M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm-7 3c-3 0-6 1.5-6 4.5V17h9v-2.5c0-1.5.6-2.7 1.5-3.6C10.8 10.3 8.9 10 7 10Zm7 0c-.7 0-1.4.05-2 .15 1.2 1 1.9 2.4 1.9 4.35V17h6v-2.5c0-3-2.9-4.5-5.9-4.5Z",
  stats: "M3 17h2V9H3v8Zm4 0h2V3H7v14Zm4 0h2v-6h-2v6Zm4 0h2V6h-2v11Z",
  vip: "M3 15h14l1-8-4.5 3L10 5 6.5 10 2 7l1 8Zm0 2h14v2H3v-2Z",
  notifications:
    "M10 2a1 1 0 0 1 1 1v.6a5.5 5.5 0 0 1 4 5.3v3.3l1.6 2.4a1 1 0 0 1-.83 1.55H4.23a1 1 0 0 1-.83-1.55L5 12.2V8.9a5.5 5.5 0 0 1 4-5.3V3a1 1 0 0 1 1-1Zm0 16a2 2 0 0 0 2-2H8a2 2 0 0 0 2 2Z",
  settings:
    "M8.3 2h3.4l.5 2.1c.5.2 1 .4 1.4.7l2-.8 1.7 3-1.6 1.3c.05.3.05.6 0 .9l1.6 1.3-1.7 3-2-.8c-.4.3-.9.5-1.4.7L11.7 16H8.3l-.5-2.1a5.9 5.9 0 0 1-1.4-.7l-2 .8-1.7-3 1.6-1.3a4.7 4.7 0 0 1 0-.9L2.7 7.5l1.7-3 2 .8c.4-.3.9-.5 1.4-.7L8.3 2ZM10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
};

export function NavIcon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className ?? "h-5 w-5"} aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
