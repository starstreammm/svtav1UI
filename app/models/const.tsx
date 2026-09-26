export const UI_VERSION = "4.0.2";


export const Language = {
    en: "English",
    ja: "Japanese",
    zh: "Chinese",
    "zh-CN": "Chinese (Simplified)",
    "zh-TW": "Chinese (Traditional)",
    ko: "Korean",
    fr: "French",
    de: "German",
    es: "Spanish",
    it: "Italian",
    ru: "Russian",
    pt: "Portuguese",
    ar: "Arabic",
    th: "Thai",
    vi: "Vietnamese"
};
export type LanguageKey = keyof typeof Language;


export const Rotate = [
    "90° clockwise and flip vertically",
    "90° clockwise",
    "90° counterclockwise",
    "90° counterclockwise and flip vertically",
    "Horizontal flip",
    "Vertical flip",
    "180° rotation",
] as const;