import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Save, FileText, Package, MapPin, Navigation, IndianRupee, Download, Eye, CheckCircle, Calendar } from 'lucide-react';
import { storage } from '../../lib/storage';
import { generateId, formatDate, formatDateTime, toDateTimeLocal, cn, numberToWords } from '../../lib/utils';
import { ConsignorNoteItem, ConsignorNoteEntry } from '../../types';
import { documentService } from '../../services/documentService';
import toast from 'react-hot-toast';

interface ConsignorNoteFormProps {
  initialData?: ConsignorNoteEntry;
  onClear?: () => void;
}

export default function ConsignorNoteForm({ initialData, onClear }: ConsignorNoteFormProps) {
  const [items, setItems] = useState<ConsignorNoteItem[]>([
    { id: generateId(), itemName: '', quantity: 0, unitWeight: 0, weight: 0, unitPrice: 0, description: '' }
  ]);
  const [showPreview, setShowPreview] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const [gstRate, setGstRate] = useState(5);
  const [availableNotes, setAvailableNotes] = useState<any[]>([]);
  const [matchingConsignors, setMatchingConsignors] = useState<any[]>([]);
  const [matchingConsignees, setMatchingConsignees] = useState<any[]>([]);
  const [showConsignorSuggestions, setShowConsignorSuggestions] = useState(false);
  const [showConsigneeSuggestions, setShowConsigneeSuggestions] = useState(false);

  const [headerData, setHeaderData] = useState({
    challanNo: generateId(),
    date: toDateTimeLocal(new Date()),
    invoiceNo: '',
    origin: '',
    destination: '',
    modeOfTransport: 'Train' as const,
    natureOfConsignment: 'Commercial' as const,
    consignorName: '',
    consignorAddress: '',
    consignorMobile: '',
    consignorGSTIN: '',
    consigneeName: '',
    consigneeAddress: '',
    consigneeMobile: '',
    consigneeGSTIN: '',
    paymentMode: 'Paid' as any,
    actualWeight: '',
    chargedWeight: '',
    freightCharges: '',
    fodCharges: '',
    riskCharges: '',
    otherCharges: '',
    hamaliCharges: '',
    docketCharges: '',
    codCharges: '',
    fusiSurcharges: '',
    remarks: '',
    shipmentType: 'Domestic' as const
  });

  useEffect(() => {
    const notes = storage.getConsignorNotes();
    const acks = storage.getAcknowledgments();
    setAvailableNotes([...notes, ...acks]);
  }, []);

  const handleNameChange = (name: string, type: 'consignor' | 'consignee') => {
    const field = type === 'consignor' ? 'consignorName' : 'consigneeName';
    setHeaderData(prev => ({ ...prev, [field]: name }));

    if (name.length > 2) {
      const matches = availableNotes.filter(n => {
        const nName = type === 'consignor' 
          ? (n.consignorName || n.consigneeName) 
          : (n.consigneeName || n.consignorName);
        return nName?.toLowerCase().includes(name.toLowerCase());
      });
      // Deduplicate by name
      const uniqueMatches = Array.from(new Map(matches.map(m => [type === 'consignor' ? (m.consignorName || m.consigneeName) : (m.consigneeName || m.consignorName), m])).values());
      
      if (type === 'consignor') {
        setMatchingConsignors(uniqueMatches);
        setShowConsignorSuggestions(true);
      } else {
        setMatchingConsignees(uniqueMatches);
        setShowConsigneeSuggestions(true);
      }
    } else {
      if (type === 'consignor') setShowConsignorSuggestions(false);
      else setShowConsigneeSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: any, type: 'consignor' | 'consignee') => {
    if (type === 'consignor') {
      setHeaderData(prev => ({
        ...prev,
        consignorName: suggestion.consignorName || suggestion.consigneeName || '',
        consignorAddress: suggestion.consignorAddress || suggestion.address || '',
        consignorMobile: suggestion.consignorMobile || suggestion.phone || '',
        consignorGSTIN: suggestion.consignorGSTIN || suggestion.consigneeGSTIN || '',
        origin: suggestion.origin || prev.origin
      }));
      setShowConsignorSuggestions(false);
    } else {
      setHeaderData(prev => ({
        ...prev,
        consigneeName: suggestion.consigneeName || suggestion.consignorName || '',
        consigneeAddress: suggestion.consigneeAddress || suggestion.address || '',
        consigneeMobile: suggestion.consigneeMobile || suggestion.phone || '',
        consigneeGSTIN: suggestion.consigneeGSTIN || suggestion.consignorGSTIN || '',
        destination: suggestion.destination || prev.destination
      }));
      setShowConsigneeSuggestions(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      setHeaderData({
        challanNo: initialData.challanNo || initialData.id,
        date: initialData.date ? toDateTimeLocal(new Date(initialData.date)) : toDateTimeLocal(new Date()),
        invoiceNo: initialData.invoiceNo || '',
        origin: initialData.origin || '',
        destination: initialData.destination || '',
        modeOfTransport: initialData.modeOfTransport || 'Train',
        natureOfConsignment: initialData.natureOfConsignment || 'Commercial',
        consignorName: initialData.consignorName || '',
        consignorAddress: initialData.consignorAddress || '',
        consignorMobile: initialData.consignorMobile || '',
        consignorGSTIN: initialData.consignorGSTIN || '',
        consigneeName: initialData.consigneeName || '',
        consigneeAddress: initialData.consigneeAddress || '',
        consigneeMobile: initialData.consigneeMobile || '',
        consigneeGSTIN: initialData.consigneeGSTIN || '',
        paymentMode: initialData.paymentMode || 'Paid',
        actualWeight: initialData.actualWeight?.toString() || '',
        chargedWeight: initialData.chargedWeight?.toString() || '',
        freightCharges: initialData.freightCharges?.toString() || '',
        fodCharges: initialData.fodCharges?.toString() || '',
        riskCharges: initialData.riskCharges?.toString() || '',
        otherCharges: initialData.otherCharges?.toString() || '',
        hamaliCharges: initialData.hamaliCharges?.toString() || '',
        docketCharges: initialData.docketCharges?.toString() || '',
        codCharges: initialData.codCharges?.toString() || '',
        fusiSurcharges: initialData.fusiSurcharges?.toString() || '',
        remarks: initialData.remarks || '',
        shipmentType: (initialData as any).shipmentType || 'Domestic'
      });
      setItems(initialData.items || [{ id: generateId(), itemName: '', quantity: 0, unitWeight: 0, weight: 0, unitPrice: 0, description: '' }]);
    }
  }, [initialData]);

  const addItem = () => {
    setItems([...items, { id: generateId(), itemName: '', quantity: 0, unitWeight: 0, weight: 0, unitPrice: 0, description: '' }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof ConsignorNoteItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Auto-calculate weight: quantity * unitWeight
        if (field === 'quantity' || field === 'unitWeight') {
          updated.weight = (Number(updated.quantity) || 0) * (Number(updated.unitWeight) || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const totalItemFreight = items.reduce((sum, item) => sum + (item.weight * item.unitPrice), 0);

  // Auto-update freight charges when items change
  useEffect(() => {
    if (totalItemFreight > 0) {
      setHeaderData(prev => ({ ...prev, freightCharges: totalItemFreight.toString() }));
    }
  }, [totalItemFreight]);

  // Aggregate weights
  const calculatedActualWeight = items.reduce((sum, item) => sum + item.weight, 0);
  useEffect(() => {
    setHeaderData(prev => {
      const currentActual = Number(prev.actualWeight) || 0;
      const currentCharged = Number(prev.chargedWeight) || 0;
      
      // If charged was same as actual (auto-synced), keep it synced
      const newCharged = (currentCharged < calculatedActualWeight || currentCharged === currentActual) 
        ? calculatedActualWeight.toString() 
        : prev.chargedWeight;

      return { 
        ...prev, 
        actualWeight: calculatedActualWeight.toString(),
        chargedWeight: newCharged
      };
    });
  }, [calculatedActualWeight]);

  const subtotal = 
    Number(headerData.freightCharges || 0) + 
    Number(headerData.fodCharges || 0) + 
    Number(headerData.riskCharges || 0) + 
    Number(headerData.otherCharges || 0) + 
    Number(headerData.hamaliCharges || 0) + 
    Number(headerData.docketCharges || 0) + 
    Number(headerData.codCharges || 0) + 
    Number(headerData.fusiSurcharges || 0);

  const taxSGST = subtotal * (gstRate / 200); // Half of GST rate for SGST
  const taxCGST = subtotal * (gstRate / 200); // Half of GST rate for CGST
  const totalAmount = subtotal + taxSGST + taxCGST;

  const downloadPDF = async () => {
    if (!printableRef.current) {
      toast.error('Printable content not found');
      return;
    }

    await documentService.downloadPDF(printableRef.current, {
      fileName: `Acknowledgment_Receipt_${headerData.challanNo}.pdf`,
      onBeforeCapture: () => {
        if (!showPreview) setShowPreview(true);
      },
      onAfterCapture: () => {
        // Option to hide back or keep visible
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!headerData.origin || !headerData.destination || !headerData.consignorName || !headerData.consigneeName) {
      toast.error('Basic details (Origin, Dest, Consignor, Consignee) are required');
      return;
    }

    const currentUser = storage.getUser();
    const entry: ConsignorNoteEntry = {
      id: initialData?.id || generateId(),
      date: headerData.date,
      ...headerData,
      actualWeight: Number(headerData.actualWeight),
      chargedWeight: Number(headerData.chargedWeight),
      freightCharges: Number(headerData.freightCharges),
      fodCharges: Number(headerData.fodCharges),
      riskCharges: Number(headerData.riskCharges),
      otherCharges: Number(headerData.otherCharges),
      hamaliCharges: Number(headerData.hamaliCharges),
      docketCharges: Number(headerData.docketCharges),
      codCharges: Number(headerData.codCharges),
      fusiSurcharges: Number(headerData.fusiSurcharges),
      taxSGST,
      taxCGST,
      totalAmount,
      items,
      signature: 'Darbe Logistics Auth',
      createdBy: initialData?.createdBy || currentUser?.name || 'System'
    };

    if (initialData) {
      storage.updateConsignorNote(entry);
      toast.success('Acknowledgment Receipt Updated Successfully');
      if (onClear) onClear();
    } else {
      storage.saveConsignorNote(entry);
      toast.success('Acknowledgment Receipt Saved Successfully');
    }
    
    // Reset form
    setHeaderData({
      challanNo: generateId(),
      date: toDateTimeLocal(new Date()),
      invoiceNo: '',
      origin: '',
      destination: '',
      modeOfTransport: 'Road',
      natureOfConsignment: 'Commercial',
      consignorName: '',
      consignorAddress: '',
      consignorMobile: '',
      consignorGSTIN: '',
      consigneeName: '',
      consigneeAddress: '',
      consigneeMobile: '',
      consigneeGSTIN: '',
      paymentMode: 'Paid',
      actualWeight: '',
      chargedWeight: '',
      freightCharges: '',
      fodCharges: '',
      riskCharges: '',
      otherCharges: '',
      hamaliCharges: '',
      docketCharges: '',
      codCharges: '',
      fusiSurcharges: '',
      remarks: '',
      shipmentType: 'Domestic'
    });
    setItems([{ id: generateId(), itemName: '', quantity: 0, unitWeight: 0, weight: 0, unitPrice: 0, description: '' }]);
  };

  return (
    <div className="w-full pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 bg-olive-900 text-white p-5 sm:p-8 rounded-2xl shadow-lg border border-olive-800">
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-3 bg-white/10 rounded-xl flex-shrink-0 animate-pulse">
            <Package size={32} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase leading-none">ACKNOWLEDGMENT RECEIPT (POD)</h2>
              <div className="inline-flex items-center bg-olive-700 px-3 py-1 rounded-full border border-olive-500/50">
                <span className="text-[10px] font-bold text-olive-300 uppercase mr-2 tracking-widest">ACKNOWLEDGMENT NUMBER:</span>
                <span className="font-mono font-black text-sm whitespace-nowrap">{headerData.challanNo}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-olive-300 text-[10px] sm:text-xs font-medium tracking-wide">Proof of Delivery Confirmation • Darbe Logistics</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-white/10 transition-all active:scale-95"
          >
            <Eye size={18} />
            <span className="whitespace-nowrap">{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
          </button>
          <button
            type="button"
            onClick={downloadPDF}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-white text-olive-900 hover:bg-olive-50 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-black/20 active:scale-95"
          >
            <Download size={18} />
            <span className="whitespace-nowrap">Export PDF</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        <form onSubmit={handleSubmit} className="flex-1 space-y-8">
        {/* Logistics Header Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-olive-600 uppercase tracking-widest pl-1">Origin</label>
            <div className="relative group">
              <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-olive-500 transition-colors" size={14} />
              <input 
                type="text" 
                value={headerData.origin}
                onChange={(e) => setHeaderData({...headerData, origin: e.target.value})}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold focus:ring-1 focus:ring-olive-500 transition-all" 
                placeholder="HYDERABAD"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-olive-600 uppercase tracking-widest pl-1">Destination</label>
            <div className="relative group">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-olive-500 transition-colors" size={14} />
              <input 
                type="text" 
                value={headerData.destination}
                onChange={(e) => setHeaderData({...headerData, destination: e.target.value})}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold focus:ring-1 focus:ring-olive-500 transition-all" 
                placeholder="MUMBAI"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-olive-600 uppercase tracking-widest pl-1">ACKNOWLEDGMENT DATE</label>
            <div className="relative group">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-olive-500 transition-colors" size={14} />
              <input 
                type="datetime-local" 
                value={headerData.date}
                onChange={(e) => setHeaderData({...headerData, date: e.target.value})}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-olive-500 transition-all" 
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-olive-600 uppercase tracking-widest pl-1">Mode</label>
            <select 
              value={headerData.modeOfTransport}
              onChange={(e) => setHeaderData({...headerData, modeOfTransport: e.target.value as any})}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-1 focus:ring-olive-500"
            >
              <option value="Road">Road</option>
              <option value="Train">Train (Rail)</option>
              <option value="Air">Air</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-olive-600 uppercase tracking-widest pl-1">Shipment</label>
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 h-[42px]">
              <button
                type="button"
                onClick={() => setHeaderData({...headerData, shipmentType: 'Domestic'})}
                className={cn(
                  "flex-1 rounded-lg text-[10px] font-black uppercase transition-all",
                  headerData.shipmentType === 'Domestic' ? "bg-olive-600 text-white shadow-sm" : "text-gray-400 hover:text-olive-600"
                )}
              >
                DOMESTIC
              </button>
              <button
                type="button"
                onClick={() => setHeaderData({...headerData, shipmentType: 'International'})}
                className={cn(
                  "flex-1 rounded-lg text-[10px] font-black uppercase transition-all",
                  headerData.shipmentType === 'International' ? "bg-olive-600 text-white shadow-sm" : "text-gray-400 hover:text-olive-600"
                )}
              >
                INTERNATIONAL
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-olive-600 uppercase tracking-widest pl-1">Nature</label>
            <select 
              value={headerData.natureOfConsignment}
              onChange={(e) => setHeaderData({...headerData, natureOfConsignment: e.target.value as any})}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black text-olive-700 focus:ring-1 focus:ring-olive-500"
            >
              <option>Commercial</option>
              <option>Non-Commercial</option>
            </select>
          </div>
        </div>

        {/* Party Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-olive-600"></div>
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-olive-600 uppercase tracking-[0.2em]">Consignor Details</h3>
              <div className="p-1 px-2 bg-olive-50 rounded text-[10px] font-bold text-olive-600 italic">Shipper</div>
            </div>
            <div className="space-y-4 relative">
              <div className="relative">
                <input 
                  type="text" placeholder="Shipper / Company Name" 
                  value={headerData.consignorName}
                  onChange={(e) => handleNameChange(e.target.value, 'consignor')}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black focus:ring-1 focus:ring-olive-500"
                />
                {showConsignorSuggestions && matchingConsignors.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                    {matchingConsignors.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectSuggestion(s, 'consignor')}
                        className="w-full text-left px-4 py-3 hover:bg-olive-50 border-b border-gray-50 last:border-0 flex flex-col"
                      >
                        <span className="text-sm font-black text-gray-900">{s.consignorName || s.consigneeName}</span>
                        <span className="text-[10px] text-gray-400 truncate">{s.consignorAddress || s.address}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <textarea 
                placeholder="Full Office/Pickup Address" rows={2}
                value={headerData.consignorAddress}
                onChange={(e) => setHeaderData({...headerData, consignorAddress: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-1 focus:ring-olive-500"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input 
                  type="text" placeholder="Mobile / Contact No." 
                  value={headerData.consignorMobile}
                  onChange={(e) => setHeaderData({...headerData, consignorMobile: e.target.value})}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold"
                />
                <input 
                  type="text" placeholder="GSTIN (Optional)" 
                  value={headerData.consignorGSTIN}
                  onChange={(e) => setHeaderData({...headerData, consignorGSTIN: e.target.value})}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono uppercase"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-olive-600"></div>
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-olive-600 uppercase tracking-[0.2em]">Consignee Details</h3>
              <div className="p-1 px-2 bg-olive-50 rounded text-[10px] font-bold text-olive-600 italic">Receiver</div>
            </div>
            <div className="space-y-4 relative">
              <div className="relative">
                <input 
                  type="text" placeholder="Receiver / Company Name" 
                  value={headerData.consigneeName}
                  onChange={(e) => handleNameChange(e.target.value, 'consignee')}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black focus:ring-1 focus:ring-olive-500"
                />
                {showConsigneeSuggestions && matchingConsignees.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                    {matchingConsignees.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectSuggestion(s, 'consignee')}
                        className="w-full text-left px-4 py-3 hover:bg-olive-50 border-b border-gray-50 last:border-0 flex flex-col"
                      >
                        <span className="text-sm font-black text-gray-900">{s.consigneeName || s.consignorName}</span>
                        <span className="text-[10px] text-gray-400 truncate">{s.consigneeAddress || s.address}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <textarea 
                placeholder="Full Delivery Address" rows={2}
                value={headerData.consigneeAddress}
                onChange={(e) => setHeaderData({...headerData, consigneeAddress: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-1 focus:ring-olive-500"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input 
                  type="text" placeholder="Contact Mobile No." 
                  value={headerData.consigneeMobile}
                  onChange={(e) => setHeaderData({...headerData, consigneeMobile: e.target.value})}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold"
                />
                <input 
                  type="text" placeholder="GSTIN (If Any)" 
                  value={headerData.consigneeGSTIN}
                  onChange={(e) => setHeaderData({...headerData, consigneeGSTIN: e.target.value})}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Weights and Dynamic Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-olive-50/50 p-6 rounded-2xl border border-olive-100 space-y-6">
            <div className="flex items-center gap-2 border-b border-olive-100 pb-3">
              <div className="w-2 h-6 bg-olive-500 rounded-full"></div>
              <h3 className="text-[11px] font-black uppercase text-olive-800 tracking-widest">Weight Controls</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-olive-100 shadow-sm">
                <label className="block text-[10px] font-black text-olive-600 uppercase mb-2">Actual Weight</label>
                <div className="flex items-end gap-2">
                  <input 
                    type="number" step="0.01"
                    value={headerData.actualWeight}
                    onChange={(e) => setHeaderData({...headerData, actualWeight: e.target.value})}
                    className="w-full bg-transparent font-black text-2xl focus:outline-none" placeholder="0.00"
                  />
                  <span className="text-[10px] font-black text-olive-300 pb-1.5 uppercase">KiloGrams</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-olive-100 shadow-sm">
                <label className="block text-[10px] font-black text-olive-600 uppercase mb-2">Charged Weight</label>
                <div className="flex items-end gap-2">
                  <input 
                    type="number" step="0.01"
                    value={headerData.chargedWeight}
                    onChange={(e) => setHeaderData({...headerData, chargedWeight: e.target.value})}
                    className="w-full bg-transparent font-black text-2xl focus:outline-none" placeholder="0.00"
                  />
                  <span className="text-[10px] font-black text-olive-300 pb-1.5 uppercase">KiloGrams</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-[11px] font-black uppercase text-gray-600 tracking-widest">Consignment Payload Items</h3>
              <button 
                type="button" 
                onClick={addItem} 
                className="text-[10px] bg-olive-600 hover:bg-olive-700 text-white px-4 py-2 rounded-xl font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus size={14} /> Add Row
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-4">Item Name</th>
                    <th className="px-4 py-4 text-center w-20">QTY</th>
                    <th className="px-4 py-4 text-center w-20">UNIT WT</th>
                    <th className="px-4 py-4 text-center w-24">TOTAL WT</th>
                    <th className="px-4 py-4 text-center w-24">RATE (₹)</th>
                    <th className="px-4 py-4 text-right w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item) => (
                    <tr key={item.id} className="group hover:bg-olive-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <input 
                          type="text" 
                          className="w-full outline-none bg-transparent font-bold text-sm" 
                          placeholder="Cargo details..." 
                          value={item.itemName} 
                          onChange={(e) => updateItem(item.id, 'itemName', e.target.value)} 
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center bg-gray-50 rounded-lg group-hover:bg-white border border-transparent group-hover:border-olive-100">
                          <input 
                            type="number" 
                            className="w-full text-center outline-none bg-transparent font-mono font-bold text-sm py-1.5" 
                            value={item.quantity} 
                            onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))} 
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center bg-gray-50 rounded-lg group-hover:bg-white border border-transparent group-hover:border-olive-100">
                          <input 
                            type="number" 
                            className="w-full text-center outline-none bg-transparent font-mono font-bold text-sm py-1.5" 
                            value={item.unitWeight} 
                            onChange={(e) => updateItem(item.id, 'unitWeight', Number(e.target.value))} 
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center bg-gray-100 rounded-lg group-hover:bg-gray-50 border border-transparent">
                          <input 
                            type="number" 
                            readOnly
                            className="w-full text-center outline-none bg-transparent font-mono font-bold text-sm py-1.5 text-gray-500" 
                            value={item.weight} 
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center bg-gray-50 rounded-lg group-hover:bg-white border border-transparent group-hover:border-olive-100">
                          <input 
                            type="number" 
                            className="w-full text-center outline-none bg-transparent font-mono font-bold text-sm py-1.5" 
                            value={item.unitPrice} 
                            onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))} 
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          type="button" 
                          disabled={items.length <= 1}
                          onClick={() => removeItem(item.id)} 
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {items.length === 0 && (
              <div className="p-10 text-center text-gray-400 italic text-sm">No items added to consignment.</div>
            )}
          </div>
        </div>

        {/* Detailed Charges Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <IndianRupee className="text-olive-600" size={20} />
              <h3 className="text-[12px] font-black uppercase text-gray-900 tracking-[0.2em]">Charges Calculator</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            {[
              { label: 'Freight Charges', key: 'freightCharges' },
              { label: 'Freight On Delivery Charges', key: 'fodCharges' },
              { label: 'Risk Charges', key: 'riskCharges' },
              { label: 'Other/Loading', key: 'otherCharges' },
              { label: 'Hamali/Labour', key: 'hamaliCharges' },
              { label: 'Docket Charges', key: 'docketCharges' },
              { label: 'Cash On Delivery Charges', key: 'codCharges' },
              { label: 'Fusi Surcharges', key: 'fusiSurcharges' }
            ].map((charge) => (
              <div key={charge.key} className="space-y-1.5 group">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-focus-within:text-olive-600 transition-colors">{charge.label}</label>
                <div className="flex items-center gap-2 bg-gray-50 group-focus-within:bg-white group-focus-within:ring-2 group-focus-within:ring-olive-500/10 border border-gray-100 px-4 py-2.5 rounded-2xl transition-all">
                  <span className="text-sm font-black text-gray-400">₹</span>
                  <input 
                    type="number" 
                    value={(headerData as any)[charge.key]}
                    onChange={(e) => setHeaderData({...headerData, [charge.key]: e.target.value})}
                    className="w-full outline-none bg-transparent font-mono font-black text-olive-900" placeholder="0"
                  />
                </div>
              </div>
            ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-olive-900 text-white p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center text-olive-300 text-[10px] font-black uppercase tracking-widest">
                  <span>Sub-Total</span>
                  <span className="bg-white/10 px-2 py-1 rounded">Taxable</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-white/10 pb-4">
                  <span className="text-xs opacity-60 italic">Charge Sum</span>
                  <span className="text-xl font-bold">₹ {subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-olive-300">
                  <div className="flex items-center gap-2">
                    <span>GST (CENTRAL + STATE)</span>
                    <input 
                      type="number" 
                      value={gstRate}
                      onChange={(e) => setGstRate(Number(e.target.value))}
                      className="w-10 bg-white/10 rounded px-1 text-white border-none focus:ring-1 focus:ring-white/30"
                    />
                    <span>%</span>
                  </div>
                  <span>₹ {(taxSGST + taxCGST).toFixed(2)}</span>
                </div>

                <div className="pt-4 mt-4 flex flex-col items-center text-center space-y-2 border-t border-white/20">
                  <span className="font-black uppercase tracking-[0.3em] text-xs text-olive-400">Grand Total</span>
                  <div className="text-4xl font-black tracking-tighter">₹ {totalAmount.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest">Payment Mode</label>
                  <select 
                    value={headerData.paymentMode}
                    onChange={(e) => setHeaderData({...headerData, paymentMode: e.target.value as any})}
                    className="w-full bg-transparent text-lg font-black text-olive-600 outline-none cursor-pointer"
                  >
                    <option value="Paid">Paid</option>
                    <option value="To-Pay">To-Pay</option>
                    <option value="Credit">Credit</option>
                    <option value="Cash">Cash</option>
                    <option value="Freight On Delivery">Freight On Delivery</option>
                  </select>
                </div>
                <div className="h-10 w-10 bg-olive-50 rounded-full flex items-center justify-center text-olive-600">
                  <IndianRupee size={20} />
                </div>
              </div>
              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-[10px] uppercase font-black text-green-500 mb-1 tracking-widest">Electronic Status</span>
                  <span className="font-handwriting text-2xl text-green-600 font-bold leading-none" style={{fontFamily: 'Dancing Script'}}>Verified Authority</span>
                </div>
                <CheckCircle size={24} className="text-green-500" />
              </div>
            </div>
            
            <button
              type="submit"
              className="group relative w-full py-5 bg-olive-700 text-white font-black uppercase tracking-[0.3em] rounded-3xl shadow-2xl shadow-olive-200/50 hover:bg-olive-800 active:scale-[0.97] transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <span className="relative z-10">{initialData ? 'Update & Save POD' : 'Authorize & Save POD'}</span>
            </button>
          </div>
        </div>
        </form>

        {/* Live Preview Side */}
        <div className={cn("xl:w-[210mm] w-full flex-shrink-0", !showPreview && "hidden")}>
          <div className="sticky top-24 overflow-x-auto pb-4">
            <div className="min-w-[800px] xl:min-w-0">
              <div 
                id="printable-cn-content"
                ref={printableRef}
                className="bg-white rounded-none w-full text-gray-800 p-[15mm] flex flex-col"
                style={{ minHeight: '100%', height: 'auto', overflow: 'visible' }}
              >
              <div className="border-b-2 border-olive-600 pb-4 mb-6 flex justify-between items-end">
                <div className="flex items-center gap-3">
                  <div className="bg-olive-900 p-2 rounded-lg text-white">
                    <Package size={24} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-gray-900">DARBE <span className="text-olive-600">LOGISTICS</span></h1>
                    <p className="text-[8px] font-bold text-olive-600 uppercase tracking-widest leading-none">Race Xpress Cargo Carrier</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <span className="px-2 py-0.5 bg-olive-50 text-olive-600 text-[9px] font-black uppercase rounded border border-olive-100">
                      {headerData.shipmentType}
                    </span>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acknowledgment Receipt</span>
                  </div>
                  <input 
                    type="text"
                    value={headerData.challanNo}
                    onChange={(e) => setHeaderData({...headerData, challanNo: e.target.value})}
                    className="text-sm font-mono font-bold text-olive-600 bg-transparent border-none outline-none focus:ring-0 text-right w-full p-0"
                  />
                  <input 
                    type="datetime-local"
                    value={headerData.date}
                    onChange={(e) => setHeaderData({...headerData, date: e.target.value})}
                    className="text-[10px] font-bold text-gray-400 bg-transparent border-none outline-none focus:ring-0 text-right w-full p-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-6 border-b border-gray-100 pb-6">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h4 className="text-[9px] font-black text-olive-600 uppercase tracking-tighter">Shipper Detail</h4>
                    <p className="text-sm font-black uppercase text-gray-900 break-words">{headerData.consignorName || 'Shipper Name'}</p>
                    <p className="text-[10px] text-gray-500 leading-tight uppercase break-words mt-1">{headerData.consignorAddress || 'Address'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[9px] font-bold text-gray-400">GSTIN:</span>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">{headerData.consignorGSTIN || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Origin</p>
                      <input 
                        type="text"
                        value={headerData.origin}
                        onChange={(e) => setHeaderData({...headerData, origin: e.target.value})}
                        className="text-xs font-bold bg-transparent border-none outline-none focus:ring-0 w-full p-0"
                      />
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Transport Mode</p>
                      <select 
                        value={headerData.modeOfTransport}
                        onChange={(e) => setHeaderData({...headerData, modeOfTransport: e.target.value as any})}
                        className="text-xs font-bold bg-transparent border-none outline-none focus:ring-0 w-full p-0 cursor-pointer"
                      >
                        <option value="Road">Road</option>
                        <option value="Train">Train</option>
                        <option value="Air">Air</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 border-l border-gray-100 pl-8">
                  <div className="space-y-1">
                    <h4 className="text-[9px] font-black text-olive-600 uppercase tracking-tighter">Receiver Detail</h4>
                    <p className="text-sm font-black uppercase text-olive-900 break-words">{headerData.consigneeName || 'Receiver Name'}</p>
                    <p className="text-[10px] text-gray-500 leading-tight uppercase break-words mt-1">{headerData.consigneeAddress || 'Address'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[9px] font-bold text-gray-400">GSTIN:</span>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">{headerData.consigneeGSTIN || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Destination</p>
                      <input 
                        type="text"
                        value={headerData.destination}
                        onChange={(e) => setHeaderData({...headerData, destination: e.target.value})}
                        className="text-xs font-bold bg-transparent border-none outline-none focus:ring-0 w-full p-0"
                      />
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Payment Mode</p>
                      <select 
                        value={headerData.paymentMode}
                        onChange={(e) => setHeaderData({...headerData, paymentMode: e.target.value as any})}
                        className="text-xs font-black text-blue-600 uppercase bg-transparent border-none outline-none focus:ring-0 w-full p-0 cursor-pointer"
                      >
                        <option value="Paid">Paid</option>
                        <option value="To-Pay">To-Pay</option>
                        <option value="Credit">Credit</option>
                        <option value="Cash">Cash</option>
                        <option value="Freight On Delivery">Freight On Delivery</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <table className="w-full text-left border-y border-gray-100">
                  <thead>
                    <tr className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50">
                      <th className="py-2 px-3">Description of Goods / Packing</th>
                      <th className="py-2 px-3 text-center">QUANTITY</th>
                      <th className="py-2 px-3 text-center">CHARGED WEIGHT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((item, idx) => (
                      <tr key={idx} className="text-xs">
                        <td className="py-3 px-3 font-bold uppercase">{item.itemName || 'Cargo Items'}</td>
                        <td className="py-3 px-3 text-center font-mono">{item.quantity}</td>
                        <td className="py-3 px-3 text-center font-mono">{item.weight} KG</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-auto grid grid-cols-2 gap-8 border-t-2 border-olive-100 pt-6">
                <div>
                  <h5 className="text-[9px] font-black text-olive-600 uppercase mb-2">Detailed Charges Breakdown</h5>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                    {[
                      { l: 'Freight', v: headerData.freightCharges },
                      { l: 'F.O.D', v: headerData.fodCharges },
                      { l: 'Docket', v: headerData.docketCharges },
                      { l: 'Labour', v: headerData.hamaliCharges },
                      { l: 'Risk', v: headerData.riskCharges },
                      { l: 'Other', v: headerData.otherCharges },
                    ].map(c => (
                      <div key={c.l} className="flex justify-between text-[10px] border-b border-gray-50 pb-0.5">
                        <span className="text-gray-400">{c.l}</span>
                        <span className="font-bold">₹ {Number(c.v || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-olive-50 p-4 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between text-[10px] text-olive-600 mb-1">
                      <span>Sub-Total Charges</span>
                      <span className="font-bold">₹ {subtotal.toFixed(2)}</span>
                    </div>
                <div className="flex justify-between text-[10px] text-olive-600 mb-2">
                  <span>Taxes (CENTRAL + STATE GST {gstRate}%)</span>
                  <span className="font-bold">₹ {(taxSGST + taxCGST).toFixed(2)}</span>
                </div>
                  </div>
                  <div className="border-t border-olive-200 pt-2 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-olive-900 leading-none">Net Payable</span>
                    <span className="text-lg font-black text-olive-900 leading-none">₹ {totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-olive-100/50">
                    <p className="text-[8px] font-black uppercase text-olive-400 mb-0.5">Amount in Words</p>
                    <p className="text-[9px] font-bold text-olive-700 italic leading-tight">Rupees {numberToWords(totalAmount)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-12 pt-12">
                <div className="border-t border-gray-200 pt-2">
                  <p className="text-[8px] italic text-gray-400 mb-6">Subject to local jurisdiction. Goods once received in good condition will not be returned.</p>
                  <p className="text-[9px] font-bold uppercase text-gray-300">Consignee's Signature</p>
                </div>
                <div className="text-right border-t border-gray-200 pt-2">
                  <p className="text-[9px] font-black uppercase text-olive-600 mb-1">For DARBE LOGISTICS LTD</p>
                  <p className="text-[10px] font-handwriting text-olive-900 font-bold mb-4" style={{fontFamily: 'Dancing Script'}}>Authorized Signatory</p>
                  <p className="text-[9px] font-bold uppercase text-gray-300">Authorized Official</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
