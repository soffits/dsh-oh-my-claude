// The line above a user message that another dsh session sent through open_session or
// prompt_session. Chat draws every `user` source as the owner's own bubble; this seat names the
// sender the bridge recorded on the message (`source.principal`, see `callerPrincipal` in
// src/mcp.ts), so a brief or follow-up from an agent does not read as something the owner typed.
import { t, useLocale } from "./i18n.js";
import type { ChainMatch, ChainOwner } from "./shared.js";

/** The sending session of a user row whose source names one, else null: the owner, a person
 *  another plugin recorded, or a row that is not a user message. */
export function agentSender(owner: ChainOwner): ChainMatch | null {
  const principal = owner.kind === "user" ? owner.source?.principal : undefined;
  // String(): the log is persisted data, and a malformed id must not break the row.
  return principal?.kind === "dsh-session" && principal.id ? { sessionId: String(principal.id) } : null;
}

/** "Sent by session 1a2b3c4d", the full id on hover. */
export function AgentSenderLine({ matched }: { matched?: ChainMatch }) {
  useLocale();
  if (!matched) return null;
  const short = matched.sessionId.replace(/^session-/, "").slice(0, 8);
  return (
    <div
      title={matched.sessionId}
      style={{ fontSize: 12, opacity: 0.7, textAlign: "right", margin: "0 0 4px" }}
    >
      {t("sender.agentSession", { id: short })}
    </div>
  );
}
