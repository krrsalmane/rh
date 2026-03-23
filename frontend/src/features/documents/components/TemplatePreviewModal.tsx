import React, { useState, useMemo } from 'react';
import { X, Eye, Code, Pencil, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Template } from '../types';

interface Props {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_DATA: Record<string, string> = {
  'employee.fullName': 'Youssef Alami',
  'employee.firstName': 'Youssef',
  'employee.lastName': 'Alami',
  'employee.function': 'Développeur Senior',
  'employee.department': 'Informatique',
  'employee.hireDate': '15/01/2022',
  'employee.salary': '12 000,00 MAD',
  'employee.cin': 'AB123456',
  'employee.cne': 'CNE123456',
  'employee.email': 'youssef.alami@maya.ma',
  'employee.phone': '0661234567',
  'employee.address': 'Casablanca, Maroc',
  'employee.contractType': 'CDI',
  'company.name': 'Maya HR Group',
  'company.address': 'Casablanca, Maroc',
  'meta.generatedAt': new Date().toLocaleDateString('fr-FR'),
  'meta.generatedYear': new Date().getFullYear().toString(),
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

function buildPreviewHtml(html: string): string {
  if (!html) return '';
  
  return html.replace(/\{\{([^}]+)\}\}/g, (_, varName) => {
    const key = varName.trim();
    if (SAMPLE_DATA[key]) {
      let bg = '#dbeafe';
      let co = '#1e40af';
      if (key.startsWith('company.')) { bg = '#f1f5f9'; co = '#475569'; }
      if (key.startsWith('meta.')) { bg = '#d1fae5'; co = '#065f46'; }
      
      return `<mark style="background:${bg};color:${co};padding:0 4px;border-radius:3px;font-weight:bold;font-style:normal;font-family:sans-serif;font-size:0.9em;">${SAMPLE_DATA[key]}</mark>`;
    }
    return `<mark style="background:#fef3c7;color:#92400e;padding:0 4px;border-radius:3px;font-style:italic;font-family:sans-serif;font-size:0.9em;">[${key.replace('form.','')}]</mark>`;
  });
}

const categoryLabels: Record<string, string> = {
  contract: 'Contrat', attestation: 'Attestation', letter: 'Lettre', custom: 'Personnalisé',
};

export const TemplatePreviewModal: React.FC<Props> = ({ template, isOpen, onClose }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [zoom, setZoom] = useState(100);
  const [isCopied, setIsCopied] = useState(false);

  console.log('TemplatePreviewModal — template:', template?.name, '| body length:', template?.body?.length ?? 0);

  const { header, body, footer, showHeader, showFooter } = useMemo(() => {
    return parseTemplateParts(template?.body || '');
  }, [template?.body]);

  const variables = useMemo(() => {
    if (!template?.body) return [];
    const matches = template.body.match(/\{\{([^}]+)\}\}/g) || [];
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '').trim()))];
  }, [template?.body]);

  const handleCopy = () => {
    if (!template?.body) return;
    navigator.clipboard.writeText(template.body);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex overflow-hidden">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
              <Eye className="w-4 h-4 text-sky-400" />
            </div>
            <h3 className="text-white font-bold text-sm leading-tight truncate" title={template.name}>{template.name}</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px] font-bold">v{template.version}</span>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold">{template.language.toUpperCase()}</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px]">{categoryLabels[template.category] || template.category}</span>
          </div>
        </div>

        {/* Detected Variables */}
        <div className="p-4 border-b border-slate-800 flex-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Variables détectées ({variables.length})</p>
          {variables.length === 0 ? (
            <p className="text-xs text-slate-600 italic">Aucune variable</p>
          ) : (
            <div className="space-y-1.5 overflow-y-auto max-h-[300px] custom-scrollbar">
              {variables.map(v => {
                let dotColor = 'bg-slate-500';
                let textColor = 'text-slate-400';
                let label = v;
                if (v.startsWith('employee.')) { dotColor = 'bg-blue-500'; textColor = 'text-blue-300'; label = v.replace('employee.', ''); }
                else if (v.startsWith('company.')) { dotColor = 'bg-slate-400'; textColor = 'text-slate-300'; label = v.replace('company.', ''); }
                else if (v.startsWith('meta.')) { dotColor = 'bg-emerald-500'; textColor = 'text-emerald-300'; label = v.replace('meta.', ''); }
                else if (v.startsWith('form.')) { dotColor = 'bg-amber-500'; textColor = 'text-amber-300'; label = v.replace('form.', '') + ' (À remplir)'; }
                return (
                  <div key={v} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                    <span className={`text-xs truncate ${textColor}`} title={v}>{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 space-y-2">
          <button
            onClick={() => { onClose(); navigate(`/templates/${template.id}/edit`); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-600 text-slate-200 text-sm font-semibold hover:bg-slate-800 transition-all"
          >
            <Pencil className="w-4 h-4" /> Modifier le modèle
          </button>
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-slate-500 text-sm font-medium hover:text-slate-300 hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" /> Fermer
          </button>
        </div>
      </aside>

      {/* CENTER PANEL */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'preview' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Eye className="w-4 h-4" /> Aperçu Document
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'code' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Code className="w-4 h-4" /> Code Source
            </button>
          </div>

          {activeTab === 'preview' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Zoom:</span>
              {[75, 100, 125].map(z => (
                <button
                  key={z}
                  onClick={() => setZoom(z)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    zoom === z ? 'border-sky-500 bg-sky-50 text-sky-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {z}%
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              {isCopied ? <><Check className="w-4 h-4 text-emerald-500" /> Copié !</> : <><Copy className="w-4 h-4" /> Copier</>}
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className={`flex-1 overflow-y-auto ${activeTab === 'preview' ? 'bg-slate-200' : 'bg-slate-950'}`}>
          {activeTab === 'preview' ? (
            <div className="py-10 px-6 flex justify-center">
              {/* A4 Paper */}
              <div
                style={{
                  width: '794px',
                  minHeight: '1123px',
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                  marginBottom: zoom < 100 ? `-${(100 - zoom) * 11}px` : '0',
                }}
                className="bg-white shadow-2xl rounded-sm flex flex-col overflow-hidden"
              >
                {/* 1. Dynamic Header */}
                {showHeader && (
                   <div 
                    className="p-10 border-b-2 border-slate-100" 
                    dangerouslySetInnerHTML={{ __html: buildPreviewHtml(header) }} 
                  />
                )}

                {/* 2. Document Body */}
                <iframe
                  srcDoc={`
                    <style>
                      body { font-family: sans-serif; line-height: 1.6; color: #334155; padding: 40px 64px; }
                      h1, h2, h3 { color: #0f172a; margin-top: 1.5em; }
                      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                      th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
                      th { background: #f8fafc; font-weight: bold; }
                    </style>
                    ${buildPreviewHtml(body)}
                  `}
                  className="flex-1 w-full border-none"
                  style={{ background: 'white' }}
                  sandbox="allow-same-origin"
                  title="Aperçu du document"
                />

                {/* 3. Dynamic Footer */}
                {showFooter && (
                  <div 
                    className="p-8 bg-slate-50 border-t border-slate-200"
                    dangerouslySetInnerHTML={{ __html: buildPreviewHtml(footer) }}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 h-full flex flex-col">
              <div className="flex-1 flex font-mono text-xs leading-relaxed overflow-auto">
                {/* Line numbers */}
                <div className="select-none text-slate-600 text-right pr-5 pt-1 border-r border-slate-800 mr-5 min-w-[3rem]">
                  {(body || '').split('\n').map((_, i) => (
                    <div key={i} className="leading-relaxed">{i + 1}</div>
                  ))}
                </div>
                <pre className="text-emerald-400 whitespace-pre-wrap break-words flex-1 pt-1 pb-10">
                  {body || '// Aucun contenu HTML trouvé dans ce modèle'}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Legend Bar (preview only) */}
        {activeTab === 'preview' && (
          <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center gap-6 shrink-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Légende:</span>
            <span className="flex items-center gap-1.5 text-xs">
              <span style={{background:'#dbeafe',color:'#1e40af',padding:'1px 8px',borderRadius:'4px',fontWeight:600}}>Données employé</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <span style={{background:'#f1f5f9',color:'#475569',padding:'1px 8px',borderRadius:'4px',fontWeight:600}}>Données entreprise</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <span style={{background:'#d1fae5',color:'#065f46',padding:'1px 8px',borderRadius:'4px',fontWeight:600}}>Métadonnées</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <span style={{background:'#fef3c7',color:'#92400e',padding:'1px 8px',borderRadius:'4px',fontStyle:'italic'}}>À remplir par HR</span>
            </span>
          </div>
        )}
      </main>
    </div>
  );
};
