import React, { useState } from 'react';
import { FileCheck, FileText, Receipt, Plus } from 'lucide-react';
import AcknowledgmentForm from '../components/forms/AcknowledgmentForm';
import ConsignorNoteForm from '../components/forms/ConsignorNoteForm';
import InvoiceGenerator from '../components/forms/InvoiceGenerator';
import { cn } from '../lib/utils';

type ActiveTab = 'acknowledgment' | 'consignor_note' | 'invoice';

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('acknowledgment');

  const tabs = [
    { id: 'acknowledgment', label: 'Consignor Note', icon: FileText },
    { id: 'consignor_note', label: 'Acknowledgment', icon: FileCheck },
    { id: 'invoice', label: 'Invoice Generator', icon: Receipt },
  ] as const;

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8 no-print">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Staff Dashboard</h1>
        <p className="text-sm text-gray-500 italic">Create entries for logistics documentation.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
        {/* Sidebar Tabs - Horizontal scroll on mobile */}
        <aside className="lg:w-64 flex-shrink-0 no-print">
          <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all uppercase tracking-wider",
                    activeTab === tab.id
                      ? "bg-olive-600 text-white shadow-lg shadow-olive-100"
                      : "text-gray-500 hover:bg-white hover:text-olive-600 hover:shadow-sm bg-gray-50 lg:bg-transparent"
                  )}
                >
                  <Icon size={18} />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-50 p-4 sm:p-6 lg:p-8 min-h-[600px]">
          <div className={cn(activeTab === 'acknowledgment' ? 'block' : 'hidden')}>
            <AcknowledgmentForm />
          </div>
          <div className={cn(activeTab === 'consignor_note' ? 'block' : 'hidden')}>
            <ConsignorNoteForm />
          </div>
          <div className={cn(activeTab === 'invoice' ? 'block' : 'hidden')}>
            <InvoiceGenerator />
          </div>
        </div>
      </div>
    </div>
  );
}
