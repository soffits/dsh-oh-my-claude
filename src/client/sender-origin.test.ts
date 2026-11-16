// The sender line above a user message: only a message another dsh session sent gets one.
import assert from "node:assert/strict";
import { agentSender } from "./sender-origin.js";

const fromSession = { kind: "dsh-session", channel: "dsh", id: "session-1a2b3c4d-0000" };
assert.deepEqual(agentSender({ kind: "user", source: { principal: fromSession } }), {
  sessionId: "session-1a2b3c4d-0000",
});
// The owner's own typing has no principal; a person another plugin recorded is not an agent.
assert.equal(agentSender({ kind: "user", source: {} }), null);
assert.equal(agentSender({ kind: "user" }), null);
assert.equal(
  agentSender({ kind: "user", source: { principal: { kind: "telegram-user", id: "42" } } }),
  null,
);
// Steering and pending rows keep Chat's own markup; a session principal without an id names nobody.
assert.equal(agentSender({ kind: "steering", source: { principal: fromSession } }), null);
assert.equal(agentSender({ kind: "user", source: { principal: { kind: "dsh-session" } } }), null);
console.log("sender-origin ok");
