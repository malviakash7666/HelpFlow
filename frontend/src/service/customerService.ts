import { apiClient } from './api';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  isActive: boolean;
  totalTickets: number;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetCustomersResponse {
  success: boolean;
  message: string;
  data: Customer[];
}

export interface CustomerResponse {
  success: boolean;
  message: string;
  data: Customer;
}

export const customerService = {
  /**
   * Get all company customers.
   */
  async getCustomers(): Promise<GetCustomersResponse> {
    const response = await apiClient.get<GetCustomersResponse>('/api/users/customers');
    return response.data;
  },

  /**
   * Create or update a customer profile manually.
   */
  async createCustomer(data: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
  }): Promise<CustomerResponse> {
    const response = await apiClient.post<CustomerResponse>('/api/users/customers', data);
    return response.data;
  },
};
