// Z-Index hierarchy for consistent layering across application
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 10,
  STICKY: 20,
  MODAL_BACKDROP: 1000,
  MODAL: 1001,
  SIDEBAR: 50,
  NOTIFICATION: 1060,
  TOOLTIP: 1070,
  MAX: 9999,
} as const;

export const Z_INDEX_CLASSES = {
  MODAL_BACKDROP: 'z-[1000]',
  MODAL: 'z-[1001]',
  SIDEBAR: 'z-50',
  NOTIFICATION: 'z-[1060]',
  TOOLTIP: 'z-[1070]',
} as const;

export const getZIndexClass = (layer: keyof typeof Z_INDEX_CLASSES): string => {
  return Z_INDEX_CLASSES[layer] || 'z-[1001]';
};

export const MODAL_BACKDROP_CLASSES = {
  base: 'bg-black/45',
  blur: 'backdrop-blur-[2px]',
};
