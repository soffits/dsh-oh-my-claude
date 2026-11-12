// The bridge's MCP server entry carries its own timeout, so Claude Code does not abort a relayed
// dsh tool that stays silent past its 300 s idle limit: the plugin's hour by default, longer under
// `isolate`.
import { strict as assert } from "node:assert";
import { buildArgs } from "./cli.js";
import { Config } from "./config.js";

/** The dsh server entry of the `--mcp-config` argument. */
const dshServer = (config: ReturnType<typeof Config>) => {
  const args = buildArgs({ model: "m", config, mcp: { url: "http://x/mcp/s" } });
  return JSON.parse(args[args.indexOf("--mcp-config") + 1] ?? "{}").mcpServers.dsh;
};
assert.equal(dshServer(new Config({})).timeout, 3_600_000);
assert.equal(dshServer(new Config({ isolate: true })).timeout, 2_000_000_000);
assert.equal(dshServer(new Config({})).type, "http");

console.log("mcp-timeout: ok");
