import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

interface UserDailyUsage {
  tokensUsed: number;
  date: string;
}

const MAX_TOKENS_PER_DAY = 150_000;
const userUsageMap = new Map<string, UserDailyUsage>();

const costGuardPluginCallback: FastifyPluginAsync = async (fastify) => {
  fastify.decorate("recordTokenUsage", (userId: string, tokens: number) => {
    const today = new Date().toISOString().slice(0, 10);
    const existing = userUsageMap.get(userId);

    if (!existing || existing.date !== today) {
      userUsageMap.set(userId, { tokensUsed: tokens, date: today });
    } else {
      existing.tokensUsed += tokens;
    }
  });

  fastify.decorate("checkTokenQuota", (userId: string): boolean => {
    const today = new Date().toISOString().slice(0, 10);
    const existing = userUsageMap.get(userId);
    if (!existing || existing.date !== today) return true;
    return existing.tokensUsed < MAX_TOKENS_PER_DAY;
  });
};

export default fp(costGuardPluginCallback, { name: "cost-guard-plugin" });

