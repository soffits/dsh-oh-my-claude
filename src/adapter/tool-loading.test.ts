// `toolLoading: dsh`: a bridged tool dsh loads up front carries Claude Code's alwaysLoad key, a
// tool dsh defers does not, and the default mode lists the tools as before.
import { strict as assert } from "node:assert";
import { ALWAYS_LOAD, deferredByPatterns, handleRpc } from "../mcp.js";
import { engineDigest } from "./isolate.js";
import { Config } from "./config.js";

const schema = (name: string) => ({ name, description: "", parameters: { type: "object" } });
// SAFETY: partial fake registry for tests
const tools = {
  schemas: () => [schema("bash"), { ...schema("ha_restart"), deferLoading: true }],
  get: () => undefined,
};
const META = "_meta";
/** What tools/list answers, with `alwaysLoad` as given. */
const listed = async (alwaysLoad?: boolean, deferTools?: string[]) => {
  // SAFETY: test double carries only what handleRpc reads
  const env = {
    tools,
    agent: {},
    signal: new AbortController().signal,
    version: "t",
    alwaysLoad,
    deferTools,
  } as unknown as Parameters<typeof handleRpc>[1];
  // SAFETY: tools/list always answers a result with tools
  const reply = (await handleRpc({ jsonrpc: "2.0", id: 1, method: "tools/list" }, env)) as {
    result: { tools: Record<string, unknown>[] };
  };
  return reply.result.tools;
};

const plain = await listed();
assert.ok(
  plain.every((t) => t[META] === undefined),
  "default: Claude Code decides",
);
const dsh = await listed(true);
assert.deepEqual(dsh.find((t) => t.name === "bash")?.[META], { [ALWAYS_LOAD]: true });
assert.equal(
  dsh.find((t) => t.name === "ha_restart")?.[META],
  undefined,
  "deferred stays deferred",
);

// `deferTools` leaves the matching tools behind ToolSearch, and only with `toolLoading: dsh`.
const some = await listed(true, ["ha_*", "schedule_create"]);
assert.deepEqual(some.find((t) => t.name === "bash")?.[META], { [ALWAYS_LOAD]: true });
assert.equal(some.find((t) => t.name === "ha_restart")?.[META], undefined);
assert.equal((await listed(false, ["bash"])).find((t) => t.name === "bash")?.[META], undefined);
assert.equal(deferredByPatterns("schedule_create", ["schedule_*"]), true);
assert.equal(deferredByPatterns("scheduler", ["schedule_*"]), false, "the pattern is anchored");
assert.equal(
  deferredByPatterns("mcp__home_assistant__ha_search", ["mcp__home_assistant__*"]),
  true,
);
assert.equal(deferredByPatterns("a.b", ["a.b"]), true);
assert.equal(deferredByPatterns("axb", ["a.b"]), false, "a dot is literal");
assert.equal(deferredByPatterns("bash", ["*", "!bash"]), false, "! takes a name back out");
assert.equal(deferredByPatterns("edit", ["*", "!bash"]), true);
assert.equal(deferredByPatterns("bash", ["!bash", "*"]), true, "the last match decides");
assert.equal(deferredByPatterns("bash", []), false);

assert.equal(new Config({}).toolLoading, "claude");
assert.deepEqual(new Config({}).deferTools, []);
// A changed deferral keys a new Claude process, an unset one leaves the key as it was.
const engine = { builtinTools: ["ToolSearch"], toolLoading: "dsh", isolate: true };
assert.equal(engineDigest(engine), engineDigest({ ...engine, deferTools: [] }));
assert.notEqual(engineDigest(engine), engineDigest({ ...engine, deferTools: ["ha_*"] }));
assert.notEqual(
  engineDigest({ ...engine, deferTools: ["a"] }),
  engineDigest({ ...engine, deferTools: ["b"] }),
);
console.log("tool-loading: ok");
