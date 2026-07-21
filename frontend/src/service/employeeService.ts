import { apiClient } from './api';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'SUPPORT_AGENT' | 'CUSTOMER';
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddEmployeeInput {
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPPORT_AGENT';
}

export interface AddEmployeeResponse {
  success: boolean;
  message: string;
  data: {
    employee: Employee;
    temporaryPassword?: string;
  };
}

export interface GetEmployeesResponse {
  success: boolean;
  message: string;
  data: Employee[];
}

export interface EmployeeResponse {
  success: boolean;
  message: string;
  data: Employee;
}

export const employeeService = {
  /**
   * Add a new employee (ADMIN or SUPPORT_AGENT)
   */
  async addEmployee(data: AddEmployeeInput): Promise<AddEmployeeResponse> {
    const response = await apiClient.post<AddEmployeeResponse>('/api/users/add-employee', data);
    return response.data;
  },

  /**
   * Get all company employees (excluding CUSTOMER role)
   */
  async getEmployees(): Promise<GetEmployeesResponse> {
    const response = await apiClient.get<GetEmployeesResponse>('/api/users/employees');
    return response.data;
  },

  /**
   * Update employee role (OWNER only access in backend)
   */
  async updateRole(id: string, role: 'OWNER' | 'ADMIN' | 'SUPPORT_AGENT'): Promise<EmployeeResponse> {
    const response = await apiClient.patch<EmployeeResponse>(`/api/users/${id}/role`, { role });
    return response.data;
  },

  /**
   * Soft delete (deactivate) an employee
   */
  async deleteEmployee(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/api/users/${id}`);
    return response.data;
  },

  /**
   * Toggle employee active / inactive status
   */
  async toggleStatus(id: string): Promise<EmployeeResponse> {
    const response = await apiClient.patch<EmployeeResponse>(`/api/users/${id}/status`);
    return response.data;
  }
};
