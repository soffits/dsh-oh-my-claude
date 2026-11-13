// Which of the plugin's own controls the web client mounts: the composer's Oh My Claude button
// (`panel`) and the permission control it puts in place of dsh's in a Claude session
// (`permissionControl`). Both come from the plugin config; the client reads them from
// `GET /ui-parts` once per page load, so a change shows after a reload of the tab.
import type { Config } from "./config.js";

/** What `GET /ui-parts` answers. */
export interface UiParts {
  panel: boolean;
  permissionControl: "claude" | "dsh";
}

/** The two config keys as the client reads them. Kept apart from the config object so the route
 *  never hands the browser anything else from it (paths, hosts, tool lists). */
export function uiPartsOf(config: Pick<Config, "panel" | "permissionControl">): UiParts {
  return { panel: config.panel, permissionControl: config.permissionControl };
}
