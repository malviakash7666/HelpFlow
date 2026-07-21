import { apiClient } from './api';

export interface TicketInfo {
  id: string;
  companyId: string;
  conversationId: string;
  customerId: string | null;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedEmployeeId: string | null;
  createdAt: string;
  updatedAt: string;
  assignedEmployee?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    location: string | null;
  };
}

export interface ListTicketsResponse {
  success: boolean;
  message: string;
  data: TicketInfo[];
}

export interface TicketResponse {
  success: boolean;
  message: string;
  data: TicketInfo;
}

export interface ReplyResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    conversationId: string;
    senderType: 'agent';
    senderId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface DashboardStats {
  totalTickets: number;
  totalGrowth: number;
  openTickets: number;
  openGrowth: number;
  inProgressTickets: number;
  inProgressGrowth: number;
  resolvedTickets: number;
  resolvedGrowth: number;
  recentTickets: TicketInfo[];
}

export interface DashboardStatsResponse {
  success: boolean;
  message: string;
  data: DashboardStats;
}

export interface CreateTicketInput {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerLocation?: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedEmployeeId?: string;
}

export const ticketService = {
  /**
   * List all support tickets for the logged-in company.
   */
  async listTickets(): Promise<ListTicketsResponse> {
    const response = await apiClient.get<ListTicketsResponse>('/api/tickets');
    return response.data;
  },

  /**
   * Get specific ticket details.
   */
  async getTicket(id: string): Promise<TicketResponse> {
    const response = await apiClient.get<TicketResponse>(`/api/tickets/${id}`);
    return response.data;
  },

  /**
   * Assign a ticket to an employee. Defaults to the logged-in employee if no ID is sent.
   */
  async assignTicket(id: string, assignedEmployeeId?: string): Promise<TicketResponse> {
    const response = await apiClient.post<TicketResponse>(`/api/tickets/${id}/assign`, {
      assignedEmployeeId,
    });
    return response.data;
  },

  /**
   * Update the status of a ticket.
   */
  async updateStatus(id: string, status: TicketInfo['status']): Promise<TicketResponse> {
    const response = await apiClient.post<TicketResponse>(`/api/tickets/${id}/status`, {
      status,
    });
    return response.data;
  },

  /**
   * Send a support reply to the visitor/customer.
   */
  async replyTicket(id: string, content: string): Promise<ReplyResponse> {
    const response = await apiClient.post<ReplyResponse>(`/api/tickets/${id}/reply`, {
      content,
    });
    return response.data;
  },

  /**
   * Get dashboard metrics and recent tickets.
   */
  async getDashboardStats(): Promise<DashboardStatsResponse> {
    const response = await apiClient.get<DashboardStatsResponse>('/api/tickets/dashboard-stats');
    return response.data;
  },

  /**
   * Create a new ticket manually.
   */
  async createTicket(data: CreateTicketInput): Promise<TicketResponse> {
    const response = await apiClient.post<TicketResponse>('/api/tickets', data);
    return response.data;
  },
};
