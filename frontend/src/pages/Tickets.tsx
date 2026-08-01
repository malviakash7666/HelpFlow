import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ticketService } from '../service/ticketService';
import type { TicketInfo, CreateTicketInput } from '../service/ticketService';
import { knowledgeBaseService } from '../service/knowledgeBaseService';
import type { ChatMessageInfo } from '../service/knowledgeBaseService';
import { employeeService } from '../service/employeeService';
import type { Employee } from '../service/employeeService';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  Paperclip,
  Send,
  Loader2,
  ArrowLeft,
  MessageSquare,
  FileText,
  Clock,
  ChevronDown,
  UserCheck,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Inbox
} from 'lucide-react';

export const Tickets: React.FC = () => {
  const { company } = useAuth();
  const { toast } = useToast();

  const [tickets, setTickets] = useState<TicketInfo[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessageInfo[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  
  // Loading states
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Manual Ticket Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [manualSubject, setManualSubject] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualPriority, setManualPriority] = useState<TicketInfo['priority']>('MEDIUM');
  const [manualAssignee, setManualAssignee] = useState('');

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [detailTab, setDetailTab] = useState<'conversation' | 'details'>('conversation');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Dynamic AI Suggestions state
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [generatingAi, setGeneratingAi] = useState(false);

  // Previous customer tickets state
  const [customerHistory, setCustomerHistory] = useState<TicketInfo[]>([]);

  const fetchTickets = async (silent = false) => {
    if (!silent) setLoadingTickets(true);
    try {
      const response = await ticketService.listTickets();
      if (response.success && response.data) {
        setTickets(response.data);
        
        // Refresh selected ticket details
        if (selectedTicket) {
          const updated = response.data.find(t => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (err: any) {
      console.error('Failed to load tickets:', err);
      toast.error('Failed to load tickets.');
    } finally {
      if (!silent) setLoadingTickets(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getEmployees();
      if (response.success && response.data) {
        setEmployees(response.data.filter((e) => e.isActive));
      }
    } catch (err: any) {
      console.error('Failed to load employees:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchEmployees();
  }, []);

  // Fetch messages and history for selected ticket
  useEffect(() => {
    if (!selectedTicket) {
      setMessages([]);
      setCustomerHistory([]);
      setAiSuggestion('');
      return;
    }

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const response = await knowledgeBaseService.getConversationMessages(selectedTicket.conversationId);
        if (response.success && response.data) {
          setMessages(response.data);
          
          // Generate AI suggestion based on the last visitor message
          const visitorMessages = response.data.filter(m => m.senderType === 'visitor');
          if (visitorMessages.length > 0) {
            generateSuggestion(visitorMessages[visitorMessages.length - 1].content);
          }
        }
      } catch (err: any) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();

    // Populate customer history
    if (selectedTicket.customer) {
      const history = tickets.filter(
        (t) => t.customerId === selectedTicket.customerId && t.id !== selectedTicket.id
      );
      setCustomerHistory(history);
    }
  }, [selectedTicket?.id, tickets.length]);

  const generateSuggestion = async (query: string) => {
    setGeneratingAi(true);
    try {
      // Simulate/mock AI suggestions processing matching company knowledge base
      setTimeout(() => {
        if (query.toLowerCase().includes('payment') || query.toLowerCase().includes('refund')) {
          setAiSuggestion(
            `This issue is related to payment. To resolve, check customer transaction details in payment dashboard. You can ask: "Hello, could you please provide your transaction reference ID so I can verify this with our gateway?"`
          );
        } else {
          setAiSuggestion(
            `Based on our company documents, this appears to be a general support inquiry. You can ask: "Hello, thank you for reaching out. Let me check our records for this request. Could you confirm your company workspace name?"`
          );
        }
        setGeneratingAi(false);
      }, 500);
    } catch (err) {
      setGeneratingAi(false);
    }
  };

  const handleCreateManualTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualEmail || !manualSubject || !manualDescription) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSubmittingManual(true);
    try {
      const payload: CreateTicketInput = {
        customerName: manualName,
        customerEmail: manualEmail,
        customerPhone: manualPhone || undefined,
        customerLocation: manualLocation || undefined,
        subject: manualSubject,
        description: manualDescription,
        priority: manualPriority,
        assignedEmployeeId: manualAssignee || undefined,
      };

      const response = await ticketService.createTicket(payload);
      if (response.success) {
        toast.success('Ticket created manually.');
        setIsModalOpen(false);
        // Reset states
        setManualName('');
        setManualEmail('');
        setManualPhone('');
        setManualLocation('');
        setManualSubject('');
        setManualDescription('');
        setManualPriority('MEDIUM');
        setManualAssignee('');
        fetchTickets();
      }
    } catch (err: any) {
      console.error('Failed to create ticket:', err);
      toast.error(err.response?.data?.message || 'Failed to create ticket.');
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleUpdateStatus = async (status: TicketInfo['status']) => {
    if (!selectedTicket) return;
    try {
      const response = await ticketService.updateStatus(selectedTicket.id, status);
      if (response.success) {
        toast.success(`Ticket status updated to ${status}.`);
        setShowStatusDropdown(false);
        fetchTickets(true);
      }
    } catch (err: any) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update ticket status.');
    }
  };

  const handleAssignTicket = async (empId: string) => {
    if (!selectedTicket) return;
    try {
      const response = await ticketService.assignTicket(selectedTicket.id, empId);
      if (response.success) {
        toast.success('Ticket assigned successfully.');
        fetchTickets(true);
      }
    } catch (err: any) {
      console.error('Failed to assign ticket:', err);
      toast.error('Failed to assign ticket.');
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      const response = await ticketService.replyTicket(selectedTicket.id, replyText);
      if (response.success) {
        setReplyText('');
        // Reload messages and refresh listing
        const responseMsgs = await knowledgeBaseService.getConversationMessages(selectedTicket.conversationId);
        if (responseMsgs.success && responseMsgs.data) {
          setMessages(responseMsgs.data);
        }
        fetchTickets(true);
      }
    } catch (err: any) {
      console.error('Failed to reply:', err);
      toast.error('Failed to send reply.');
    } finally {
      setSendingReply(false);
    }
  };

  // Helper formats
  const formatRelativeTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = new Date().getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 65 && mins >= 0) return `${Math.max(1, mins)} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-slate-900 border-slate-800 text-slate-400';
      case 'MEDIUM': return 'bg-blue-950/40 border-blue-900/50 text-blue-400';
      case 'HIGH': return 'bg-amber-950/40 border-amber-900/50 text-amber-400';
      case 'URGENT': return 'bg-red-950/40 border-red-900/50 text-red-400';
      default: return 'bg-slate-900 border-slate-850 text-slate-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-rose-950/40 border-rose-900/50 text-rose-400';
      case 'ASSIGNED': return 'bg-indigo-950/40 border-indigo-900/50 text-indigo-400';
      case 'IN_PROGRESS': return 'bg-amber-950/40 border-amber-900/50 text-amber-400';
      case 'RESOLVED': return 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400';
      case 'CLOSED': return 'bg-slate-900 border-slate-800 text-slate-550';
      default: return 'bg-slate-900 border-slate-850 text-slate-500';
    }
  };

  // Filter logic
  const filteredTickets = tickets.filter((t) => {
    const customerName = t.customer ? t.customer.name.toLowerCase() : 'anonymous visitor';
    const matchesSearch =
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="flex-grow bg-[#0a0f1d] min-h-screen text-slate-100 flex flex-col relative overflow-hidden">
      
      {/* 1. TICKETS LIST VIEW */}
      {!selectedTicket && (
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 flex-grow">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">All Tickets</h1>
              <p className="text-slate-400 text-xs mt-1">
                Monitor unresolved handoffs, update status priority tags, and route to specific staff members.
              </p>
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/10 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              New Ticket
            </button>
          </div>

          {/* Control Bar (Search, Status Filter, Priority Filter) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search tickets by ID, customer, subject..."
                className="w-full bg-[#0d1527] border border-slate-800 focus:border-blue-500 text-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none transition-all placeholder-slate-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-1/2 sm:w-auto bg-[#0d1527] border border-slate-800 text-slate-350 text-xs px-3 py-2.5 rounded-xl cursor-pointer outline-none focus:border-blue-500"
              >
                <option value="ALL">All Status</option>
                <option value="OPEN">Open</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-1/2 sm:w-auto bg-[#0d1527] border border-slate-800 text-slate-350 text-xs px-3 py-2.5 rounded-xl cursor-pointer outline-none focus:border-blue-500"
              >
                <option value="ALL">All Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-[#0c1325]/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm flex-grow flex flex-col justify-between shadow-xl">
            <div className="overflow-x-auto">
              {loadingTickets ? (
                <div className="flex flex-col items-center justify-center py-32 text-slate-500 gap-3">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <span className="text-xs">Loading support list...</span>
                </div>
              ) : currentTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center p-6">
                  <Inbox className="w-12 h-12 text-slate-700 mb-3" />
                  <h4 className="text-slate-400 font-semibold text-sm">No tickets found</h4>
                  <p className="text-xs text-slate-550 max-w-sm mt-1">
                    Try modifying search parameters or wait for automated chatbot handoffs to populate.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-850/80 bg-slate-900/10 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      <th className="py-4 px-6">Ticket ID</th>
                      <th className="py-4 px-6">Customer</th>
                      <th className="py-4 px-6">Issue</th>
                      <th className="py-4 px-6">Priority</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Assigned To</th>
                      <th className="py-4 px-6">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/30 text-xs text-slate-350">
                    {currentTickets.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className="hover:bg-slate-900/25 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-6 font-mono font-bold text-blue-500 text-[10.5px]">
                          #{t.id.substring(0, 5).toUpperCase()}
                        </td>
                        <td className="py-4 px-6">
                          {t.customer ? (
                            <div>
                              <div className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors text-sm">
                                {t.customer.name}
                              </div>
                              <div className="text-[10px] text-slate-500">{t.customer.email}</div>
                            </div>
                          ) : (
                            <span className="text-slate-600 italic">Anonymous Visitor</span>
                          )}
                        </td>
                        <td className="py-4 px-6 max-w-[220px] truncate font-medium text-slate-200" title={t.subject}>
                          {t.subject}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 border text-[9px] font-bold rounded-full ${getPriorityBadge(t.priority)}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 border text-[9px] font-bold rounded-full ${getStatusBadge(t.status)}`}>
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-300">
                          {t.assignedEmployee ? (
                            t.assignedEmployee.name
                          ) : (
                            <span className="text-slate-650 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-slate-500">
                          {formatRelativeTime(t.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination footer */}
            {!loadingTickets && filteredTickets.length > itemsPerPage && (
              <div className="p-4 border-t border-slate-800/80 bg-slate-900/10 flex items-center justify-between text-xs text-slate-400 mt-auto">
                <span>
                  Showing <strong className="text-slate-200">{indexOfFirstItem + 1}</strong> to{' '}
                  <strong className="text-slate-200">
                    {Math.min(indexOfLastItem, filteredTickets.length)}
                  </strong>{' '}
                  of <strong className="text-slate-200">{filteredTickets.length}</strong> tickets
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 bg-[#0d1527] border border-slate-800 hover:border-slate-700 text-slate-350 rounded-lg cursor-pointer transition-all disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          currentPage === page
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-[#0d1527] border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 bg-[#0d1527] border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg cursor-pointer transition-all disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. DETAILED TICKET VIEW (MULTIPANE LAYOUT) */}
      {selectedTicket && (
        <div className="flex flex-col h-screen overflow-hidden">
          {/* Header row */}
          <div className="px-6 py-4 border-b border-slate-800 bg-[#0c1325]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  fetchTickets();
                }}
                className="p-2 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-450 hover:text-white rounded-xl transition-all cursor-pointer"
                title="Back to tickets list"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-blue-500">
                  Ticket #{selectedTicket.id.substring(0, 8).toUpperCase()}
                </span>
                <span className={`text-[8.5px] px-2 py-0.5 border rounded-full capitalize font-semibold ${getPriorityBadge(selectedTicket.priority)}`}>
                  {selectedTicket.priority}
                </span>
                <span className={`text-[8.5px] px-2 py-0.5 border rounded-full capitalize font-semibold ${getStatusBadge(selectedTicket.status)}`}>
                  {selectedTicket.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-500 text-xs">
                Assigned Employee:
              </span>
              <select
                value={selectedTicket.assignedEmployeeId || ''}
                onChange={(e) => handleAssignTicket(e.target.value)}
                className="bg-[#0c1226] border border-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-xl outline-none cursor-pointer focus:border-blue-500"
              >
                <option value="">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Three Column Grid Workspace */}
          <div className="flex-grow flex overflow-hidden">
            
            {/* Column A: Left Info panel (metadata, status actions) */}
            <div className="w-80 border-r border-slate-800 bg-[#080d1a]/60 p-6 flex flex-col gap-6 overflow-y-auto shrink-0 select-none">
              
              {/* Customer Box */}
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Customer</h4>
                {selectedTicket.customer ? (
                  <div className="bg-[#0c1325]/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center font-bold text-sm uppercase">
                        {selectedTicket.customer.name.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200 text-sm leading-tight">
                          {selectedTicket.customer.name}
                        </div>
                        {selectedTicket.customer.location && (
                          <div className="text-[9.5px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {selectedTicket.customer.location}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-[11px] text-slate-400 pt-2 border-t border-slate-850/50">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate" title={selectedTicket.customer.email}>
                          {selectedTicket.customer.email}
                        </span>
                      </div>
                      {selectedTicket.customer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{selectedTicket.customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0c1325]/40 border border-slate-800 border-dashed rounded-2xl p-4 text-center text-slate-500 text-xs italic">
                    Anonymous Web Visitor
                  </div>
                )}
              </div>

              {/* Status update Actions */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Update Status</h4>
                {selectedTicket.status === 'RESOLVED' ? (
                  <button
                    onClick={() => handleUpdateStatus('IN_PROGRESS')}
                    className="w-full py-2.5 bg-[#0d1527] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer text-center"
                  >
                    Reopen Ticket
                  </button>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      className="w-full px-4 py-2.5 bg-[#0d1527] border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-between transition-all cursor-pointer"
                    >
                      <span>Update Status</span>
                      <ChevronDown className="w-4 h-4 text-slate-550" />
                    </button>
                    {showStatusDropdown && (
                      <div className="absolute top-full left-0 w-full mt-1.5 bg-[#0c1226] border border-slate-800 rounded-xl overflow-hidden shadow-2xl z-40 flex flex-col py-1">
                        {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
                          <button
                            key={st}
                            onClick={() => handleUpdateStatus(st as any)}
                            className="w-full px-4 py-2 hover:bg-slate-800 text-left text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer capitalize"
                          >
                            {st.replace('_', ' ').toLowerCase()}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Ticket info attributes */}
              <div className="space-y-4 text-xs text-slate-450 mt-auto border-t border-slate-800/80 pt-4">
                <div className="flex items-center justify-between">
                  <span>Created At:</span>
                  <span className="text-slate-300 font-semibold">{new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Channel:</span>
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    AI chatbot Handoff
                  </span>
                </div>
              </div>
            </div>

            {/* Column B: Center chat timeline */}
            <div className="flex-grow flex flex-col bg-[#080d1a]/20 overflow-hidden">
              {/* Tab options bar */}
              <div className="px-6 border-b border-slate-850 bg-[#0c1325]/10 flex items-center gap-6 shrink-0 select-none">
                <button
                  onClick={() => setDetailTab('conversation')}
                  className={`py-3.5 border-b-2 text-xs font-semibold tracking-wide cursor-pointer transition-all ${
                    detailTab === 'conversation'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-350'
                  }`}
                >
                  Conversation
                </button>
                <button
                  onClick={() => setDetailTab('details')}
                  className={`py-3.5 border-b-2 text-xs font-semibold tracking-wide cursor-pointer transition-all ${
                    detailTab === 'details'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-350'
                  }`}
                >
                  Details
                </button>
              </div>

              {/* Dynamic body */}
              {detailTab === 'conversation' ? (
                <>
                  {/* Chat messages */}
                  <div className="flex-grow overflow-y-auto p-6 space-y-4">
                    {loadingMessages ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                        <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
                        <span className="text-xs">Loading transcript history...</span>
                      </div>
                    ) : (
                      <>
                        {/* Handoff trigger banner */}
                        <div className="flex items-center justify-center py-2.5">
                          <span className="text-[9.5px] font-bold text-slate-500 bg-slate-900/60 border border-slate-850 px-3 py-1.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            Ticket escalated to human queue • {formatRelativeTime(selectedTicket.createdAt)}
                          </span>
                        </div>

                        {messages.map((msg) => {
                          const isVisitor = msg.senderType === 'visitor';
                          const isAgent = msg.senderType === 'agent';
                          const isBot = msg.senderType === 'bot';

                          return (
                            <div
                              key={msg.id}
                              className={`flex gap-3 max-w-[85%] ${
                                isAgent ? 'ml-auto flex-row-reverse' : 'mr-auto'
                              }`}
                            >
                              {/* Avatar */}
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
                                  isVisitor
                                    ? 'bg-[#0d1527] border-slate-800 text-blue-400'
                                    : isBot
                                    ? 'bg-blue-600/10 border-blue-500/20 text-blue-400'
                                    : 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400 font-bold'
                                }`}
                              >
                                {isVisitor ? (
                                  <User className="w-4 h-4" />
                                ) : isBot ? (
                                  <Sparkles className="w-4 h-4" />
                                ) : (
                                  <UserCheck className="w-4 h-4" />
                                )}
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <div
                                  className={`p-3.5 rounded-2xl text-xs leading-relaxed border ${
                                    isAgent
                                      ? 'bg-blue-600 border-blue-500 text-white rounded-tr-none shadow-md shadow-blue-600/10'
                                      : isBot
                                      ? 'bg-[#0d1527] border-slate-800 text-slate-350 rounded-tl-none relative'
                                      : 'bg-[#0c1325]/60 border-slate-850 text-slate-200 rounded-tl-none'
                                  }`}
                                >
                                  {isBot && (
                                    <span className="absolute top-0 right-0 transform translate-x-1.5 -translate-y-1.5 bg-blue-900 border border-blue-700 text-blue-300 font-bold text-[7.5px] px-1.5 py-0.5 rounded uppercase tracking-wider scale-90">
                                      AI Bot
                                    </span>
                                  )}
                                  <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                                <span className={`text-[8.5px] text-slate-500 ${isAgent ? 'text-right' : 'text-left'}`}>
                                  {isAgent
                                    ? 'Assigned Agent'
                                    : isBot
                                    ? 'OmniSupport AI'
                                    : selectedTicket.customer?.name || 'Customer'}{' '}
                                  • {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>

                  {/* Resolved Ticket banner overlay or input field */}
                  {selectedTicket.status === 'RESOLVED' ? (
                    <div className="p-4 bg-emerald-950/20 border-t border-emerald-900/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0">
                      <CheckCircle className="w-4 h-4" />
                      This ticket was marked as RESOLVED on {new Date(selectedTicket.updatedAt).toLocaleDateString()}
                    </div>
                  ) : (
                    <div className="flex flex-col border-t border-slate-800 bg-[#080d1a]/80 shrink-0">
                      {!selectedTicket.assignedEmployeeId && (
                        <div className="px-6 py-2 bg-blue-950/20 border-b border-slate-800/60 flex items-center justify-between text-[11px] text-blue-400">
                          <span>This ticket is currently unassigned. Assign it to yourself to start replying.</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (company?.userId) {
                                handleAssignTicket(company.userId);
                              } else {
                                toast.error("Could not resolve your user ID. Try using the dropdown or reloading.");
                              }
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer transition-all active:scale-95 text-[10px]"
                          >
                            Assign to Me
                          </button>
                        </div>
                      )}
                      <form onSubmit={handleSendReply} className="p-4 flex gap-2 w-full">
                        <button
                          type="button"
                          className="p-3 bg-[#0d1527] border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all cursor-pointer shrink-0"
                          title="Attach documentation reference"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                        
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={
                            selectedTicket.assignedEmployeeId
                              ? "Type your response..."
                              : "Select an assignee first to send a reply..."
                          }
                          disabled={!selectedTicket.assignedEmployeeId || sendingReply}
                          className="flex-grow bg-[#0c1226] border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-xs outline-none text-slate-250 placeholder-slate-650 transition-all disabled:opacity-50"
                        />
                        
                        <button
                          type="submit"
                          disabled={!selectedTicket.assignedEmployeeId || !replyText.trim() || sendingReply}
                          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 shrink-0 animate-none"
                        >
                          {sendingReply ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Send
                        </button>
                      </form>
                    </div>
                  )}
                </>
              ) : (
                /* Details panel */
                <div className="flex-grow overflow-y-auto p-6 space-y-6 select-none">
                  <div className="bg-[#0c1325]/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-white">Escalated Handoff Query</h3>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedTicket.description}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Column C: Right pane (AI Suggestions & History) */}
            <div className="w-80 border-l border-slate-800 bg-[#080d1a]/60 p-6 flex flex-col gap-6 overflow-y-auto shrink-0 select-none">
              
              {/* AI suggestions box */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">AI Suggestions</h4>
                  <span className="flex items-center gap-1 text-[8.5px] font-bold text-blue-400 bg-blue-950/40 border border-blue-900/40 px-1.5 py-0.5 rounded">
                    <Sparkles className="w-3 h-3" />
                    Dynamic RAG
                  </span>
                </div>

                <div className="bg-[#0c1325]/80 border border-slate-800 rounded-2xl p-4 space-y-4 relative overflow-hidden">
                  {generatingAi ? (
                    <div className="flex flex-col items-center justify-center py-6 text-slate-500 gap-2">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      <span className="text-[10px]">Analyzing knowledge base...</span>
                    </div>
                  ) : aiSuggestion ? (
                    <>
                      <p className="text-[11.5px] text-slate-300 leading-relaxed">
                        {aiSuggestion}
                      </p>
                      <button
                        onClick={() => {
                          const advicePattern = /"([^"]+)"/;
                          const match = aiSuggestion.match(advicePattern);
                          if (match) {
                            setReplyText(match[1]);
                          } else {
                            // Trim helper text or use whole block
                            setReplyText(aiSuggestion);
                          }
                          toast.success('Suggestion copied to reply input.');
                        }}
                        className="w-full py-2 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 text-[10.5px] font-semibold rounded-xl transition-all cursor-pointer text-center"
                      >
                        Use as Reply
                      </button>
                    </>
                  ) : (
                    <p className="text-[10.5px] text-slate-600 italic text-center py-4">
                      No query detected to suggest response.
                    </p>
                  )}
                </div>
              </div>

              {/* Previous Tickets History */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Previous Tickets</h4>
                  <span className="text-[9px] text-slate-600">Total: {customerHistory.length}</span>
                </div>

                {customerHistory.length === 0 ? (
                  <p className="text-[10.5px] text-slate-600 italic">No previous tickets for this customer.</p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {customerHistory.map((hist) => (
                      <button
                        key={hist.id}
                        onClick={() => setSelectedTicket(hist)}
                        className="w-full text-left p-3.5 bg-[#0c1325]/45 hover:bg-slate-900 border border-slate-800/80 rounded-xl transition-all flex flex-col gap-1.5 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[10px] text-blue-500">
                            #{hist.id.substring(0, 5).toUpperCase()}
                          </span>
                          <span className={`text-[8.5px] px-1.5 py-0.2 border rounded-full font-semibold capitalize scale-90 ${getStatusBadge(hist.status)}`}>
                            {hist.status.toLowerCase()}
                          </span>
                        </div>
                        <span className="text-slate-200 font-semibold text-[11px] truncate block" title={hist.subject}>
                          {hist.subject}
                        </span>
                        <span className="text-[9.5px] text-slate-550 block">
                          {new Date(hist.createdAt).toLocaleDateString()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 3. CREATE MANUAL TICKET MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
          <div className="bg-[#0c1325] border border-slate-800 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/10">
              <h2 className="font-bold text-white text-base">Create New Ticket</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateManualTicket} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Enter customer name"
                    className="bg-[#080d1a] border border-slate-800 focus:border-blue-500 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none transition-all"
                    required
                  />
                </div>

                {/* Customer Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Customer Email *
                  </label>
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="Enter customer email"
                    className="bg-[#080d1a] border border-slate-800 focus:border-blue-500 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none transition-all"
                    required
                  />
                </div>

                {/* Customer Phone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Customer Phone
                  </label>
                  <input
                    type="text"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="bg-[#080d1a] border border-slate-800 focus:border-blue-500 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none transition-all"
                  />
                </div>

                {/* Customer Location */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Customer Location
                  </label>
                  <input
                    type="text"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    placeholder="e.g. Mumbai, India"
                    className="bg-[#080d1a] border border-slate-800 focus:border-blue-500 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none transition-all"
                  />
                </div>

                {/* Subject */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={manualSubject}
                    onChange={(e) => setManualSubject(e.target.value)}
                    placeholder="Enter ticket subject"
                    className="bg-[#080d1a] border border-slate-800 focus:border-blue-500 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none transition-all"
                    required
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Description *
                  </label>
                  <textarea
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    placeholder="Describe the issue..."
                    rows={4}
                    className="bg-[#080d1a] border border-slate-800 focus:border-blue-500 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none transition-all resize-none"
                    required
                  />
                </div>

                {/* Priority */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Priority *
                  </label>
                  <select
                    value={manualPriority}
                    onChange={(e) => setManualPriority(e.target.value as any)}
                    className="bg-[#080d1a] border border-slate-800 text-slate-300 text-xs px-3.5 py-2.5 rounded-xl outline-none cursor-pointer focus:border-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                {/* Assignee */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Assign To
                  </label>
                  <select
                    value={manualAssignee}
                    onChange={(e) => setManualAssignee(e.target.value)}
                    className="bg-[#080d1a] border border-slate-800 text-slate-300 text-xs px-3.5 py-2.5 rounded-xl outline-none cursor-pointer focus:border-blue-500"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:border-slate-750 hover:bg-slate-900 text-slate-350 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingManual}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-600/10 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {submittingManual ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Ticket'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default Tickets;
