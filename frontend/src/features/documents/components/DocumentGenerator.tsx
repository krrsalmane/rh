import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/shared/utils/cn';
import { CheckCircle2, ChevronRight, FileText, User, ClipboardCheck, Download, Loader2, ArrowLeft, Zap } from 'lucide-react';
import { useAvailableTemplates, useTemplate } from '../hooks/useTemplates';
import { useGenerateDocument } from '../hooks/useDocuments';
import { useEmployees, useEmployee } from '@/features/employees/hooks/useEmployees';
import { DynamicDocumentForm } from './DynamicDocumentForm';
import { LanguageSelector, type SupportedLanguage } from './LanguageSelector';
import type { GenerateDocumentDto } from '../types';
import type { Employee } from '@/features/employees/types';
import axios from '@/shared/api/axiosInstance';

const STEPS = [
  { key: 'template', label: 'Modèle', icon: FileText },
  { key: 'form', label: 'Informations', icon: ClipboardCheck },
  { key: 'review', label: 'Aperçu', icon: User },
  { key: 'done', label: 'Terminé', icon: CheckCircle2 },
];

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  'attestation_travail': 'Attestation de travail',
  'attestation_salaire': 'Attestation de salaire',
  'attestation_simple': 'Attestation simple',
  'contrat_cdd': 'Contrat CDD',
  'contrat_cdi': 'Contrat de travail CDI',
};

const getVariableSchema = (docType: string): VariableSchema[] => {
  const baseSchema: VariableSchema[] = [
    { name: 'employee.fullName', label: 'Nom complet', type: 'text', autoFill: true },
    { name: 'employee.cin', label: 'CIN', type: 'text', autoFill: true },
    { name: 'employee.hireDate', label: 'Date d\'embauche', type: 'date', autoFill: true },
    { name: 'employee.function', label: 'Fonction', type: 'text', autoFill: true },
    { name: 'employee.department', label: 'Département', type: 'text', autoFill: true },
  ];

  if (docType === 'attestation_salaire' || docType === 'contrat_cdi' || docType === 'contrat_cdd') {
    baseSchema.push({ name: 'employee.salary', label: 'Salaire brut mensuel', type: 'currency', autoFill: true });
  }

  if (docType === 'contrat_cdd') {
    baseSchema.push({ name: 'form.endDate', label: 'Date de fin de contrat', type: 'date', autoFill: false, required: true });
  }

  return baseSchema;
};

interface Props {
  preselectedEmployeeId?: string;
  preselectedDocumentType?: string;
  preselectedTemplateId?: string;
  onClose?: () => void;
}

export const DocumentGenerator: React.FC<Props> = ({ 
  preselectedEmployeeId, 
  preselectedDocumentType, 
  preselectedTemplateId,
  onClose 
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(preselectedDocumentType || preselectedTemplateId ? 1 : 0);
  const [selectedDocType, setSelectedDocType] = useState<string>(preselectedDocumentType || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(preselectedTemplateId || '');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(preselectedEmployeeId || '');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [generatedDocId, setGeneratedDocId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('fr');
  
  const { data: availableTemplates = {}, isLoading: loadingTemplates } = useAvailableTemplates();
  const { data: templateDetails } = useTemplate(selectedTemplateId || undefined);
  const availableTypes = Object.keys(availableTemplates);

  const currentSchema = useMemo(() => {
    if (selectedTemplateId && templateDetails?.data) {
      return templateDetails.data.variableSchema || [];
    }
    return selectedDocType ? getVariableSchema(selectedDocType) : [];
  }, [selectedTemplateId, templateDetails, selectedDocType]);

  // Pre-select document type if provided via URL
  React.useEffect(() => {
    if (preselectedDocumentType && availableTypes.length > 0 && !selectedDocType) {
      if (availableTypes.includes(preselectedDocumentType)) {
        setSelectedDocType(preselectedDocumentType);
      }
    }
  }, [preselectedDocumentType, availableTypes, selectedDocType]);

  // Sync language with template if available
  React.useEffect(() => {
    if (templateDetails?.data?.language) {
      setSelectedLanguage(templateDetails.data.language as SupportedLanguage);
    }
  }, [templateDetails]);

  const { data: employeesData } = useEmployees({ search: employeeSearch, page: 1, limit: 50 });
  const { data: employeeDetails } = useEmployee(selectedEmployeeId || undefined);
  const generateMutation = useGenerateDocument();

  const employees = employeesData?.data || [];
  const selectedEmployee = employeeDetails?.data || employees.find((e: Employee) => e.id === selectedEmployeeId);

  const employeeDataForForm = useMemo(() => {
    if (!selectedEmployee) return {};
    return {
      firstName: selectedEmployee.firstName,
      lastName: selectedEmployee.lastName,
      fullName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
      cin: selectedEmployee.cin,
      cne: selectedEmployee.cne,
      email: selectedEmployee.email,
      phone: selectedEmployee.phone,
      address: selectedEmployee.address,
      hireDate: selectedEmployee.hireDate,
      contractType: selectedEmployee.contractType,
      function: selectedEmployee.function,
      department: selectedEmployee.department,
      salary: selectedEmployee.salary,
    };
  }, [selectedEmployee]);

  const handleGenerate = () => {
    if ((!selectedDocType && !selectedTemplateId) || !selectedEmployeeId) return;
    const dto: GenerateDocumentDto = {
      documentType: selectedDocType || undefined,
      templateId: selectedTemplateId || undefined,
      employeeId: selectedEmployeeId,
      formData,
      language: selectedLanguage,
    };
    generateMutation.mutate(dto, {
      onSuccess: (doc) => {
        setGeneratedDocId(doc.id);
        setStep(3);
      },
    });
  };

  const handleDownload = async () => {
    if (!generatedDocId) return;
    try {
      const res = await axios.get(`/documents/${generatedDocId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'document.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { /* error handled by interceptors */ }
  };

  const canGoNext = () => {
    if (step === 0) return !!selectedDocType || !!selectedTemplateId;
    if (step === 1) {
      if (!selectedEmployeeId) return false;
      const manualFields = currentSchema.filter(v => !v.autoFill && v.required);
      return manualFields.every(v => {
        const fieldName = v.name.replace(/^form\./, '');
        return !!formData[fieldName];
      });
    }
    return true;
  };

  return (
    <div className="space-y-6" id="document-generator">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <React.Fragment key={s.key}>
              {i > 0 && <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />}
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors border",
                isActive ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : isDone ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'text-slate-400 border-transparent'
              )}>
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 min-h-[400px]">
        {/* STEP 0: Choose document type */}
        {step === 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Choisir un type de document</h2>
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
                className="w-48"
              />
            </div>
            {loadingTemplates ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-sky-500 animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableTypes.map((type) => {
                  const label = DOCUMENT_TYPE_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  const supportedLangs = availableTemplates[type] || [];
                  const isLangSupported = supportedLangs.includes(selectedLanguage);

                  return (
                    <button
                      key={type}
                      disabled={!isLangSupported}
                      onClick={() => setSelectedDocType(type)}
                      className={cn(
                        "text-left p-4 rounded-xl border-2 transition-all group",
                        selectedDocType === type
                          ? 'border-slate-900 bg-slate-50/50 shadow-sm'
                          : isLangSupported 
                            ? 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                            : 'border-slate-50 bg-slate-50/30 opacity-50 cursor-not-allowed'
                      )}
                      id={`gen-type-${type}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className={cn("w-4 h-4", isLangSupported ? "text-sky-500" : "text-slate-300")} />
                        <span className="text-sm font-semibold text-slate-800">{label}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {supportedLangs.map(lang => (
                          <span key={lang} className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase",
                            lang === selectedLanguage ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-400"
                          )}>
                            {lang}
                          </span>
                        ))}
                      </div>
                      {!isLangSupported && (
                        <p className="text-[10px] text-rose-500 mt-2 font-medium">Non disponible en cette langue</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 1: Employee + Form */}
        {step === 1 && (selectedDocType || selectedTemplateId) && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Informations du document</h2>

            {/* Employee selector */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Employé *</label>
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder="Rechercher un employé..."
                className="input-field mb-2"
                id="gen-employee-search"
              />
              {!selectedEmployeeId && employees.length > 0 && (
                <div className="max-h-[200px] overflow-y-auto border border-slate-200 rounded-xl">
                  {employees.map((emp: Employee) => (
                    <button
                      key={emp.id}
                      onClick={() => { setSelectedEmployeeId(emp.id); setEmployeeSearch(`${emp.firstName} ${emp.lastName}`); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-sky-50 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <span className="font-medium text-slate-800">{emp.firstName} {emp.lastName}</span>
                      {emp.department && <span className="text-slate-400 ml-2">— {emp.department}</span>}
                    </button>
                  ))}
                </div>
              )}
              {selectedEmployee && (
                <div className="flex items-center gap-3 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 mt-2">
                  <div className="w-8 h-8 rounded-full bg-sky-200 text-sky-700 flex items-center justify-center text-sm font-bold">
                    {selectedEmployee.firstName.charAt(0)}{selectedEmployee.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                    <p className="text-xs text-slate-500">{selectedEmployee.function} — {selectedEmployee.department}</p>
                  </div>
                  <button onClick={() => { setSelectedEmployeeId(''); setEmployeeSearch(''); }} className="ml-auto text-xs text-slate-400 hover:text-rose-500">Changer</button>
                </div>
              )}
            </div>

            {selectedEmployeeId && (
              <div className="mt-8 border-t border-slate-100 pt-6">
                <DynamicDocumentForm
                  variableSchema={currentSchema}
                  employeeData={employeeDataForForm}
                  formData={formData}
                  onFormDataChange={setFormData}
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Review */}
        {step === 2 && (selectedDocType || selectedTemplateId) && selectedEmployee && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Aperçu et confirmation</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-medium text-slate-400 mb-1">Type de Document</p>
                <p className="text-sm font-bold text-slate-800">
                  {selectedTemplateId && templateDetails?.data?.name 
                    ? templateDetails.data.name 
                    : (DOCUMENT_TYPE_LABELS[selectedDocType] || selectedDocType || 'Document personnalisé')
                  }
                </p>
                <p className="text-xs text-slate-500 uppercase">
                  {selectedTemplateId ? 'Modèle personnalisé' : 'Modèle statique'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-medium text-slate-400 mb-1">Employé</p>
                <p className="text-sm font-bold text-slate-800">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                <p className="text-xs text-slate-500">{selectedEmployee.function}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-medium text-slate-400 mb-2">Langue</p>
                <LanguageSelector
                  selectedLanguage={selectedLanguage}
                  onLanguageChange={setSelectedLanguage}
                  className="w-full"
                />
                <p className="text-xs text-slate-500 mt-3">Document sera généré dans cette langue</p>
              </div>
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="w-full px-6 py-4 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              id="gen-generate-btn"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Génération en cours...</>
              ) : (
                <><Zap className="w-4 h-4 fill-white" /> Générer le document</>
              )}
            </button>
          </div>
        )}

        {/* STEP 3: Done */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Document généré !</h2>
            <p className="text-sm text-slate-500 mb-6">Le PDF a été créé avec succès.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-lg shadow-slate-900/10"
                id="gen-download-btn"
              >
                <Download className="w-4 h-4" /> Télécharger le document
              </button>
              <button
                onClick={() => { setStep(0); setSelectedDocType(''); setSelectedEmployeeId(''); setEmployeeSearch(''); setFormData({}); setGeneratedDocId(null); }}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition-all"
              >
                <Zap className="w-4 h-4" /> Générer un autre
              </button>
              <button
                onClick={() => navigate('/documents')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors"
              >
                Voir les documents
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      {step < 3 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose?.()}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Annuler' : 'Retour'}
          </button>
          {step < 2 && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canGoNext()}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
