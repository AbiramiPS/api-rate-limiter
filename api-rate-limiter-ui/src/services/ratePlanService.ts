import { get } from './api';
import { RatePlanResponse, Page } from '@/types/api';

export class RatePlanService {
  private static readonly BASE_PATH = '/admin/plans';

  static async getAllPlans(page: number = 0, size: number = 100): Promise<Page<RatePlanResponse>> {
    return get<Page<RatePlanResponse>>(`${this.BASE_PATH}`, { page, size });
  }

  static async getPlanByName(planName: string): Promise<RatePlanResponse> {
    return get<RatePlanResponse>(`${this.BASE_PATH}/${encodeURIComponent(planName)}`);
  }
}
