import React, { useState, useEffect } from 'react';
import { Database, Search, FileCheck, FileText, Receipt, ChevronRight, Hash, User, Calendar, MapPin, FileSpreadsheet, Edit2 } from 'lucide-react';
import { storage } from '../../lib/storage';
import { AcknowledgmentEntry, ConsignorNoteEntry, InvoiceEntry } from '../../types';
import { cn, formatDateTime } from '../../lib/utils';
import * as XLSX from 'xlsx';

type DataType = 'acknowledgments' | 'consignor_notes' | 'invoices';

export default function DatabaseView({ onEdit }: { onEdit?: (type: DataType, data: any) => void }) {
  const [activeType, setActiveType] = useState<DataType>('acknowledgments');
  const [search, setSearch] = useState('');
  
  const [data, setData] = useState<{
    acknowledgments: AcknowledgmentEntry[];
    consignor_notes: ConsignorNoteEntry[];
    invoices: InvoiceEntry[];
  }>({
    acknowledgments: [],
    consignor_notes: [],
    invoices: []
  });

  useEffect(() => {
    setData({
      acknowledgments: storage.getAcknowledgments(),
      consignor_notes: storage.getConsignorNotes(),
      invoices: storage.getInvoices()
    });
  }, []);

  const filteredData = data[activeType].filter(item => {
    const searchLower = search.toLowerCase();
    if (activeType === 'acknowledgments') {
      const entry = item as AcknowledgmentEntry;
      return entry.consigneeName.toLowerCase().includes(searchLower) || 
             entry.id.toLowerCase().includes(searchLower) ||
             (entry.destination?.toLowerCase().includes(searchLower) || false);
    } else if (activeType === 'consignor_notes') {
      const entry = item as ConsignorNoteEntry;
      return entry.consignorName.toLowerCase().includes(searchLower) || entry.id.toLowerCase().includes(searchLower) || entry.origin.toLowerCase().includes(searchLower);
    } else {
      const entry = item as InvoiceEntry;
      return entry.customerName.toLowerCase().includes(searchLower) || entry.invoiceNumber.toLowerCase().includes(searchLower);
    }
  });

  const exportToExcel = () => {
    const rawData = data[activeType];
    if (rawData.length === 0) {
      alert('No data to export');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(rawData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeType);
    XLSX.writeFile(wb, `${activeType}_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gray-100 text-gray-600 rounded-xl">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Database Records</h2>
            <p className="text-xs text-gray-500">Historical records of all generated logistics documents.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 pr-4 pl-3 py-2 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-100 hover:bg-green-700 transition-all"
          >
            <FileSpreadsheet size={18} />
            Export to Excel
          </button>
          
          <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by ID, Name or Route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-olive-500 transition-all w-full md:w-64"
          />
        </div>
      </div>
    </div>

      <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveType('acknowledgments')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
            activeType === 'acknowledgments' ? "bg-white text-olive-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <FileText size={14} /> Consignor Notes
        </button>
        <button
          onClick={() => setActiveType('consignor_notes')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
            activeType === 'consignor_notes' ? "bg-white text-olive-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <FileCheck size={14} /> Acknowledgments
        </button>
        <button
          onClick={() => setActiveType('invoices')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
            activeType === 'invoices' ? "bg-white text-olive-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Receipt size={14} /> Invoices
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <Search size={32} />
            </div>
            <p className="text-gray-400 font-medium">No records found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Identification</th>
                  <th className="px-6 py-4">Main Party</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Created By</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-olive-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold w-fit">
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                        SYNCED
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">
                          {activeType === 'invoices' ? (item as any).invoiceNumber : item.id}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase font-mono tracking-tighter">ID: {item.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-olive-100 flex items-center justify-center text-olive-600">
                          <User size={14} />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">
                          {activeType === 'invoices' ? (item as any).customerName : (activeType === 'acknowledgments' ? (item as any).consigneeName : (item as any).consignorName)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {activeType === 'acknowledgments' && (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                              <span className="font-bold">FROM:</span>
                              <span className="truncate max-w-[120px] font-medium text-gray-600">{(item as any).consignorName || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                              <span className="font-bold">TO:</span>
                              <span className="truncate max-w-[120px] font-medium text-gray-600">{(item as any).consigneeName}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-600 font-medium mt-1">
                              <MapPin size={10} className="text-olive-500" />
                              <span>{(item as any).destination || (item as any).address}</span>
                            </div>
                            <span className="text-[10px] text-gray-400">
                              {(item as any).address ? `Location: ${(item as any).address} • ` : ''}
                              {(item as any).quantity} Pcs • {((item as any).chargedWeight || (item as any).actualWeight || 0)} KG
                            </span>
                          </div>
                        )}
                        {activeType === 'consignor_notes' && (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                              <MapPin size={10} className="text-olive-500" />
                              <span>{(item as any).origin} → {(item as any).destination}</span>
                            </div>
                            <span className="text-[10px] text-gray-400">
                              {(item as any).items?.length || 0} Items • ₹ {(item as any).totalAmount?.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {activeType === 'invoices' && (
                          <span className="text-sm font-bold text-olive-600">₹ {(item as any).total.toFixed(2)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                        {(item as any).createdBy || 'System'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar size={12} />
                        {(() => {
                          const date = new Date(item.date);
                          return isNaN(date.getTime()) ? item.date : formatDateTime(date);
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {onEdit && (
                        <button 
                          onClick={() => onEdit(activeType, item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-olive-600 bg-olive-50 hover:bg-olive-100 rounded-lg border border-olive-100 transition-all active:scale-95"
                        >
                          <Edit2 size={14} />
                          <span>Edit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
