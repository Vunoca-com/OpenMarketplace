'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { appConfig } from '@/lib/config';
import { mediaUrl } from '@/lib/media/url';

export type SiteBranding = {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  backgroundImageUrl: string;
  backgroundSize: string;
  backgroundPosition: string;
  backgroundRepeat: string;
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
  layoutStyle: string;
  theme: string;
  density: string;
  font: string;
  radius: string;
  cardStyle: string;
  headerStyle: string;
  footerColumns: string;
  heroStyle: string;
  categoryStyle: string;
  listingCardStyle: string;
  showHero: boolean;
  showCategories: boolean;
  showFeatured: boolean;
  showNewest: boolean;
  showNearby: boolean;
  showSponsored: boolean;
  showRightRail: boolean;
};

const DEFAULT_BRANDING: SiteBranding = {
  siteName: 'OpenMarketplace',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#0969ff',
  secondaryColor: '#f59e0b',
  backgroundColor: '#f8fafc',
  backgroundImageUrl: '',
  backgroundSize: 'cover',
  backgroundPosition: 'center top',
  backgroundRepeat: 'no-repeat',
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
  layoutStyle: 'modern',
  theme: 'teal',
  density: 'comfortable',
  font: 'Inter',
  radius: '12',
  cardStyle: 'shadow',
  headerStyle: 'classic',
  footerColumns: '4',
  heroStyle: 'banner',
  categoryStyle: 'grid',
  listingCardStyle: 'modern',
  showHero: true,
  showCategories: true,
  showFeatured: true,
  showNewest: true,
  showNearby: true,
  showSponsored: true,
  showRightRail: true,
};

const SiteSettingsContext = createContext<SiteBranding>(DEFAULT_BRANDING);

const BRANDING_CACHE_KEY = 'customer.site-branding.v8';

function unwrapSettingValue(raw: any): string | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
  if (typeof raw === 'object') {
    const nested = raw.value ?? raw.Value ?? raw.settingValue ?? raw.SettingValue;
    return nested === undefined || nested === null ? undefined : String(nested);
  }
  return undefined;
}

function normalizeSettingsMap(raw: any): Record<string, string> {
  const result: Record<string, string> = {};
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const key = item?.key ?? item?.Key;
      const value = unwrapSettingValue(item);
      if (key && value !== undefined) result[String(key)] = value;
    }
    return result;
  }
  if (raw && typeof raw === 'object') {
    for (const [key, value] of Object.entries(raw)) {
      const unwrapped = unwrapSettingValue(value);
      if (unwrapped !== undefined) result[key] = unwrapped;
    }
  }
  return result;
}

function normalizeLayoutStyle(raw: string) {
  const value = (raw || DEFAULT_BRANDING.layoutStyle)
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const aliases: Record<string, string> = {
    market: 'marketplace',
    ecommerce: 'ecommerce',
    'e-commerce': 'ecommerce',
    communityportal: 'community',
    'community-portal': 'community',
    realestate: 'real-estate',
    property: 'real-estate',
    auto: 'automotive',
    car: 'automotive',
  };

  const normalized = aliases[value] ?? value;
  return ['modern', 'marketplace', 'ecommerce', 'community', 'minimal', 'real-estate', 'automotive', 'luxury'].includes(normalized)
    ? normalized
    : DEFAULT_BRANDING.layoutStyle;
}

function normalizeBranding(data: any): SiteBranding {
  const branding = data?.branding ?? data?.data?.branding ?? data?.settings?.branding ?? {};
  const settings = normalizeSettingsMap(data?.settings ?? data?.data?.settings ?? data?.items ?? data?.data?.items ?? {});
  const value = (camel: keyof SiteBranding, key: string, fallback = '') => {
    const fromBranding = unwrapSettingValue(branding?.[camel]);
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
    backgroundColor: value('backgroundColor', 'site.background_color', DEFAULT_BRANDING.backgroundColor),
    backgroundImageUrl: value('backgroundImageUrl', 'site.background_image_url', DEFAULT_BRANDING.backgroundImageUrl),
    backgroundSize: value('backgroundSize', 'site.background_size', DEFAULT_BRANDING.backgroundSize),
    backgroundPosition: value('backgroundPosition', 'site.background_position', DEFAULT_BRANDING.backgroundPosition),
    backgroundRepeat: value('backgroundRepeat', 'site.background_repeat', DEFAULT_BRANDING.backgroundRepeat),
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
    layoutStyle: normalizeLayoutStyle(value('layoutStyle', 'layout.style', DEFAULT_BRANDING.layoutStyle)),
    theme: value('theme', 'layout.theme', DEFAULT_BRANDING.theme),
    density: value('density', 'layout.density', DEFAULT_BRANDING.density),
    font: value('font', 'layout.font', DEFAULT_BRANDING.font),
    radius: value('radius', 'layout.radius', DEFAULT_BRANDING.radius),
    cardStyle: value('cardStyle', 'layout.card_style', DEFAULT_BRANDING.cardStyle),
    headerStyle: value('headerStyle', 'layout.header_style', DEFAULT_BRANDING.headerStyle),
    footerColumns: value('footerColumns', 'layout.footer_columns', DEFAULT_BRANDING.footerColumns),
    heroStyle: value('heroStyle', 'layout.hero_style', DEFAULT_BRANDING.heroStyle),
    categoryStyle: value('categoryStyle', 'layout.category_style', DEFAULT_BRANDING.categoryStyle),
    listingCardStyle: value('listingCardStyle', 'layout.listing_card_style', DEFAULT_BRANDING.listingCardStyle),
    showHero: value('showHero', 'layout.show_hero', 'true').toLowerCase() !== 'false',
    showCategories: value('showCategories', 'layout.show_categories', 'true').toLowerCase() !== 'false',
    showFeatured: value('showFeatured', 'layout.show_featured', 'true').toLowerCase() !== 'false',
    showNewest: value('showNewest', 'layout.show_newest', 'true').toLowerCase() !== 'false',
    showNearby: value('showNearby', 'layout.show_nearby', 'true').toLowerCase() !== 'false',
    showSponsored: value('showSponsored', 'layout.show_sponsored', 'true').toLowerCase() !== 'false',
    showRightRail: value('showRightRail', 'layout.show_right_rail', 'true').toLowerCase() !== 'false',
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

  const palettes: Record<string, {
    primary: string;
    primaryDark: string;
    primarySoft: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
  }> = {
    light: { primary: '#2563eb', primaryDark: '#1d4ed8', primarySoft: '#dbeafe', secondary: '#64748b', background: '#f8fafc', surface: '#ffffff', text: '#172033', muted: '#64748b', border: '#dbe3ef' },
    dark: { primary: '#38bdf8', primaryDark: '#0ea5e9', primarySoft: '#0c4a6e', secondary: '#94a3b8', background: '#101318', surface: '#171b22', text: '#f3f4f6', muted: '#a6adbb', border: '#2c3440' },
    teal: { primary: '#0f9488', primaryDark: '#0f766e', primarySoft: '#ccfbf1', secondary: '#14b8a6', background: '#f0fdfa', surface: '#ffffff', text: '#134e4a', muted: '#5f7775', border: '#bde8e2' },
    blue: { primary: '#2563eb', primaryDark: '#1d4ed8', primarySoft: '#dbeafe', secondary: '#3b82f6', background: '#eff6ff', surface: '#ffffff', text: '#1e3a8a', muted: '#617397', border: '#bfdbfe' },
    green: { primary: '#16a34a', primaryDark: '#15803d', primarySoft: '#dcfce7', secondary: '#22c55e', background: '#f0fdf4', surface: '#ffffff', text: '#14532d', muted: '#607565', border: '#bbf7d0' },
    orange: { primary: '#ea580c', primaryDark: '#c2410c', primarySoft: '#ffedd5', secondary: '#f97316', background: '#fff7ed', surface: '#ffffff', text: '#7c2d12', muted: '#806657', border: '#fed7aa' },
    purple: { primary: '#7c3aed', primaryDark: '#6d28d9', primarySoft: '#ede9fe', secondary: '#9333ea', background: '#faf5ff', surface: '#ffffff', text: '#4c1d95', muted: '#746487', border: '#ddd6fe' },
    gold: { primary: '#a16207', primaryDark: '#854d0e', primarySoft: '#fef3c7', secondary: '#ca8a04', background: '#fffbeb', surface: '#ffffff', text: '#713f12', muted: '#806f56', border: '#fde68a' },
  };

  const theme = (branding.theme || DEFAULT_BRANDING.theme).toLowerCase();
  const palette = palettes[theme] ?? palettes.teal;

  // Theme palette is authoritative. Previously site.primary_color was written
  // as an inline variable and permanently overrode Dark/Blue/Gold theme CSS.
  document.documentElement.style.setProperty('--primary', palette.primary);
  document.documentElement.style.setProperty('--primary-dark', palette.primaryDark);
  document.documentElement.style.setProperty('--primary-soft', palette.primarySoft);
  document.documentElement.style.setProperty('--brand-button-bg', `linear-gradient(180deg, ${palette.primary}, ${palette.primaryDark})`);
  document.documentElement.style.setProperty('--secondary', palette.secondary);
  document.documentElement.style.setProperty('--secondary-soft', `${palette.secondary}24`);
  document.documentElement.style.setProperty('--amber', palette.secondary);
  document.documentElement.style.setProperty('--bg', palette.background);
  document.documentElement.style.setProperty('--surface', palette.surface);
  document.documentElement.style.setProperty('--surface-soft', theme === 'dark' ? '#1d232c' : palette.primarySoft);
  document.documentElement.style.setProperty('--text', palette.text);
  document.documentElement.style.setProperty('--muted', palette.muted);
  document.documentElement.style.setProperty('--muted-2', theme === 'dark' ? '#7f8998' : palette.muted);
  document.documentElement.style.setProperty('--line', palette.border);
  document.documentElement.style.setProperty('--line-strong', theme === 'dark' ? '#3a4554' : palette.border);
  document.documentElement.style.setProperty('--border', palette.border);
  document.documentElement.style.setProperty('--input-bg', theme === 'dark' ? '#131820' : palette.surface);
  document.documentElement.style.setProperty('--header-bg', theme === 'dark' ? 'rgba(23,27,34,.96)' : 'color-mix(in srgb, var(--surface) 94%, transparent)');
  document.documentElement.style.setProperty('--footer-bg', theme === 'dark' ? '#090c10' : palette.text);
  document.documentElement.style.setProperty('--theme-shadow', theme === 'dark' ? '0 12px 32px rgba(0,0,0,.28)' : '0 12px 32px rgba(15,23,42,.08)');
  document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';

  // A custom background image/color remains an explicit Branding override.
  const hasCustomBackgroundImage = Boolean((branding.backgroundImageUrl || '').trim());
  const configuredBackground = (branding.backgroundColor || '').trim();
  const isLegacyDefaultBackground = !configuredBackground || configuredBackground.toLowerCase() === DEFAULT_BRANDING.backgroundColor.toLowerCase();
  const effectiveBackground = hasCustomBackgroundImage || !isLegacyDefaultBackground ? configuredBackground : palette.background;
  document.documentElement.style.setProperty('--site-background-color', effectiveBackground || palette.background);

  const backgroundImage = mediaUrl(branding.backgroundImageUrl);
  document.documentElement.style.setProperty('--site-background-image', backgroundImage ? `url("${backgroundImage}")` : 'none');
  document.documentElement.style.setProperty('--site-background-size', branding.backgroundSize || DEFAULT_BRANDING.backgroundSize);
  document.documentElement.style.setProperty('--site-background-position', branding.backgroundPosition || DEFAULT_BRANDING.backgroundPosition);
  document.documentElement.style.setProperty('--site-background-repeat', branding.backgroundRepeat || DEFAULT_BRANDING.backgroundRepeat);
  document.documentElement.style.setProperty('--site-radius', `${parseInt(branding.radius || DEFAULT_BRANDING.radius, 10) || 12}px`);
  document.documentElement.dataset.layoutStyle = branding.layoutStyle || DEFAULT_BRANDING.layoutStyle;
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.density = branding.density || DEFAULT_BRANDING.density;
  document.documentElement.dataset.cardStyle = branding.cardStyle || DEFAULT_BRANDING.cardStyle;
  document.documentElement.dataset.headerStyle = branding.headerStyle || DEFAULT_BRANDING.headerStyle;
  document.documentElement.dataset.footerColumns = branding.footerColumns || DEFAULT_BRANDING.footerColumns;
  document.documentElement.dataset.heroStyle = branding.heroStyle || DEFAULT_BRANDING.heroStyle;
  document.documentElement.dataset.categoryStyle = branding.categoryStyle || DEFAULT_BRANDING.categoryStyle;
  document.documentElement.dataset.listingCardStyle = branding.listingCardStyle || DEFAULT_BRANDING.listingCardStyle;
}

export function SiteSettingsProvider({ children, initialBranding }: { children: ReactNode; initialBranding?: Partial<SiteBranding> }) {
  const pathname = usePathname();
  const initialValue = useMemo<SiteBranding>(() => ({ ...DEFAULT_BRANDING, ...initialBranding }), [initialBranding]);
  const [branding, setBranding] = useState<SiteBranding>(initialValue);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);

  async function refreshBranding() {
    const requestId = ++requestIdRef.current;
    try {
      const separator = appConfig.apiBaseUrl.includes('?') ? '&' : '?';
      const res = await fetch(`${appConfig.apiBaseUrl}/site-settings${separator}_=${Date.now()}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache' },
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error('Site settings request failed');
      const root = payload?.success && payload?.data ? payload.data : payload;
      const next = normalizeBranding(root);
      if (requestId === requestIdRef.current) {
        writeBrandingCache(next);
        setBranding(next);
      }
    } catch {
      // Keep the last valid settings when the API is temporarily unavailable.
    }
  }

  // Homepage owns customer settings refresh. It calls the API only when:
  // 1) no session cache exists, or
  // 2) the browser was hard-refreshed while already on the homepage.
  // Child-page refreshes and all client-side navigation use the existing cache.
  useEffect(() => {
    const cached = readBrandingCache();
    if (cached) setBranding(cached);

    const isFirstMount = !mountedRef.current;
    mountedRef.current = true;

    let isHomepageReload = false;
    if (isFirstMount && pathname === '/') {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      isHomepageReload = navigation?.type === 'reload';
    }

    if (pathname === '/' && (!cached || isHomepageReload)) {
      void refreshBranding();
    }
  }, [pathname]);

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

  }, [branding]);

  // Client-side navigation must not reload settings. Re-apply only the cached
  // title/favicon after Next.js updates route metadata; this is synchronous and
  // does not trigger a network request or a provider state update.
  useEffect(() => {
    const stableTitle = branding.siteName || DEFAULT_BRANDING.siteName;
    const stableFavicon = resolveFavicon(branding.faviconUrl || branding.logoUrl);
    document.title = stableTitle;
    ensureFavicon(stableFavicon);
  }, [pathname, branding.siteName, branding.faviconUrl, branding.logoUrl]);

  const value = useMemo(() => branding, [branding]);
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

export function resolveSiteImage(url?: string | null) {
  return mediaUrl(url);
}
