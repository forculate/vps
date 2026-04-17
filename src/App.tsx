import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit, Trash2, RotateCw, History, X, Save, 
  Search, Calendar, Server, DollarSign, ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { format, differenceInDays, parseISO, addMonths } from 'date-fns';

type IPRecord = {
  id: string;
  groupId: string; // To link renewals together
  name: string;
  startDate: string;
  endDate: string;
  ips: string;
  username: string;
  sale: number;
  expense: number;
  provider: string;
  status: 'Active' | 'Archived';
  createdAt: number;
};

export default function App() {
  const [records, setRecords] = useState<IPRecord[]>(() => {
    const saved = localStorage.getItem('ipRecords');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('ipRecords', JSON.stringify(records));
  }, [records]);

  const [search, setSearch] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [currentRecord, setCurrentRecord] = useState<IPRecord | null>(null);
  
  const activeRecords = useMemo(() => {
    return records
      .filter((r) => r.status === 'Active')
      .filter((r) => 
        r.name.toLowerCase().includes(search.toLowerCase()) || 
        r.ips.includes(search) ||
        r.username.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [records, search]);

  const deleteRecord = (id: string, groupId: string) => {
    if (window.confirm('Are you sure you want to delete this record? This will also delete its history if any.')) {
      setRecords((prev) => prev.filter((r) => r.groupId !== groupId));
    }
  };

  const getProfit = (sale: number, expense: number) => sale - expense;

  const getRemainingDays = (endDate: string) => {
    try {
      const remaining = differenceInDays(parseISO(endDate), new Date());
      return remaining;
    } catch {
      return 0;
    }
  };

  const renderDaysBadge = (days: number) => {
    if (days < 0) return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold">Expired</span>;
    if (days <= 15) return <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-md text-xs font-semibold">{days} Days</span>;
    return <span className="px-2 py-1 bg-green-100 text-emerald-700 rounded-md text-xs font-semibold">{days} Days</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            IP Manager Pro
          </h1>
        </div>
        <button
          onClick={() => {
            setCurrentRecord(null);
            setIsAddModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors border border-blue-600"
        >
          <Plus className="w-4 h-4" />
          Add New Client
        </button>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto flex flex-col h-full gap-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider mb-1">Total Active IPs</div>
            <div className="text-2xl font-bold text-gray-900">{activeRecords.length}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider mb-1">Monthly Sales</div>
            <div className="text-2xl font-bold text-gray-900">
              ${activeRecords.reduce((acc, curr) => acc + Number(curr.sale), 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider mb-1">Monthly Expenses</div>
            <div className="text-2xl font-bold text-gray-900">
              ${activeRecords.reduce((acc, curr) => acc + Number(curr.expense), 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider mb-1">Estimated Profit</div>
            <div className="text-2xl font-bold text-emerald-500">
              +${activeRecords.reduce((acc, curr) => acc + getProfit(curr.sale, curr.expense), 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200 w-fit">
              <button className="px-4 py-1.5 bg-white text-gray-900 shadow-[0_1px_3px_rgba(0,0,0,0.1)] rounded-md text-sm font-medium border border-gray-200">Current Month</button>
              <button disabled className="px-4 py-1.5 text-gray-500 text-sm font-medium">Archive / Old Data</button>
            </div>
            <input
              type="text"
              placeholder="Search IP or Username..."
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-[300px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead className="bg-[#f9fafb] border-b border-gray-200 text-gray-500 font-semibold">
                <tr>
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold">IPs</th>
                  <th className="py-3 px-4 font-semibold">Username</th>
                  <th className="py-3 px-4 font-semibold">Provider</th>
                  <th className="py-3 px-4 font-semibold">Start Date</th>
                  <th className="py-3 px-4 font-semibold">End Date</th>
                  <th className="py-3 px-4 font-semibold">Remaining</th>
                  <th className="py-3 px-4 font-semibold text-right">Sale</th>
                  <th className="py-3 px-4 font-semibold text-right">Expense</th>
                  <th className="py-3 px-4 font-semibold text-right">Profit</th>
                  <th className="py-3 px-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeRecords.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-gray-500">
                      No matching records found. Add a new entry to get started.
                    </td>
                  </tr>
                ) : (
                  activeRecords.map((record) => {
                    const days = getRemainingDays(record.endDate);
                    const profit = getProfit(record.sale, record.expense);
                    return (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-900 border-b border-gray-100 align-middle">{record.name}</td>
                        <td className="py-3 px-4 font-mono text-[13px] text-gray-700 border-b border-gray-100 align-middle">{record.ips}</td>
                        <td className="py-3 px-4 text-gray-700 border-b border-gray-100 align-middle">{record.username}</td>
                        <td className="py-3 px-4 border-b border-gray-100 align-middle">
                          <span className="text-gray-600">
                            {record.provider}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 border-b border-gray-100 align-middle">{format(parseISO(record.startDate), 'dd MMM yyyy')}</td>
                        <td className="py-3 px-4 text-gray-600 border-b border-gray-100 align-middle">{format(parseISO(record.endDate), 'dd MMM yyyy')}</td>
                        <td className="py-3 px-4 border-b border-gray-100 align-middle">{renderDaysBadge(days)}</td>
                        <td className="py-3 px-4 text-right text-gray-900 border-b border-gray-100 align-middle">${Number(record.sale).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right text-gray-900 border-b border-gray-100 align-middle">${Number(record.expense).toFixed(2)}</td>
                        <td className={`py-3 px-4 text-right font-bold border-b border-gray-100 align-middle ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {profit >= 0 ? '+' : '-'}${Math.abs(profit).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 flex justify-center gap-1.5 border-b border-gray-100 align-middle">
                          <button
                            onClick={() => {
                              setCurrentRecord(record);
                              setIsRenewModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 transition"
                          >
                            Renew
                          </button>
                          <button
                            onClick={() => {
                              setCurrentRecord(record);
                              setIsEditModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setCurrentRecord(record);
                              setIsHistoryModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 transition"
                          >
                            History
                          </button>
                          <button
                            onClick={() => deleteRecord(record.id, record.groupId)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-gray-200 bg-white text-red-500 hover:bg-red-50 transition"
                          >
                            Del
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Table Footer / Summary */}
        {activeRecords.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-wrap justify-end gap-12 sm:gap-16">
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider mb-1">Page Total Sales</div>
              <div className="text-xl font-bold text-gray-900">
                ${activeRecords.reduce((acc, curr) => acc + Number(curr.sale), 0).toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider mb-1">Page Total Expense</div>
              <div className="text-xl font-bold text-gray-900">
                ${activeRecords.reduce((acc, curr) => acc + Number(curr.expense), 0).toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider mb-1">Net Page Profit</div>
              <div className="text-xl font-bold text-emerald-500">
                +${activeRecords.reduce((acc, curr) => acc + getProfit(curr.sale, curr.expense), 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add / Edit Form Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <FormModal
          record={currentRecord}
          isEdit={isEditModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            setCurrentRecord(null);
          }}
          onSave={(data) => {
            if (isEditModalOpen && currentRecord) {
              setRecords(records.map(r => r.id === currentRecord.id ? { ...r, ...data } : r));
            } else {
              const newRecord: IPRecord = {
                ...data,
                id: crypto.randomUUID(),
                groupId: crypto.randomUUID(),
                status: 'Active',
                createdAt: Date.now(),
              };
              setRecords([newRecord, ...records]);
            }
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
          }}
        />
      )}

      {/* Renew Modal */}
      {isRenewModalOpen && currentRecord && (
        <RenewModal
          record={currentRecord}
          onClose={() => {
            setIsRenewModalOpen(false);
            setCurrentRecord(null);
          }}
          onRenew={(newData) => {
            // Archive current record
            const archivedRecord = { ...currentRecord, status: 'Archived' as const };
            
            // Create new active record
            const newActiveRecord: IPRecord = {
              ...currentRecord,
              ...newData,
              id: crypto.randomUUID(),
              status: 'Active',
              createdAt: Date.now(),
            };

            setRecords(prev => prev.map(r => r.id === currentRecord.id ? archivedRecord : r).concat(newActiveRecord));
            setIsRenewModalOpen(false);
          }}
        />
      )}

      {/* History Modal */}
      {isHistoryModalOpen && currentRecord && (
        <HistoryModal
          records={records.filter(r => r.groupId === currentRecord.groupId).sort((a,b) => b.createdAt - a.createdAt)}
          onClose={() => {
            setIsHistoryModalOpen(false);
            setCurrentRecord(null);
          }}
        />
      )}
    </div>
  );
}

function FormModal({ record, isEdit, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: record?.name || '',
    ips: record?.ips || '',
    username: record?.username || '',
    provider: record?.provider || '',
    startDate: record?.startDate || format(new Date(), 'yyyy-MM-dd'),
    endDate: record?.endDate || format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    sale: record?.sale || 0,
    expense: record?.expense || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Entry' : 'Add New Client'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1">Name / Client</label>
              <input required type="text" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1">IP Addresses</label>
              <input required type="text" placeholder="192.168.1.1, etc." className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                value={formData.ips} onChange={e => setFormData({...formData, ips: e.target.value})} />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1">Username</label>
              <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1">Provider</label>
              <input required type="text" placeholder="DigitalOcean, Hetzner..." className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value})} />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1">Start Date</label>
              <input required type="date" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1">End Date</label>
              <input required type="date" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1">Sale Amount ($)</label>
              <input required type="number" step="0.01" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={formData.sale} onChange={e => setFormData({...formData, sale: parseFloat(e.target.value) || 0})} />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1">Expense Amount ($)</label>
              <input required type="number" step="0.01" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={formData.expense} onChange={e => setFormData({...formData, expense: parseFloat(e.target.value) || 0})} />
            </div>
          </div>
          <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2 text-gray-700 font-semibold text-sm hover:bg-gray-100 rounded-md transition-colors border border-transparent">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-md transition-colors flex items-center gap-2 shadow-sm border border-blue-600">
              {isEdit ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RenewModal({ record, onClose, onRenew }: any) {
  // Attempt to parse old end date and add 1 month for new default end date
  let defaultNewStart = record.endDate;
  let defaultNewEnd = '';
  try {
    const d = parseISO(record.endDate);
    defaultNewEnd = format(addMonths(d, 1), 'yyyy-MM-dd');
  } catch {
    defaultNewEnd = format(addMonths(new Date(), 1), 'yyyy-MM-dd');
  }

  const [formData, setFormData] = useState({
    startDate: defaultNewStart,
    endDate: defaultNewEnd,
    sale: record.sale,
    expense: record.expense,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRenew(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <RotateCw className="w-5 h-5 text-blue-600" />
            Renew IP Allocation
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="bg-blue-50/50 px-6 py-4 text-sm text-blue-800 border-b border-blue-100">
          <p>Renewing <strong>{record.name}</strong> for IP(s) <strong className="font-mono">{record.ips}</strong>.</p>
          <p className="mt-1 text-blue-600 opacity-80">This will archive the current record to history and start a new active period.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">New Start Date</label>
                <input required type="date" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 mt-6" />
              <div className="flex-1">
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">New End Date</label>
                <input required type="date" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex-1">
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">Renewal Sale ($)</label>
                <input required type="number" step="0.01" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.sale} onChange={e => setFormData({...formData, sale: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="flex-1">
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">Renewal Expense ($)</label>
                <input required type="number" step="0.01" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.expense} onChange={e => setFormData({...formData, expense: parseFloat(e.target.value) || 0})} />
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2 text-gray-700 font-semibold text-sm hover:bg-gray-100 rounded-md transition-colors border border-transparent">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-md transition-colors flex items-center gap-2 shadow-sm border border-blue-600">
              <RotateCw className="w-4 h-4" />
              Confirm Renewal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HistoryModal({ records, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white flex-none">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-500" />
              Billing History
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {records.length > 0 ? `Client: ${records[0].name} | IP: ${records[0].ips}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="relative border-l-2 border-gray-200 pl-6 space-y-6">
            {records.map((r: any, idx: number) => {
              const isActive = r.status === 'Active';
              return (
                <div key={r.id} className="relative">
                  <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-white ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                  <div className={`bg-white border rounded-xl p-4 shadow-sm ${isActive ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-800">{format(parseISO(r.startDate), 'dd MMM yyyy')} to {format(parseISO(r.endDate), 'dd MMM yyyy')}</span>
                        {isActive && <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-md">Current Active</span>}
                        {!isActive && <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-md">Archived</span>}
                      </div>
                      <div className="text-sm text-gray-500">
                        Added on {format(new Date(r.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="block text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1">Sale</span>
                        <span className="font-semibold text-gray-900">${Number(r.sale).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1">Expense</span>
                        <span className="font-semibold text-gray-900">${Number(r.expense).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1">Profit</span>
                        <span className="font-bold text-emerald-500">${(r.sale - r.expense).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1">Provider</span>
                        <span className="text-gray-800 font-medium">{r.provider}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

