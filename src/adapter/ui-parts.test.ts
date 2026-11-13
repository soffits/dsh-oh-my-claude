// `panel` and `permissionControl`: their defaults, what `GET /ui-parts` reports, and how
// `permissionControl: dsh` leaves stored per-session permission overrides out.
import assert from "node:assert/strict";
import type { PluginContext } from "../dsh.js";
import { ClaudeCodeAdapter } from "./class.js";
import { Config } from "./config.js";
import { uiPartsOf } from "./ui-parts.js";

const base = Config({});
assert.equal(base.panel, true);
assert.equal(base.permissionControl, "claude");
assert.deepEqual(uiPartsOf(base), { panel: true, permissionControl: "claude" });
// isolate does not imply either: the two are UI choices, set on their own.
assert.deepEqual(uiPartsOf(Config({ isolate: true })), {
  panel: true,
  permissionControl: "claude",
});
assert.deepEqual(uiPartsOf(Config({ panel: false, permissionControl: "dsh" })), {
  panel: false,
  permissionControl: "dsh",
});
// SAFETY: a wrong value on purpose, as a hand-edited profile could hold
assert.throws(() => Config({ permissionControl: "nobody" } as never));

// The route hands the browser these two keys and nothing else from the config.
assert.deepEqual(
  Object.keys(uiPartsOf(Config({ sshHost: "box", command: "/opt/claude" }))).toSorted(),
  ["panel", "permissionControl"],
);

// Under `claude` a stored override steers the session, as before.
{
  // SAFETY: partial fake; the constructor and the permission methods read nothing past `on`
  const a = new ClaudeCodeAdapter({ on() {} } as unknown as PluginContext, Config({}));
  a.accessModes.set("s", "danger-full-access");
  const r = await a.setPermissionMode("s", "plan");
  assert.equal(r.override, "plan");
  assert.equal(a.getPermissionMode("s", "danger-full-access"), "plan");
}

// Under `dsh` nothing can show or clear an override, so a stored one (picked before the switch,
// restored with a transcript) is ignored, a new pick is refused, and the mode is dsh's mapping.
{
  const config = Config({ permissionControl: "dsh" });
  // SAFETY: partial fake; the constructor and the permission methods read nothing past `on`
  const a = new ClaudeCodeAdapter({ on() {} } as unknown as PluginContext, config);
  a.permissionModes.set("s", "plan");
  a.accessModes.set("s", "danger-full-access");
  assert.equal(a.getPermissionMode("s", "danger-full-access"), "bypassPermissions");
  const info = a.permissionModeInfo("s");
  assert.equal(info.override, null);
  assert.equal(info.mode, "bypassPermissions");
  const r = await a.setPermissionMode("s", "acceptEdits");
  assert.equal(r.live, false);
  assert.match(r.error ?? "", /permissionControl is dsh/);
  assert.equal(a.getPermissionMode("s", "read-only"), "plan", "the shield still maps");
}

// A pinned permissionMode stays the mode under `dsh`.
{
  const config = Config({ permissionControl: "dsh", permissionMode: "bypassPermissions" });
  // SAFETY: partial fake; the constructor and the permission methods read nothing past `on`
  const a = new ClaudeCodeAdapter({ on() {} } as unknown as PluginContext, config);
  a.permissionModes.set("s", "plan");
  assert.equal(a.getPermissionMode("s", "danger-full-access"), "bypassPermissions");
}
console.log("ui-parts ok");
