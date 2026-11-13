// Which of the plugin's own controls this tab mounts: the composer's Oh My Claude button (`panel`)
// and the permission control it puts in place of dsh's in a Claude session (`permissionControl`).
// Both are plugin config keys the server reports at `GET /ui-parts` (src/adapter/ui-parts.ts).
import type { UiParts } from "../adapter/ui-parts.js";
import { ROUTE, readJson } from "./shared.js";

/** What a box with neither key set mounts: both controls, as before the keys existed. */
export const UI_PARTS_DEFAULT: UiParts = { panel: true, permissionControl: "claude" };

const KEY = "omc-ui-parts";

/** The server's answer this page load, once it arrived. */
let known: UiParts | undefined;
let pending: Promise<UiParts | undefined> | undefined;

/** Reads a reply or a stored copy. Only an explicit `panel: false` or `permissionControl: "dsh"`
 *  turns a control off, so a reply missing a key (or garbage in localStorage) mounts it. */
export function readUiParts(
  body: { panel?: unknown; permissionControl?: unknown } | null | undefined,
): UiParts {
  return {
    panel: body?.panel !== false,
    permissionControl: body?.permissionControl === "dsh" ? "dsh" : "claude",
  };
}

/** The answer this browser stored last, else the defaults. localStorage may throw (a locked-down
 *  browser) or hold another shape; both read as the defaults. */
function storedUiParts(): UiParts {
  try {
    const raw = window.localStorage.getItem(KEY);
    return readUiParts(raw ? JSON.parse(raw) : null);
  } catch {
    return UI_PARTS_DEFAULT;
  }
}

/** Asks the server once per page load and stores the answer for the next load. Undefined when the
 *  route failed (a server older than this client, a dropped request): the caller keeps its guess. */
function fetchUiParts(): Promise<UiParts | undefined> {
  pending ??= fetch(`${ROUTE}/ui-parts`)
    .then((r) => readJson<{ panel?: unknown; permissionControl?: unknown }>(r))
    .then((body) => {
      const parts = readUiParts(body);
      known = parts;
      try {
        window.localStorage.setItem(KEY, JSON.stringify(parts));
      } catch {
        // Not stored: the next load guesses the defaults again and corrects itself the same way.
      }
      return parts;
    })
    .catch(() => undefined);
  return pending;
}

/**
 * Calls `apply` at once with the tab's best guess (the server's answer when this page already has
 * it, else the one this browser stored last, else the defaults), and again with the server's answer
 * when that differs. The stored guess is what keeps a box that turned a control off from flashing
 * it on every load; only the first load in a browser can. The returned function stops the second
 * call, for a context disposed before the answer came.
 */
export function watchUiParts(apply: (parts: UiParts) => void): () => void {
  let live = true;
  const first = known ?? storedUiParts();
  apply(first);
  void fetchUiParts().then((parts) => {
    if (!live || !parts) return;
    if (parts.panel !== first.panel || parts.permissionControl !== first.permissionControl)
      apply(parts);
  });
  return () => {
    live = false;
  };
}
