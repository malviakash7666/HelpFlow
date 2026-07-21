import { apiClient } from './api';

export interface CompanyRegisterInput {
  name: string;
  email: string;
  password?: string;
  website?: string;
  description?: string;
  logo?: string;
  industry?: string;
  autoAssignmentEnabled?: boolean;
  assignmentMethod?: string;
  assignTo?: string;
  fallbackEmployeeId?: string | null;
}

export interface CompanyLoginInput {
  email: string;
  password?: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  email: string;
  website: string | null;
  description: string | null;
  logo: string | null;
  industry: string | null;
  isActive: boolean;
  autoAssignmentEnabled: boolean;
  assignmentMethod: string;
  assignTo: string;
  fallbackEmployeeId: string | null;
  userRole?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    company: CompanyProfile;
    accessToken: string;
  };
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: CompanyProfile;
}

export const authService = {
  /**
   * Register a new company and auto-login
   */
  async register(data: CompanyRegisterInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/company/register', data);
    return response.data;
  },

  /**
   * Log in a company
   */
  async login(data: CompanyLoginInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/company/login', data);
    return response.data;
  },

  /**
   * Log out company and clear tokens/cookies
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>('/api/company/logout');
    return response.data;
  },

  /**
   * Retrieve company profile
   */
  async getProfile(): Promise<ProfileResponse> {
    const response = await apiClient.get<ProfileResponse>('/api/company/profile');
    return response.data;
  },

  /**
   * Update company profile details
   */
  async updateProfile(data: Partial<CompanyRegisterInput>): Promise<ProfileResponse> {
    const response = await apiClient.put<ProfileResponse>('/api/company/profile', data);
    return response.data;
  }
};
