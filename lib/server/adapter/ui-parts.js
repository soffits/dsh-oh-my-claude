/** The two config keys as the client reads them. Kept apart from the config object so the route
 *  never hands the browser anything else from it (paths, hosts, tool lists). */
export function uiPartsOf(config) {
    return { panel: config.panel, permissionControl: config.permissionControl };
}
//# sourceMappingURL=ui-parts.js.map