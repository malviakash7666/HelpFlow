import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { knowledgeBaseService } from '../service/knowledgeBaseService';
import type { ConversationInfo, ChatMessageInfo } from '../service/knowledgeBaseService';
import {
  ArrowLeft,
  Database,
  Loader2,
  MessageSquare,
  User,
  Cpu,
  Inbox,
  LogOut,
  Calendar,
  CheckCircle,
  CheckSquare
} from 'lucide-react';

export const Conversations: React.FC = () => {
  const { company, logout } = useAuth();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageInfo[]>([]);
  
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Redirect if not authenticated
  if (!company) {
    return <Navigate to="/" replace />;
  }

  // Load conversations
  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const response = await knowledgeBaseService.getConversations();
      if (response.success && response.data) {
        setConversations(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
      toast.error('Failed to retrieve conversation logs.');
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const response = await knowledgeBaseService.getConversationMessages(selectedId);
        if (response.success && response.data) {
          setMessages(response.data);
        }
      } catch (err: any) {
        console.error('Failed to load messages:', err);
        toast.error('Failed to retrieve messages for this conversation.');
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedId]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getShortId = (id: string) => {
    return id.substring(0, 8);
  };

  return (
    <div className="flex-grow flex flex-col h-screen overflow-hidden bg-[#0a0f1d] text-slate-100">
      {/* Page Header */}
      <div className="px-6 py-4.5 border-b border-slate-800 bg-[#0c1325]/40 flex items-center justify-between shrink-0 select-none">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            Chat Transcript Audit
          </h1>
          <p className="text-slate-500 text-[10px] mt-0.5">
            Audit conversational sessions between customer visitors and the private RAG AI bot.
          </p>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-grow flex overflow-hidden p-6 gap-6">
        
        {/* Left Panel: Conversations List */}
        <div className="w-1/3 flex flex-col bg-slate-900/60 border border-slate-850 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h2 className="font-bold text-slate-200 text-sm">Conversation Log</h2>
            </div>
            <span className="text-[10px] bg-indigo-950 border border-indigo-900 text-indigo-400 font-bold px-2 py-0.5 rounded-full">
              {conversations.length} Active
            </span>
          </div>

          <div className="flex-grow overflow-y-auto divide-y divide-slate-850/40">
            {loadingConversations ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                <span className="text-xs">Loading logs...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Inbox className="w-8 h-8 text-slate-700 mb-2" />
                <h4 className="text-slate-400 font-semibold text-xs">No conversations logged</h4>
                <p className="text-[10px] text-slate-500 max-w-xs mt-1">
                  Once users interact with your integrated widget, conversation histories will appear here.
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full text-left p-4 transition-all flex flex-col gap-2 hover:bg-slate-900/40 relative cursor-pointer ${
                    selectedId === conv.id
                      ? 'bg-indigo-950/20 border-l-2 border-indigo-500'
                      : 'border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">
                      Session ID: {getShortId(conv.id)}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400 capitalize">
                      {conv.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(conv.createdAt)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Chat Transcript */}
        <div className="w-2/3 flex flex-col bg-slate-900/60 border border-slate-850 rounded-2xl overflow-hidden backdrop-blur-sm">
          {selectedId ? (
            <>
              {/* Active Conversation Topbar */}
              <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-950/40 border border-indigo-800/40 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200 text-xs leading-none">
                      Conversation Session
                    </h3>
                    <span className="text-[10px] text-slate-500">ID: {selectedId}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950 border border-emerald-800 text-emerald-400">
                    <CheckCircle className="w-2.5 h-2.5" />
                    Secure
                  </span>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-grow overflow-y-auto p-6 space-y-4">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    <span className="text-xs">Loading transcript...</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isVisitor = msg.senderType === 'visitor';
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-[85%] ${
                          isVisitor ? 'ml-auto flex-row-reverse' : 'mr-auto'
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border shadow-md ${
                            isVisitor
                              ? 'bg-slate-900 border-slate-800 text-indigo-400'
                              : 'bg-indigo-950/40 border-indigo-900/40 text-emerald-400'
                          }`}
                        >
                          {isVisitor ? (
                            <User className="w-3.5 h-3.5" />
                          ) : (
                            <Cpu className="w-3.5 h-3.5" />
                          )}
                        </div>

                        {/* Content bubble */}
                        <div className="flex flex-col gap-1">
                          <div
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed border ${
                              isVisitor
                                ? 'bg-slate-900/80 border-slate-800 text-slate-200 rounded-tr-none'
                                : 'bg-indigo-950/10 border-indigo-900/30 text-slate-300 rounded-tl-none shadow-lg shadow-indigo-950/5'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <span
                            className={`text-[9px] text-slate-500 ${
                              isVisitor ? 'text-right' : 'text-left'
                            }`}
                          >
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            // No conversation selected empty state
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
              <Inbox className="w-12 h-12 text-slate-850 mb-3" />
              <h3 className="text-slate-400 font-bold text-sm">Select a Conversation</h3>
              <p className="text-xs text-slate-600 max-w-sm mt-1">
                Choose a session from the list on the left to view the complete chat history and RAG bot response audit trail.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
