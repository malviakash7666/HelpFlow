import { apiClient } from './api';

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
}

export const webhookService = {
  async getWebhooks(): Promise<{ success: boolean; data: WebhookConfig[] }> {
    const response = await apiClient.get('/api/webhooks');
    return response.data;
  },

  async createWebhook(data: { url: string; events?: string[] }): Promise<{ success: boolean; data: WebhookConfig }> {
    const response = await apiClient.post('/api/webhooks', data);
    return response.data;
  },

  async deleteWebhook(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/api/webhooks/${id}`);
    return response.data;
  },
};
