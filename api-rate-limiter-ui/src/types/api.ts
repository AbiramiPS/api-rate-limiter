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

export interface RatePlanRequest {
  planName: string;
  active: boolean;
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

export interface UserCustomRuleRequest {
  userPlanId: number;
  maxRequests: number;
  windowValue: number;
  windowUnit: string;
  price: number;
  active: boolean;
}

export interface UserCustomRuleResponse {
  id: number;
  clientId: string;
  clientName: string;
  maxRequests: number;
  windowValue: number;
  windowUnit: string;
  price: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  message: string;
  status: number;
  details?: string;
}
