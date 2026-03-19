import React, { useState, useCallback, useEffect } from 'react';
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
  Heading1, Heading2, Heading3, Plus, Trash2, GripVertical, Save, Send,
} from 'lucide-react';
import type { VariableSchema, CreateTemplateDto, Template } from '../types';

interface Props {
  template?: Template;
  onSave: (data: CreateTemplateDto) => void;
  isSaving: boolean;
}

const VARIABLE_SHORTCUTS = [
  { label: 'Nom complet', value: '{{employee.fullName}}', name: 'employee.fullName' },
  { label: 'Fonction', value: '{{employee.function}}', name: 'employee.function' },
  { label: 'Date embauche', value: '{{employee.hireDate}}', name: 'employee.hireDate' },
  { label: 'Département', value: '{{employee.department}}', name: 'employee.department' },
  { label: 'Salaire', value: '{{employee.salary}}', name: 'employee.salary' },
  { label: 'CIN', value: '{{employee.cin}}', name: 'employee.cin' },
];

export const TemplateBuilder: React.FC<Props> = ({ template, onSave, isSaving }) => {
  const [name, setName] = useState(template?.name || '');
  const [category, setCategory] = useState<CreateTemplateDto['category']>(template?.category || 'attestation');
  const [language, setLanguage] = useState<'fr' | 'ar' | 'en' | 'de'>(template?.language || 'fr');
  const [variableSchema, setVariableSchema] = useState<VariableSchema[]>(template?.variableSchema || []);


  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: template?.body || '<p>Commencez à rédiger votre modèle ici...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  useEffect(() => {
    if (template && editor) {
      editor.commands.setContent(template.body || '');
    }
  }, [template, editor]);

  const insertVariable = useCallback((variable: string) => {
    if (editor) {
      editor.chain().focus().insertContent(variable).run();
    }
  }, [editor]);

  const addVariable = () => {
    setVariableSchema([...variableSchema, {
      name: 'form.new_variable',
      label: 'Nouvelle variable',
      type: 'text',
      required: false,
      autoFill: false,
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
    onSave({ name, category, language, body, variableSchema, status });
  };

  if (!editor) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" id="template-builder">
      {/* LEFT PANEL — Editor (60%) */}
      <div className="lg:col-span-3 space-y-4">
        {/* Variable Insert Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Insérer une variable</p>
          <div className="flex flex-wrap gap-1.5">
            {VARIABLE_SHORTCUTS.map((v) => (
              <button
                key={v.name}
                onClick={() => insertVariable(v.value)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
                type="button"
              >
                {v.label}
              </button>
            ))}
            <button
              onClick={() => {
                const varName = prompt('Nom de la variable (ex: form.motif)');
                if (varName) insertVariable(`{{${varName}}}`);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              type="button"
            >
              <Plus className="w-3 h-3" /> Variable
            </button>
          </div>
        </div>

        {/* TipTap Toolbar */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-slate-100 bg-slate-50/50">
            <ToolbarBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} icon={Bold} title="Gras" />
            <ToolbarBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} icon={Italic} title="Italique" />
            <ToolbarBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} icon={UnderlineIcon} title="Souligné" />
            <ToolbarBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} icon={Strikethrough} title="Barré" />
            <span className="w-px h-5 bg-slate-200 mx-1" />
            <ToolbarBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} icon={Heading1} title="Titre 1" />
            <ToolbarBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} icon={Heading2} title="Titre 2" />
            <ToolbarBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} icon={Heading3} title="Titre 3" />
            <span className="w-px h-5 bg-slate-200 mx-1" />
            <ToolbarBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} icon={List} title="Liste" />
            <ToolbarBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={ListOrdered} title="Liste numérotée" />
            <span className="w-px h-5 bg-slate-200 mx-1" />
            <ToolbarBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} icon={AlignLeft} title="Gauche" />
            <ToolbarBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} icon={AlignCenter} title="Centre" />
            <ToolbarBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} icon={AlignRight} title="Droite" />
            <span className="w-px h-5 bg-slate-200 mx-1" />
            <ToolbarBtn active={false} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} icon={TableIcon} title="Tableau" />
            <span className="w-px h-5 bg-slate-200 mx-1" />
            <ToolbarBtn active={false} onClick={() => editor.chain().focus().undo().run()} icon={Undo2} title="Annuler" />
            <ToolbarBtn active={false} onClick={() => editor.chain().focus().redo().run()} icon={Redo2} title="Rétablir" />
          </div>

          {/* Editor Content */}
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* RIGHT PANEL — Settings + Schema (40%) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Template Settings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Paramètres</h3>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Nom du modèle *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Nom" id="tpl-name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Catégorie *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="input-field" id="tpl-category">
                <option value="attestation">Attestation</option>
                <option value="contract">Contrat</option>
                <option value="letter">Lettre</option>
                <option value="custom">Personnalisé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Langue</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value as any)} className="input-field" id="tpl-language">
                <option value="fr">Français</option>
                <option value="ar">Arabe</option>
                <option value="en">Anglais</option>
                <option value="de">Allemand</option>
              </select>
            </div>
          </div>
        </div>

        {/* Variable Schema Editor */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Variables</h3>
            <button onClick={addVariable} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors" type="button">
              <Plus className="w-3 h-3" /> Ajouter
            </button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {variableSchema.map((v, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <input
                    value={v.name}
                    onChange={(e) => updateVariable(i, { name: e.target.value })}
                    className="flex-1 text-xs font-mono bg-white border border-slate-200 rounded px-2 py-1"
                    placeholder="form.name"
                  />
                  <button onClick={() => removeVariable(i)} className="p-1 text-slate-400 hover:text-rose-500" type="button">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    value={v.label}
                    onChange={(e) => updateVariable(i, { label: e.target.value })}
                    className="bg-white border border-slate-200 rounded px-2 py-1"
                    placeholder="Label"
                  />
                  <select
                    value={v.type}
                    onChange={(e) => updateVariable(i, { type: e.target.value as any })}
                    className="bg-white border border-slate-200 rounded px-2 py-1"
                  >
                    <option value="text">Texte</option>
                    <option value="textarea">Zone de texte</option>
                    <option value="date">Date</option>
                    <option value="number">Nombre</option>
                    <option value="currency">Montant</option>
                    <option value="select">Sélection</option>
                  </select>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={v.required} onChange={(e) => updateVariable(i, { required: e.target.checked })} className="rounded border-slate-300 text-sky-500" />
                    Requis
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={v.autoFill} onChange={(e) => updateVariable(i, { autoFill: e.target.checked })} className="rounded border-slate-300 text-sky-500" />
                    Auto-rempli
                  </label>
                </div>
              </div>
            ))}
            {variableSchema.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">Aucune variable définie</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => handleSave('draft')}
            disabled={isSaving || !name}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            id="tpl-save-draft"
          >
            <Save className="w-4 h-4" />
            Brouillon
          </button>
          <button
            onClick={() => handleSave('active')}
            disabled={isSaving || !name}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors shadow-lg shadow-sky-500/20 disabled:opacity-50"
            id="tpl-publish"
          >
            <Send className="w-4 h-4" />
            Publier
          </button>
        </div>
      </div>
    </div>
  );
};

// Toolbar button component
function ToolbarBtn({ active, onClick, icon: Icon, title }: { active: boolean; onClick: () => void; icon: React.ElementType; title: string }) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-sky-100 text-sky-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
      title={title}
      type="button"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
