// The client side of `panel` and `permissionControl`: what a reply or a stored copy reads as, and
// the order watchUiParts applies its guess and the server's answer in.
import assert from "node:assert/strict";
import type { UiParts } from "../adapter/ui-parts.js";
import { UI_PARTS_DEFAULT, readUiParts, watchUiParts } from "./ui-parts.js";

assert.deepEqual(readUiParts(null), UI_PARTS_DEFAULT);
assert.deepEqual(readUiParts({}), UI_PARTS_DEFAULT, "an older reply missing both keys mounts both");
assert.deepEqual(readUiParts({ panel: "no", permissionControl: "x" }), UI_PARTS_DEFAULT);
assert.deepEqual(readUiParts({ panel: false, permissionControl: "dsh" }), {
  panel: false,
  permissionControl: "dsh",
});

const store = new Map<string, string>();
const realWindow = globalThis.window;
const realFetch = globalThis.fetch;
// SAFETY: the module only touches window.localStorage's getItem and setItem
globalThis.window = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  },
} as unknown as Window & typeof globalThis;
let asked = 0;
let reply: Record<string, unknown> = {};
// SAFETY: the module calls fetch with one URL and reads the reply as JSON
globalThis.fetch = (async (url: string) => {
  asked += 1;
  assert.equal(url, "/dsh-oh-my-claude/ui-parts");
  return new Response(JSON.stringify(reply));
}) as unknown as typeof fetch;

const settle = () => new Promise((r) => setTimeout(r, 0));

// A browser that stored "both off" on a box now back on the defaults: the stored guess first, then
// the server's answer, which is stored for the next load.
store.set("omc-ui-parts", JSON.stringify({ panel: false, permissionControl: "dsh" }));
reply = { panel: true, permissionControl: "claude" };
const seen: UiParts[] = [];
watchUiParts((p) => seen.push(p));
assert.deepEqual(seen, [{ panel: false, permissionControl: "dsh" }], "the stored guess, at once");
await settle();
await settle();
assert.deepEqual(seen.at(-1), UI_PARTS_DEFAULT, "then the server's answer");
assert.equal(seen.length, 2);
assert.deepEqual(JSON.parse(store.get("omc-ui-parts") ?? "null"), UI_PARTS_DEFAULT);

// Later mounts in the same page take the answer the page already has, with no second request
// and no second call.
const again: UiParts[] = [];
const stop = watchUiParts((p) => again.push(p));
await settle();
await settle();
assert.deepEqual(again, [UI_PARTS_DEFAULT]);
assert.equal(asked, 1, "one request per page load");
stop();

globalThis.window = realWindow;
globalThis.fetch = realFetch;
console.log("client ui-parts ok");
