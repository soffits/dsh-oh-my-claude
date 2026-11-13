import type { Config } from "./config.js";
/** What `GET /ui-parts` answers. */
export interface UiParts {
    panel: boolean;
    permissionControl: "claude" | "dsh";
}
/** The two config keys as the client reads them. Kept apart from the config object so the route
 *  never hands the browser anything else from it (paths, hosts, tool lists). */
export declare function uiPartsOf(config: Pick<Config, "panel" | "permissionControl">): UiParts;
