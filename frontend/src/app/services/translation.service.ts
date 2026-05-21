import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import enTranslations from './translations/en.json';
import siTranslations from './translations/si.json';
import taTranslations from './translations/ta.json';

export type Language = 'en' | 'si' | 'ta';

interface TranslationData {
  [key: string]: string | TranslationData;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage = new BehaviorSubject<Language>(this.getSavedLanguage());
  currentLanguage$: Observable<Language> = this.currentLanguage.asObservable();
  
  private translations: { [key in Language]: TranslationData } = {
    en: enTranslations as TranslationData,
    si: siTranslations as TranslationData,
    ta: taTranslations as TranslationData,
  };

  constructor() {
    this.applyLanguage(this.currentLanguage.value);
  }

  private getSavedLanguage(): Language {
    const saved = localStorage.getItem('app-language') as Language | null;
    return saved && ['en', 'si', 'ta'].includes(saved) ? saved : 'en';
  }

  setLanguage(language: Language): void {
    this.currentLanguage.next(language);
    localStorage.setItem('app-language', language);
    this.applyLanguage(language);
  }

  getLanguage(): Language {
    return this.currentLanguage.value;
  }

  private applyLanguage(language: Language): void {
    document.documentElement.lang = language;
    document.body.setAttribute('data-lang', language);
  }

  translate(key: string, params?: { [key: string]: string }): string {
    const lang = this.currentLanguage.value;
    let translation = this.getNestedValue(this.translations[lang], key);

    if (!translation) {
      console.warn(`Translation key not found: ${key}`);
      translation = key;
    }

    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(`{{${param}}}`, params[param]);
      });
    }

    return translation;
  }

  private getNestedValue(obj: any, path: string): string {
    return path.split('.').reduce((acc, part) => acc?.[part], obj) || '';
  }

  getAvailableLanguages(): Array<{ code: Language; name: string }> {
    return [
      { code: 'en', name: 'English' },
      { code: 'si', name: 'සිංහල' },
      { code: 'ta', name: 'தமிழ்' }
    ];
  }
}
