export type WindowUnit = 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY';

export interface RatePlan {
  id: string;
  name: string;
  code: string;
  description: string;
  maxRequests: number;
  windowValue: number;
  windowUnit: WindowUnit;
  isDefault?: boolean;
  userCount: number;
  createdAt: string;
}

export interface User {
  id: string;
  clientId: string;
  clientName: string;
  email: string;
  planId: string;
  planName: string;
  customRuleEnabled: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  createdAt: string;
}

export interface UserCustomRule {
  id: string;
  clientId: string;
  clientName: string;
  maxRequests: number;
  windowValue: number;
  windowUnit: WindowUnit;
  enabled: boolean;
  reason?: string;
  updatedAt: string;
}

export interface ResolvedRule {
  clientId: string;
  source: 'CUSTOM_RULE' | 'RATE_PLAN';
  sourceName: string;
  maxRequests: number;
  windowValue: number;
  windowUnit: WindowUnit;
}

export interface RedisKeyItem {
  key: string;
  type: 'rate_limit' | 'rate_rule';
  clientId: string;
  ttlSeconds: number;
  currentCount?: number;
  maxRequests?: number;
  windowValue?: number;
  windowUnit?: WindowUnit;
  source?: 'CUSTOM_RULE' | 'RATE_PLAN';
  status?: 'ALLOWED' | 'WARNING' | 'THROTTLED';
  lastUpdated: string;
}

export interface RedisStats {
  connected: boolean;
  version: string;
  uptimeInSeconds: number;
  usedMemoryHuman: string;
  totalKeys: number;
  rateLimitKeysCount: number;
  ruleCacheKeysCount: number;
  cacheHitRatio: number;
  totalEvaluations: number;
  blockedRequestsCount: number;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  activePlans: number;
  customRulesCount: number;
  redisKeysCount: number;
  totalRequests24h: number;
  blockedRequests24h: number;
  averageResponseTimeMs: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  clientId: string;
  clientName: string;
  action: 'EVALUATED' | 'BLOCKED' | 'CACHE_HIT' | 'CACHE_MISS' | 'RULE_UPDATED' | 'USER_CREATED';
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'DANGER' | 'INFO';
}

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
