import type { Plugin } from '@opencode-ai/plugin';

const APPLIER_AGENT = 'openspec/applier';

const APPLIER_COMPACTION_CONTEXT = `
This is an openspec/applier session. Preserve the latest "## Agent Delegation Timeline" block in the compaction summary with its exact Revision, Change, CLI State, execution lines, task order, agents, states, dependencies, evidence, facilitator cycle, verdict, and fix owners.

Keep completed, active, blocked, and planned delegations distinct. Preserve retained facilitator finding identifiers and their assigned fix owners. If the latest value cannot be established from the conversation, write UNKNOWN instead of inferring progress. The compacted session must be able to resume by updating this timeline before the next delegation.
`.trim();

/** セッション履歴を取得できなくても、受信済みメッセージから実装エージェントを識別する。 */
const activeApplierSessions = new Set<string>();

/** 実装エージェントの圧縮要約へ、最新の委任タイムラインを引き継ぐ。 */
const applierCompactionPlugin = (({ client }) =>
  Promise.resolve({
    'chat.message': ({ agent, sessionID }) => {
      if (agent === APPLIER_AGENT) activeApplierSessions.add(sessionID);
      return Promise.resolve();
    },
    'experimental.session.compacting': async ({ sessionID }, output) => {
      if (!activeApplierSessions.has(sessionID)) {
        try {
          const response = await client.session.messages({
            path: { id: sessionID },
          });
          const isApplierSession = response.data?.some(
            ({ info }) => info.role === 'user' && info.agent === APPLIER_AGENT
          );

          if (isApplierSession !== true) return;
          activeApplierSessions.add(sessionID);
        } catch {
          // 判定できないセッションには専用指示を加えず、既定の圧縮を続ける。
          return;
        }
      }

      output.context.push(APPLIER_COMPACTION_CONTEXT);
    },
  })) satisfies Plugin;

export default applierCompactionPlugin;
