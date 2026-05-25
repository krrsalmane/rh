import React from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface FileUploadZoneProps {
  title?: string;
  subtitle?: string;
  onClick?: () => void;
  onDrop?: (files: FileList) => void;
  accept?: string;
  className?: string;
  children?: React.ReactNode;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  title = 'Glissez un fichier ici ou cliquez pour parcourir',
  subtitle = 'PDF, DOCX, JPG — max 10 Mo',
  onClick,
  onDrop,
  accept,
  className,
  children,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files?.length && onDrop) {
      onDrop(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
    onClick?.();
  };

  return (
    <div
      className={cn('file-upload-zone', className)}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={accept}
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files?.length && onDrop) onDrop(e.target.files);
        }}
        aria-hidden
      />
      {children ?? (
        <>
          <Upload className="file-upload-icon" strokeWidth={1.5} />
          <p className="file-upload-title">{title}</p>
          <p className="file-upload-subtitle">{subtitle}</p>
        </>
      )}
    </div>
  );
};
