'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import tr from '@/locales/tr.json';
import en from '@/locales/en.json';

export type Language = 'tr' | 'en';

export type Translations = typeof tr;

const translations: Record<Language, Translations> = {
  tr,
  en: en as Translations,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Sistem dilini algılar ve desteklenen dile dönüştürür
 * Türkçe (tr) ve İngilizce (en) desteklenir
 */
function getSystemLanguage(): Language {
  const browserLang = navigator.language.toLowerCase();

  // Türkçe varyantlarını kontrol et (tr, tr-TR, tr-CY, vb.)
  if (browserLang.startsWith('tr')) {
    return 'tr';
  }

  // Varsayılan olarak İngilizce döndür
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language | null;
    if (saved && (saved === 'tr' || saved === 'en')) {
      setTimeout(() => setLanguage(saved), 0);
    } else {
      // Sistem dilini algıla ve kullan
      const systemLang = getSystemLanguage();
      setTimeout(() => setLanguage(systemLang), 0);
      localStorage.setItem('language', systemLang);
    }
    setTimeout(() => setMounted(true), 0);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  if (!mounted) {
    return <></>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
