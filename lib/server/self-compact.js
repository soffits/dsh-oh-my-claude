// Compaction the model asks for itself: the `compact` tool, the note that carries what it wants
// kept past the summary, and the line that tells it how full its context is. Automatic compaction
// fires on a token count wherever the work happens to be; a model that sees the count and can
// compact at a break of its own choosing avoids being cut off mid-task.
import z from "@deepseek-ai/schemastery";
/** The tool's name as dsh registers it; Claude Code sees it as `mcp__dsh__compact`. */
export const COMPACT_TOOL = "compact";
const KEEP_PARAM = "What must survive the compaction exactly, in your own words: the person's own words that " +
    "still matter, promises not yet kept, decisions and why, the next step. It is put back word " +
    "for word right after the summary.";
/** The tool's arguments; a `keep` that is not a string fails the call. */
const CompactArgs = z.object({ keep: z.string().default("") });
/** The `compact` tool as dsh's tool registry takes it. `run` gets the calling agent and the text
 *  to keep, trimmed, and answers what the model reads back. */
export function compactTool(run) {
    return {
        name: COMPACT_TOOL,
        description: "Compact this conversation once the current turn ends, at a moment you choose: a task " +
            "finished, a natural break, before a new subject. An older stretch is replaced by a " +
            "summary and the newest part stays word for word. Automatic compaction still runs at its " +
            "threshold; compacting at a break first keeps it from cutting in mid-task. Answers how full " +
            "the context is now. Top-level sessions only.",
        parameters: {
            type: "object",
            properties: { keep: { type: "string", description: KEEP_PARAM } },
            additionalProperties: false,
        },
        output: {
            schema: { type: "string" },
            render: (_args, value) => [
                { type: "text", text: String(value) },
            ],
        },
        async execute(args, exec) {
            if (exec.agent === undefined)
                throw new Error(`${COMPACT_TOOL} needs a calling agent`);
            return run(exec.agent, CompactArgs(args).keep.trim());
        },
    };
}
/** A token count as people read it: 412k, 1M, 1.05M. */
export function tokensText(n) {
    if (n >= 1_000_000)
        return `${Number((n / 1_000_000).toFixed(2))}M`;
    if (n >= 1000)
        return `${Math.round(n / 1000)}k`;
    return String(Math.round(n));
}
/** `part` as a whole percentage of `whole`. */
const pct = (part, whole) => Math.round((part / whole) * 100);
/** One line on how full the context is and where automatic compaction fires. */
export function fillText(fill) {
    const used = `${tokensText(fill.used)} of ${tokensText(fill.window)} tokens (${pct(fill.used, fill.window)}%)`;
    return fill.auto === undefined
        ? `Context in use: ${used}; no automatic compaction.`
        : `Context in use: ${used}; automatic compaction at ${pct(fill.auto, fill.window)}%.`;
}
/** What the tool answers once the compaction is set to run. */
export const scheduledText = (fill) => [
    "Compaction runs once this turn ends. Whatever you put in keep comes back word for word right after the summary.",
    fill && fillText(fill),
]
    .filter(Boolean)
    .join(" ");
/** Whether a session is close enough to its automatic compaction to be told: past `share` of the
 *  way there. Never with no automatic compaction, or with `share` off (0). */
export const fillDue = (fill, share) => fill.auto !== undefined && share > 0 && fill.used >= fill.auto * share;
/** The line a session gets, once, when its context crosses the notice level. */
export const fillNotice = (fill) => `[Oh My Claude] ${fillText(fill)} At the next natural break, call ${COMPACT_TOOL} with what must survive, so automatic compaction does not cut in mid-task.`;
/** The note put back after the summary, carrying the model's own text unchanged. */
export const keepNote = (keep) => `[Oh My Claude] You asked for this compaction and wrote what had to survive it. Here it is, word for word:\n\n${keep}`;
/** The note a session gets when the compaction it asked for did not run. */
export const notRunNote = (why) => `[Oh My Claude] The compaction you asked for did not run (${why}). The conversation is as it was; call ${COMPACT_TOOL} again at the next break if it is still needed.`;
/** What Claude Code's `/compact` is told about the text the model wants kept. On one line, since
 *  it rides in the command's argument; the note after the summary keeps its own layout. */
export const keepInstructions = (keep) => keep === ""
    ? undefined
    : "The assistant asked for this compaction and wrote what must survive it, quoted at the end " +
        "of these instructions. It is put back word for word right after your summary, so do not " +
        `copy it, but keep in the summary what is needed to act on it. The text: ${keep.replace(/\s+/g, " ")}`;
//# sourceMappingURL=self-compact.js.map