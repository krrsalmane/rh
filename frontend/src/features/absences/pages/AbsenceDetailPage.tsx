import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserX, ArrowLeft, Loader2, FileText, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAbsence, useJustifyAbsence, useMarkUnjustified } from '../hooks/useAbsences';
import { useAppSelector } from '@/store/hooks';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const AbsenceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = useAppSelector((s) => s.auth.role);
  const canManage = role === 'super_admin' || role === 'hr_agent';

  const { data: absence, isLoading } = useAbsence(id);
  const justifyMut = useJustifyAbsence();
  const markUnjustifiedMut = useMarkUnjustified();

  const [files, setFiles] = useState<FileList | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
      </div>
    );
  }

  if (!absence?.data) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Absence introuvable</p>
        <button onClick={() => navigate('/absences')} className="mt-4 text-rose-500 hover:underline">Retour à la liste</button>
      </div>
    );
  }

  const abs = absence.data;

  const handleJustify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('attachments', files[i]);
    }
    formData.append('reviewNote', reviewNote);

    justifyMut.mutate({ id: abs.id, formData }, {
      onSuccess: () => {
        setFiles(null);
        setReviewNote('');
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up" id="absence-detail-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/absences')}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
            <UserX className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Détails de l'absence</h1>
            <p className="text-sm text-slate-400">{abs.employeeName}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Informations</h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400 uppercase">Statut</p>
                <div className="mt-1">
                  {abs.justificationStatus === 'pending' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                      <Clock className="w-3.5 h-3.5" /> En attente
                    </span>
                  )}
                  {abs.justificationStatus === 'justified' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                      <CheckCircle className="w-3.5 h-3.5" /> Justifiée
                    </span>
                  )}
                  {abs.justificationStatus === 'unjustified' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                      <XCircle className="w-3.5 h-3.5" /> Non justifiée
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 uppercase">Période</p>
                <p className="text-sm font-medium text-slate-700">
                  Du {format(new Date(abs.startDate), 'dd/MM/yyyy')} au {format(new Date(abs.endDate), 'dd/MM/yyyy')}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400 uppercase">Type</p>
                <p className="text-sm font-medium text-slate-700">{abs.type || 'Non spécifié'}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400 uppercase">Département</p>
                <p className="text-sm font-medium text-slate-700">{abs.department}</p>
              </div>
            </div>
          </div>

          {abs.attachments && Array.isArray(abs.attachments) && abs.attachments.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Justificatifs</h3>
              <div className="space-y-2">
                {abs.attachments.map((file, idx) => (
                  <a 
                    key={idx} 
                    href={`/api/uploads/${file}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors group"
                  >
                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
                    <span className="text-xs text-slate-600 truncate">Document {idx + 1}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Motif de l'absence</h3>
              <div className="p-4 rounded-xl bg-slate-50 text-slate-700 italic">
                {abs.reason || "Aucun motif fourni lors de l'enregistrement."}
              </div>
            </div>

            {abs.reviewNote && (
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Note de révision</h3>
                <div className="p-4 rounded-xl bg-violet-50 text-violet-700 text-sm">
                  {abs.reviewNote}
                </div>
              </div>
            )}

            {canManage && abs.justificationStatus === 'pending' && (
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Justifier l'absence</h3>
                <form onSubmit={handleJustify} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Documents justificatifs (Max 5)</label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 hover:border-rose-300 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-slate-400 mb-2" />
                          <p className="text-sm text-slate-500">
                            {files ? `${files.length} fichier(s) sélectionné(s)` : 'Cliquez pour uploader ou glissez-déposez'}
                          </p>
                        </div>
                        <input type="file" multiple onChange={(e) => setFiles(e.target.files)} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Note de révision (optionnel)</label>
                    <textarea 
                      value={reviewNote} 
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Ajouter une note..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 min-h-[100px]"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button 
                      type="submit" 
                      disabled={justifyMut.isPending || !files}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                      {justifyMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Valider comme justifiée
                    </button>
                    <button 
                      type="button"
                      disabled={markUnjustifiedMut.isPending}
                      onClick={() => markUnjustifiedMut.mutate(abs.id)}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-all"
                    >
                      {markUnjustifiedMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Marquer non justifiée
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
