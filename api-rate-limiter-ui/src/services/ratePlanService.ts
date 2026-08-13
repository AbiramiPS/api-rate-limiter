import { get, post, put, del, ApiError } from './api';
import { RatePlanResponse, RatePlanRequest, Page } from '@/types/api';

export class RatePlanService {
  private static readonly BASE_PATH = '/admin/plans';

  static async getAllPlans(page: number = 0, size: number = 100): Promise<Page<RatePlanResponse>> {
    return get<Page<RatePlanResponse>>(`${this.BASE_PATH}`, { page, size });
  }

  static async getPlanByName(planName: string): Promise<RatePlanResponse> {
    return get<RatePlanResponse>(`${this.BASE_PATH}/${encodeURIComponent(planName)}`);
  }

  static async createPlan(request: RatePlanRequest): Promise<RatePlanResponse> {
    return post<RatePlanResponse>(`${this.BASE_PATH}`, request);
  }

  static async updatePlan(planName: string, request: RatePlanRequest): Promise<RatePlanResponse> {
    return put<RatePlanResponse>(`${this.BASE_PATH}/${encodeURIComponent(planName)}`, request);
  }

  static async deletePlan(planName: string): Promise<string> {
    return del<string>(`${this.BASE_PATH}/${encodeURIComponent(planName)}`);
  }

  static async searchPlans(planName: string, page: number = 0, size: number = 10): Promise<Page<RatePlanResponse>> {
    return get<Page<RatePlanResponse>>(`${this.BASE_PATH}/search`, { planName, page, size });
  }
}

export { ApiError };
