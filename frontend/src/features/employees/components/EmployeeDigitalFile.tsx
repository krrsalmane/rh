import React, { useState } from 'react';
import { FileText, Clock, UserX, CalendarDays } from 'lucide-react';

const tabs = [
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'time', label: 'Temps', icon: Clock },
  { key: 'absences', label: 'Absences', icon: UserX },
  { key: 'leaves', label: 'Congés', icon: CalendarDays },
] as const;

export const EmployeeDigitalFile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('documents');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden" id="employee-digital-file">
      {/* Tab headers */}
      <div className="flex border-b border-slate-100">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                isActive
                  ? 'text-sky-600 border-sky-500 bg-sky-50/50'
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
              }`}
              id={`tab-${tab.key}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="p-8 flex flex-col items-center justify-center min-h-[200px] text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
          {React.createElement(tabs.find((t) => t.key === activeTab)?.icon || FileText, { className: 'w-6 h-6 text-slate-400' })}
        </div>
        <p className="text-sm font-medium text-slate-600">Module en cours de développement</p>
        <p className="text-xs text-slate-400 mt-1">Cette fonctionnalité sera disponible prochainement</p>
      </div>
    </div>
  );
};
