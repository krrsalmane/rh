export const SUPPORTED_LANGUAGES = ['fr', 'en', 'ar', 'de'] as const;
export const NAMESPACES = ['common', 'auth', 'employees', 'documents', 'time', 'absences', 'leaves', 'settings'] as const;
export const FALLBACK_LANGUAGE = 'fr';
export const RTL_LANGUAGES = ['ar'] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
export type Namespace = typeof NAMESPACES[number];
