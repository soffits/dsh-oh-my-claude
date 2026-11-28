import type { JsonValue } from "./dsh.js";
/** How full one session's context is, in tokens. `auto` is where automatic compaction fires,
 *  undefined when the session has none. */
export type ContextFill = {
    used: number;
    window: number;
    auto?: number;
};
/** The tool's name as dsh registers it; Claude Code sees it as `mcp__dsh__compact`. */
export declare const COMPACT_TOOL = "compact";
/** The `compact` tool as dsh's tool registry takes it. `run` gets the calling agent and the text
 *  to keep, trimmed, and answers what the model reads back. */
export declare function compactTool<A>(run: (agent: A, keep: string) => Promise<string>): {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            keep: {
                type: string;
                description: string;
            };
        };
        additionalProperties: boolean;
    };
    output: {
        schema: {
            type: string;
        };
        render: (_args: Record<string, JsonValue>, value: JsonValue) => {
            type: string;
            text: string;
        }[];
    };
    execute(args: Record<string, JsonValue>, exec: {
        agent?: A;
    }): Promise<string>;
};
/** A token count as people read it: 412k, 1M, 1.05M. */
export declare function tokensText(n: number): string;
/** One line on how full the context is and where automatic compaction fires. */
export declare function fillText(fill: ContextFill): string;
/** What the tool answers once the compaction is set to run. */
export declare const scheduledText: (fill: ContextFill | undefined) => string;
/** Whether a session is close enough to its automatic compaction to be told: past `share` of the
 *  way there. Never with no automatic compaction, or with `share` off (0). */
export declare const fillDue: (fill: ContextFill, share: number) => boolean;
/** The line a session gets, once, when its context crosses the notice level. */
export declare const fillNotice: (fill: ContextFill) => string;
/** The note put back after the summary, carrying the model's own text unchanged. */
export declare const keepNote: (keep: string) => string;
/** The note a session gets when the compaction it asked for did not run. */
export declare const notRunNote: (why: string) => string;
/** What Claude Code's `/compact` is told about the text the model wants kept. On one line, since
 *  it rides in the command's argument; the note after the summary keeps its own layout. */
export declare const keepInstructions: (keep: string) => string | undefined;
