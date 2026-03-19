import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { DocumentGenerator } from '../components/DocumentGenerator';

export const GenerateDocumentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('templateId') || undefined;
  const employeeId = searchParams.get('employeeId') || undefined;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up" id="generate-document-page">
      <DocumentGenerator
        preselectedTemplateId={templateId}
        preselectedEmployeeId={employeeId}
      />
    </div>
  );
};
