import { get, post, put, del, ApiError } from './api';
import { UserCustomRuleRequest, UserCustomRuleResponse, Page } from '@/types/api';

export class CustomRuleService {
  private static readonly BASE_PATH = '/admin/custom-rules';

  static async getCustomRuleByClientId(clientId: string): Promise<UserCustomRuleResponse> {
    return get<UserCustomRuleResponse>(`${this.BASE_PATH}/${encodeURIComponent(clientId)}`);
  }

  static async createCustomRule(request: UserCustomRuleRequest): Promise<UserCustomRuleResponse> {
    return post<UserCustomRuleResponse>(`${this.BASE_PATH}`, request);
  }

  static async updateCustomRule(clientId: string, request: UserCustomRuleRequest): Promise<UserCustomRuleResponse> {
    return put<UserCustomRuleResponse>(`${this.BASE_PATH}/${encodeURIComponent(clientId)}`, request);
  }

  static async deleteCustomRule(clientId: string): Promise<string> {
    return del<string>(`${this.BASE_PATH}/${encodeURIComponent(clientId)}`);
  }

  static async searchCustomRules(clientName: string, page: number = 0, size: number = 10): Promise<Page<UserCustomRuleResponse>> {
    return get<Page<UserCustomRuleResponse>>(`${this.BASE_PATH}/search`, { user: clientName, page, size });
  }
}

export { ApiError };
