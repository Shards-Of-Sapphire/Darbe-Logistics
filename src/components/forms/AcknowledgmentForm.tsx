import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, User, Phone, MapPin, Navigation, Package, Weight, Calendar, CheckCircle, Download, Eye, Globe } from 'lucide-react';
import { storage } from '../../lib/storage';
import { generateId, formatDate, formatDateTime, toDateTimeLocal, cn, numberToWords } from '../../lib/utils';
import { documentService } from '../../services/documentService';
import { AcknowledgmentEntry } from '../../types';
import toast from 'react-hot-toast';

interface AcknowledgmentFormProps {
  initialData?: AcknowledgmentEntry;
  onClear?: () => void;
}

export default function AcknowledgmentForm({ initialData, onClear }: AcknowledgmentFormProps) {
  const [formData, setFormData] = useState({
    consignorName: '',
    consignorAddress: '',
    consignorPhone: '',
    consigneeName: '',
    address: '',
    destination: '',
    phone: '',
    description: '',
    quantity: '',
    packing: '',
    unitWeight: '',
    actualWeight: '',
    chargedWeight: '',
    unitPrice: '',
    dimensions: '',
    modeOfTransport: 'Train',
    shipmentType: 'Domestic',
    consignorGSTIN: '',
    consigneeGSTIN: '',
    date: toDateTimeLocal(new Date()),
    amount: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        consignorName: (initialData as any).consignorName || '',
        consignorAddress: (initialData as any).consignorAddress || '',
        consignorPhone: (initialData as any).consignorPhone || '',
        consigneeName: initialData.consigneeName || '',
        address: initialData.address || '',
        destination: (initialData as any).destination || '',
        phone: initialData.phone || '',
        description: initialData.description || '',
        quantity: initialData.quantity?.toString() || '',
        packing: initialData.packing || '',
        unitWeight: (initialData as any).unitWeight?.toString() || '',
        actualWeight: initialData.actualWeight?.toString() || '',
        chargedWeight: initialData.chargedWeight?.toString() || '',
        unitPrice: (initialData as any).unitPrice?.toString() || '',
        dimensions: initialData.dimensions || '',
        modeOfTransport: (initialData as any).modeOfTransport || 'Train',
        shipmentType: (initialData as any).shipmentType || 'Domestic',
        consignorGSTIN: (initialData as any).consignorGSTIN || '',
        consigneeGSTIN: (initialData as any).consigneeGSTIN || '',
        date: initialData.date ? toDateTimeLocal(new Date(initialData.date)) : toDateTimeLocal(new Date()),
        amount: initialData.amount?.toString() || ''
      });
    }
  }, [initialData]);
  const [showPreview, setShowPreview] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);
  const [availableNotes, setAvailableNotes] = useState<any[]>([]);
  const [matchingNames, setMatchingNames] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const notes = storage.getConsignorNotes();
    const acks = storage.getAcknowledgments();
    setAvailableNotes([...notes, ...acks]);
  }, []);

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, consigneeName: name });

    if (name.length > 2) {
      const matches = availableNotes.filter(n => {
        const nName = (n.consigneeName || n.consignorName || '');
        return nName.toLowerCase().includes(name.toLowerCase());
      });
      // Deduplicate by name
      const uniqueMatches = Array.from(new Map(matches.map(m => [(m.consigneeName || m.consignorName), m])).values());
      setMatchingNames(uniqueMatches);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: any) => {
    setFormData({
      ...formData,
      consignorName: suggestion.consignorName || formData.consignorName,
      consignorAddress: suggestion.consignorAddress || formData.consignorAddress,
      consignorPhone: suggestion.consignorMobile || formData.consignorPhone,
      consigneeName: suggestion.consigneeName || suggestion.consignorName || '',
      address: suggestion.consigneeAddress || suggestion.consignorAddress || suggestion.address || '',
      destination: suggestion.destination || suggestion.origin || '',
      phone: suggestion.consigneeMobile || suggestion.consignorMobile || suggestion.phone || '',
      consigneeGSTIN: suggestion.consigneeGSTIN || suggestion.consignorGSTIN || '',
      shipmentType: (suggestion as any).shipmentType || formData.shipmentType,
      modeOfTransport: (suggestion as any).modeOfTransport || formData.modeOfTransport || 'Train'
    });
    setShowSuggestions(false);
  };

  const downloadPDF = async () => {
    if (!printableRef.current) {
      toast.error('Printable content not found');
      return;
    }

    await documentService.downloadPDF(printableRef.current, {
      fileName: `Consignment_Note_${generateId().slice(0, 8)}.pdf`,
      onBeforeCapture: () => {
        if (!showPreview) setShowPreview(true);
      },
      onAfterCapture: () => {
        // Option to hide or keep
      }
    });
  };

  useEffect(() => {
    const qty = Number(formData.quantity) || 0;
    const uwt = Number(formData.unitWeight) || 0;
    const calculatedActual = qty * uwt;
    
    setFormData(prev => {
      const currentActual = Number(prev.actualWeight) || 0;
      const currentCharged = Number(prev.chargedWeight) || 0;
      
      // If charged weight was same as actual weight (auto-synced), keep it synced
      const newCharged = (currentCharged < calculatedActual || currentCharged === currentActual)
        ? calculatedActual.toString()
        : prev.chargedWeight;

      // Update amount if charged weight or unit price changed
      const price = Number(prev.unitPrice) || 0;
      const newAmount = (Number(newCharged) * price).toFixed(2);

      return {
        ...prev,
        actualWeight: calculatedActual.toString(),
        chargedWeight: newCharged,
        amount: newAmount === '0.00' ? (prev.amount || '0.00') : newAmount
      };
    });
  }, [formData.quantity, formData.unitWeight, formData.unitPrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.consigneeName || !formData.description || !formData.quantity) {
      toast.error('Consignee, Description and Quantity are required');
      return;
    }

    const currentUser = storage.getUser();
    const entry = {
      id: initialData?.id || generateId(),
      date: formData.date,
      ...formData,
      quantity: Number(formData.quantity) || 0,
      unitWeight: Number(formData.unitWeight) || 0,
      actualWeight: Number(formData.actualWeight) || 0,
      chargedWeight: Number(formData.chargedWeight) || 0,
      unitPrice: Number(formData.unitPrice) || 0,
      amount: Number(formData.amount) || 0,
      signature: 'Digitally Verified',
      createdBy: initialData?.createdBy || currentUser?.name || 'System'
    };

    if (initialData) {
      storage.updateAcknowledgment(entry);
      toast.success('Consignment Note Updated Successfully');
      if (onClear) onClear();
    } else {
      storage.saveAcknowledgment(entry);
      toast.success('Consignment Note Submitted Successfully');
    }

    setFormData({
      consignorName: '',
      consignorAddress: '',
      consignorPhone: '',
      consigneeName: '',
      address: '',
      destination: '',
      phone: '',
      description: '',
      quantity: '',
      packing: '',
      unitWeight: '',
      actualWeight: '',
      chargedWeight: '',
      unitPrice: '',
      dimensions: '',
      modeOfTransport: 'Train',
      shipmentType: 'Domestic',
      consignorGSTIN: '',
      consigneeGSTIN: '',
      date: toDateTimeLocal(new Date()),
      amount: ''
    });
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 bg-olive-100 text-olive-600 rounded-xl flex-shrink-0">
            <FileText size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 uppercase leading-snug">Consignor Note</h2>
            <p className="text-[10px] sm:text-xs text-gray-500 italic">Official Record for Darbe Logistics Consignment Details.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2 transition-all"
          >
            <Eye size={16} />
            <span className="whitespace-nowrap">{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
          </button>
          <button
            type="button"
            onClick={downloadPDF}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-900 text-white hover:bg-black rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            <Download size={16} />
            <span className="whitespace-nowrap">Print Receipt</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 sm:gap-8">
        <form onSubmit={handleSubmit} className="flex-1 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-4 sm:space-y-5">
            <h3 className="text-xs font-black text-olive-600 uppercase tracking-widest border-l-2 border-olive-600 pl-3">Consignor Details</h3>
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 pl-1">Consignor Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={16} />
                  <input
                    type="text"
                    value={formData.consignorName}
                    onChange={(e) => setFormData({...formData, consignorName: e.target.value})}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-1 focus:ring-olive-500 text-sm font-semibold transition-all"
                    placeholder="Enter sender name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Consignor Mobile</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={14} />
                    <input
                      type="tel"
                      value={formData.consignorPhone}
                      onChange={(e) => setFormData({...formData, consignorPhone: e.target.value})}
                      className="w-full pl-9 pr-3 py-2.5 sm:py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm sm:text-xs transition-all"
                      placeholder="+91..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Consignor GSTIN</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={14} />
                    <input
                      type="text"
                      value={formData.consignorGSTIN}
                      onChange={(e) => setFormData({...formData, consignorGSTIN: e.target.value.toUpperCase()})}
                      className="w-full pl-9 pr-3 py-2.5 sm:py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm sm:text-xs transition-all"
                      placeholder="GSTIN"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Consignor Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={14} />
                  <input
                    type="text"
                    value={formData.consignorAddress}
                    onChange={(e) => setFormData({...formData, consignorAddress: e.target.value})}
                    className="w-full pl-9 pr-3 py-2.5 sm:py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm sm:text-xs transition-all"
                    placeholder="Pickup Location"
                  />
                </div>
              </div>
            </div>

            <h3 className="text-xs font-black text-olive-600 uppercase tracking-widest border-l-2 border-olive-600 pl-3 pt-4">Consignee & Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 pl-1 group-focus-within:text-olive-600 transition-colors">Shipment Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={14} />
                    <input
                      type="datetime-local"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full pl-9 pr-3 py-2.5 sm:py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm sm:text-xs transition-all"
                    />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 pl-1 group-focus-within:text-olive-600 transition-colors">Consignee GSTIN</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={14} />
                    <input
                      type="text"
                      placeholder="Consignee GSTIN"
                      value={formData.consigneeGSTIN}
                      onChange={(e) => setFormData({...formData, consigneeGSTIN: e.target.value.toUpperCase()})}
                      className="w-full pl-9 pr-3 py-2.5 sm:py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm sm:text-xs transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Transport Mode</label>
                  <select 
                    value={formData.modeOfTransport}
                    onChange={(e) => setFormData({...formData, modeOfTransport: e.target.value as any})}
                    className="w-full px-3 py-2.5 sm:py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm sm:text-xs font-bold"
                  >
                    <option value="Road">Road</option>
                    <option value="Train">Train (Rail)</option>
                    <option value="Air">Air</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Mobile No.</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={14} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full pl-9 pr-3 py-2.5 sm:py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm sm:text-xs transition-all"
                      placeholder="+91..."
                    />
                  </div>
                </div>
              </div>

              <div className="relative">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 pl-1">Name / Company</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={16} />
                  <input
                    type="text"
                    value={formData.consigneeName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-1 focus:ring-olive-500 text-sm font-semibold transition-all"
                    placeholder="Enter receiver name"
                  />
                  {showSuggestions && matchingNames.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                      {matchingNames.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectSuggestion(s)}
                          className="w-full text-left px-4 py-3 hover:bg-olive-50 border-b border-gray-50 last:border-0 flex flex-col"
                        >
                          <span className="text-sm font-black text-gray-900">{s.consigneeName || s.consignorName}</span>
                          <span className="text-[10px] text-gray-400 truncate">{s.consigneeAddress || s.consignorAddress || s.address}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Mobile No.</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={14} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full pl-9 pr-3 py-2.5 sm:py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm sm:text-xs transition-all"
                      placeholder="+91..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Destination City</label>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={14} />
                    <input
                      type="text"
                      value={formData.destination}
                      onChange={(e) => setFormData({...formData, destination: e.target.value})}
                      className="w-full pl-9 pr-3 py-2.5 sm:py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm sm:text-xs transition-all"
                      placeholder="e.g. MUMBAI"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Address Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={14} />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full pl-9 pr-3 py-2.5 sm:py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm sm:text-xs transition-all"
                      placeholder="City / Area"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <h3 className="text-xs font-black text-olive-600 uppercase tracking-widest border-l-2 border-olive-600 pl-3">Shipment Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Contents Description</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={16} />
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm transition-all"
                    placeholder="e.g. TEXTILE GOODS"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1">PIECES</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-3 py-2.5 sm:py-1.5 bg-gray-50 border border-gray-100 rounded text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1">UNIT WT (KG)</label>
                  <input
                    type="number"
                    value={formData.unitWeight}
                    onChange={(e) => setFormData({...formData, unitWeight: e.target.value})}
                    className="w-full px-3 py-2.5 sm:py-1.5 bg-gray-50 border border-gray-100 rounded text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1">Packing Mode</label>
                  <input
                    type="text"
                    value={formData.packing}
                    onChange={(e) => setFormData({...formData, packing: e.target.value})}
                    className="w-full px-3 py-2.5 sm:py-1.5 bg-gray-50 border border-gray-100 rounded text-sm"
                    placeholder="e.g. CARTONS"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-olive-50 p-2 rounded-xl border border-olive-100">
                  <label className="block text-[9px] font-bold text-olive-600 uppercase mb-1">ACTUAL WEIGHT</label>
                  <input
                    type="number"
                    value={formData.actualWeight}
                    onChange={(e) => setFormData({...formData, actualWeight: e.target.value})}
                    className="w-full bg-transparent font-bold text-sm focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div className="bg-olive-50 p-2 rounded-xl border border-olive-100">
                  <label className="block text-[9px] font-bold text-olive-600 uppercase mb-1">CHARGED WEIGHT</label>
                  <input
                    type="number"
                    value={formData.chargedWeight}
                    onChange={(e) => setFormData({ ...formData, chargedWeight: e.target.value })}
                    className="w-full bg-transparent font-black text-sm focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div className="bg-olive-50 p-2 rounded-xl border border-olive-100">
                  <label className="block text-[9px] font-bold text-olive-600 uppercase mb-1">UNIT PRICE (₹)</label>
                  <input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    className="w-full bg-transparent font-black text-sm focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="bg-gray-900 p-4 rounded-xl shadow-lg">
                <label className="block text-[10px] font-black text-olive-400 uppercase mb-1">TOTAL AMOUNT (₹)</label>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-white">₹</span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full bg-transparent font-black text-2xl text-olive-400 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-6 sm:gap-8 items-end border-t border-gray-50 pt-8 mt-4">
          <div className="w-full bg-gray-50 p-4 sm:p-5 rounded-2xl flex items-center justify-between border border-dashed border-gray-200">
            <div>
              <div className="flex items-center gap-1.5 text-green-600 mb-1">
                <CheckCircle size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Verification Status</span>
              </div>
              <p className="font-handwriting text-xl sm:text-2xl text-gray-800" style={{ fontFamily: 'Dancing Script' }}>
                Digitally Verified
              </p>
            </div>
            <div className="h-10 w-10 bg-white rounded-full border border-gray-100 flex items-center justify-center text-olive-600 shadow-sm flex-shrink-0">
                <FileText size={18} />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3.5 sm:py-4 bg-olive-700 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-olive-100 hover:bg-olive-800 transition-all active:scale-95 text-xs sm:text-sm"
          >
            {initialData ? 'Update Consignment Note' : 'Submit Consignment Note'}
          </button>
        </div>
        </form>

        {/* Live Preview Side */}
        <div className={cn("xl:w-[210mm] w-full flex-shrink-0", !showPreview && "hidden")}>
          <div className="sticky top-24 overflow-x-auto pb-4">
            <div className="min-w-[600px] xl:min-w-0">
              <div 
                id="printable-pod-content"
                ref={printableRef}
                className="bg-white rounded-none w-full text-gray-800 p-[15mm] flex flex-col"
                style={{ minHeight: '100%', height: 'auto', overflow: 'visible' }}
              >
              <div className="border-b-2 border-olive-400 pb-4 mb-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-olive-600 p-2 rounded-lg text-white">
                    <Package size={24} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-gray-900 leading-none">DARBE <span className="text-olive-600">LOGISTICS</span></h1>
                    <p className="text-[8px] font-bold text-olive-600 uppercase tracking-widest mt-1">Consignment Note Receipt</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Shipment Date</span>
                  <input 
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="text-[10px] font-black text-olive-600 bg-transparent border-none outline-none focus:ring-0 text-right p-0"
                  />
                </div>
              </div>

              <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 mb-6">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-[10px] font-black text-olive-600 uppercase mb-2">Consignor / Sender</h4>
                    <p className="text-sm font-black uppercase text-gray-900 break-words">{formData.consignorName || 'N/A'}</p>
                    <p className="text-xs text-gray-500 mt-1 uppercase break-words">{formData.consignorAddress || 'N/A'}</p>
                    <div className="flex gap-4 mt-2">
                      <div>
                        <p className="text-[8px] font-bold text-gray-400 uppercase">GSTIN</p>
                        <p className="text-[10px] font-black text-olive-900">{formData.consignorGSTIN || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-gray-400 uppercase">PHONE</p>
                        <p className="text-[10px] font-bold text-gray-400">{formData.consignorPhone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="border-l border-gray-200 pl-8">
                    <h4 className="text-[10px] font-black text-olive-600 uppercase mb-2">Consignee / Receiver</h4>
                    <p className="text-sm font-black uppercase text-gray-900 break-words">{formData.consigneeName || 'N/A'}</p>
                    <p className="text-xs text-gray-500 mt-1 uppercase break-words">{formData.address || 'N/A'}</p>
                    <div className="flex gap-4 mt-2">
                      <div>
                        <p className="text-[8px] font-bold text-gray-400 uppercase">Destination</p>
                        <p className="text-[10px] font-black text-olive-900 uppercase">{formData.destination || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-gray-400 uppercase">PHONE</p>
                        <p className="text-[10px] font-bold text-gray-400">{formData.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-olive-50/20 p-6 rounded-2xl border border-olive-100 mb-6">
                <h4 className="text-[10px] font-black text-olive-600 uppercase mb-3">Shipment Details</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div>
                    <p className="text-[8px] font-bold text-gray-400 uppercase">Description</p>
                    <p className="text-xs font-black text-gray-900 uppercase">{formData.description || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-gray-400 uppercase">Quantity</p>
                    <p className="text-xs font-black text-gray-900 uppercase">{formData.quantity} {formData.packing || 'PIECES'}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-gray-400 uppercase">Charged Weight</p>
                    <p className="text-xs font-black text-olive-700 uppercase">{formData.chargedWeight} KG</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-gray-400 uppercase">Total Amount</p>
                    <p className="text-xs font-black text-olive-700">₹ {formData.amount || '0.00'}</p>
                  </div>
                </div>
              </div>

              {formData.amount && (
                <div className="mb-6 px-4 py-3 bg-olive-50/30 rounded-xl border border-olive-100/50">
                  <p className="text-[9px] font-black uppercase text-olive-400 tracking-wider mb-1">Amount in Words</p>
                  <p className="text-[11px] font-bold text-olive-700 italic">Rupees {numberToWords(Number(formData.amount))}</p>
                </div>
              )}

              <div className="text-[10px] text-gray-500 mb-8 italic text-center border-y border-gray-50 py-3">
                This document serves as an unofficial acknowledgment that the items mentioned above have been processed for transit via Darbe Logistics. Official L.R. will be issued post-inspection.
              </div>

              <div className="mt-auto grid grid-cols-2 gap-12 pt-12">
                <div className="text-center border-t border-gray-100 pt-3">
                  <p className="text-[9px] font-black uppercase text-gray-300">Customer Signature</p>
                </div>
                <div className="text-center border-t border-gray-100 pt-3">
                  <p className="text-[9px] font-black uppercase text-olive-600 mb-1">Darbe Logistics Official</p>
                  <p className="text-xs font-handwriting text-olive-900 font-bold" style={{fontFamily: 'Dancing Script'}}>Verified Electronic Copy</p>
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
