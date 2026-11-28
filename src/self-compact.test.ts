// The `compact` tool's own texts and checks: how fill reads, when the notice is due, what the
// summary is told about the kept text, and what the tool accepts.
import assert from "node:assert/strict";
import {
  compactTool,
  fillDue,
  fillNotice,
  fillText,
  keepInstructions,
  keepNote,
  scheduledText,
  tokensText,
} from "./self-compact.js";
import { PEOPLE_INSTRUCTIONS, summaryInstructions } from "./compact-retain.js";

assert.equal(tokensText(812), "812");
assert.equal(tokensText(412_400), "412k");
assert.equal(tokensText(1_000_000), "1M");
assert.equal(tokensText(1_050_000), "1.05M");

const fill = { used: 490_000, window: 1_000_000, auto: 600_000 };
assert.equal(
  fillText(fill),
  "Context in use: 490k of 1M tokens (49%); automatic compaction at 60%.",
);
assert.equal(
  fillText({ used: 10_000, window: 200_000 }),
  "Context in use: 10k of 200k tokens (5%); no automatic compaction.",
);
assert.match(
  fillNotice(fill),
  /^\[Oh My Claude\] Context in use: .* call compact with what must survive/,
);
assert.match(scheduledText(fill), /runs once this turn ends\. .* Context in use: 490k/);
assert.equal(scheduledText(undefined).includes("Context in use"), false, "no figure, no line");

// Due past the share of the way to automatic compaction; never without one, never when off.
assert.equal(fillDue(fill, 0.8), true, "490k past 0.8 × 600k");
assert.equal(fillDue({ ...fill, used: 470_000 }, 0.8), false);
assert.equal(fillDue({ ...fill, auto: undefined }, 0.8), false);
assert.equal(fillDue(fill, 0), false);

// The kept text: word for word, layout and all, in the note; on one line in `/compact`'s argument,
// after the people section and the verbatim-tail note.
const keep = 'Ana said: "先别发"\n- next: run the tests';
assert.ok(keepNote(keep).endsWith(`\n\n${keep}`));
assert.equal(keepInstructions(""), undefined);
const told = keepInstructions(keep) ?? "";
assert.equal(told.includes("\n"), false);
assert.ok(told.endsWith('The text: Ana said: "先别发" - next: run the tests'));
const all = summaryInstructions("TAIL", told);
assert.ok(all.startsWith(PEOPLE_INSTRUCTIONS));
assert.ok(all.indexOf("TAIL") < all.indexOf("The assistant asked for this compaction"));
assert.equal(summaryInstructions(undefined, undefined), PEOPLE_INSTRUCTIONS);

// The tool: trims what it is given, rejects a non-string, needs the calling agent.
{
  const seen: Array<[string, string]> = [];
  const tool = compactTool<string>(async (agent, kept) => {
    seen.push([agent, kept]);
    return "ok";
  });
  assert.equal(tool.name, "compact");
  assert.deepEqual(Object.keys(tool.parameters.properties), ["keep"]);
  assert.equal(await tool.execute({ keep: "  x  " }, { agent: "a1" }), "ok");
  assert.equal(await tool.execute({}, { agent: "a1" }), "ok");
  assert.deepEqual(seen, [
    ["a1", "x"],
    ["a1", ""],
  ]);
  await assert.rejects(tool.execute({ keep: 3 }, { agent: "a1" }));
  await assert.rejects(tool.execute({}, {}), /needs a calling agent/);
  assert.deepEqual(tool.output.render({}, "done"), [{ type: "text", text: "done" }]);
}
