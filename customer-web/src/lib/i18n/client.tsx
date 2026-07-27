'use client';

import { useEffect, useMemo, useState } from 'react';
import { en, vi, es, ja, zh, type Dictionary, type Lang } from '@/i18n';
export type { Lang } from '@/i18n';
import { getCategoryLabelKey } from '@/constants/categories';
import { useSiteSettings } from '@/lib/site-settings';

const dictionaries: Record<Lang, Dictionary> = { en, vi, es, ja, zh };
const STORAGE_KEY = 'om-language';

function normalizeLang(value?: string | null): Lang {
  return value === 'vi' || value === 'es' || value === 'ja' || value === 'zh' ? value : 'en';
}

export function getCategoryLabel(value?: string | null, lang: Lang = 'en') {
  const key = getCategoryLabelKey(value);
  const dictionary = dictionaries[lang];
  return key ? (dictionary[key] ?? dictionaries.en[key] ?? value ?? '') : (value ?? '');
}


function getPackageLabelKey(value?: string | null) {
  const code = (value ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  const map: Record<string, string> = { FREE: 'pkgFree', BASIC: 'pkgBasic', FEATURED: 'pkgFeatured', URGENT: 'pkgUrgent', PREMIUM: 'pkgPremium', CREDITS100: 'pkgCredits100' };
  return map[code];
}

export function getPackageLabel(value?: string | null, lang: Lang = 'en') {
  const key = getPackageLabelKey(value);
  const dictionary = dictionaries[lang];
  return key ? (dictionary[key] ?? dictionaries.en[key] ?? value ?? '') : (value ?? '');
}

function getPaymentProviderLabelKey(value?: string | null) {
  const code = (value ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  const map: Record<string, string> = { TEST: 'providerTest', STRIPE: 'providerStripe', PAYPAL: 'providerPaypal' };
  return map[code];
}

export function getPaymentProviderLabel(value?: string | null, lang: Lang = 'en') {
  const key = getPaymentProviderLabelKey(value);
  const dictionary = dictionaries[lang];
  return key ? (dictionary[key] ?? dictionaries.en[key] ?? value ?? '') : (value ?? '');
}
export function useI18n() {
  const siteSettings = useSiteSettings();
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const applyLanguage = () => {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      const next = siteSettings.showLanguageSelector && stored
        ? normalizeLang(stored)
        : normalizeLang(siteSettings.defaultLanguage);
      setLangState(next);
      document.documentElement.lang = next;
    };
    applyLanguage();
    window.addEventListener('storage', applyLanguage);
    window.addEventListener('om-language-changed', applyLanguage);
    return () => {
      window.removeEventListener('storage', applyLanguage);
      window.removeEventListener('om-language-changed', applyLanguage);
    };
  }, [siteSettings.defaultLanguage, siteSettings.showLanguageSelector]);

  const api = useMemo(() => {
    const dictionary = dictionaries[lang];
    return {
      lang,
      t: (key: string) => dictionary[key] ?? dictionaries.en[key] ?? key,
      category: (value?: string | null) => getCategoryLabel(value, lang),
      packageLabel: (value?: string | null) => getPackageLabel(value, lang),
      paymentProviderLabel: (value?: string | null) => getPaymentProviderLabel(value, lang),
      setLang: (next: Lang) => {
        if (!siteSettings.showLanguageSelector) return;
        localStorage.setItem(STORAGE_KEY, next);
        document.documentElement.lang = next;
        setLangState(next);
        window.dispatchEvent(new Event('om-language-changed'));
      },
    };
  }, [lang, siteSettings.showLanguageSelector]);

  return api;
}
