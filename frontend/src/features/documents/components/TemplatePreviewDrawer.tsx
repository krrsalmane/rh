import React, { useState } from 'react';
import { X, Eye, Code, Info, Pencil, Zap } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { Template } from '../types';

interface Props {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (template: Template) => void;
  onGenerate: (template: Template) => void;
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  archived: 'bg-slate-100 text-slate-500 border-slate-200',
};

const categoryColors: Record<string, string> = {
  contract: 'bg-blue-50 text-blue-700 border-blue-200',
  attestation: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  letter: 'bg-purple-50 text-purple-700 border-purple-200',
  custom: 'bg-slate-100 text-slate-600 border-slate-200',
};

const langFlags: Record<string, React.ReactNode> = {
  fr: (
    <svg viewBox="0 0 3 2" className="w-4 h-3 rounded-sm shadow-sm">
      <rect width="3" height="2" fill="#ED2939" />
      <rect width="2" height="2" fill="#fff" />
      <rect width="1" height="2" fill="#002395" />
    </svg>
  ),
  ar: (
    <svg viewBox="0 0 3 2" className="w-4 h-3 rounded-sm shadow-sm">
      <rect width="3" height="2" fill="#c1272d" />
      <circle cx="1.5" cy="1" r="0.4" fill="#006233" />
    </svg>
  ),
  en: (
    <svg viewBox="0 0 3 2" className="w-4 h-3 rounded-sm shadow-sm">
      <rect width="3" height="2" fill="#00247d" />
      <path d="M0,0 L3,2 M3,0 L0,2" stroke="#fff" strokeWidth="0.6" />
      <path d="M0,0 L3,2 M3,0 L0,2" stroke="#cf142b" strokeWidth="0.4" />
      <path d="M1.5,0 L1.5,2 M0,1 L3,1" stroke="#fff" strokeWidth="1" />
      <path d="M1.5,0 L1.5,2 M0,1 L3,1" stroke="#cf142b" strokeWidth="0.6" />
    </svg>
  ),
  de: (
    <svg viewBox="0 0 3 2" className="w-4 h-3 rounded-sm shadow-sm">
      <rect width="3" height="2" fill="#FFCE00" />
      <rect width="3" height="1.33" fill="#DD0000" />
      <rect width="3" height="0.66" fill="#000" />
    </svg>
  ),
};

function parseTemplateParts(fullBody: string) {
  const parts = {
    header: '',
    body: fullBody,
    footer: '',
    showHeader: false,
    showFooter: false
  };

  if (fullBody.includes('<!-- HEADER -->')) {
    const headerMatch = fullBody.match(/<!-- HEADER -->([\s\S]*?)<!-- END_HEADER -->/);
    if (headerMatch) {
      parts.header = headerMatch[1].trim();
      parts.showHeader = !fullBody.includes('<!-- HEADER_HIDDEN -->');
    }
    const bodyMatch = fullBody.match(/<!-- BODY -->([\s\S]*?)<!-- END_BODY -->/);
    if (bodyMatch) parts.body = bodyMatch[1].trim();
    const footerMatch = fullBody.match(/<!-- FOOTER -->([\s\S]*?)<!-- END_FOOTER -->/);
    if (footerMatch) {
      parts.footer = footerMatch[1].trim();
      parts.showFooter = !fullBody.includes('<!-- FOOTER_HIDDEN -->');
    }
  }

  return parts;
}

export const TemplatePreviewDrawer: React.FC<Props> = ({
  template, isOpen, onClose, onEdit, onGenerate
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'variables' | 'info'>('preview');
  const isArabic = template?.language === 'ar';

  if (!template) return null;

  const { header, body, footer, showHeader, showFooter } = parseTemplateParts(template.body || '');

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-slate-900 truncate">{template.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", categoryColors[template.category])}>
                  {template.category}
                </span>
                <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", statusColors[template.status])}>
                  {template.status}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">v{template.version}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6">
            {[
              { id: 'preview', label: 'Aperçu', icon: Eye },
              { id: 'variables', label: 'Variables', icon: Code },
              { id: 'info', label: 'Infos', icon: Info },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 pb-3 text-sm font-medium transition-all relative",
                  activeTab === tab.id
                    ? "text-slate-900"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/30">
          {activeTab === 'preview' && (
            <div className="h-full p-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
                <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Visualisation du document</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-200" />
                    <div className="w-2 h-2 rounded-full bg-slate-200" />
                    <div className="w-2 h-2 rounded-full bg-slate-200" />
                  </div>
                </div>
                <iframe
                  srcDoc={`
                    <html lang="${template.language}" dir="ltr">
                    <body>
                    <style>
                      body { font-family: sans-serif; line-height: 1.4; color: #334155; padding: 20px; margin: 0; direction: ltr; text-align: left; }
                      .zone-header { border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px; direction: ltr; text-align: left; }
                      .zone-footer { border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 15px; background: #f8fafc; font-size: 0.8em; direction: ltr; text-align: left; }
                      .zone-body { direction: ${isArabic ? 'rtl' : 'ltr'}; text-align: ${isArabic ? 'right' : 'left'}; }
                      h1, h2, h3 { color: #0f172a; margin-top: 1em; }
                      table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                      th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: ${isArabic ? 'right' : 'left'}; }
                      th { background: #f8fafc; font-weight: bold; }
                    </style>
                    <div class="content">
                      ${showHeader ? `<div class="zone-header">${header}</div>` : ''}
                      <div class="zone-body">${body}</div>
                      ${showFooter ? `<div class="zone-footer">${footer}</div>` : ''}
                    </div>
                    </body>
                    </html>
                  `}
                  title="Preview"
                  className="w-full h-full border-none bg-white"
                />
              </div>
            </div>
          )}

          {activeTab === 'variables' && (
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Champs de données ({template.variableSchema.length})</h3>
              {template.variableSchema.length > 0 ? (
                <div className="space-y-2">
                  {template.variableSchema.map((v, i) => (
                    <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between group hover:border-slate-300 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{v.label}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{"{{"}{v.name}{"}}"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {v.autoFill ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                            <span className="w-1 h-1 bg-blue-600 rounded-full" /> Auto-fill
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                            <span className="w-1 h-1 bg-amber-600 rounded-full" /> À remplir
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 uppercase font-bold">{v.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Code className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Aucune variable définie</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="p-6 space-y-6">
              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Statistiques d'utilisation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <p className="text-xs text-slate-400 mb-1">Documents générés</p>
                    <p className="text-2xl font-bold text-slate-900">{template.usageCount}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <p className="text-xs text-slate-400 mb-1">Version actuelle</p>
                    <p className="text-2xl font-bold text-slate-900">v{template.version}</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Historique</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Créé le</span>
                    <span className="text-slate-700 font-medium">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Créé par</span>
                    <span className="text-slate-700 font-medium">{template.createdBy || 'Système'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Langue</span>
                    <div className="flex items-center gap-2">
                      {langFlags[template.language]}
                      <span className="text-slate-700 font-bold uppercase">{template.language}</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 space-y-3 bg-white">
          <button
            onClick={() => onEdit(template)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Modifier le modèle
          </button>
          <button
            onClick={() => onGenerate(template)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
          >
            <Zap className="w-4 h-4 fill-white" />
            Utiliser ce modèle
          </button>
        </div>
      </div>
    </>
  );
};
