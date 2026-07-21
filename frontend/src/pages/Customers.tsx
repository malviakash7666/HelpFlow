import React, { useEffect, useState } from 'react';
import { customerService } from '../service/customerService';
import type { Customer } from '../service/customerService';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Loader2,
  Inbox
} from 'lucide-react';

export const Customers: React.FC = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await customerService.getCustomers();
      if (response.success && response.data) {
        setCustomers(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load customers:', err);
      toast.error('Failed to retrieve customer logs.');
    } finally {
      setLoading(true);
      // Wait a tiny bit for realistic transition
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    const timeDiff = Math.abs(new Date().getTime() - d.getTime());
    const diffMin = Math.ceil(timeDiff / (1000 * 60));
    
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="flex-grow p-8 bg-[#0a0f1d] min-h-screen text-slate-100 flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            Customers
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Manage contact profiles and view engagement analytics of users.
          </p>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-80">
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
            placeholder="Search customers..."
            className="w-full bg-[#0d1527] border border-slate-800 focus:border-blue-500 text-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none transition-all placeholder-slate-500"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#0c1325]/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm flex-grow flex flex-col justify-between">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="text-xs">Loading customer directory...</span>
            </div>
          ) : currentCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center p-6">
              <Inbox className="w-12 h-12 text-slate-700 mb-3" />
              <h4 className="text-slate-400 font-semibold text-sm">No customers found</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Any users interacting with the chatbot or registered manually will appear here automatically.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/10 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Phone</th>
                  <th className="py-4 px-6 text-center">Total Tickets</th>
                  <th className="py-4 px-6">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/30 text-xs">
                {currentCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-900/25 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                          {cust.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200 text-sm">{cust.name}</div>
                          {cust.location && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-600" />
                              {cust.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-350">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-600" />
                        {cust.email}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-350">
                      {cust.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-600" />
                          {cust.phone}
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">No phone record</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/40 border border-blue-900/50 text-blue-400">
                        {cust.totalTickets}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                        {formatDate(cust.lastActive)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination bar */}
        {!loading && filteredCustomers.length > itemsPerPage && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/10 flex items-center justify-between text-xs text-slate-400 mt-auto">
            <span>
              Showing <strong className="text-slate-200">{indexOfFirstItem + 1}</strong> to{' '}
              <strong className="text-slate-200">
                {Math.min(indexOfLastItem, filteredCustomers.length)}
              </strong>{' '}
              of <strong className="text-slate-200">{filteredCustomers.length}</strong> customers
            </span>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-[#0d1527] border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg cursor-pointer transition-all disabled:opacity-30 disabled:pointer-events-none"
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
  );
};
export default Customers;
