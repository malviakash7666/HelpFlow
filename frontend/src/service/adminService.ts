import { apiClient } from './api';

export interface SystemOverview {
  totalCompanies: number;
  totalUsers: number;
  totalDocuments: number;
  totalTickets: number;
  usage: any[];
  recentLogs: any[];
}

export const adminService = {
  async getOverview(): Promise<{ success: boolean; data: SystemOverview }> {
    const response = await apiClient.get('/api/admin/overview');
    return response.data;
  },

  async getCompanies(): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get('/api/admin/companies');
    return response.data;
  },

  async getAuditLogs(): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get('/api/admin/logs');
    return response.data;
  },
};
