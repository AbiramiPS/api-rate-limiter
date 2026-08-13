import { get, post, put, patch, del, ApiError } from './api';
import { UserPlanRequest, UserPlanResponse, Page } from '@/types/api';

export class UserPlanService {
  private static readonly BASE_PATH = '/admin/user-plans';

  static async getAllUsers(page: number = 0, size: number = 10): Promise<Page<UserPlanResponse>> {
    return get<Page<UserPlanResponse>>(`${this.BASE_PATH}`, { page, size });
  }

  static async getUserByClientId(clientId: string): Promise<UserPlanResponse> {
    return get<UserPlanResponse>(`${this.BASE_PATH}/${encodeURIComponent(clientId)}`);
  }

  static async searchUsers(clientName: string, page: number = 0, size: number = 10): Promise<Page<UserPlanResponse>> {
    return get<Page<UserPlanResponse>>(`${this.BASE_PATH}/search`, { clientName, page, size });
  }

  static async createUser(request: UserPlanRequest): Promise<UserPlanResponse> {
    return post<UserPlanResponse>(`${this.BASE_PATH}`, request);
  }

  static async updateUser(clientId: string, request: UserPlanRequest): Promise<UserPlanResponse> {
    return put<UserPlanResponse>(`${this.BASE_PATH}/${encodeURIComponent(clientId)}`, request);
  }

  static async patchUser(clientId: string, request: Partial<UserPlanRequest>): Promise<UserPlanResponse> {
    return patch<UserPlanResponse>(`${this.BASE_PATH}/${encodeURIComponent(clientId)}`, request);
  }

  static async deleteUser(clientId: string): Promise<string> {
    return del<string>(`${this.BASE_PATH}/${encodeURIComponent(clientId)}`);
  }
}

export { ApiError };
