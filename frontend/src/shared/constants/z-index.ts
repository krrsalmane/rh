// Z-Index hierarchy for consistent layering across application
export const Z_INDEX = {
  // Base layers
  BASE: 0,
  DROPDOWN: 10,
  STICKY: 20,
  
  // Overlay layers
  MODAL_BACKDROP: 40,
  SIDEBAR: 50,
  MODAL: 50,
  
  // Top layers
  NOTIFICATION: 60,
  TOOLTIP: 70,
  
  // Maximum
  MAX: 9999,
} as const;

// Tailwind CSS classes for consistent z-index usage
export const Z_INDEX_CLASSES = {
  MODAL_BACKDROP: 'z-40',
  SIDEBAR: 'z-50',
  MODAL: 'z-50',
  NOTIFICATION: 'z-60',
  TOOLTIP: 'z-70',
} as const;

// Helper function to get z-index class with fallback
export const getZIndexClass = (layer: keyof typeof Z_INDEX_CLASSES): string => {
  return Z_INDEX_CLASSES[layer] || 'z-50';
};

// Modal backdrop styling for consistent shadows
export const MODAL_BACKDROP_CLASSES = {
  base: 'bg-black/40',
  blur: 'backdrop-blur-sm',
};
