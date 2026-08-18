import { post, get, put, ApiError } from './api';
import { RatePlanRuleRequest, RatePlanRuleResponse } from '@/types/api';

/**
 * Service for interacting with RatePlanRule endpoints.
 * Base path: /admin/rules
 */
export class RuleService {
  private static readonly BASE_PATH = '/admin/rules';

  /** Retrieve rule details for a specific plan ID */
  static async getRule(planId: number): Promise<RatePlanRuleResponse> {
    return get<RatePlanRuleResponse>(`${this.BASE_PATH}/${planId}`);
  }

  /** Create a new rule linked to a plan */
  static async createRule(request: RatePlanRuleRequest): Promise<RatePlanRuleResponse> {
    return post<RatePlanRuleResponse>(this.BASE_PATH, request);
  }

  /** Update an existing rule */
  static async updateRule(planId: number, request: RatePlanRuleRequest): Promise<RatePlanRuleResponse> {
    // Assuming backend PUT expects /admin/rules/{planId} or just /admin/rules depending on the API design.
    // The user said: "Update the existing RatePlanRule using the existing RatePlanRule API."
    // A typical REST update to a specific rule ID or plan ID.
    // Let's use PUT to /admin/rules/{planId} based on standard conventions or /admin/rules if it acts on planId inside the body.
    return put<RatePlanRuleResponse>(`${this.BASE_PATH}/${planId}`, request);
  }

  // Additional helpers (search, list) could be added here if needed.
}

export { ApiError };
