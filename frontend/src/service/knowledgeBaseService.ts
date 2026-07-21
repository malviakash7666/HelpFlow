import { apiClient } from './api';

export interface DocumentInfo {
  id: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SourceDoc {
  id: string;
  originalName: string;
  score: number;
}

export interface ChatResponseData {
  answer: string;
  sources: SourceDoc[];
  conversationId?: string;
}

export interface ConversationInfo {
  id: string;
  companyId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageInfo {
  id: string;
  conversationId: string;
  senderType: 'visitor' | 'bot' | 'agent';
  senderId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListConversationsResponse {
  success: boolean;
  message: string;
  data: ConversationInfo[];
}

export interface ListMessagesResponse {
  success: boolean;
  message: string;
  data: ChatMessageInfo[];
}

export interface ListDocumentsResponse {
  success: boolean;
  message: string;
  data: DocumentInfo[];
}

export interface UploadDocumentResponse {
  success: boolean;
  message: string;
  data: DocumentInfo;
}

export interface ReindexResponse {
  success: boolean;
  message: string;
  data: DocumentInfo;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  data: ChatResponseData;
}

export const knowledgeBaseService = {
  /**
   * Upload a PDF, DOCX, or TXT document to the knowledge base.
   */
  async uploadDocument(file: File): Promise<UploadDocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<UploadDocumentResponse>(
      '/api/knowledge-base/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * List all uploaded documents for the authenticated company.
   */
  async listDocuments(): Promise<ListDocumentsResponse> {
    const response = await apiClient.get<ListDocumentsResponse>('/api/knowledge-base/documents');
    return response.data;
  },

  /**
   * Delete a document and its vector representations.
   */
  async deleteDocument(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/api/knowledge-base/documents/${id}`
    );
    return response.data;
  },

  /**
   * Reindex a failed or existing document.
   */
  async reindexDocument(id: string): Promise<ReindexResponse> {
    const response = await apiClient.post<ReindexResponse>(`/api/knowledge-base/reindex/${id}`);
    return response.data;
  },

  /**
   * Ask the AI a question based strictly on uploaded documents (RAG).
   */
  async askQuestion(question: string, conversationId?: string): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>('/api/knowledge-base/chat', {
      question,
      conversationId,
    });
    return response.data;
  },

  /**
   * Get all past conversations for this company.
   */
  async getConversations(): Promise<ListConversationsResponse> {
    const response = await apiClient.get<ListConversationsResponse>('/api/knowledge-base/conversations');
    return response.data;
  },

  /**
   * Get all messages for a specific conversation.
   */
  async getConversationMessages(id: string): Promise<ListMessagesResponse> {
    const response = await apiClient.get<ListMessagesResponse>(`/api/knowledge-base/conversations/${id}/messages`);
    return response.data;
  },
};
