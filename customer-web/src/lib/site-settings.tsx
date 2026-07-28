'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { appConfig } from '@/lib/config';
import { mediaUrl } from '@/lib/media/url';

export type SiteBranding = {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  facebookUrl: string;
  youtubeUrl: string;
  instagramUrl: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  footerText: string;
  seoTitle: string;
  seoDescription: string;
  defaultLanguage: 'en' | 'vi' | 'es' | 'ja' | 'zh';
  showLanguageSelector: boolean;
};

const DEFAULT_BRANDING: SiteBranding = {
  siteName: 'OpenMarketplace',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#0969ff',
  secondaryColor: '#f59e0b',
  facebookUrl: '',
  youtubeUrl: '',
  instagramUrl: '',
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
  footerText: 'Modern local classifieds for buying, selling and discovering trusted listings nearby.',
  seoTitle: 'OpenMarketplace',
  seoDescription: 'Local classifieds marketplace',
  defaultLanguage: 'en',
  showLanguageSelector: true,
};

const SiteSettingsContext = createContext<SiteBranding>(DEFAULT_BRANDING);

const BRANDING_CACHE_KEY = 'customer.site-branding.v1';

function normalizeBranding(data: any): SiteBranding {
  const branding = data?.branding ?? data?.data?.branding ?? data?.settings?.branding ?? {};
  const settings = data?.settings ?? data?.data?.settings ?? {};
  const value = (camel: keyof SiteBranding, key: string, fallback = '') => {
    const fromBranding = branding?.[camel];
    const fromSettings = settings?.[key];
    const raw = fromBranding ?? fromSettings ?? fallback;
    return typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim();
  };
  const defaultLanguageRaw = value('defaultLanguage', 'localization.default_language', DEFAULT_BRANDING.defaultLanguage);
  const defaultLanguage = defaultLanguageRaw === 'vi' || defaultLanguageRaw === 'es' || defaultLanguageRaw === 'ja' || defaultLanguageRaw === 'zh' ? defaultLanguageRaw : 'en';
  const showLanguageSelectorRaw = value('showLanguageSelector', 'localization.show_language_selector', String(DEFAULT_BRANDING.showLanguageSelector));
  return {
    siteName: value('siteName', 'site.name', DEFAULT_BRANDING.siteName),
    logoUrl: value('logoUrl', 'site.logo_url', DEFAULT_BRANDING.logoUrl),
    faviconUrl: value('faviconUrl', 'site.favicon_url', DEFAULT_BRANDING.faviconUrl),
    primaryColor: value('primaryColor', 'site.primary_color', DEFAULT_BRANDING.primaryColor),
    secondaryColor: value('secondaryColor', 'site.secondary_color', DEFAULT_BRANDING.secondaryColor),
    facebookUrl: value('facebookUrl', 'social.facebook_url', DEFAULT_BRANDING.facebookUrl),
    youtubeUrl: value('youtubeUrl', 'social.youtube_url', DEFAULT_BRANDING.youtubeUrl),
    instagramUrl: value('instagramUrl', 'social.instagram_url', DEFAULT_BRANDING.instagramUrl),
    contactEmail: value('contactEmail', 'contact.email', DEFAULT_BRANDING.contactEmail),
    contactPhone: value('contactPhone', 'contact.phone', DEFAULT_BRANDING.contactPhone),
    contactAddress: value('contactAddress', 'contact.address', DEFAULT_BRANDING.contactAddress),
    footerText: value('footerText', 'footer.text', DEFAULT_BRANDING.footerText),
    seoTitle: value('seoTitle', 'seo.title', DEFAULT_BRANDING.seoTitle),
    seoDescription: value('seoDescription', 'seo.description', DEFAULT_BRANDING.seoDescription),
    defaultLanguage,
    showLanguageSelector: showLanguageSelectorRaw.toLowerCase() !== 'false',
  };
}

function resolveFavicon(url?: string | null) {
  return mediaUrl(url);
}

function ensureFavicon(resolved?: string | null) {
  if (!resolved || typeof document === 'undefined') return;

  const iconLinks = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]'));
  const link = iconLinks[0] ?? document.createElement('link');
  link.rel = 'icon';
  if (link.href !== resolved) link.href = resolved;
  if (!link.parentNode) document.head.appendChild(link);

  // Remove duplicate route-generated favicon links so Next navigation cannot
  // temporarily replace the configured customer favicon.
  for (const duplicate of iconLinks.slice(1)) duplicate.remove();
}

function readBrandingCache(): SiteBranding | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(BRANDING_CACHE_KEY);
    return raw ? ({ ...DEFAULT_BRANDING, ...JSON.parse(raw) } as SiteBranding) : null;
  } catch {
    return null;
  }
}

function writeBrandingCache(branding: SiteBranding) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(branding));
  } catch {
    // Storage can be unavailable in private/restricted browser modes.
  }
}

function applyCssVariables(branding: SiteBranding) {
  if (typeof document === 'undefined') return;
  if (branding.primaryColor) document.documentElement.style.setProperty('--primary', branding.primaryColor);
  if (branding.primaryColor) document.documentElement.style.setProperty('--primary-dark', branding.primaryColor);
  if (branding.primaryColor) document.documentElement.style.setProperty('--primary-soft', `${branding.primaryColor}18`);
  if (branding.primaryColor) document.documentElement.style.setProperty('--brand-button-bg', `linear-gradient(180deg, ${branding.primaryColor}, ${branding.primaryColor})`);
  if (branding.secondaryColor) document.documentElement.style.setProperty('--secondary', branding.secondaryColor);
  if (branding.secondaryColor) document.documentElement.style.setProperty('--secondary-soft', `${branding.secondaryColor}18`);
  if (branding.secondaryColor) document.documentElement.style.setProperty('--amber', branding.secondaryColor);
}

export function SiteSettingsProvider({ children, initialBranding }: { children: ReactNode; initialBranding?: Partial<SiteBranding> }) {
  const initialValue = useMemo<SiteBranding>(() => ({ ...DEFAULT_BRANDING, ...initialBranding }), [initialBranding]);
  const [branding, setBranding] = useState<SiteBranding>(initialValue);

  useEffect(() => {
    let cancelled = false;

    // Reuse the branding during client-side navigation. A full browser refresh
    // runs this provider again and refreshes the cache from Admin settings.
    const cached = readBrandingCache();
    if (cached) setBranding(cached);

    async function load() {
      try {
        const res = await fetch(`${appConfig.apiBaseUrl}/site-settings`, { cache: 'no-store' });
        const payload = await res.json().catch(() => null);
        if (!res.ok) throw new Error('Site settings request failed');
        const next = normalizeBranding(payload?.success && payload?.data ? payload.data : payload);
        if (!cancelled) {
          writeBrandingCache(next);
          setBranding(next);
        }
      } catch {
        // Keep the server-provided or cached branding instead of reverting to
        // OpenMarketplace when the settings request is temporarily unavailable.
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    applyCssVariables(branding);

    const stableTitle = branding.siteName || DEFAULT_BRANDING.siteName;
    const stableFavicon = resolveFavicon(branding.faviconUrl || branding.logoUrl);

    const applyStableHead = () => {
      if (document.title !== stableTitle) document.title = stableTitle;
      ensureFavicon(stableFavicon);
    };

    applyStableHead();

    const description = branding.seoDescription;
    if (description) {
      let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = description;
    }

    // Next.js can update <head> when navigating between pages. Restore the
    // cached website title/favicon immediately without calling the API again.
    const observer = new MutationObserver(applyStableHead);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [branding]);

  const value = useMemo(() => branding, [branding]);
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

export function resolveSiteImage(url?: string | null) {
  return mediaUrl(url);
}
