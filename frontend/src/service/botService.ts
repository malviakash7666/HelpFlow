import { apiClient } from './api';

export interface BotConfig {
  id: string;
  companyId: string;
  name: string;
  theme: string;
  avatar: string | null;
  welcomeMessage: string;
  language: string;
  temperature: number;
  model: string;
  maxTokens: number;
  widgetPosition: string;
  allowedDomains: string[];
  publicKey: string;
  isActive: boolean;
}

export interface BotConfigResponse {
  success: boolean;
  message: string;
  data: BotConfig;
}

export const botService = {
  async getBotConfig(): Promise<BotConfigResponse> {
    const response = await apiClient.get<BotConfigResponse>('/api/bots');
    return response.data;
  },

  async updateBotConfig(data: Partial<BotConfig>): Promise<BotConfigResponse> {
    const response = await apiClient.put<BotConfigResponse>('/api/bots', data);
    return response.data;
  },

  async rotateKeys(): Promise<{ success: boolean; message: string; data: { publicKey: string } }> {
    const response = await apiClient.post('/api/bots/rotate-keys');
    return response.data;
  },
};
