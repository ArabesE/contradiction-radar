# Demo script — 2:35 target

## 0:00–0:18 — Problem

**Visual:** Contradiction Radar Agent Messages tab, then `#general` demo evidence.

**Voice:** “Slack is where teams make decisions—but later messages can quietly conflict with requirements, deadlines, versions, or customer scope. Contradiction Radar finds that drift before it turns into rework.”

## 0:18–0:43 — Slack-native experience

**Visual:** Agent profile/suggested prompts. Send the Atlas prompt.

**Voice:** “It is a new Slack Agent using the current Agent Messages experience. I ask it to check a claim. The trigger supplies a short-lived action token, so Slack’s Real-time Search API returns evidence in the requesting user’s context.”

## 0:43–1:16 — Explainable findings

**Visual:** Thread response. Pause on the requirement conflict, links, and superseded decision.

**Voice:** “The earlier security requirement makes September fifteenth incompatible, so the agent flags a high-confidence requirement conflict. It also catches the later October eighth decision as superseding the original date. Every result explains why and links back to both Slack messages, while non-conflicting search results stay out of the way.”

## 1:16–1:55 — Context changes the answer

**Visual:** Send SSO prompt, show conflict, click Add context, reply `This is for production version 2.`, show scope mismatch.

**Voice:** “Conservative reasoning is the product. This SSO statement first looks incompatible. I add that it applies to production version two. The agent re-checks and now recognizes that the earlier message is local development version one—a scope mismatch, not an accusation.”

## 1:55–2:15 — Human control and privacy

**Visual:** Click False positive or Mark resolved; show acknowledgement.

**Voice:** “Users can add context, mark resolved, or report a false positive. Feedback stores identifiers and reason codes, never raw message text. The quantized NLI model runs inside our private cloud worker, so Slack content is not sent to a remote model provider.”

## 2:15–2:35 — Architecture and close

**Visual:** Architecture PNG, then return to Slack result.

**Voice:** “Bolt and Socket Mode connect the agent, Slack remains the permission boundary, and a self-hosted NLI-plus-rules ensemble handles scope, time, versions, proposals, and supersession. Contradiction Radar turns scattered Slack history into cautious, evidence-backed decision support.”
