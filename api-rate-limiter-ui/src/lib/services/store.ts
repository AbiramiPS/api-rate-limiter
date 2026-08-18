import {
  RatePlan,
  User,
  UserCustomRule,
  RedisKeyItem,
  RedisStats,
  SystemStats,
  ActivityLog,
  ResolvedRule,
} from '@/types';
import {
  INITIAL_PLANS,
  INITIAL_USERS,
  INITIAL_CUSTOM_RULES,
  INITIAL_REDIS_KEYS,
  INITIAL_REDIS_STATS,
  INITIAL_SYSTEM_STATS,
  INITIAL_LOGS,
} from '../mockData';
import { getWindowInSeconds } from '../utils';

const STORAGE_KEYS = {
  PLANS: 'rate_limiter_plans_v1',
  USERS: 'rate_limiter_users_v1',
  CUSTOM_RULES: 'rate_limiter_custom_rules_v1',
  REDIS_KEYS: 'rate_limiter_redis_keys_v1',
  REDIS_STATS: 'rate_limiter_redis_stats_v1',
  LOGS: 'rate_limiter_logs_v1',
  BACKEND_URL: 'rate_limiter_backend_url',
};

// Helper for client-side storage access
function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error setting ${key} in localStorage`, e);
  }
}

export class RateLimiterStore {
  // Plans
  static getPlans(): RatePlan[] {
    return getItem<RatePlan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
  }

  static getPlanById(id: string): RatePlan | undefined {
    return this.getPlans().find((p) => p.id === id || p.code === id);
  }

  static createPlan(planData: Omit<RatePlan, 'id' | 'userCount' | 'createdAt'>): RatePlan {
    const plans = this.getPlans();
    const newPlan: RatePlan = {
      ...planData,
      id: `plan-${Date.now()}`,
      userCount: 0,
      createdAt: new Date().toISOString(),
    };
    const updated = [newPlan, ...plans];
    setItem(STORAGE_KEYS.PLANS, updated);
    this.addLog('System Admin', 'USER_CREATED', `Created new rate plan: ${newPlan.name} (${newPlan.maxRequests} req / ${newPlan.windowValue} ${newPlan.windowUnit})`, 'SUCCESS');
    return newPlan;
  }

  static updatePlan(id: string, updates: Partial<RatePlan>): RatePlan | null {
    const plans = this.getPlans();
    const index = plans.findIndex((p) => p.id === id);
    if (index === -1) return null;
    plans[index] = { ...plans[index], ...updates };
    setItem(STORAGE_KEYS.PLANS, plans);
    this.addLog('System Admin', 'RULE_UPDATED', `Updated rate plan details for ${plans[index].name}`, 'WARNING');
    return plans[index];
  }

  static deletePlan(id: string): boolean {
    const plans = this.getPlans();
    const plan = plans.find((p) => p.id === id);
    if (plan && plan.userCount > 0) {
      throw new Error(`Cannot delete plan '${plan.name}' because it has ${plan.userCount} active users assigned.`);
    }
    const filtered = plans.filter((p) => p.id !== id);
    setItem(STORAGE_KEYS.PLANS, filtered);
    return true;
  }

  // Users
  static getUsers(): User[] {
    return getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  static getUserByClientId(clientId: string): User | undefined {
    return this.getUsers().find((u) => u.clientId.toLowerCase() === clientId.toLowerCase());
  }

  static createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const users = this.getUsers();
    const existing = users.find((u) => u.clientId.toLowerCase() === userData.clientId.toLowerCase());
    if (existing) {
      throw new Error(`Client ID '${userData.clientId}' already exists.`);
    }

    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [newUser, ...users];
    setItem(STORAGE_KEYS.USERS, updatedUsers);

    // Increment plan count
    const plans = this.getPlans();
    const planIdx = plans.findIndex((p) => p.id === userData.planId || p.name === userData.planName);
    if (planIdx !== -1) {
      plans[planIdx].userCount += 1;
      setItem(STORAGE_KEYS.PLANS, plans);
    }

    this.addLog(newUser.clientId, 'USER_CREATED', `Registered new client '${newUser.clientName}' under plan '${newUser.planName}'.`, 'SUCCESS');
    return newUser;
  }

  static updateUser(clientId: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.clientId.toLowerCase() === clientId.toLowerCase());
    if (index === -1) return null;

    const oldUser = users[index];
    const updatedUser = { ...oldUser, ...updates };
    users[index] = updatedUser;
    setItem(STORAGE_KEYS.USERS, users);

    // If custom rule toggled off, sync redis cache
    if (oldUser.customRuleEnabled && !updatedUser.customRuleEnabled) {
      this.evictRedisRuleCache(clientId);
    }

    this.addLog(clientId, 'RULE_UPDATED', `Updated client details for ${clientId} (${updatedUser.clientName}).`, 'INFO');
    return updatedUser;
  }

  static deleteUser(clientId: string): boolean {
    const users = this.getUsers();
    const user = users.find((u) => u.clientId.toLowerCase() === clientId.toLowerCase());
    if (!user) return false;

    const filtered = users.filter((u) => u.clientId.toLowerCase() !== clientId.toLowerCase());
    setItem(STORAGE_KEYS.USERS, filtered);

    // Decrement plan user count
    const plans = this.getPlans();
    const planIdx = plans.findIndex((p) => p.id === user.planId || p.name === user.planName);
    if (planIdx !== -1 && plans[planIdx].userCount > 0) {
      plans[planIdx].userCount -= 1;
      setItem(STORAGE_KEYS.PLANS, plans);
    }

    // Flush Redis keys associated
    this.flushRedisKey(`rate_limit:${clientId}`);
    this.flushRedisKey(`rate_rule:${clientId}`);

    return true;
  }

  // Custom Rules
  static getCustomRules(): UserCustomRule[] {
    return getItem<UserCustomRule[]>(STORAGE_KEYS.CUSTOM_RULES, INITIAL_CUSTOM_RULES);
  }

  static getCustomRuleByClientId(clientId: string): UserCustomRule | undefined {
    return this.getCustomRules().find((r) => r.clientId.toLowerCase() === clientId.toLowerCase());
  }

  static upsertCustomRule(ruleData: Omit<UserCustomRule, 'id' | 'updatedAt'>): UserCustomRule {
    const rules = this.getCustomRules();
    const index = rules.findIndex((r) => r.clientId.toLowerCase() === ruleData.clientId.toLowerCase());

    let updatedRule: UserCustomRule;

    if (index !== -1) {
      updatedRule = {
        ...rules[index],
        ...ruleData,
        updatedAt: new Date().toISOString(),
      };
      rules[index] = updatedRule;
    } else {
      updatedRule = {
        ...ruleData,
        id: `rule-${Date.now()}`,
        updatedAt: new Date().toISOString(),
      };
      rules.unshift(updatedRule);
    }

    setItem(STORAGE_KEYS.CUSTOM_RULES, rules);

    // Automatically enable customRuleEnabled on User
    const user = this.getUserByClientId(ruleData.clientId);
    if (user && (!user.customRuleEnabled || !ruleData.enabled)) {
      this.updateUser(ruleData.clientId, { customRuleEnabled: ruleData.enabled });
    }

    // Evict Redis rule cache so the new rule is loaded
    this.evictRedisRuleCache(ruleData.clientId);

    this.addLog(
      ruleData.clientId,
      'RULE_UPDATED',
      `Custom Rate Limit rule ${index !== -1 ? 'updated' : 'created'}: ${ruleData.maxRequests} req / ${ruleData.windowValue} ${ruleData.windowUnit}.`,
      'WARNING'
    );

    return updatedRule;
  }

  static deleteCustomRule(clientId: string): boolean {
    const rules = this.getCustomRules();
    const filtered = rules.filter((r) => r.clientId.toLowerCase() !== clientId.toLowerCase());
    setItem(STORAGE_KEYS.CUSTOM_RULES, filtered);

    // Disable custom rule on user
    this.updateUser(clientId, { customRuleEnabled: false });

    // Evict Redis rule cache
    this.evictRedisRuleCache(clientId);

    return true;
  }

  // CORE RULE RESOLUTION LOGIC
  static resolveRuleForClient(clientId: string): ResolvedRule {
    const user = this.getUserByClientId(clientId);
    const customRule = this.getCustomRuleByClientId(clientId);

    // Logic requirement:
    // If customRuleEnabled = true AND rule is enabled -> Use UserCustomRule
    if (user && user.customRuleEnabled && customRule && customRule.enabled) {
      return {
        clientId: user.clientId,
        source: 'CUSTOM_RULE',
        sourceName: `Custom Rule (${user.clientName})`,
        maxRequests: customRule.maxRequests,
        windowValue: customRule.windowValue,
        windowUnit: customRule.windowUnit,
      };
    }

    // Else -> Use default RatePlanRule associated with the user's plan
    const plans = this.getPlans();
    let plan = user ? plans.find((p) => p.id === user.planId || p.name === user.planName) : null;
    if (!plan) {
      plan = plans.find((p) => p.isDefault) || plans[0];
    }

    return {
      clientId: user ? user.clientId : clientId,
      source: 'RATE_PLAN',
      sourceName: `Plan: ${plan.name}`,
      maxRequests: plan.maxRequests,
      windowValue: plan.windowValue,
      windowUnit: plan.windowUnit,
    };
  }

  // REDIS SIMULATION ENGINE
  static getRedisKeys(): RedisKeyItem[] {
    return getItem<RedisKeyItem[]>(STORAGE_KEYS.REDIS_KEYS, INITIAL_REDIS_KEYS);
  }

  static getRedisStats(): RedisStats {
    const keys = this.getRedisKeys();
    const rateLimitKeysCount = keys.filter((k) => k.type === 'rate_limit').length;
    const ruleCacheKeysCount = keys.filter((k) => k.type === 'rate_rule').length;
    const baseStats = getItem<RedisStats>(STORAGE_KEYS.REDIS_STATS, INITIAL_REDIS_STATS);

    return {
      ...baseStats,
      totalKeys: keys.length,
      rateLimitKeysCount,
      ruleCacheKeysCount,
    };
  }

  static evictRedisRuleCache(clientId: string): void {
    this.flushRedisKey(`rate_rule:${clientId}`);
  }

  static flushRedisKey(keyName: string): boolean {
    const keys = this.getRedisKeys();
    const filtered = keys.filter((k) => k.key.toLowerCase() !== keyName.toLowerCase());
    setItem(STORAGE_KEYS.REDIS_KEYS, filtered);
    this.addLog('REDIS', 'RULE_UPDATED', `Flushed key '${keyName}' from Redis cache/store.`, 'INFO');
    return keys.length !== filtered.length;
  }

  static flushAllRedisKeys(): void {
    setItem(STORAGE_KEYS.REDIS_KEYS, []);
    this.addLog('REDIS', 'RULE_UPDATED', 'Flushed ALL rate limit counters and cached rules from Redis.', 'DANGER');
  }

  static simulateApiRequest(clientId: string): {
    allowed: boolean;
    status: number;
    currentCount: number;
    maxRequests: number;
    windowValue: number;
    windowUnit: string;
    source: string;
    message: string;
    ttlSeconds: number;
  } {
    const user = this.getUserByClientId(clientId);
    const clientName = user ? user.clientName : clientId;
    const resolved = this.resolveRuleForClient(clientId);
    const keys = this.getRedisKeys();

    // 1. Ensure Rule Cache key exists in Redis (`rate_rule:clientId`)
    const ruleKeyName = `rate_rule:${clientId}`;
    let ruleCacheKey = keys.find((k) => k.key === ruleKeyName);
    const windowSecs = getWindowInSeconds(resolved.windowValue, resolved.windowUnit);

    if (!ruleCacheKey) {
      ruleCacheKey = {
        key: ruleKeyName,
        type: 'rate_rule',
        clientId,
        ttlSeconds: 3600,
        maxRequests: resolved.maxRequests,
        windowValue: resolved.windowValue,
        windowUnit: resolved.windowUnit,
        source: resolved.source,
        lastUpdated: new Date().toISOString(),
      };
      keys.push(ruleCacheKey);
      this.addLog(clientId, 'CACHE_MISS', `Cache miss for ${ruleKeyName}. Loaded ${resolved.sourceName} into Redis cache.`, 'INFO');
    }

    // 2. Rate Limit Counter key (`rate_limit:clientId`)
    const limitKeyName = `rate_limit:${clientId}`;
    let limitKeyIndex = keys.findIndex((k) => k.key === limitKeyName);

    let currentCount = 1;
    let ttlSeconds = windowSecs;

    if (limitKeyIndex !== -1) {
      const existing = keys[limitKeyIndex];
      currentCount = (existing.currentCount || 0) + 1;
      ttlSeconds = Math.max(1, existing.ttlSeconds - 1);
    }

    const isAllowed = currentCount <= resolved.maxRequests;
    const keyStatus = isAllowed
      ? currentCount >= resolved.maxRequests * 0.8
        ? 'WARNING'
        : 'ALLOWED'
      : 'THROTTLED';

    const updatedLimitKey: RedisKeyItem = {
      key: limitKeyName,
      type: 'rate_limit',
      clientId,
      ttlSeconds,
      currentCount,
      maxRequests: resolved.maxRequests,
      windowValue: resolved.windowValue,
      windowUnit: resolved.windowUnit,
      status: keyStatus,
      lastUpdated: new Date().toISOString(),
    };

    if (limitKeyIndex !== -1) {
      keys[limitKeyIndex] = updatedLimitKey;
    } else {
      keys.push(updatedLimitKey);
    }

    setItem(STORAGE_KEYS.REDIS_KEYS, keys);

    // Update Stats
    const stats = this.getRedisStats();
    stats.totalEvaluations += 1;
    if (!isAllowed) {
      stats.blockedRequestsCount += 1;
    }
    setItem(STORAGE_KEYS.REDIS_STATS, stats);

    // Add log
    if (!isAllowed) {
      this.addLog(
        clientId,
        'BLOCKED',
        `HTTP 429 Too Many Requests: Request ${currentCount}/${resolved.maxRequests} blocked within ${resolved.windowValue} ${resolved.windowUnit} window.`,
        'DANGER'
      );
      return {
        allowed: false,
        status: 429,
        currentCount,
        maxRequests: resolved.maxRequests,
        windowValue: resolved.windowValue,
        windowUnit: resolved.windowUnit,
        source: resolved.sourceName,
        message: `HTTP 429: Rate limit exceeded (${currentCount}/${resolved.maxRequests} requests)`,
        ttlSeconds,
      };
    }

    this.addLog(
      clientId,
      'EVALUATED',
      `HTTP 200 OK: Request allowed (${currentCount}/${resolved.maxRequests} req in ${resolved.windowValue} ${resolved.windowUnit}).`,
      'SUCCESS'
    );

    return {
      allowed: true,
      status: 200,
      currentCount,
      maxRequests: resolved.maxRequests,
      windowValue: resolved.windowValue,
      windowUnit: resolved.windowUnit,
      source: resolved.sourceName,
      message: `HTTP 200: Request permitted (${currentCount}/${resolved.maxRequests} requests)`,
      ttlSeconds,
    };
  }

  // System Logs
  static getLogs(): ActivityLog[] {
    return getItem<ActivityLog[]>(STORAGE_KEYS.LOGS, INITIAL_LOGS);
  }

  static addLog(
    clientId: string,
    action: ActivityLog['action'],
    details: string,
    status: ActivityLog['status']
  ): void {
    const user = this.getUserByClientId(clientId);
    const logs = this.getLogs();
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      clientId,
      clientName: user ? user.clientName : clientId,
      action,
      details,
      status,
    };
    const updated = [newLog, ...logs.slice(0, 49)];
    setItem(STORAGE_KEYS.LOGS, updated);
  }

  // Backend Integration Config
  static getBackendUrl(): string {
    return getItem<string>(STORAGE_KEYS.BACKEND_URL, 'http://localhost:8080/api');
  }

  static setBackendUrl(url: string): void {
    setItem(STORAGE_KEYS.BACKEND_URL, url);
  }
}
