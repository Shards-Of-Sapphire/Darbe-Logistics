import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Download, Receipt, User, Calendar, FileText, Send, Eye, Package, FileSpreadsheet } from 'lucide-react';
import { storage } from '../../lib/storage';
import { generateId, formatDate, formatDateTime, toDateTimeLocal, cn, numberToWords } from '../../lib/utils';
import { InvoiceItem, InvoiceEntry } from '../../types';
import { documentService } from '../../services/documentService';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface InvoiceGeneratorProps {
  initialData?: InvoiceEntry;
  onClear?: () => void;
}

export default function InvoiceGenerator({ initialData, onClear }: InvoiceGeneratorProps) {
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: generateId(), description: '', quantity: 0, unitWeight: 0, price: 0, total: 0 }
  ]);
  const [customerName, setCustomerName] = useState('');
  const [customerDestination, setCustomerDestination] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(toDateTimeLocal(new Date()));
  const [cgstRate, setCgstRate] = useState(9);
  const [sgstRate, setSgstRate] = useState(9);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${generateId()}`);
  const [showPreview, setShowPreview] = useState(true);
  const [availableNotes, setAvailableNotes] = useState<any[]>([]);
  const [allPossibleDestinations, setAllPossibleDestinations] = useState<string[]>([]);
  const [filterStartDate, setFilterStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toDateTimeLocal(d);
  });
  const [filterEndDate, setFilterEndDate] = useState(toDateTimeLocal(new Date()));
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load both consignor notes and acknowledgments
    const notes = storage.getConsignorNotes();
    const acks = storage.getAcknowledgments();
    
    // Combine for processing (normalizing fields if necessary)
    const combined = [
      ...notes.map(n => ({ ...n, type: 'Consignor Note', displayId: n.challanNo || n.id })),
      ...acks.map(a => ({ ...a, type: 'Acknowledgment', displayId: a.id }))
    ];
    
    // Filter by date
    const filtered = combined.filter(n => {
      if (!n.date) return false;
      const itemDate = new Date(n.date).getTime();
      const start = new Date(filterStartDate).getTime();
      const end = new Date(filterEndDate).getTime();
      return itemDate >= start && itemDate <= end;
    });

    setAvailableNotes(filtered);
  }, [filterStartDate, filterEndDate]);

  // When customer name changes, find all unique destinations
  useEffect(() => {
    const cName = customerName.toLowerCase();
    const destinations = new Set<string>();
    
    availableNotes.forEach(n => {
      const nName = (n.consigneeName || n.consignorName || '').toLowerCase();
      if (!customerName || nName.includes(cName)) {
        if (n.destination) destinations.add(n.destination);
        if (n.address) destinations.add(n.address);
        if (n.consigneeAddress) destinations.add(n.consigneeAddress);
      }
    });

    setAllPossibleDestinations(Array.from(destinations).sort());
  }, [customerName, availableNotes]);

  const handleAutoFetchNotes = () => {
    if (availableNotes.length === 0) {
      toast.error('No shipments found in this date range');
      return;
    }

    const filteredForCustomer = availableNotes.filter(n => {
      const nameMatch = customerName 
        ? (n.consigneeName || n.consignorName || '').toLowerCase().includes(customerName.toLowerCase())
        : true;
      
      const destMatch = (customerDestination && customerDestination !== 'Manual')
        ? (n.destination || n.address || n.consigneeAddress || '').toLowerCase().includes(customerDestination.toLowerCase())
        : true;

      return nameMatch && destMatch;
    });

    const newItems = filteredForCustomer.map(note => {
      const qty = Number(note.quantity || 1);
      const actualWt = Number(note.actualWeight || 0);
      const chargedWt = Number(note.chargedWeight || actualWt || 0);
      const amount = Number(note.amount || note.totalAmount || 0);
      
      const uwt = Number((note as any).unitWeight || (qty > 0 ? actualWt / qty : 0));
      const price = Number((note as any).unitPrice || (chargedWt > 0 ? amount / chargedWt : (qty > 0 ? amount / qty : amount)));
      
      return {
        id: generateId(),
        description: `${note.type}: ${note.displayId.slice(0,8)} | ${note.description || note.itemName || note.natureOfConsignment || 'Freight Services'}`,
        quantity: qty,
        unitWeight: uwt,
        priceByWeight: true,
        price: price,
        total: amount
      };
    });

    if (newItems.length > 0) {
      setItems(newItems);
      if (!customerName && filteredForCustomer.length > 0) {
        setCustomerName(filteredForCustomer[0].consigneeName || filteredForCustomer[0].consignorName || '');
      }
      toast.success(`Loaded ${newItems.length} items for ${customerName || 'customer'}`);
    } else {
      toast.error('No matching records found');
    }
  };

  const handleLoadFromNote = (noteId: string) => {
    const note = availableNotes.find(n => n.id === noteId);
    if (note) {
      setCustomerName(note.consigneeName || note.consignorName || '');
      setCustomerDestination(note.destination || note.address || note.consigneeAddress || '');
      
      const qty = Number(note.quantity || 1);
      const actualWt = Number(note.actualWeight || 0);
      const chargedWt = Number(note.chargedWeight || actualWt || 0);
      const amount = Number(note.amount || note.totalAmount || 0);
      
      const uwt = Number((note as any).unitWeight || (qty > 0 ? actualWt / qty : 0));
      const price = Number((note as any).unitPrice || (chargedWt > 0 ? amount / chargedWt : (qty > 0 ? amount / qty : amount)));

      setItems([{
        id: generateId(),
        description: `${note.type}: ${note.displayId.slice(0,8)} | ${note.description || note.itemName || note.natureOfConsignment || 'Freight Services'}`,
        quantity: qty,
        unitWeight: uwt,
        price: price,
        total: amount
      }]);
      toast.success('Loaded shipment data');
    }
  };

  useEffect(() => {
    if (initialData) {
      setInvoiceNumber(initialData.invoiceNumber || `INV-${generateId()}`);
      setInvoiceDate(initialData.date ? toDateTimeLocal(new Date(initialData.date)) : toDateTimeLocal(new Date()));
      setCustomerName(initialData.customerName || '');
      setItems(initialData.items || [{ id: generateId(), description: '', quantity: 0, unitWeight: 0, price: 0, total: 0 }]);
    }
  }, [initialData]);

  const addItem = () => {
    setItems([...items, { id: generateId(), description: '', quantity: 0, unitWeight: 0, price: 0, total: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // User wants: unit * weight = total price
        // In our case: quantity * unitWeight * price
        const qty = Number(updatedItem.quantity) || 0;
        const uwt = Number(updatedItem.unitWeight) || 0;
        const uprice = Number(updatedItem.price) || 0;
        
        // If unitWeight is 0, fallback to quantity * price
        if (uwt > 0) {
          updatedItem.total = qty * uwt * uprice;
        } else {
          updatedItem.total = qty * uprice;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const cgstAmount = (subtotal * cgstRate) / 100;
  const sgstAmount = (subtotal * sgstRate) / 100;
  const totalTax = cgstAmount + sgstAmount;
  const grandTotal = subtotal + totalTax;

  const handleSave = () => {
    if (!customerName) {
      toast.error('Customer name is required');
      return;
    }

    const currentUser = storage.getUser();
    const entry: InvoiceEntry = {
      id: initialData?.id || generateId(),
      invoiceNumber,
      date: invoiceDate,
      customerName,
      items,
      subtotal,
      tax: totalTax,
      total: grandTotal,
      createdBy: initialData?.createdBy || currentUser?.name || 'System'
    };

    if (initialData) {
      storage.updateInvoice(entry);
      toast.success('Invoice Updated Successfully');
      if (onClear) onClear();
    } else {
      storage.saveInvoice(entry);
      toast.success('Invoice Generated & Saved');
    }

    setItems([{ id: generateId(), description: '', quantity: 0, price: 0, total: 0 }]);
    setCustomerName('');
    setInvoiceNumber(`INV-${generateId()}`);
  };

  const downloadPDF = async () => {
    if (!invoiceRef.current) {
      toast.error('Invoice preview not found');
      return;
    }

    await documentService.downloadPDF(invoiceRef.current, {
      fileName: `Invoice_${invoiceNumber}.pdf`,
      onBeforeCapture: () => {
        if (!showPreview) setShowPreview(true);
      },
      onAfterCapture: () => {
        // We don't necessarily hide it back automatically if user wants to see it
        // but if we were strictly following the "wasHidden" logic, we can do it here.
      }
    });
  };

  const exportToExcel = () => {
    const data = items.map((item, index) => ({
      'S.No': index + 1,
      'Description': item.description,
      'Quantity': item.quantity,
      'Unit Price': item.price,
      'Total': item.total
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoice Items");
    
    const summaryData = [
      { Label: 'Customer', Value: customerName },
      { Label: 'Invoice No', Value: invoiceNumber },
      { Label: 'Date', Value: formatDate(new Date()) },
      { Label: 'Subtotal', Value: subtotal },
      { Label: 'CGST', Value: cgstAmount },
      { Label: 'SGST', Value: sgstAmount },
      { Label: 'Grand Total', Value: grandTotal }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    XLSX.writeFile(wb, `Invoice_${invoiceNumber}.xlsx`);
    toast.success('Excel exported successfully');
  };

  return (
    <div className="w-full pb-10 px-0 sm:px-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 bg-olive-100 text-olive-600 rounded-xl flex-shrink-0">
            <Receipt size={24} className="sm:w-7 sm:h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none">Invoice Generator</h2>
            <p className="text-[10px] sm:text-sm text-gray-500 italic mt-0.5">Create professional tax invoices with auto-calculations.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2 transition-all whitespace-nowrap"
          >
            <Eye size={16} />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            onClick={exportToExcel}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-olive-200 rounded-lg text-xs sm:text-sm font-semibold text-olive-600 hover:bg-olive-50 flex items-center justify-center gap-2 transition-all whitespace-nowrap"
          >
            <FileSpreadsheet size={16} />
            Excel
          </button>
          <button
            onClick={downloadPDF}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-900 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-black flex items-center justify-center gap-2 transition-all shadow-md whitespace-nowrap"
          >
            <Download size={16} />
            PDF
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 mb-10">
        {/* Editor Side */}
        <div className="flex-1 space-y-6">
          <div className="bg-olive-50 p-4 sm:p-5 rounded-2xl border border-olive-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-olive-800">1. Define Date Range</h3>
              <div className="flex gap-2">
                <button 
                  onClick={handleAutoFetchNotes}
                  className="px-3 py-1.5 bg-olive-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-olive-700 transition-all flex items-center gap-2"
                >
                  <Plus size={12} />
                  Fetch Matching Shipments
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-olive-600 uppercase mb-1">From Date</label>
                <input 
                  type="datetime-local"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full bg-white border border-olive-200 rounded-xl px-3 py-2 text-[11px] font-semibold text-olive-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-olive-600 uppercase mb-1">To Date</label>
                <input 
                  type="datetime-local"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full bg-white border border-olive-200 rounded-xl px-3 py-2 text-[11px] font-semibold text-olive-900 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-olive-100 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-olive-800">2. Filter by Destination & Customer</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-olive-600 uppercase mb-1.5 ml-1">Destination Location</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-olive-300 pointer-events-none" size={14} />
                    <select 
                      value={customerDestination}
                      onChange={(e) => setCustomerDestination(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-olive-200 rounded-xl text-xs font-bold text-olive-900 shadow-sm outline-none"
                    >
                      <option value="">All Destinations...</option>
                      {allPossibleDestinations.map((d, i) => (
                        <option key={i} value={d}>{d}</option>
                      ))}
                      <option value="Manual">Manual Entry...</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-olive-600 uppercase mb-1.5 ml-1">Customer / Bill To</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-olive-300 pointer-events-none" size={14} />
                    <input 
                      type="text" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-white border border-olive-200 rounded-xl text-xs font-bold text-olive-900 shadow-sm outline-none" 
                      placeholder="Search Customer Name..."
                    />
                  </div>
                </div>
              </div>

              {customerDestination === 'Manual' && (
                <input 
                  type="text"
                  placeholder="Enter custom destination..."
                  className="w-full px-4 py-2 bg-white border border-olive-200 rounded-xl text-xs font-bold text-olive-900 outline-none"
                  onChange={(e) => setCustomerDestination(e.target.value)}
                />
              )}

              <div className="pt-2 border-t border-olive-100">
                <label className="block text-[9px] font-bold text-olive-600 uppercase mb-1.5 ml-1">
                  Manual Select ({availableNotes.filter(n => {
                    const nameMatch = customerName ? (n.consigneeName || n.consignorName || '').toLowerCase().includes(customerName.toLowerCase()) : true;
                    const destMatch = (customerDestination && customerDestination !== 'Manual') ? (n.destination || n.address || n.consigneeAddress || '').toLowerCase().includes(customerDestination.toLowerCase()) : true;
                    return nameMatch && destMatch;
                  }).length} Matching Result)
                </label>
                <select 
                  onChange={(e) => handleLoadFromNote(e.target.value)}
                  className="w-full bg-white border border-olive-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-olive-900 shadow-sm outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>Pick from matching results...</option>
                  {availableNotes
                    .filter(n => {
                      const nameMatch = customerName ? (n.consigneeName || n.consignorName || '').toLowerCase().includes(customerName.toLowerCase()) : true;
                      const destMatch = (customerDestination && customerDestination !== 'Manual') ? (n.destination || n.address || n.consigneeAddress || '').toLowerCase().includes(customerDestination.toLowerCase()) : true;
                      return nameMatch && destMatch;
                    })
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(n => (
                    <option key={n.id} value={n.id}>
                      [{n.type.split(' ')[0][0]}] {n.displayId.slice(0,8)} - {n.consigneeName || n.consignorName} ({n.destination || n.address})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-100 space-y-4 sm:space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-olive-600 border-l-2 border-olive-600 pl-3">Invoice Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 pl-1">Invoice Number</label>
                <input 
                  type="text" 
                  value={invoiceNumber} 
                  readOnly 
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 sm:py-2 text-sm font-mono font-bold text-olive-600"
                />
              </div>
              <div className="relative">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 pl-1">Final Customer Name (Official)</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-1 focus:ring-olive-500 transition-all uppercase" 
                  placeholder="Official Billing Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 pl-1">CGST Rate (%)</label>
                <input 
                  type="number" 
                  value={cgstRate}
                  onChange={(e) => setCgstRate(Number(e.target.value))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 sm:py-2 text-sm font-mono focus:ring-1 focus:ring-olive-500" 
                  placeholder="9"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 pl-1">SGST Rate (%)</label>
                <input 
                  type="number" 
                  value={sgstRate}
                  onChange={(e) => setSgstRate(Number(e.target.value))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 sm:py-2 text-sm font-mono focus:ring-1 focus:ring-olive-500" 
                  placeholder="9"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Service Line Items</span>
              <button 
                onClick={addItem} 
                className="p-1 px-3 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span className="text-[10px] font-black uppercase">Add Item</span>
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="flex-1 w-full lg:w-auto">
                    <label className="sm:hidden text-[9px] font-bold text-gray-400 uppercase mb-1 block">Description</label>
                    <input 
                      type="text" 
                      placeholder="Service / Item Description"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold uppercase"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="w-16">
                      <label className="sm:hidden text-[9px] font-bold text-gray-400 uppercase mb-1 block">QTY</label>
                      <input 
                        type="number" 
                        className="w-full px-2 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono text-center"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="w-20">
                      <label className="sm:hidden text-[9px] font-bold text-gray-400 uppercase mb-1 block">UNIT WT</label>
                      <input 
                        type="number" 
                        className="w-full px-2 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono text-center"
                        value={item.unitWeight}
                        onChange={(e) => updateItem(item.id, 'unitWeight', Number(e.target.value))}
                      />
                    </div>
                    <div className="w-24">
                      <label className="sm:hidden text-[9px] font-bold text-gray-400 uppercase mb-1 block">RATE (₹)</label>
                      <input 
                        type="number" 
                        className="w-full px-2 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono text-right"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                      />
                    </div>
                    <div className="w-24">
                      <label className="sm:hidden text-[9px] font-bold text-gray-400 uppercase mb-1 block">TOTAL (₹)</label>
                      <input 
                        type="number" 
                        readOnly
                        className="w-full px-2 py-2 bg-gray-100 border border-gray-100 rounded-xl text-xs font-mono text-right text-olive-600 font-bold"
                        value={item.total}
                      />
                    </div>
                    <div className="flex items-center justify-center">
                      <button 
                        onClick={() => removeItem(item.id)} 
                        disabled={items.length <= 1}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-6 border-t border-gray-100 space-y-3">
                <div className="flex justify-between text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wider">
                  <span>Subtotal</span>
                  <span className="font-mono">₹ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm text-gray-400 px-2 py-1 bg-gray-50 rounded-lg">
                  <span className="italic">CGST ({cgstRate}%) + SGST ({sgstRate}%)</span>
                  <span className="font-mono">₹ {totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t-2 border-olive-50">
                  <span className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Grand Total</span>
                  <span className="text-2xl font-black text-olive-600 leading-none">₹ {grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleSave}
                className="group relative w-full py-4 bg-olive-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl mt-6 hover:bg-olive-700 transition-all shadow-xl shadow-olive-100 flex items-center justify-center gap-3 overflow-hidden active:scale-95"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                <Send size={18} className="relative z-10" />
                <span className="relative z-10">{initialData ? 'Update & Save Invoice' : 'Authorize & Save Invoice'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Preview Side */}
        <div className={cn("lg:w-[210mm] w-full flex-shrink-0", !showPreview && "hidden")}>
          <div className="sticky top-24 overflow-x-auto pb-4">
            <div className="min-w-[800px] lg:min-w-0">
              <div 
                id="pdf-invoice-content"
                ref={invoiceRef}
                className="bg-white rounded-none w-full text-gray-800 p-[20mm] flex flex-col"
                style={{ minHeight: '100%', height: 'auto', overflow: 'visible' }}
              >
              <div className="border-b-4 border-olive-600 pb-8 mb-10 flex justify-between items-end">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-olive-600 p-2.5 rounded-lg text-white">
                      <Package size={32} />
                    </div>
                    <div>
                      <h1 className="text-4xl font-black text-gray-900 leading-none tracking-tighter">DARBE<span className="text-olive-600">LOGISTICS</span></h1>
                      <p className="text-[10px] font-bold text-olive-600 uppercase tracking-[0.3em] mt-1 pl-1">Race Xpress Cargo Carrier</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed opacity-70">
                    Plot 12-A, Logistics Enclave, Industrial Phase II,<br />
                    Hyderabad, Telangana - 500001<br />
                    <span className="font-bold text-gray-400">GSTIN: 36AABC1234D1Z5</span>
                  </p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="bg-gray-100 px-6 py-2 rounded-t-xl border-x border-t border-gray-200">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Tax Invoice</span>
                  </div>
                  <div className="bg-white border border-gray-200 p-4 rounded-b-xl rounded-tl-xl shadow-sm min-w-[200px]">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">INVOICE NUMBER</span>
                      <span className="text-sm font-mono font-black text-olive-600">#{invoiceNumber}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-bold text-gray-400 uppercase mb-1">Invoice Date</span>
                      <div className="flex flex-wrap justify-end gap-1 mb-1.5">
                        {[
                          { label: '7d', days: 7 },
                          { label: '15d', days: 15 },
                          { label: '1m', days: 30 },
                          { label: '3m', days: 90 },
                          { label: '6m', days: 180 },
                          { label: '1yr', days: 365 }
                        ].map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              const d = new Date();
                              d.setDate(d.getDate() - preset.days);
                              setInvoiceDate(toDateTimeLocal(d));
                            }}
                            className="px-1 py-0.5 text-[8px] font-black bg-gray-50 text-gray-400 hover:bg-olive-50 hover:text-olive-600 rounded transition-colors"
                          >
                            {preset.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setInvoiceDate(toDateTimeLocal(new Date()))}
                          className="px-1 py-0.5 text-[8px] font-black bg-olive-50 text-olive-600 rounded transition-colors"
                        >
                          Now
                        </button>
                      </div>
                      <input 
                        type="datetime-local"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        className="text-[10px] font-bold text-gray-400 bg-transparent border-none outline-none focus:ring-0 text-right w-full p-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mb-12">
                <div>
                  <h3 className="text-[10px] font-black text-olive-600 uppercase mb-3 tracking-widest border-b border-olive-100 pb-1 inline-block">Billed To</h3>
                  <div className="space-y-1">
                    <p className="text-lg font-black text-gray-900 uppercase break-words">{customerName || 'Customer Name'}</p>
                    <p className="text-xs text-gray-400 font-medium">Verified Consignee / Account Holder</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-[10px] font-black text-olive-600 uppercase mb-2 tracking-widest">Transport</h3>
                    <p className="text-xs font-bold text-gray-700">Surface Express</p>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-olive-600 uppercase mb-2 tracking-widest">Payment</h3>
                    <p className="text-xs font-bold text-green-600">Post-Paid / Credit</p>
                  </div>
                </div>
              </div>

              <div className="mb-auto">
                <table className="w-full text-left">
                  <thead className="border-b-2 border-olive-900">
                    <tr className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                      <th className="py-4 px-2">Description</th>
                      <th className="py-4 px-2 text-center w-20">QTY</th>
                      <th className="py-4 px-2 text-center w-20">WT/U</th>
                      <th className="py-4 px-2 text-right w-24">Rate</th>
                      <th className="py-4 px-2 text-right w-32">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="group">
                        <td className="py-4 px-2 font-bold text-sm text-gray-800 uppercase tracking-tight">
                          {item.description || 'General Cargo Transport Service'}
                        </td>
                        <td className="py-4 px-2 text-center text-sm font-mono">{item.quantity}</td>
                        <td className="py-4 px-2 text-center text-sm font-mono">{item.unitWeight}</td>
                        <td className="py-4 px-2 text-right text-sm font-mono">₹ {item.price.toFixed(2)}</td>
                        <td className="py-4 px-2 text-right text-sm font-black text-olive-700">₹ {item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mb-16">
                <div className="w-64 space-y-2 border-t border-olive-100 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-bold">₹ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">CENTRAL GST ({cgstRate}%)</span>
                    <span className="font-bold">₹ {cgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">STATE GST ({sgstRate}%)</span>
                    <span className="font-bold">₹ {sgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg pt-2 border-t border-gray-100">
                    <span className="font-bold text-olive-600 uppercase text-xs mt-2 font-black">Grand Total</span>
                    <span className="font-black text-olive-600">₹ {grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-olive-100/50">
                    <p className="text-[8px] font-black uppercase text-olive-400 mb-0.5">Amount in Words</p>
                    <p className="text-[10px] font-bold text-olive-700 italic leading-tight uppercase">Rupees {numberToWords(grandTotal)} Only</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-10 mt-auto">
                <div>
                  <h4 className="text-[10px] font-bold uppercase text-olive-600 mb-2 underline decoration-olive-100 underline-offset-4">Terms & Conditions</h4>
                  <ul className="text-[9px] text-gray-500 space-y-1 list-disc list-inside">
                    <li>Payments are due within 15 days of invoice date.</li>
                    <li>Interest of 2% p.m. will be charged for delayed payments.</li>
                    <li>Disputes subject to local jurisdiction only.</li>
                    <li>This is a computer generated invoice.</li>
                  </ul>
                </div>
                <div className="text-right flex flex-col items-end justify-end">
                  <div className="border-b border-gray-300 w-48 mb-2"></div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Authorized Signatory</p>
                  <p className="text-xs font-bold text-olive-900 mt-1">For Darbe Logistics Ltd.</p>
                </div>
              </div>
              
              <div className="mt-20 pt-4 border-t border-gray-100 text-[8px] text-center text-gray-400 uppercase tracking-[0.2em]">
                Fast. Reliable. Darbe Logistics.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
