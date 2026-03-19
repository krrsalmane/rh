import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, FileText, User, ClipboardCheck, Download, Loader2, ArrowLeft, Zap } from 'lucide-react';
import { useActiveTemplates, useGenerateDocument } from '../hooks/useDocuments';
import { useEmployees } from '@/features/employees/hooks/useEmployees';
import { DynamicDocumentForm } from './DynamicDocumentForm';
import type { Template, GenerateDocumentDto } from '../types';
import type { Employee } from '@/features/employees/types';
import axios from '@/shared/api/axiosInstance';

const STEPS = [
  { key: 'template', label: 'Modèle', icon: FileText },
  { key: 'form', label: 'Informations', icon: ClipboardCheck },
  { key: 'review', label: 'Aperçu', icon: User },
  { key: 'done', label: 'Terminé', icon: CheckCircle2 },
];

interface Props {
  preselectedEmployeeId?: string;
  preselectedTemplateId?: string;
  onClose?: () => void;
}

export const DocumentGenerator: React.FC<Props> = ({ preselectedEmployeeId, preselectedTemplateId, onClose }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(preselectedTemplateId ? 1 : 0);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(preselectedEmployeeId || '');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [generatedDocId, setGeneratedDocId] = useState<string | null>(null);

  const { data: templates = [], isLoading: loadingTemplates } = useActiveTemplates();

  // Pre-select template if provided via URL
  React.useEffect(() => {
    if (preselectedTemplateId && templates.length > 0 && !selectedTemplate) {
      const found = templates.find((t) => t.id === preselectedTemplateId);
      if (found) setSelectedTemplate(found);
    }
  }, [preselectedTemplateId, templates, selectedTemplate]);
  const { data: employeesData } = useEmployees({ search: employeeSearch, page: 1, limit: 50 });
  const generateMutation = useGenerateDocument();

  const employees = employeesData?.data || [];
  const selectedEmployee = employees.find((e: Employee) => e.id === selectedEmployeeId);

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
    if (!selectedTemplate || !selectedEmployeeId) return;
    const dto: GenerateDocumentDto = {
      templateId: selectedTemplate.id,
      employeeId: selectedEmployeeId,
      formData,
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
    if (step === 0) return !!selectedTemplate;
    if (step === 1) return !!selectedEmployeeId;
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
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-sky-100 text-sky-700' : isDone ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400'
              }`}>
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 min-h-[400px]">
        {/* STEP 0: Choose template */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Choisir un modèle</h2>
            {loadingTemplates ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-sky-500 animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      selectedTemplate?.id === tpl.id
                        ? 'border-sky-500 bg-sky-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    id={`gen-tpl-${tpl.id}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-sky-500" />
                      <span className="text-sm font-semibold text-slate-800">{tpl.name}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {tpl.variableSchema.filter((v) => !v.autoFill).length} champ(s) à remplir
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 1: Employee + Form */}
        {step === 1 && selectedTemplate && (
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

            {/* Dynamic form */}
            {selectedEmployeeId && (
              <DynamicDocumentForm
                variableSchema={selectedTemplate.variableSchema}
                employeeData={employeeDataForForm}
                formData={formData}
                onFormDataChange={setFormData}
              />
            )}
          </div>
        )}

        {/* STEP 2: Review */}
        {step === 2 && selectedTemplate && selectedEmployee && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Aperçu et confirmation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-medium text-slate-400 mb-1">Modèle</p>
                <p className="text-sm font-bold text-slate-800">{selectedTemplate.name}</p>
                <p className="text-xs text-slate-500">v{selectedTemplate.version}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-medium text-slate-400 mb-1">Employé</p>
                <p className="text-sm font-bold text-slate-800">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                <p className="text-xs text-slate-500">{selectedEmployee.function}</p>
              </div>
            </div>
            {Object.keys(formData).length > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-medium text-slate-400 mb-2">Données du formulaire</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(formData).map(([key, val]) => (
                    <div key={key}>
                      <span className="text-xs text-slate-400">{key}: </span>
                      <span className="text-xs font-medium text-slate-700">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="w-full px-6 py-3 text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors shadow-lg shadow-sky-500/20 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              id="gen-generate-btn"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Génération en cours...</>
              ) : (
                <><Zap className="w-4 h-4" /> Générer le PDF</>
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
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors shadow-lg shadow-sky-500/20"
                id="gen-download-btn"
              >
                <Download className="w-4 h-4" /> Télécharger PDF
              </button>
              <button
                onClick={() => { setStep(0); setSelectedTemplate(null); setSelectedEmployeeId(''); setEmployeeSearch(''); setFormData({}); setGeneratedDocId(null); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
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
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Annuler' : 'Retour'}
          </button>
          {step < 2 && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canGoNext()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors shadow-lg shadow-sky-500/20 disabled:opacity-50"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
