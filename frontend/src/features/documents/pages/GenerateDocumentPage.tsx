import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DocumentGenerator } from '../components/DocumentGenerator';

export const GenerateDocumentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const documentType = searchParams.get('documentType') || undefined;
  const templateId = searchParams.get('templateId') || undefined;
  const employeeId = searchParams.get('employeeId') || undefined;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-20" id="generate-document-page">
      <DocumentGenerator
        preselectedDocumentType={documentType}
        preselectedTemplateId={templateId}
        preselectedEmployeeId={employeeId}
        onClose={() => navigate(-1)}
      />
    </div>
  );
};
