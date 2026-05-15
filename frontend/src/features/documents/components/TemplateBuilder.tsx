import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import clsx from 'clsx';
import {
  Bold, Italic, Underline as UnderlineIcon, List,
  AlignCenter, Undo2,
  Plus, Trash2, GripVertical, Save, Send, Eye, EyeOff, Zap,
  Upload, Pencil, Settings, X, Image as ImageIcon,
  Type, Layers, Layout, RotateCcw, MousePointer2, Database
} from 'lucide-react';

interface HeaderConfig {
  title: string;
  subtitle: string;
  infoLine: string;
  logoUrl: string | null;
  logoSize: number;
  showDivider: boolean;
  textAlign: 'between' | 'left' | 'center' | 'right';
  layout: 'standard' | 'minimal' | 'centered';
}

interface FooterConfig {
  leftText: string;
  centerText: string;
  rightText: string;
  showDivider: boolean;
  showPageNumber: boolean;
}

type SupportedLang = 'fr' | 'ar' | 'en' | 'de';

const SUPPORTED_LANGS: SupportedLang[] = ['fr', 'ar', 'en', 'de'];

const FONT_SIZES = ['10pt', '11pt', '12pt', '13pt', '14pt', '16pt', '18pt', '20pt'];

const TEXT_STYLE_PRESETS = [
  { label: 'Default', value: 'default', attrs: {} },
  { label: 'Serif (Corporate)', value: 'serif', attrs: { fontFamily: 'Merriweather, serif' } },
  { label: 'Blackletter', value: 'blackletter', attrs: { fontFamily: 'UnifrakturCook, serif' } },
  { label: 'Script', value: 'script', attrs: { fontFamily: 'Great Vibes, cursive' } },
  { label: 'Monospace', value: 'mono', attrs: { fontFamily: 'Courier New, monospace' } },
  { label: 'Rounded', value: 'rounded', attrs: { fontFamily: 'Fredoka, sans-serif' } },
  { label: 'Small Caps', value: 'smallcaps', attrs: { fontVariant: 'small-caps', letterSpacing: '0.03em' } },
  { label: 'Wide', value: 'wide', attrs: { letterSpacing: '0.2em', textTransform: 'uppercase' } },
];

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

const TextStyleExtras = Extension.create({
  name: 'textStyleExtras',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element) => element.style.fontFamily || null,
            renderHTML: (attributes) => {
              if (!attributes.fontFamily) return {};
              return { style: `font-family: ${attributes.fontFamily}` };
            },
          },
          fontVariant: {
            default: null,
            parseHTML: (element) => element.style.fontVariant || null,
            renderHTML: (attributes) => {
              if (!attributes.fontVariant) return {};
              return { style: `font-variant: ${attributes.fontVariant}` };
            },
          },
          letterSpacing: {
            default: null,
            parseHTML: (element) => element.style.letterSpacing || null,
            renderHTML: (attributes) => {
              if (!attributes.letterSpacing) return {};
              return { style: `letter-spacing: ${attributes.letterSpacing}` };
            },
          },
          textTransform: {
            default: null,
            parseHTML: (element) => element.style.textTransform || null,
            renderHTML: (attributes) => {
              if (!attributes.textTransform) return {};
              return { style: `text-transform: ${attributes.textTransform}` };
            },
          },
        },
      },
    ];
  },
});

const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  title: '{{company.name}}',
  subtitle: '{{company.address}}',
  infoLine: '{{meta.generatedAt}}',
  logoUrl: null,
  logoSize: 60,
  showDivider: false,
  textAlign: 'between',
  layout: 'standard',
};

const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  leftText: '',
  centerText: '',
  rightText: '',
  showDivider: false,
  showPageNumber: false,
};

const generateHeaderHtml = (config: HeaderConfig) => {
  const align = config.textAlign === 'between' ? 'space-between' :
    config.textAlign === 'center' ? 'center' :
      config.textAlign === 'right' ? 'flex-end' : 'flex-start';
  const logoSrc = config.logoUrl || '';

  return `
<div style="width:100%;display:flex;justify-content:${align};align-items:flex-start;padding-bottom:16px;${config.showDivider ? 'border-bottom:2px solid #e2e8f0;' : ''}margin-bottom:24px;font-family:sans-serif;">
  <div style="display:flex;${config.textAlign === 'right' ? 'flex-direction:row-reverse;' : 'flex-direction:row;'}align-items:center;gap:16px;">
    <div id="logo-container" data-field="logo">
      ${config.logoUrl ? `<img src="${logoSrc}" style="height:${config.logoSize}px;width:auto;" />` : ''}
    </div>
    <div style="text-align:${config.textAlign === 'center' ? 'center' : 'left'};">
      <div data-field="title" style="font-size:16pt;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:0.02em;">${config.title}</div>
      <div data-field="subtitle" style="font-size:9.5pt;color:#64748b;margin-top:2px;">${config.subtitle}</div>
    </div>
  </div>
  ${config.textAlign === 'between' ? `
  <div data-field="infoLine" style="text-align:right;font-size:10.5pt;color:#475569;font-weight:600;margin-top:2px;">
    ${config.infoLine}
  </div>` : ''}
</div>
`.trim();
};

const generateFooterHtml = (config: FooterConfig) => {
  return `
<div style="width:100%;margin-top:40px;padding-top:20px;${config.showDivider ? 'border-top:1px solid #f1f5f9;' : ''}display:flex;justify-content:space-between;align-items:flex-end;font-size:8.5pt;color:#94a3b8;font-family:sans-serif;">
  <div data-field="leftText" style="flex:1;text-align:left;font-weight:600;color:#64748b;">${config.leftText}</div>
  <div data-field="centerText" style="flex:2;text-align:center;">${config.centerText}</div>
  <div data-field="rightText" style="flex:1;text-align:right;display:flex;flex-direction:column;gap:4px;align-items:flex-end;">
    <span>${config.rightText}</span>
    ${config.showPageNumber ? '<span style="font-weight:600;color:#64748b;">Page 1/1</span>' : ''}
  </div>
</div>
`.trim();
};

const PREVIEW_DATA: Record<string, string> = {
  'employee.fullName': 'Jean Dupont',
  'employee.firstName': 'Jean',
  'employee.lastName': 'Dupont',
  'employee.function': 'Directeur Commercial',
  'employee.department': 'Ventes',
  'employee.hireDate': '01/01/2020',
  'employee.salary': '45 000 DH',
  'employee.cin': 'AB123456',
  'company.name': 'Maya Group SARL',
  'company.address': '123 Avenue des FAR, Casablanca, Maroc',
  'meta.generatedAt': '23 Mars 2026',
  'meta.generatedYear': '2026',
};
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

interface Props {
  template?: Template;
  onSave: () => void;
  isSaving: boolean;
}

const QUICK_VARS = [
  { group: 'Collaborateur', vars: [
    { label: 'Nom Complet', value: '{{employee.fullName}}', tag: '{{employee.fullName}}' },
    { label: 'CIN', value: '{{employee.cin}}', tag: '{{employee.cin}}' },
    { label: 'Poste', value: '{{employee.function}}', tag: '{{employee.function}}' },
    { label: 'Département', value: '{{employee.department}}', tag: '{{employee.department}}' },
    { label: 'Date Embauche', value: '{{formatDate employee.hireDate}}', tag: '{{formatDate employee.hireDate}}' },
    { label: 'Salaire', value: '{{formatCurrency employee.salary}}', tag: '{{formatCurrency employee.salary}}' },
  ]},
  { group: 'Entreprise', vars: [
    { label: 'Nom Société', value: '{{company.name}}', tag: '{{company.name}}' },
    { label: 'Adresse', value: '{{company.address}}', tag: '{{company.address}}' },
  ]},
  { group: 'Document', vars: [
    { label: 'Date du jour', value: '{{meta.generatedAt}}', tag: '{{meta.generatedAt}}' },
    { label: 'Année', value: '{{meta.generatedYear}}', tag: '{{meta.generatedYear}}' },
  ]},
  { group: 'Signatures', vars: [
    { label: 'Signature du salarié', value: '<p><strong>Signature du salarié :</strong></p><p>_________________________</p>', tag: '<p><strong>Signature du salarié :</strong></p><p>_________________________</p>' },
    { label: 'Signature de l\'employeur', value: '<p><strong>Signature de l\'employeur :</strong></p><p>_________________________</p>', tag: '<p><strong>Signature de l\'employeur :</strong></p><p>_________________________</p>' },
  ]},
];

export const TemplateBuilder: React.FC<Props> = ({ template, onSave }) => {
  const isNewTemplate = !template || template.id === 'new';
  const [name, setName] = useState(template?.name || '');
  const [category, setCategory] = useState<CreateTemplateDto['category']>(template?.category || 'attestation');
  const [language, setLanguage] = useState<SupportedLang>(template?.language || 'fr');
  const [activeLanguage, setActiveLanguage] = useState<SupportedLang>(template?.language || 'fr');
  const [variableSchema, setVariableSchema] = useState<VariableSchema[]>(template?.variableSchema || []);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [bodyByLanguage, setBodyByLanguage] = useState<Record<SupportedLang, string>>(() => {
    const initial: Record<SupportedLang, string> = {
      fr: '', ar: '', en: '', de: '',
    };

    if (template?.bodyTranslations) {
      SUPPORTED_LANGS.forEach((lang) => {
        initial[lang] = template.bodyTranslations?.[lang] || '';
      });
      if (!initial[template.language] && template.body) {
        initial[template.language] = template.body;
      }
      return initial;
    }

    if (template?.body) {
      initial[template.language || 'fr'] = template.body;
      return initial;
    }

    return initial;
  });
  const [liveHtml, setLiveHtml] = useState(bodyByLanguage[activeLanguage] || '');

  // Header/Footer Zones
  const [showHeader, setShowHeader] = useState(isNewTemplate ? true : false);
  const [showFooter, setShowFooter] = useState(false);

  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>(DEFAULT_HEADER_CONFIG);
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(DEFAULT_FOOTER_CONFIG);

  const [headerHtml, setHeaderHtml] = useState(generateHeaderHtml(DEFAULT_HEADER_CONFIG));
  const [footerHtml, setFooterHtml] = useState(generateFooterHtml(DEFAULT_FOOTER_CONFIG));

  const [editingZone, setEditingZone] = useState<'header' | 'body' | 'footer'>('body');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [editorMode, setEditorMode] = useState<'tiptap' | 'html'>(() => {
    const currentBody = bodyByLanguage[activeLanguage] || '';
    return currentBody.includes('<html') ? 'html' : 'tiptap';
  });
  const [importedHtml, setImportedHtml] = useState<string | null>(() => {
    const currentBody = bodyByLanguage[activeLanguage] || '';
    return currentBody.includes('<html') ? currentBody : null;
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Helpers for Zone Management
  const parseTemplateParts = (fullBody: string) => {
    // Standardized zone tags
    const headerMatch = fullBody.match(/<!-- HEADER_START -->\n([\s\S]*?)\n<!-- HEADER_END -->/)?.[1];
    const bodyMatch = fullBody.match(/<!-- BODY_START -->\n([\s\S]*?)\n<!-- BODY_END -->/)?.[1];
    const footerMatch = fullBody.match(/<!-- FOOTER_START -->\n([\s\S]*?)\n<!-- FOOTER_END -->/)?.[1];

    if (headerMatch || bodyMatch || footerMatch) {
      return {
        header: headerMatch?.trim() || '',
        body: bodyMatch?.trim() || '',
        footer: footerMatch?.trim() || '',
      };
    }

    // Fallback for older format
    const oldHeader = fullBody.match(/<!-- HEADER -->\n([\s\S]*?)(?=<!-- BODY -->)/)?.[1];
    const oldBody = fullBody.match(/<!-- BODY -->\n([\s\S]*?)(?=<!-- FOOTER -->|$)/)?.[1];
    const oldFooter = fullBody.match(/<!-- FOOTER -->\n([\s\S]*?)$/)?.[1];

    return {
      header: oldHeader?.trim() || '',
      body: oldBody?.trim() || (fullBody.includes('<!-- HEADER -->') ? '' : fullBody),
      footer: oldFooter?.trim() || '',
    };
  };

  const extractBodyContent = (content: string) => {
    const { body } = parseTemplateParts(content || '');
    return body || content || '';
  };

  const previewZone = (html: string) => {
    let res = html;
    Object.entries(PREVIEW_DATA).forEach(([k, v]) => {
      res = res.replace(new RegExp(`{{${k}}}`, 'g'), v);
    });
    // Replace logo variables
    res = res.replace(/{{logoUrl}}/g, headerConfig.logoUrl || 'https://via.placeholder.com/150?text=Logo');
    res = res.replace(/{{logoSize}}/g, headerConfig.logoSize.toString());
    // Handle conditional logo
    if (!headerConfig.logoUrl) {
      res = res.replace(/\{\{#if logoUrl\}\}[\s\S]*?\{\{\/if\}\}/, '');
    } else {
      res = res.replace(/\{\{#if logoUrl\}\}/, '').replace(/\{\{\/if\}\}/, '');
    }
    // Replace any other variables with [Variable]
    res = res.replace(/\{\{([^}]+)\}\}/g, '<span class="bg-slate-100 text-slate-400 px-1 rounded text-[0.8em] font-mono">[$1]</span>');
    return res;
  };

  // Reactive HTML Generation
  useEffect(() => {
    setHeaderHtml(generateHeaderHtml(headerConfig));
  }, [headerConfig]);

  useEffect(() => {
    setFooterHtml(generateFooterHtml(footerConfig));
  }, [footerConfig]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setHeaderConfig(prev => ({ ...prev, logoUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };


  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }), Underline, TextStyle, FontSize, TextStyleExtras, Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell,
      Placeholder.configure({
        placeholder: 'Commencez à rédiger votre modèle ici...',
        emptyNodeClass: 'is-empty',
      }),
    ],
    content: bodyByLanguage[activeLanguage] || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[500px] p-0 bg-white',
        style: 'font-family: Arial, sans-serif; font-size: 14px; line-height: 1.8;',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setLiveHtml(html);
      setBodyByLanguage((prev) => ({ ...prev, [activeLanguage]: html }));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const nextBody = bodyByLanguage[activeLanguage] || '';
    if (editor.getHTML() !== nextBody) {
      editor.commands.setContent(nextBody || '', { emitUpdate: false });
    }
    setLiveHtml(nextBody || '');
    if (nextBody.includes('<html')) {
      setEditorMode('html');
      setImportedHtml(nextBody);
    } else {
      setEditorMode('tiptap');
      setImportedHtml(null);
    }
  }, [activeLanguage, bodyByLanguage, editor]);

  useEffect(() => {
    if (template && editor) {
      const templateSource =
        (template.bodyTranslations && template.bodyTranslations[template.language || 'fr']) ||
        template.body ||
        '';
      const { header, body, footer } = parseTemplateParts(templateSource);
      const nextBodyByLanguage: Record<SupportedLang, string> = {
        fr: '', ar: '', en: '', de: '',
      };

      if (template.bodyTranslations) {
        SUPPORTED_LANGS.forEach((lang) => {
          nextBodyByLanguage[lang] = extractBodyContent(template.bodyTranslations?.[lang] || '');
        });
      }

      if (template.body) {
        nextBodyByLanguage[template.language || 'fr'] = extractBodyContent(template.body);
      }

      setBodyByLanguage(nextBodyByLanguage);
      setActiveLanguage(template.language || 'fr');

      if (header) {
        setHeaderHtml(header);
        setShowHeader(true);
      }

      if (footer) {
        setFooterHtml(footer);
        setShowFooter(true);
      }

      if (editor.getHTML() !== body) {
        editor.commands.setContent(body || '');
      }

      // Load configs from HTML
      if (header) {
        setHeaderConfig(parseConfigFromHtml(header, 'header'));
      }
      if (footer) {
        setFooterConfig(parseConfigFromHtml(footer, 'footer'));
      }

      setName(template.name || '');
      setCategory(template.category || 'attestation');
      setLanguage((template.language as SupportedLang) || 'fr');
      setVariableSchema(template.variableSchema || []);
    }
  }, [template, editor]);

  const parseConfigFromHtml = (html: string, zone: 'header' | 'footer'): any => {
    if (zone === 'header') {
      const config = { ...DEFAULT_HEADER_CONFIG };
      const titleMatch = html.match(/data-field="title"[^>]*>([\s\S]*?)<\/div>/);
      const subtitleMatch = html.match(/data-field="subtitle"[^>]*>([\s\S]*?)<\/div>/);
      const infoLineMatch = html.match(/data-field="infoLine"[^>]*>[\s\S]*?">([\s\S]*?)<\/div>/);
      const logoMatch = html.match(/id="logo-container"[^>]*>[\s\S]*?src="([^"]*)"/);
      const sizeMatch = html.match(/height:(\d+)px/);
      const alignMatch = html.match(/justify-content:([^;]*)/);

      if (titleMatch) config.title = titleMatch[1];
      if (subtitleMatch) config.subtitle = subtitleMatch[1];
      if (infoLineMatch) config.infoLine = infoLineMatch[1].replace(/<[^>]*>/g, '').replace(/^Casablanca, le |^Le /i, '');
      if (logoMatch && !logoMatch[1].includes('{{logoUrl}}')) config.logoUrl = logoMatch[1];
      if (sizeMatch) config.logoSize = parseInt(sizeMatch[1]);
      if (alignMatch) {
        const val = alignMatch[1].trim();
        if (val === 'space-between') config.textAlign = 'between';
        else if (val === 'center') config.textAlign = 'center';
        else if (val === 'flex-end') config.textAlign = 'right';
        else config.textAlign = 'left';
      }
      return config;
    } else {
      const config = { ...DEFAULT_FOOTER_CONFIG };
      const leftMatch = html.match(/data-field="leftText"[^>]*>([\s\S]*?)<\/div>/);
      const centerMatch = html.match(/data-field="centerText"[^>]*>([\s\S]*?)<\/div>/);
      const rightMatch = html.match(/data-field="rightText"[^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>/);
      if (leftMatch) config.leftText = leftMatch[1];
      if (centerMatch) config.centerText = centerMatch[1];
      if (rightMatch) config.rightText = rightMatch[1];
      config.showPageNumber = html.includes('Page 1/1');
      config.showDivider = html.includes('border-top');
      return config;
    }
  };

  const onElementClick = (e: React.MouseEvent, zone: 'header' | 'footer') => {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    const field = target.closest('[data-field]')?.getAttribute('data-field');

    setEditingZone(zone);
    if (field) {
      setFocusedField(field);
      toast(`Édition de : ${field}`, { icon: '🎯', duration: 1500 });
    }
  };

  const insertVariable = useCallback((variable: string) => {
    if (editingZone === 'body') {
      if (editor) editor.chain().focus().insertContent(variable).run();
    } else if (editingZone === 'header') {
      setHeaderHtml(prev => prev + variable);
    } else if (editingZone === 'footer') {
      setFooterHtml(prev => prev + variable);
    }
  }, [editor, editingZone]);

  const handleImportHTML = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const html = ev.target?.result as string;

      // Store full HTML for iframe rendering
      setImportedHtml(html);
      setEditorMode('html');
      setLiveHtml(html);
      setBodyByLanguage((prev) => ({ ...prev, [activeLanguage]: html }));

      // Detect all {{variables}} from the full HTML
      const varMatches = html.match(/\{\{([^}]+)\}\}/g) || [];
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

      setVariableSchema(schema);

      toast.success(
        `✅ Template importé ! ${unique.length} variable(s) détectée(s).`,
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
    const currentBodyContent = editorMode === 'html' ? (importedHtml || '') : (bodyByLanguage[activeLanguage] || editor?.getHTML() || '');
    const normalizedCurrentBody = extractBodyContent(currentBodyContent);
    const currentHeaderHtml = showHeader ? generateHeaderHtml(headerConfig) : '';
    const currentFooterHtml = showFooter ? generateFooterHtml(footerConfig) : '';
    const normalizedBodiesByLanguage: Record<SupportedLang, string> = {
      fr: extractBodyContent(bodyByLanguage.fr || ''),
      ar: extractBodyContent(bodyByLanguage.ar || ''),
      en: extractBodyContent(bodyByLanguage.en || ''),
      de: extractBodyContent(bodyByLanguage.de || ''),
    };
    const fullBodyByLanguage: Record<SupportedLang, string> = {
      fr: [
        showHeader && currentHeaderHtml ? `<!-- HEADER_START -->\n${currentHeaderHtml.trim()}\n<!-- HEADER_END -->` : '',
        `<!-- BODY_START -->\n${normalizedBodiesByLanguage.fr.trim()}\n<!-- BODY_END -->`,
        showFooter && currentFooterHtml ? `<!-- FOOTER_START -->\n${currentFooterHtml.trim()}\n<!-- FOOTER_END -->` : '',
      ].filter(Boolean).join('\n\n'),
      ar: [
        showHeader && currentHeaderHtml ? `<!-- HEADER_START -->\n${currentHeaderHtml.trim()}\n<!-- HEADER_END -->` : '',
        `<!-- BODY_START -->\n${normalizedBodiesByLanguage.ar.trim()}\n<!-- BODY_END -->`,
        showFooter && currentFooterHtml ? `<!-- FOOTER_START -->\n${currentFooterHtml.trim()}\n<!-- FOOTER_END -->` : '',
      ].filter(Boolean).join('\n\n'),
      en: [
        showHeader && currentHeaderHtml ? `<!-- HEADER_START -->\n${currentHeaderHtml.trim()}\n<!-- HEADER_END -->` : '',
        `<!-- BODY_START -->\n${normalizedBodiesByLanguage.en.trim()}\n<!-- BODY_END -->`,
        showFooter && currentFooterHtml ? `<!-- FOOTER_START -->\n${currentFooterHtml.trim()}\n<!-- FOOTER_END -->` : '',
      ].filter(Boolean).join('\n\n'),
      de: [
        showHeader && currentHeaderHtml ? `<!-- HEADER_START -->\n${currentHeaderHtml.trim()}\n<!-- HEADER_END -->` : '',
        `<!-- BODY_START -->\n${normalizedBodiesByLanguage.de.trim()}\n<!-- BODY_END -->`,
        showFooter && currentFooterHtml ? `<!-- FOOTER_START -->\n${currentFooterHtml.trim()}\n<!-- FOOTER_END -->` : '',
      ].filter(Boolean).join('\n\n'),
    };
    const fullBody = [
      showHeader && currentHeaderHtml ? `<!-- HEADER_START -->\n${currentHeaderHtml.trim()}\n<!-- HEADER_END -->` : '',
      `<!-- BODY_START -->\n${normalizedCurrentBody.trim()}\n<!-- BODY_END -->`,
      showFooter && currentFooterHtml ? `<!-- FOOTER_START -->\n${currentFooterHtml.trim()}\n<!-- FOOTER_END -->` : '',
    ].filter(Boolean).join('\n\n');

    // Auto-detect variables if schema is minimal
    let finalSchema = variableSchema;
    if (variableSchema.length === 0) {
      const matches = fullBody.match(/\{\{([^}]+)\}\}/g) || [];
      const distinct = [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '').trim()))];
      finalSchema = distinct.map(v => ({
        name: v,
        label: v.split('.').pop() || v,
        type: 'text',
        required: v.startsWith('form.'),
        autoFill: !v.startsWith('form.'),
      })) as VariableSchema[];
    }

    const bodyTranslations: Partial<Record<SupportedLang, string>> = {};
    SUPPORTED_LANGS.forEach((lang) => {
      const content = fullBodyByLanguage[lang];
      if (content) bodyTranslations[lang] = content;
    });

    const payload: CreateTemplateDto = {
      name,
      category,
      language: activeLanguage,
      body: fullBodyByLanguage[activeLanguage] || fullBody,
      bodyTranslations,
      variableSchema: finalSchema,
      status,
    };

    if (template?.id && template.id !== 'new') {
      updateMutation.mutate({ id: template.id, data: payload }, { onSuccess: onSave });
    } else {
      createMutation.mutate(payload, { onSuccess: onSave });
    }
  };

  if (!editor) return null;

  if (!editor) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* ── Main Editor Column (A4 Style) ── */}
      <div className="flex-1 flex justify-center w-full">
        <div className="w-full max-w-[794px] space-y-4">
          {/* Quick Var Toolbar - Shared */}
          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Zap className="w-3 h-3 text-sky-500" />
                Insertion rapide
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-dashed border-sky-300 rounded-lg hover:border-sky-500 hover:bg-sky-50 text-sky-600 transition-all font-semibold"
                  type="button"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Importer HTML
                </button>
                <input ref={fileInputRef} type="file" accept=".html,.htm" className="hidden" onChange={handleImportHTML} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_VARS.flatMap(g => g.vars).map((v) => (
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

          {/* THE DOCUMENT CONTAINER */}
          <div
            className="bg-white shadow-2xl rounded-sm border border-slate-200 min-h-[700px] flex flex-col transition-all duration-300 overflow-hidden"
          >

            {/* 1. HEADER ZONE */}
            <div className={clsx(
              "relative transition-all duration-300 border-b border-dashed",
              editingZone === 'header' ? "bg-sky-50/30 border-sky-200 ring-2 ring-inset ring-sky-200" : "border-transparent",
              !showHeader && "opacity-40 grayscale"
            )}>
              <ZoneBar
                title="En-tête (Header)"
                active={editingZone === 'header'}
                enabled={showHeader}
                onToggle={() => setShowHeader(!showHeader)}
                onEdit={() => setEditingZone('header')}
                color="sky"
                icon={Layout}
              />
              <div
                onClick={(e) => { if (showHeader) onElementClick(e, 'header'); }}
                className={clsx(
                  "p-10 overflow-hidden cursor-pointer group/header relative",
                  editingZone !== 'header' && showHeader && "hover:bg-sky-50 transition-colors"
                )}
              >
                {/* Click Hint Overlay */}
                {editingZone !== 'header' && showHeader && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/header:opacity-100 transition-opacity bg-sky-50/20 backdrop-blur-[1px] z-10">
                    <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full shadow-lg border border-sky-100 text-sky-600 font-bold text-xs animate-bounce-subtle">
                      <MousePointer2 className="w-3.5 h-3.5" />
                      Cliquez pour modifier
                    </div>
                  </div>
                )}

                {showHeader ? (
                  <div className="relative z-0" dangerouslySetInnerHTML={{ __html: previewZone(headerHtml) }} />
                ) : (
                  <div className="h-20 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 text-sm italic pointer-events-none">
                    En-tête désactivé
                  </div>
                )}
              </div>
            </div>

            {/* 2. BODY ZONE */}
            <div className={clsx(
              "relative transition-all duration-300",
              editingZone === 'body' ? "bg-white ring-2 ring-inset ring-emerald-200" : "bg-slate-50/10"
            )}>
              <ZoneBar
                title="Corps du document (Body)"
                active={editingZone === 'body'}
                enabled={true}
                onToggle={() => { }}
                onEdit={() => setEditingZone('body')}
                color="emerald"
                icon={Type}
                hideToggle
              />

              {editorMode === 'html' && importedHtml ? (
                <div className="p-10">
                  <HtmlLiveEditor
                    initialHtml={importedHtml}
                    onChange={(newHtml: string) => {
                      setImportedHtml(newHtml);
                      setLiveHtml(newHtml);
                      setBodyByLanguage((prev) => ({ ...prev, [activeLanguage]: newHtml }));
                    }}
                    onExit={() => setEditorMode('tiptap')}
                  />
                </div>
              ) : (
                <div 
                  className={clsx(
                    "p-10 min-h-[600px]", 
                    editingZone !== 'body' && "opacity-60 pointer-events-none",
                    activeLanguage === 'ar' && "text-right"
                  )}
                  lang={activeLanguage}
                  dir={activeLanguage === 'ar' ? 'rtl' : 'ltr'}
                >
                  {editingZone === 'body' && (
                    <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-slate-50 border border-slate-100 rounded-xl mb-6 sticky top-4 z-20 shadow-sm animate-fade-in">
                      <ToolbarBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} icon={Bold} title="Gras" />
                      <ToolbarBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} icon={Italic} title="Italique" />
                      <ToolbarBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} icon={UnderlineIcon} title="Souligné" />
                      <select
                        defaultValue="default"
                        onChange={(e) => {
                          const preset = TEXT_STYLE_PRESETS.find((item) => item.value === e.target.value);
                          if (!preset || preset.value === 'default') {
                            editor.chain().focus().setMark('textStyle', { fontFamily: null, fontVariant: null, letterSpacing: null, textTransform: null }).removeEmptyTextStyle().run();
                            return;
                          }
                          editor.chain().focus().setMark('textStyle', preset.attrs).run();
                        }}
                        className="ml-2 h-8 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 px-2"
                        title="Style du texte"
                      >
                        {TEXT_STYLE_PRESETS.map((preset) => (
                          <option key={preset.value} value={preset.value}>{preset.label}</option>
                        ))}
                      </select>
                      <select
                        value={editor.getAttributes('textStyle').fontSize || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) {
                            editor.chain().focus().unsetFontSize().run();
                          } else {
                            editor.chain().focus().setFontSize(value).run();
                          }
                        }}
                        className="ml-2 h-8 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 px-2"
                        title="Taille du texte"
                      >
                        <option value="">Taille</option>
                        {FONT_SIZES.map((size) => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                      <span className="w-px h-4 bg-slate-200 mx-1" />
                      <ToolbarBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} icon={List} title="Liste" />
                      <span className="w-px h-4 bg-slate-200 mx-1" />
                      <ToolbarBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} icon={AlignCenter} title="Centrer" />
                      <ToolbarBtn active={false} onClick={() => editor.chain().focus().undo().run()} icon={Undo2} title="Annuler" />

                      <div className="ml-auto">
                        <button onClick={() => setIsPreviewOpen(true)} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-all" title="Aperçu plein écran" type="button">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  <EditorContent editor={editor} />
                </div>
              )}
            </div>

            {/* 3. FOOTER ZONE */}
            <div className={clsx(
              "relative mt-8 transition-all duration-300 border-t border-dashed",
              editingZone === 'footer' ? "bg-slate-50/50 border-slate-300 ring-2 ring-inset ring-slate-300" : "border-transparent",
              !showFooter && "opacity-40 grayscale"
            )}>
              <ZoneBar
                title="Pied de page (Footer)"
                active={editingZone === 'footer'}
                enabled={showFooter}
                onToggle={() => setShowFooter(!showFooter)}
                onEdit={() => setEditingZone('footer')}
                color="slate"
                icon={Layers}
              />
              <div
                onClick={(e) => { if (showFooter) onElementClick(e, 'footer'); }}
                className={clsx(
                  "p-10 overflow-hidden cursor-pointer group/footer relative",
                  editingZone !== 'footer' && showFooter && "hover:bg-slate-50 transition-colors"
                )}
              >
                {/* Click Hint Overlay */}
                {editingZone !== 'footer' && showFooter && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/footer:opacity-100 transition-opacity bg-slate-50/20 backdrop-blur-[1px] z-10">
                    <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full shadow-lg border border-slate-100 text-slate-600 font-bold text-xs animate-bounce-subtle">
                      <MousePointer2 className="w-3.5 h-3.5" />
                      Cliquez pour modifier
                    </div>
                  </div>
                )}

                {showFooter ? (
                  <div className="relative z-0" dangerouslySetInnerHTML={{ __html: previewZone(footerHtml) }} />
                ) : (
                  <div className="h-16 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 text-sm italic pointer-events-none">
                    Pied de page désactivé
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Sidebar Column ── */}
      <div className="w-full lg:w-80 space-y-6">

        {/* Conditional Zone Editor */}
        {(editingZone === 'header' || editingZone === 'footer') ? (
          <ZoneEditor
            zone={editingZone}
            config={editingZone === 'header' ? headerConfig : footerConfig}
            setConfig={editingZone === 'header' ? setHeaderConfig : setFooterConfig}
            html={editingZone === 'header' ? headerHtml : footerHtml}
            setHtml={editingZone === 'header' ? setHeaderHtml : setFooterHtml}
            onClose={() => {
              setEditingZone('body');
              setFocusedField(null);
            }}
            onLogoUpload={handleLogoUpload}
            insertVariable={insertVariable}
            focusedField={focusedField}
            onResetHtml={() => {
              if (confirm('Réinitialiser cette zone avec le contenu par défaut ?')) {
                if (editingZone === 'header') setHeaderConfig(DEFAULT_HEADER_CONFIG);
                else setFooterConfig(DEFAULT_FOOTER_CONFIG);
                toast.success('Zone réinitialisée');
              }
            }}
          />
        ) : (
          <>
            {/* Language Tabs */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-slate-400" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Langues du modèle</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {SUPPORTED_LANGS.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setActiveLanguage(lang);
                      setLanguage(lang);
                    }}
                    className={clsx(
                      "py-2 rounded-xl border text-[10px] font-black uppercase transition-all",
                      activeLanguage === lang
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    )}
                    type="button"
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">Contenu par langue. Le style (header/footer) reste partagé.</p>
            </div>

            {/* Variable Library */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-4 h-4 text-sky-500" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bibliothèque de Variables</p>
              </div>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {QUICK_VARS.map((group) => (
                  <div key={group.group} className="space-y-1.5">
                    <p className="text-[9px] font-black text-slate-300 uppercase px-1">{group.group}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.vars.map((v) => (
                        <button
                          key={v.value}
                          onClick={() => {
                            if (editor) {
                              editor.chain().focus().insertContent(v.tag).run();
                              toast.success(`Variable "${v.label}" insérée`);
                            }
                          }}
                          className="px-2 py-1 text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-100 rounded-lg hover:bg-sky-100 transition-all flex items-center gap-1"
                          title={v.tag}
                        >
                          <Plus className="w-2.5 h-2.5" />
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100 text-[9px] text-amber-700 leading-relaxed font-medium">
                <span className="font-black uppercase block mb-1">💡 Astuce RH</span>
                Cliquez sur une variable pour l'insérer à l'endroit de votre curseur.
              </div>
            </div>

            {/* General Info */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <Settings className="w-4 h-4 text-slate-400" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuration</p>
              </div>
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
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Langue par défaut</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value as any)} className="input-field text-sm">
                    <option value="fr">Français</option>
                    <option value="ar">Arabe</option>
                    <option value="en">Anglais</option>
                    <option value="de">Allemand</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dynamic Variables */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Variables Formulaire</p>
                <button onClick={addVariable} className="text-sky-600 hover:text-sky-700 transition-colors" type="button">
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {variableSchema.map((v, i) => (
                  <div key={i} className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col gap-2 relative group transition-all hover:bg-white hover:shadow-md hover:border-sky-100">
                    <button onClick={() => removeVariable(i)} className="absolute -top-1 -right-1 w-5 h-5 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:border-rose-200 shadow-sm transition-all opacity-0 group-hover:opacity-100" type="button">
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-3 h-3 text-slate-300 shrink-0" />
                      <input
                        value={v.name}
                        onChange={(e) => updateVariable(i, { name: e.target.value })}
                        className="flex-1 text-[10px] font-mono bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-sky-300 transition-all font-bold text-slate-600"
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
          </>
        )}

        {/* Global Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => handleSave('active')}
            disabled={isPending || !name}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 text-sm font-black text-white bg-slate-900 hover:bg-slate-800 rounded-2xl transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 active:scale-[0.98]"
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
          category, language: activeLanguage, body: liveHtml,
          bodyTranslations: { ...bodyByLanguage },
          variableSchema, status: 'draft', version: template?.version || 1,
          usageCount: 0, createdAt: new Date().toISOString()
        } as Template}
      />
      {/* Custom styles for the editor to make variables more "obvious" */}
      <style>{`
        .ProseMirror {
          min-height: 800px;
          padding: 60px 80px !important;
          font-family: 'Inter', sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #000;
          background: white;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
          margin: 20px auto;
          max-width: 800px;
          outline: none !important;
        }
        /* Make {{variables}} stand out like chips */
        .ProseMirror p {
          margin-bottom: 1em;
        }
        /* We can't easily target text nodes in CSS, but we can style the whole editor to feel like a document */
      `}</style>
    </div>
  );
};

// ── Helper Components ──

// ── Interactive HTML Live Editor ──

interface HtmlLiveEditorProps {
  initialHtml: string;
  onChange: (html: string) => void;
  onExit: () => void;
}

function HtmlLiveEditor({ initialHtml, onChange, onExit }: HtmlLiveEditorProps) {
  const [view, setView] = useState<'visual' | 'code'>('visual');
  const [html, setHtml] = useState(initialHtml);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const skipNextIframeSync = useRef(false);

  // Sync state to parent
  useEffect(() => {
    onChange(html);
  }, [html, onChange]);

  // Handle Visual Mode Logic (designMode in iFrame)
  useEffect(() => {
    if (view === 'visual' && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (!doc) return;

      if (!skipNextIframeSync.current) {
        doc.open();
        doc.write(html);
        doc.close();
        doc.designMode = 'on';
      }
      skipNextIframeSync.current = false;

      const handleInput = () => {
        const newHtml = doc.documentElement.outerHTML;
        skipNextIframeSync.current = true;
        setHtml(newHtml);
      };

      doc.addEventListener('input', handleInput);
      return () => doc.removeEventListener('input', handleInput);
    }
  }, [view, html]);

  return (
    <div className="flex flex-col border border-amber-200 rounded-xl overflow-hidden bg-white shadow-xl animate-fade-in">
      {/* Interactive Toolbar */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.5)]"></span>
            <span className="text-[10px] text-amber-900 font-black uppercase tracking-widest">Éditeur HTML Dynamique</span>
          </div>
          <div className="h-4 w-px bg-amber-200" />
          <div className="flex bg-white/50 p-0.5 rounded-lg border border-amber-200/50 shadow-sm">
            <button
              onClick={() => setView('visual')}
              className={clsx(
                "px-3 py-1 text-[9px] font-black uppercase tracking-tighter rounded-md transition-all",
                view === 'visual' ? "bg-amber-500 text-white shadow-sm" : "text-amber-600 hover:bg-amber-100"
              )}
            >
              Visuel
            </button>
            <button
              onClick={() => setView('code')}
              className={clsx(
                "px-3 py-1 text-[9px] font-black uppercase tracking-tighter rounded-md transition-all",
                view === 'code' ? "bg-amber-500 text-white shadow-sm" : "text-amber-600 hover:bg-amber-100"
              )}
            >
              Code Source
            </button>
          </div>
        </div>

        <button
          onClick={onExit}
          className="text-[9px] font-black text-amber-600 hover:text-amber-800 underline uppercase tracking-tighter transition-colors"
          type="button"
        >
          Quitter le mode HTML
        </button>
      </div>

      {/* Editing Area */}
      <div className="relative min-h-[600px] flex flex-col bg-slate-900 shadow-inner">
        {view === 'visual' ? (
          <iframe
            ref={iframeRef}
            className="w-full flex-1 bg-white"
            title="HTML Visual Editor"
            sandbox="allow-same-origin allow-scripts"
          />
        ) : (
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            className="w-full flex-1 p-6 font-mono text-[11px] leading-relaxed bg-slate-900 text-sky-300 focus:outline-none custom-scrollbar outline-none resize-none"
            spellCheck={false}
          />
        )}

        {/* Floating Hint */}
        {view === 'visual' && (
          <div className="absolute bottom-4 right-4 bg-amber-100/90 backdrop-blur-sm border border-amber-200 px-3 py-1.5 rounded-full shadow-lg pointer-events-none animate-bounce-subtle">
            <p className="text-[10px] font-bold text-amber-800 flex items-center gap-2">
              <MousePointer2 className="w-3 h-3" />
              Édition directe activée
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ZoneBar({ title, active, enabled, onToggle, onEdit, color, icon: Icon, hideToggle }: any) {
  const colorMap: any = {
    sky: "bg-sky-500",
    emerald: "bg-emerald-500",
    slate: "bg-slate-500"
  };

  return (
    <div className={clsx(
      "flex items-center justify-between px-6 py-2 border-b transition-all sticky top-0 z-30",
      active ? "bg-white border-slate-200 shadow-sm" : "bg-slate-50/50 border-transparent"
    )}>
      <div className="flex items-center gap-3">
        <div className={clsx("p-1.5 rounded-lg text-white shadow-sm", colorMap[color])}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className={clsx("text-xs font-black uppercase tracking-wider", active ? "text-slate-900" : "text-slate-400")}>
          {title}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {!hideToggle && (
          <button
            onClick={onToggle}
            className={clsx(
              "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all",
              enabled ? "text-slate-600 bg-white border border-slate-200 shadow-sm" : "text-slate-400 opacity-50"
            )}
          >
            {enabled ? <Eye className="w-3 h-3 text-emerald-500" /> : <EyeOff className="w-3 h-3" />}
            {enabled ? "Visible" : "Masqué"}
          </button>
        )}
        <button
          onClick={onEdit}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
            active ? "bg-slate-900 text-white shadow-lg" : "text-slate-600 hover:bg-white hover:shadow-sm"
          )}
        >
          {active ? <Pencil className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
          {active ? "En cours d'édition" : "Modifier"}
        </button>
      </div>
    </div>
  );
}

function FieldSection({ label, field, focusedField, children }: { label: string; field: string; focusedField: string | null; children: React.ReactNode }) {
  return (
    <div className={clsx(
      "space-y-1.5 p-2 rounded-xl transition-all",
      focusedField === field ? "bg-sky-50 ring-1 ring-sky-200" : ""
    )}>
      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

function ZoneEditor({
  zone, config, setConfig, html, setHtml, onClose, onLogoUpload, focusedField, onResetHtml
}: any) {
  const [tab, setTab] = useState<'visual' | 'code'>('visual');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [footerLeft, setFooterLeft] = useState(config.leftText || '');
  const [footerRight, setFooterRight] = useState(config.rightText || '');

  useEffect(() => {
    if (zone === 'footer') {
      setFooterLeft(config.leftText || '');
      setFooterRight(config.rightText || '');
    }
  }, [zone, config.leftText, config.rightText]);

  const updateField = (field: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-5 shadow-xl animate-scale-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
            Éditeur {zone === 'header' ? 'En-tête' : 'Pied de page'}
          </h3>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl transition-all">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setTab('visual')}
          className={clsx("flex-1 py-2 text-[10px] font-bold rounded-lg transition-all", tab === 'visual' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
        >
          Widgets
        </button>
        <button
          onClick={() => setTab('code')}
          className={clsx("flex-1 py-2 text-[10px] font-bold rounded-lg transition-all", tab === 'code' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
        >
          Source HTML
        </button>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {tab === 'visual' ? (
          <div className="space-y-5 animate-fade-in">
            {zone === 'header' ? (
              <>
                <FieldSection label="Identité du Document" field="title" focusedField={focusedField}>
                  <input
                    value={config.title} onChange={(e) => updateField('title', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all"
                    placeholder="Titre du document..."
                  />
                  <input
                    value={config.subtitle} onChange={(e) => updateField('subtitle', e.target.value)}
                    className="w-full px-3 py-2 text-[10px] bg-slate-50 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all mt-1"
                    placeholder="Sous-titre / Entreprise..."
                  />
                </FieldSection>

                <FieldSection label="Branding & Logo" field="logo" focusedField={focusedField}>
                  <div className="flex items-center gap-4 py-1">
                    <div className="w-14 h-14 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                      {config.logoUrl ? <img src={config.logoUrl} className="max-w-full max-h-full object-contain" /> : <ImageIcon className="w-5 h-5 text-slate-300" />}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 px-3 text-[10px] font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Upload className="w-3 h-3" /> Charger
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
                      {config.logoUrl && (
                        <button onClick={() => updateField('logoUrl', null)} className="w-full py-1 text-[9px] font-bold text-rose-500 hover:bg-rose-50 rounded-lg transition-all">Supprimer</button>
                      )}
                    </div>
                  </div>
                  {config.logoUrl && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[8px] font-black text-slate-400 mb-1">TAILLE PROPORTIONNELLE <span>{config.logoSize}px</span></div>
                      <input
                        type="range" min="30" max="150" value={config.logoSize}
                        onChange={(e) => updateField('logoSize', parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                      />
                    </div>
                  )}
                </FieldSection>

                <FieldSection label="Coordonnées / Info" field="infoLine" focusedField={focusedField}>
                  <input
                    value={config.infoLine} onChange={(e) => updateField('infoLine', e.target.value)}
                    className="w-full px-3 py-2 text-[10px] font-medium bg-slate-50 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all"
                    placeholder="Ville, Date, etc..."
                  />
                </FieldSection>

                <div className="p-2 space-y-3">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Mise en page</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['left', 'center', 'right', 'between'].map((a: any) => (
                      <button
                        key={a} onClick={() => updateField('textAlign', a)}
                        className={clsx(
                          "py-2 rounded-lg border text-[9px] font-black transition-all",
                          config.textAlign === a ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10" : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                        )}
                      >
                        {a.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={config.showDivider} onChange={(e) => updateField('showDivider', e.target.checked)} className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Afficher la ligne de séparation</span>
                  </label>
                </div>
              </>
            ) : (
              <>
                <FieldSection label="Texte Gauche" field="leftText" focusedField={focusedField}>
                  <input
                    value={footerLeft}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFooterLeft(value);
                    }}
                    onBlur={() => updateField('leftText', footerLeft)}
                    className="w-full px-3 py-2 text-[10px] font-bold bg-slate-50 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all"
                  />
                </FieldSection>
                <FieldSection label="Texte Droit" field="rightText" focusedField={focusedField}>
                  <textarea
                    value={footerRight}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFooterRight(value);
                    }}
                    onBlur={() => updateField('rightText', footerRight)}
                    className="w-full px-3 py-2 text-[10px] bg-slate-50 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all h-20 resize-none"
                  />
                </FieldSection>
                <div className="p-2 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={config.showPageNumber} onChange={(e) => updateField('showPageNumber', e.target.checked)} className="rounded border-slate-300 text-slate-600 focus:ring-slate-500 w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Numérotation de page</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={config.showDivider} onChange={(e) => updateField('showDivider', e.target.checked)} className="rounded border-slate-300 text-slate-600 focus:ring-slate-500 w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Ligne de séparation</span>
                  </label>
                </div>
              </>
            )}

            <div className="pt-2 border-t border-slate-50">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Variables Rapides</label>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[9px] text-slate-400 italic">Ajoutez les variables manuellement dans le texte.</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in space-y-4">
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-[9px] text-rose-600 leading-relaxed font-medium">
              <span className="font-black uppercase block mb-1">Attention</span>
              Les modifications directes du code peuvent désynchroniser les widgets ci-dessus. Utilisez cette zone pour des styles avancés uniquement.
            </div>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="w-full h-64 font-mono text-[10px] p-4 bg-slate-900 text-sky-300 rounded-2xl focus:outline-none custom-scrollbar leading-relaxed"
              spellCheck={false}
            />
            <button
              onClick={onResetHtml}
              className="w-full py-2.5 px-3 text-[10px] font-bold text-slate-400 hover:text-slate-600 border border-slate-100 rounded-xl hover:border-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser aux défauts
            </button>
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className="w-full py-4 bg-slate-900 text-white text-[11px] font-black rounded-2xl shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all uppercase tracking-widest"
      >
        Valider les changements
      </button>
    </div>
  );
}

function ToolbarBtn({ active, onClick, icon: Icon, title }: { active: boolean; onClick: () => void; icon: React.ElementType; title: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "p-1.5 rounded-lg transition-all",
        active ? 'bg-sky-100 text-sky-600 shadow-inner' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
      )}
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
