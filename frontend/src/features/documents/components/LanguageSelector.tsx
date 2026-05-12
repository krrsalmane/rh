import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export type SupportedLanguage = 'fr' | 'ar' | 'en' | 'de';

interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

const LANGUAGES: LanguageOption[] = [
  { code: 'fr', name: 'Français', flag: '🇫🇷', direction: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', direction: 'rtl' },
  { code: 'en', name: 'English', flag: '🇬🇧', direction: 'ltr' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', direction: 'ltr' },
];

interface LanguageSelectorProps {
  selectedLanguage: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
  className?: string;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  className,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedLanguageData = LANGUAGES.find(lang => lang.code === selectedLanguage) || LANGUAGES[0];

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "ring-2 ring-slate-900 ring-offset-1"
        )}
      >
        <span className="text-lg">{selectedLanguageData.flag}</span>
        <span className="text-slate-700">{selectedLanguageData.name}</span>
        <ChevronDown className={cn(
          "w-4 h-4 text-slate-400 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="py-1">
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => {
                  onLanguageChange(language.code);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-50 focus:outline-none focus:bg-slate-50",
                  language.code === selectedLanguage && "bg-slate-100 text-slate-900",
                  language.direction === 'rtl' && "flex-row-reverse"
                )}
                dir={language.direction}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="text-slate-700">{language.name}</span>
                {language.code === selectedLanguage && (
                  <div className="w-2 h-2 bg-slate-900 rounded-full ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for displaying language info
export const LanguageInfo: React.FC<{ language: SupportedLanguage }> = ({ language }) => {
  const languageData = LANGUAGES.find(lang => lang.code === language) || LANGUAGES[0];
  
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <span>{languageData.flag}</span>
      <span>{languageData.name}</span>
    </div>
  );
};

// Hook for getting language display name
export const useLanguageDisplay = (language: SupportedLanguage) => {
  const languageData = LANGUAGES.find(lang => lang.code === language) || LANGUAGES[0];
  return languageData;
};
