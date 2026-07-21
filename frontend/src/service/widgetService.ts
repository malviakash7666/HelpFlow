import { apiClient } from './api';

export interface WidgetInfo {
  id: string;
  companyId: string;
  widgetKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WidgetConfigResponse {
  success: boolean;
  message: string;
  data: WidgetInfo;
}

export const widgetService = {
  /**
   * Fetch (or auto-initialize) the widget config for the authenticated company.
   */
  async getWidgetConfig(): Promise<WidgetConfigResponse> {
    const response = await apiClient.get<WidgetConfigResponse>('/api/widget/config');
    return response.data;
  },

  /**
   * Enable or disable the company's chatbot widget.
   */
  async toggleWidget(): Promise<WidgetConfigResponse> {
    const response = await apiClient.post<WidgetConfigResponse>('/api/widget/config/toggle');
    return response.data;
  },

  /**
   * Regenerate the widget key for API security.
   */
  async regenerateWidgetKey(): Promise<WidgetConfigResponse> {
    const response = await apiClient.post<WidgetConfigResponse>('/api/widget/config/regenerate');
    return response.data;
  },
};
