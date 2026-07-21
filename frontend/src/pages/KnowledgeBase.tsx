import React, { useEffect, useState, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { knowledgeBaseService } from '../service/knowledgeBaseService';
import type { DocumentInfo, ChatResponseData } from '../service/knowledgeBaseService';
import {
  ArrowLeft,
  Database,
  UploadCloud,
  Loader2,
  Trash2,
  RefreshCw,
  Send,
  Sparkles,
  FileText,
  AlertTriangle,
  HelpCircle,
  CheckCircle,
  FileSpreadsheet,
  MessageSquare,
  CheckSquare
} from 'lucide-react';

export const KnowledgeBase: React.FC = () => {
  const { company } = useAuth();
  const { toast } = useToast();

  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatResponse, setChatResponse] = useState<ChatResponseData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = async (silent = false) => {
    if (!silent) setLoadingDocs(true);
    try {
      const response = await knowledgeBaseService.listDocuments();
      if (response.success && response.data) {
        setDocuments(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load documents:', err);
      toast.error('Failed to load documents.');
    } finally {
      if (!silent) setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (company) {
      fetchDocs();
    }
  }, [company]);

  // Polling hook: auto-updates document statuses when ingestion is running
  useEffect(() => {
    const hasProcessing = documents.some(
      (doc) => doc.processingStatus === 'PENDING' || doc.processingStatus === 'PROCESSING'
    );

    if (hasProcessing) {
      const interval = setInterval(() => {
        fetchDocs(true);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [documents]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMimeIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-rose-400" />;
    if (mimeType.includes('word') || mimeType.includes('msword')) return <FileSpreadsheet className="w-5 h-5 text-indigo-400" />;
    return <FileText className="w-5 h-5 text-slate-400" />;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only PDF, DOCX, and TXT files are allowed.');
      toast.error('Only PDF, DOCX, and TXT are supported.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File is too large. Max limit is 10MB.');
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const response = await knowledgeBaseService.uploadDocument(file);
      if (response.success) {
        toast.success(response.message || 'Document uploaded successfully.');
        fetchDocs(true);
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      const errMsg = err.response?.data?.message || 'Failed to upload document.';
      setUploadError(errMsg);
      toast.error(errMsg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document and its vector embeddings?')) return;

    try {
      const response = await knowledgeBaseService.deleteDocument(id);
      if (response.success) {
        toast.success(response.message || 'Document deleted successfully.');
        setDocuments(documents.filter((d) => d.id !== id));
      }
    } catch (err: any) {
      console.error('Delete document failed:', err);
      toast.error(err.response?.data?.message || 'Failed to delete document.');
    }
  };

  const handleReindexDoc = async (id: string) => {
    try {
      const response = await knowledgeBaseService.reindexDocument(id);
      if (response.success) {
        toast.success(response.message || 'Reindex triggered.');
        fetchDocs(true);
      }
    } catch (err: any) {
      console.error('Reindex failed:', err);
      toast.error(err.response?.data?.message || 'Failed to reindex document.');
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || question.trim().length === 0) return;

    setChatLoading(true);
    setChatError(null);
    setChatResponse(null);

    try {
      const response = await knowledgeBaseService.askQuestion(question);
      if (response.success && response.data) {
        setChatResponse(response.data);
      }
    } catch (err: any) {
      console.error('Chat failed:', err);
      const errMsg = err.response?.data?.message || 'Failed to generate answer.';
      setChatError(errMsg);
      toast.error(errMsg);
    } finally {
      setChatLoading(false);
    }
  };

  if (!company) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex-grow flex flex-col bg-[#0a0f1d] text-slate-100 relative overflow-hidden">
      {/* Background neon blobs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl -z-10 animate-pulse"></div>

      {/* Page Header */}
      <div className="px-8 py-5 border-b border-slate-800 bg-[#0c1325]/40 flex items-center justify-between shrink-0 select-none">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-500" />
            Knowledge Base
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Upload source documentation to seed the RAG vector space and test the response output.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-grow w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Documents Manager (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* File Upload Panel */}
          <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
            <h2 className="font-bold text-slate-100 text-lg mb-4 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-400" />
              Upload Source Document
            </h2>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed border-slate-800 hover:border-indigo-500/60 rounded-xl p-8 text-center cursor-pointer transition-all bg-slate-950/40 flex flex-col items-center justify-center gap-3 ${
                uploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.docx,.doc,.txt"
              />
              {uploading ? (
                <>
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                  <span className="text-sm font-semibold text-slate-300">Uploading & processing document...</span>
                  <span className="text-xs text-slate-500">Extracting text & creating embeddings</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-indigo-950/40 border border-indigo-900/50 rounded-xl flex items-center justify-center text-indigo-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-sm font-semibold text-slate-300">Click to browse files</span>
                    <span className="block text-xs text-slate-500">Supports PDF, DOCX, or TXT up to 10MB</span>
                  </div>
                </>
              )}
            </div>

            {uploadError && (
              <div className="mt-4 bg-red-950/40 border border-red-800/60 rounded-xl p-4 text-red-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Documents Directory List */}
          <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Documents Index
              </h2>
              <button
                onClick={() => fetchDocs()}
                disabled={loadingDocs}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                title="Refresh List"
              >
                <RefreshCw className={`w-4 h-4 ${loadingDocs ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingDocs && documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-xs">Loading indexes...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-850 rounded-xl">
                <Database className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                <h4 className="text-slate-400 font-semibold text-sm">No source documents uploaded</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Upload PDF, DOCX, or TXT documentation to seed the RAG vector space.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      <th className="py-3 px-4">Filename</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40 text-xs">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-900/20 group transition-colors">
                        <td className="py-3.5 px-4 max-w-[200px] sm:max-w-xs truncate">
                          <div className="flex items-center gap-2.5">
                            {getMimeIcon(doc.mimeType)}
                            <div>
                              <span className="font-semibold text-slate-200 block truncate" title={doc.originalName}>
                                {doc.originalName}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                ID: {doc.id.substring(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">
                          {formatFileSize(doc.fileSize)}
                        </td>
                        <td className="py-3.5 px-4">
                          {doc.processingStatus === 'COMPLETED' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 border border-emerald-900 text-emerald-400">
                              <CheckCircle className="w-3 h-3" />
                              Ready
                            </span>
                          )}
                          {doc.processingStatus === 'PROCESSING' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-950 border border-yellow-900 text-yellow-400">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Parsing
                            </span>
                          )}
                          {doc.processingStatus === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950 border border-blue-900 text-blue-400">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Queued
                            </span>
                          )}
                          {doc.processingStatus === 'FAILED' && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950 border border-rose-900 text-rose-400 cursor-help"
                              title={doc.error || 'Parsing failed.'}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {doc.processingStatus === 'FAILED' && (
                              <button
                                onClick={() => handleReindexDoc(doc.id)}
                                className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Re-index document"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Delete source index"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Chat Panel (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-fit">
          <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col w-full">
            <h2 className="font-bold text-slate-100 text-lg mb-6 flex items-center gap-2 border-b border-slate-850 pb-4">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              RAG AI Assistant
            </h2>

            {/* Chat Box Input */}
            <form onSubmit={handleAskQuestion} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Ask a question based on your documents
                </label>
                <div className="relative">
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What is the refund policy? / Who is the company point of contact?"
                    rows={3}
                    className="w-full pl-4 pr-12 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-xl text-slate-200 placeholder-slate-600 transition-all text-sm resize-none"
                    required
                    disabled={chatLoading}
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !question.trim()}
                    className="absolute bottom-3 right-3 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    {chatLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </form>

            {chatError && (
              <div className="mt-5 bg-red-950/40 border border-red-800/60 rounded-xl p-4 text-red-200 text-xs">
                {chatError}
              </div>
            )}

            {/* AI Response Output */}
            {chatResponse && (
              <div className="mt-6 space-y-5 animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-3 relative overflow-hidden">
                  {/* Decorative corner tag */}
                  <div className="absolute top-0 right-0 bg-indigo-500/10 text-indigo-400 text-[8px] font-bold tracking-widest px-2 py-0.5 border-b border-l border-slate-800 rounded-bl-lg uppercase">
                    AI Response
                  </div>
                  <div className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                    {chatResponse.answer}
                  </div>
                </div>

                {/* Sources Attribution */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Source Attribution
                  </span>
                  {chatResponse.sources.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic block">
                      No matching vector context was returned for this answer.
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {chatResponse.sources.map((src) => (
                        <div
                          key={src.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-[11px] rounded-lg text-slate-300"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate max-w-[150px] font-medium" title={src.originalName}>
                            {src.originalName}
                          </span>
                          <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/30 px-1 rounded">
                            {Math.round(src.score * 100)}% Match
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!chatResponse && !chatLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-600 gap-2 border border-dashed border-slate-850 rounded-xl mt-6">
                <HelpCircle className="w-8 h-8 text-slate-700" />
                <span className="text-xs font-semibold">Ready for RAG Query</span>
                <span className="text-[10px] text-slate-500 text-center px-4">
                  Ask a question to search vector index and generate an contextual response.
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
export default KnowledgeBase;
