import React, { useEffect, useState } from 'react';
import { companyApi } from '../api';
import { Building2, MapPin, Loader2, Image as ImageIcon } from 'lucide-react';
import {
  FormField,
  FormGrid,
  FormInput,
  FormTextarea,
  FileUploadZone,
  FormWizard,
  type FormWizardStep,
} from '@/shared/components/forms';
import { toast } from 'react-hot-toast';

const WIZARD_STEPS: FormWizardStep[] = [
  {
    id: 'profile',
    title: 'Profil entreprise',
    description: 'Logo, nom et adresse affichés sur les documents officiels',
  },
  {
    id: 'prayer',
    title: 'Localisation',
    description: 'Coordonnées pour le calcul des pauses de prière',
  },
];

export const CompanySettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: '',
    address: '',
    logoUrl: '',
    latitude: 31.629100,
    longitude: -8.009700,
  });

  useEffect(() => {
    companyApi
      .get()
      .then((res) => setData(res))
      .catch(() => toast.error('Erreur lors du chargement des paramètres'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!data.name.trim()) {
      toast.error('Le nom de l\'entreprise est requis');
      setStep(0);
      return;
    }
    setSaving(true);
    try {
      await companyApi.update(data);
      toast.success('Paramètres mis à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (step === 0 && !data.name.trim()) {
      toast.error('Le nom de l\'entreprise est requis');
      return;
    }
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="form-page animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-[#EFF6FF] p-2 text-[#2563EB]">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-[#1A1A2E]">Paramètres de l'entreprise</h3>
          <p className="mt-0.5 text-xs text-[#6B7280]">Configuration globale du profil société</p>
        </div>
      </div>

      <FormWizard
        steps={WIZARD_STEPS}
        currentStep={step}
        onCancel={() => setStep(0)}
        onBack={() => setStep((s) => Math.max(0, s - 1))}
        onNext={handleNext}
        onSubmit={handleSave}
        onStepClick={(index) => {
          if (index < step) setStep(index);
        }}
        isLoading={saving}
        submitText="Enregistrer les modifications"
      >
        {step === 0 && (
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <FormField label="Logo de l'entreprise">
              <div className="flex h-32 w-32 flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-[#D1D5DB] bg-[#F9FAFB]">
                {data.logoUrl ? (
                  <img src={data.logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
                ) : (
                  <div className="flex flex-col items-center text-[#9CA3AF]">
                    <ImageIcon className="mb-2 h-8 w-8" />
                    <span className="text-[10px] font-medium">Aucun logo</span>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <FileUploadZone
                  accept=".png,.jpg,.jpeg,.svg"
                  onDrop={(files) => {
                    if (files?.length) {
                      setData((d) => ({ ...d, logoUrl: URL.createObjectURL(files[0]) }));
                    }
                  }}
                />
              </div>
            </FormField>

            <div className="flex-1 space-y-4">
              <FormField label="Nom de l'entreprise" required>
                <FormInput
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  placeholder="Ex: Maya Digital"
                />
              </FormField>
              <FormField label="Adresse du siège">
                <FormTextarea
                  value={data.address}
                  onChange={(e) => setData({ ...data, address: e.target.value })}
                  rows={3}
                  placeholder="Adresse complète..."
                />
              </FormField>
            </div>
          </div>
        )}

        {step === 1 && (
          <>
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3">
              <MapPin className="h-5 w-5 text-[#2563EB]" />
              <p className="text-xs text-[#6B7280]">
                Utilisé pour calculer le nombre de pauses de prière autorisées par jour.
              </p>
            </div>
            <FormGrid>
              <FormField label="Latitude">
                <FormInput
                  type="number"
                  step="0.000001"
                  min={-90}
                  max={90}
                  value={String(data.latitude)}
                  onChange={(e) =>
                    setData({ ...data, latitude: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="Ex: 31.629100"
                />
                <p className="mt-1 text-xs text-[#9CA3AF]">Entre -90 et 90</p>
              </FormField>
              <FormField label="Longitude">
                <FormInput
                  type="number"
                  step="0.000001"
                  min={-180}
                  max={180}
                  value={String(data.longitude)}
                  onChange={(e) =>
                    setData({ ...data, longitude: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="Ex: -8.009700"
                />
                <p className="mt-1 text-xs text-[#9CA3AF]">Entre -180 et 180</p>
              </FormField>
            </FormGrid>
          </>
        )}
      </FormWizard>
    </div>
  );
};
