// A test file run on its own, without DSH_OMC_STATE_DIR, must never write into the live state dir
// under ~/.local/state: it gets a fresh temp dir instead, removed when the run exits.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

if (process.argv[2] === "--child") {
  const { STATE_DIR, trace } = await import("./state.js");
  await trace("probe line from a bare test run");
  console.log(JSON.stringify({ dir: STATE_DIR, env: process.env.DSH_OMC_STATE_DIR }));
} else {
  const home = mkdtempSync(join(tmpdir(), "omc-home-"));
  try {
    const env: NodeJS.ProcessEnv = { ...process.env, HOME: home };
    delete env.DSH_OMC_STATE_DIR;
    delete env.NODE_ENV;
    delete env.VITEST;
    const run = spawnSync(process.execPath, [import.meta.filename, "--child"], {
      env,
      encoding: "utf8",
    });
    assert.equal(run.status, 0, run.stderr);
    const { dir, env: seen } = JSON.parse(run.stdout.trim().split("\n").pop() ?? "{}");
    const live = join(home, ".local", "state", "dsh-oh-my-claude");
    assert.notEqual(dir, live, "a bare test run does not use the live state dir");
    assert.ok(dir.startsWith(tmpdir()), "it gets a temp dir");
    assert.equal(seen, dir, "and exports it for modules that read the variable");
    assert.equal(existsSync(live), false, "nothing was written under the live path");
    assert.equal(existsSync(dir), false, "the temp dir is removed when the run exits");
  } finally {
    rmSync(home, { recursive: true, force: true });
  }

  const { isTestRun } = await import("./state.js");
  assert.equal(isTestRun("/x/lib/server/adapter.js", {}), false, "the plugin itself is not a test");
  assert.equal(isTestRun("/x/src/adapter.test.ts", {}), true);
  assert.equal(isTestRun("/x/node_modules/.bin/vitest", { VITEST: "true" }), true);
  console.log("state-dir ok");
}
