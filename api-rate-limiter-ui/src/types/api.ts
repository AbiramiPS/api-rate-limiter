// Backend DTOs matching Spring Boot API
export interface UserPlanRequest {
  clientId: string;
  clientName: string;
  planId: number;
  customRuleEnabled: boolean;
}

export interface UserPlanResponse {
  id: number;
  clientId: string;
  clientName: string;
  planName: string;
  customRuleEnabled: boolean;
}

export interface RatePlanResponse {
  id: number;
  planName: string;
  active: boolean;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  details?: string;
}
