import { create } from 'zustand'

export type Language = "en" | "cz" | "de"

interface LanguageState {
    nativeLanguage: Language;
    studiedLanguage: Language;
    setNativeLanguage: (lang: Language) => void;
    setStudiedLanguage: (lang: Language) => void;
};

const useLanguage = create<LanguageState>((set) => ({
    nativeLanguage: "cz",
    studiedLanguage: "de",
    setStudiedLanguage: (lang) =>
        set(() => ({ studiedLanguage: lang })),

    setNativeLanguage: (lang) =>
        set(() => ({ nativeLanguage: lang })),
}));

export function getNativeLang() {
    return useLanguage.getState().nativeLanguage;
}

export function getStudiedLang() {
    return useLanguage.getState().studiedLanguage;
}

export function getLanguagesJson()
{
    const languages_data = {studied: getStudiedLang(), native: getNativeLang()};
    return JSON.stringify(languages_data);
}

export default useLanguage;