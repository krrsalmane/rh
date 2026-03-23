import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Undo2, Redo2, Table as TableIcon,
  Heading1, Heading2, Heading3, Plus, Trash2, GripVertical, Save, Send, Eye, Zap,
  Upload, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateTemplate, useUpdateTemplate } from '../hooks/useTemplates';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import type { VariableSchema, CreateTemplateDto, Template } from '../types';

const LABEL_MAP: Record<string, string> = {
  'employee.fullName': 'Nom complet', 'employee.firstName': 'Prénom',
  'employee.lastName': 'Nom de famille', 'employee.function': 'Fonction',
  'employee.department': 'Département', 'employee.hireDate': "Date d'embauche",
  'employee.salary': 'Salaire', 'employee.cin': 'CIN', 'employee.cne': 'CNE',
  'employee.email': 'Email', 'employee.phone': 'Téléphone', 'employee.address': 'Adresse',
  'employee.contractType': 'Type de contrat', 'company.name': "Nom de l'entreprise",
  'company.address': "Adresse de l'entreprise", 'meta.generatedAt': 'Date de génération',
  'meta.generatedYear': 'Année',
};

const EXAMPLE_HTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body>
<h2 style="text-align:center">ATTESTATION DE TRAVAIL</h2>
<p>Je soussigné(e), {{form.signataireName}}, agissant en qualité de {{form.signaireFunction}} de la société {{company.name}}, dont le siège social est situé à {{company.address}},</p>
<p>Atteste que Monsieur/Madame <strong>{{employee.fullName}}</strong>, titulaire de la CIN n° {{employee.cin}}, occupe le poste de <strong>{{employee.function}}</strong> au sein du département {{employee.department}}, depuis le {{employee.hireDate}}.</p>
<p>Cette attestation est délivrée pour : <strong>{{form.purpose}}</strong></p>
<p>Fait à {{company.address}}, le {{meta.generatedAt}}</p>
<br/><br/>
<p>Signature : ___________________</p>
<p>{{form.signataireName}}</p>
</body></html>`;


interface Props {
  template?: Template;
  onSave: () => void;
  isSaving: boolean;
}

const QUICK_VARS = [
  { label: 'Nom complet', value: '{{employee.fullName}}' },
  { label: 'Prénom', value: '{{employee.firstName}}' },
  { label: 'Nom', value: '{{employee.lastName}}' },
  { label: 'Fonction', value: '{{employee.function}}' },
  { label: 'Département', value: '{{employee.department}}' },
  { label: 'Date embauche', value: '{{employee.hireDate}}' },
  { label: 'Salaire', value: '{{employee.salary}}' },
  { label: 'CIN', value: '{{employee.cin}}' },
  { label: 'Entreprise', value: '{{company.name}}' },
  { label: 'Date du jour', value: '{{meta.generatedAt}}' },
];

export const TemplateBuilder: React.FC<Props> = ({ template, onSave }) => {
  const [name, setName] = useState(template?.name || '');
  const [category, setCategory] = useState<CreateTemplateDto['category']>(template?.category || 'attestation');
  const [language, setLanguage] = useState<'fr' | 'ar' | 'en' | 'de'>(template?.language || 'fr');
  const [variableSchema, setVariableSchema] = useState<VariableSchema[]>(template?.variableSchema || []);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [liveHtml, setLiveHtml] = useState(template?.body || '');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const editor = useEditor({
    extensions: [
      StarterKit, Underline, TextStyle, Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell,
    ],
    content: template?.body || '<p>Commencez à rédiger votre modèle ici...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[600px] p-10 bg-white shadow-inner rounded-2xl border border-slate-100',
        style: 'font-family: Arial, sans-serif; font-size: 14px; line-height: 1.8;',
      },
    },
    onUpdate: ({ editor }) => {
      setLiveHtml(editor.getHTML());
    },
  });

  useEffect(() => {
    if (template && editor) {
      if (editor.getHTML() !== template.body) {
        editor.commands.setContent(template.body || '');
      }
      setName(template.name || '');
      setCategory(template.category || 'attestation');
      setLanguage(template.language || 'fr');
      setVariableSchema(template.variableSchema || []);
    }
  }, [template, editor]);

  const insertVariable = useCallback((variable: string) => {
    if (editor) {
      editor.chain().focus().insertContent(variable).run();
    }
  }, [editor]);

  const downloadExample = () => {
    const blob = new Blob([EXAMPLE_HTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exemple-template-mayahr.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportHTML = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const html = ev.target?.result as string;
      // Extract body content if full HTML document
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const bodyContent = bodyMatch ? bodyMatch[1] : html;

      // Auto-detect all {{variables}}
      const varMatches = bodyContent.match(/\{\{([^}]+)\}\}/g) || [];
      const unique = [...new Set(varMatches.map(v => v.replace(/\{\{|\}\}/g, '').trim()))];

      const schema: VariableSchema[] = unique.map(varName => {
        const isAutoFill = varName.startsWith('employee.') || varName.startsWith('company.') || varName.startsWith('meta.');
        let type: VariableSchema['type'] = 'text';
        const lower = varName.toLowerCase();
        if (lower.includes('date') || lower.includes('naissance')) type = 'date';
        else if (lower.includes('salary') || lower.includes('salaire') || lower.includes('montant') || lower.includes('prime')) type = 'currency';
        else if (lower.includes('nombre') || lower.includes('duree') || lower.includes('period')) type = 'number';

        const rawLabel = varName.replace(/^(form|employee|company|meta)\./, '');
        const label = LABEL_MAP[varName] || (
          rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1).replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')
        );
        return { name: varName, label, type, required: !isAutoFill, autoFill: isAutoFill };
      });

      editor?.commands.setContent(bodyContent);
      setLiveHtml(bodyContent);
      setVariableSchema(schema);

      const formVars = unique.filter(v => v.startsWith('form.'));
      const autoVars = unique.filter(v => !v.startsWith('form.'));
      console.log('Variables détectées:', unique);
      toast.success(
        `✅ Template importé ! ${unique.length} variable(s) : ${autoVars.length} auto-remplie(s), ${formVars.length} à remplir.`,
        { duration: 5000 }
      );
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const addVariable = () => {
    setVariableSchema([...variableSchema, {
      name: 'form.variable', label: 'Nouvelle variable', type: 'text', required: true, autoFill: false,
    }]);
  };

  const updateVariable = (index: number, updates: Partial<VariableSchema>) => {
    const copy = [...variableSchema];
    copy[index] = { ...copy[index], ...updates };
    setVariableSchema(copy);
  };

  const removeVariable = (index: number) => {
    setVariableSchema(variableSchema.filter((_, i) => i !== index));
  };

  const handleSave = (status: 'draft' | 'active') => {
    const body = editor?.getHTML() || '';

    // Auto-detect variables if schema is minimal
    let finalSchema = variableSchema;
    if (variableSchema.length === 0) {
      const matches = body.match(/\{\{([^}]+)\}\}/g) || [];
      const distinct = [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '').trim()))];
      finalSchema = distinct.map(v => ({
        name: v,
        label: v.split('.').pop() || v,
        type: 'text',
        required: v.startsWith('form.'),
        autoFill: !v.startsWith('form.'),
      })) as VariableSchema[];
    }

    const data: CreateTemplateDto = { name, category, language, body, variableSchema: finalSchema, status };

    if (template?.id && template.id !== 'new') {
      updateMutation.mutate({ id: template.id, data }, { onSuccess: onSave });
    } else {
      createMutation.mutate(data, { onSuccess: onSave });
    }
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* ── Main Editor Column ── */}
      <div className="flex-1 space-y-6">
        {/* Variable Toolbar */}
        <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Zap className="w-3 h-3 text-sky-500" />
              Insertion rapide
            </div>
            {/* Import / Download buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={downloadExample}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all"
                type="button"
                title="Télécharger un fichier HTML d'exemple"
              >
                <Download className="w-3.5 h-3.5" />
                Exemple HTML
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-dashed border-sky-300 rounded-lg hover:border-sky-500 hover:bg-sky-50 text-sky-600 transition-all font-semibold"
                type="button"
                title="Importer un fichier HTML avec variables"
              >
                <Upload className="w-3.5 h-3.5" />
                Importer HTML
              </button>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm"
                className="hidden"
                onChange={handleImportHTML}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_VARS.map((v) => (
              <button
                key={v.value}
                onClick={() => insertVariable(v.value)}
                className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-white border border-sky-100 hover:border-sky-300 hover:bg-sky-50 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
                type="button"
              >
                <Plus className="w-3 h-3 text-sky-400" />
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* TipTap Container */}
        <div className="space-y-4">
          {/* TipTap Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex flex-wrap items-center gap-0.5 p-2 bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
              <ToolbarBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} icon={Bold} title="Gras" />
              <ToolbarBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} icon={Italic} title="Italique" />
              <ToolbarBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} icon={UnderlineIcon} title="Souligné" />
              <span className="w-px h-5 bg-slate-200 mx-1" />
              <ToolbarBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} icon={Heading1} title="H1" />
              <ToolbarBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} icon={Heading2} title="H2" />
              <ToolbarBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} icon={Heading3} title="H3" />
              <span className="w-px h-5 bg-slate-200 mx-1" />
              <ToolbarBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} icon={AlignLeft} title="Gauche" />
              <ToolbarBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} icon={AlignCenter} title="Centre" />
              <ToolbarBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} icon={AlignRight} title="Droite" />
              <span className="w-px h-5 bg-slate-200 mx-1" />
              <ToolbarBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} icon={List} title="List" />
              <ToolbarBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={ListOrdered} title="Numbers" />
              <span className="w-px h-5 bg-slate-200 mx-1" />
              <ToolbarBtn active={false} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} icon={TableIcon} title="Tableau" />
              <span className="w-px h-5 bg-slate-200 mx-1" />
              <ToolbarBtn active={false} onClick={() => editor.chain().focus().undo().run()} icon={Undo2} title="Annuler" />
              <ToolbarBtn active={false} onClick={() => editor.chain().focus().redo().run()} icon={Redo2} title="Rétablir" />

              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setIsPreviewOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-xl transition-all"
                  type="button"
                >
                  <Eye className="w-4 h-4" /> Aperçu HD
                </button>
              </div>
            </div>

            <div className="bg-slate-50/30 p-8 min-h-[700px]">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Sidebar Column ── */}
      <div className="w-full lg:w-80 space-y-6">
        {/* General Info */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuration</p>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nom du modèle *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Ex: Attestation de travail" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Catégorie</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="input-field text-sm">
                <option value="attestation">Attestation</option>
                <option value="contract">Contrat</option>
                <option value="letter">Lettre</option>
                <option value="custom">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Langue</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value as any)} className="input-field text-sm">
                <option value="fr">FR</option>
                <option value="ar">AR</option>
                <option value="en">EN</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Variables */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Variables Formulaire</p>
            <button onClick={addVariable} className="text-sky-600 hover:text-sky-700 transition-colors" type="button">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {variableSchema.map((v, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col gap-2 relative">
                <button onClick={() => removeVariable(i)} className="absolute -top-1 -right-1 w-5 h-5 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:border-rose-200 shadow-sm transition-all" type="button">
                  <Trash2 className="w-3 h-3" />
                </button>
                <div className="flex items-center gap-2">
                  <GripVertical className="w-3 h-3 text-slate-300 shrink-0" />
                  <input
                    value={v.name}
                    onChange={(e) => updateVariable(i, { name: e.target.value })}
                    className="flex-1 text-[10px] font-mono bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-sky-300 transition-all"
                    placeholder="form.id"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <input
                    value={v.label}
                    onChange={(e) => updateVariable(i, { label: e.target.value })}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1"
                    placeholder="Libellé"
                  />
                  <select
                    value={v.type}
                    onChange={(e) => updateVariable(i, { type: e.target.value as any })}
                    className="bg-white border border-slate-200 rounded-lg px-1 py-1"
                  >
                    <option value="text">Texte</option>
                    <option value="date">Date</option>
                    <option value="number">Nombre</option>
                    <option value="currency">Montant</option>
                  </select>
                </div>
              </div>
            ))}
            {variableSchema.length === 0 && (
              <p className="text-[10px] text-slate-400 text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Aucune variable manuelle
              </p>
            )}
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => handleSave('active')}
            disabled={isPending || !name}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 text-sm font-black text-white bg-sky-500 hover:bg-sky-600 rounded-2xl transition-all shadow-xl shadow-sky-500/20 disabled:opacity-50 active:scale-[0.98]"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Publier le modèle
          </button>
          <button
            onClick={() => handleSave('draft')}
            disabled={isPending || !name}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Enregistrer brouillon
          </button>
        </div>
      </div>

      {/* Preview Modal Overlay */}
      <TemplatePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        template={{
          id: template?.id || 'preview',
          name: name || 'Nouveau modèle',
          category, language, body: liveHtml,
          variableSchema, status: 'draft', version: template?.version || 1,
          usageCount: 0, createdAt: new Date().toISOString()
        } as Template}
      />
    </div>
  );
};

function ToolbarBtn({ active, onClick, icon: Icon, title }: { active: boolean; onClick: () => void; icon: React.ElementType; title: string }) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-lg transition-all ${active ? 'bg-sky-100 text-sky-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
      title={title}
      type="button"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
