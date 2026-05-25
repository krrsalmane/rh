import React, { useState } from 'react';

interface HiddenSalaryProps {
  salary?: number;
  className?: string;
}

export const HiddenSalary: React.FC<HiddenSalaryProps> = ({ salary, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!salary) {
    return <span className={className}>—</span>;
  }

  const formattedSalary = salary.toLocaleString('fr-FR') + ' MAD';
  const maskedSalary = '●●●●●●';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setIsVisible(!isVisible);
      }}
      className={`px-2 py-1 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 font-mono text-sm ${className}`}
      title={isVisible ? 'Cacher' : 'Afficher'}
    >
      {isVisible ? formattedSalary : maskedSalary}
    </button>
  );
};
