import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Clipboard,
  Clock,
  Compass,
  Flag,
  Globe,
  Moon,
  List,
  Mail,
  Map,
  MapPin,
  Navigation2,
  RadioTower,
  RefreshCw,
  Share2,
  Shield,
  Sun,
} from 'lucide-react';

const DEFAULT_DETAILS = {
  ip: '—',
  version: '—',
  isp: '—',
  asn: '—',
  country: '—',
  countryCode: '',
  region: '—',
  city: '—',
  postal: '—',
  timezone: '—',
  lat: null,
  lon: null,
};

const pillClass = {
  ok: 'rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  warn: 'rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
};

const THEME_STORAGE_KEY = 'ipstack-theme';

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

const LOOKUP_PATH = (() => {
  const raw = import.meta.env.VITE_LOOKUP_PATH ?? '/lookup';
  return raw.startsWith('/') ? raw : `/${raw}`;
})();

function useIpDetails() {
  const [details, setDetails] = useState(DEFAULT_DETAILS);
  const [status, setStatus] = useState({ label: 'Loading…', tone: 'ok' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const hasFetchedOnce = useRef(false);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    setStatus({ label: 'Loading…', tone: 'ok' });

    try {
      const res = await fetch(`/api${LOOKUP_PATH}`);
      if (!res.ok) {
        throw new Error(`Proxy error: ${res.status}`);
      }
      const data = await res.json();
      if (data && data.success === false) {
        throw new Error(data.error?.info || 'Upstream ipstack error');
      }
      const parsed = parseIpstack(data);
      setDetails(parsed);
      setStatus({ label: 'Live', tone: 'ok' });
    } catch (err) {
      console.error(err);
      setStatus({ label: 'Offline', tone: 'warn' });
      setError('Unable to retrieve IP details. Please try again.');
      setDetails(DEFAULT_DETAILS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetchedOnce.current) return; // prevents double-fetch in React.StrictMode
    hasFetchedOnce.current = true;
    fetchDetails();
  }, [fetchDetails]);

  const refresh = () => fetchDetails();

  return { details, status, error, loading, refresh };
}

function parseIpstack(json) {
  const data = json ?? {};
  const location = data.location ?? {};
  const connection = data.connection ?? {};
  const timeZone = data.time_zone ?? {};
  return {
    ip: data.ip ?? '—',
    version: data.type ?? (data.ip?.includes(':') ? 'IPv6' : 'IPv4'),
    isp: connection.isp ?? '—',
    asn: connection.asn ? `AS${connection.asn}` : '—',
    country: data.country_name ?? '—',
    countryCode: data.country_code ?? '',
    region: data.region_name ?? '—',
    city: data.city ?? '—',
    postal: data.zip ?? '—',
    timezone: timeZone.id ?? timeZone.code ?? '—',
    lat: typeof data.latitude === 'number' ? data.latitude : location.latitude ?? null,
    lon: typeof data.longitude === 'number' ? data.longitude : location.longitude ?? null,
  };
}

function ccToFlagEmoji(code) {
  if (!code || code.length !== 2) return '';
  const base = 127397;
  return String.fromCodePoint(...code.toUpperCase().split('').map((char) => char.charCodeAt(0) + base));
}

function openStreetMapEmbed(lat, lon) {
  const delta = 0.05;
  const left = lon - delta;
  const right = lon + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(left)},${encodeURIComponent(bottom)},${encodeURIComponent(right)},${encodeURIComponent(top)}&layer=mapnik&marker=${encodeURIComponent(lat)},${encodeURIComponent(lon)}`;
}

function openStreetMapLink(lat, lon) {
  return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lon)}#map=12/${encodeURIComponent(lat)}/${encodeURIComponent(lon)}`;
}

function formatCoords(value) {
  return typeof value === 'number' ? value.toFixed(5) : '—';
}

export default function App() {
  const { details, status, error, loading, refresh } = useIpDetails();
  const [theme, setTheme] = useState(getInitialTheme);
  const [copyState, setCopyState] = useState('Copy');
  const [shareState, setShareState] = useState('Share');
  const isDark = theme === 'dark';

  useEffect(() => {
    document.title = 'What is my IP';
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [isDark, theme]);

  const appClass = `relative min-h-screen transition-colors duration-500 ${
    isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'
  }`;

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const headerClass = isDark
    ? 'relative z-10 border-b border-white/10'
    : 'relative z-10 border-b border-zinc-200/70 bg-white/70 backdrop-blur';
  const headerIconClass = isDark
    ? 'flex h-8 w-8 items-center justify-center rounded-md bg-white/5 ring-1 ring-inset ring-white/10 text-sm font-semibold text-white'
    : 'flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-sm font-semibold text-zinc-800 shadow-sm';
  const headerTitleClass = isDark
    ? 'text-base font-semibold tracking-tight text-white/90'
    : 'text-base font-semibold tracking-tight text-zinc-900';
  const headerSubtitleClass = isDark ? 'text-xs text-zinc-400' : 'text-xs text-zinc-500';
  const refreshButtonClass = isDark
    ? 'inline-flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:text-white hover:ring-white/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
    : 'inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60';
  const themeToggleClass = isDark
    ? 'relative inline-flex h-9 w-16 items-center justify-center rounded-full bg-white/5 px-2 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 active:scale-95'
    : 'relative inline-flex h-9 w-16 items-center justify-center rounded-full border border-zinc-200 bg-white px-2 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-100 active:scale-95';
  const sunIconClass = `absolute left-3 h-5 w-5 z-20 pointer-events-none transition-opacity duration-300 drop-shadow-sm ${
    isDark ? 'opacity-0' : 'opacity-100 text-zinc-900'
  }`;
  const moonIconClass = `absolute right-3 h-5 w-5 z-20 pointer-events-none transition-opacity duration-300 drop-shadow-sm ${
    isDark ? 'opacity-100 text-white' : 'opacity-0'
  }`;
  const openMapClass = isDark
    ? 'inline-flex items-center gap-2 rounded-md bg-white/0 px-3 py-2 text-sm font-medium text-zinc-300 ring-1 ring-inset ring-white/10 transition hover:bg-white/5 hover:text-white hover:ring-white/20 active:scale-[0.98]'
    : 'inline-flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm font-medium text-zinc-600 transition hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-900 active:scale-95';
  const summaryCardClass = isDark
    ? 'mb-6 rounded-xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur'
    : 'mb-6 rounded-xl border border-zinc-200/70 bg-white/70 p-6 shadow-lg shadow-zinc-900/5 backdrop-blur';
  const cardClass = isDark
    ? 'rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur'
    : 'rounded-xl border border-zinc-200/70 bg-white/70 p-6 shadow-lg shadow-zinc-900/5 backdrop-blur';
  const mapCardClass = isDark
    ? 'flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur'
    : 'flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200/70 bg-white/70 backdrop-blur';
  const detailDividerClass = isDark
    ? 'grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 sm:divide-y-0 sm:divide-x'
    : 'grid grid-cols-1 divide-y divide-zinc-200/70 sm:grid-cols-2 sm:divide-y-0 sm:divide-x';
  const ipLabelClass = isDark ? 'text-sm font-medium text-zinc-400' : 'text-sm font-medium text-zinc-500';
  const ipValueClass = isDark
    ? 'text-3xl font-semibold tracking-tight text-white'
    : 'text-3xl font-semibold tracking-tight text-zinc-900';
  const badgeClass = isDark
    ? 'rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium text-zinc-300'
    : 'rounded-md border border-zinc-200 bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700';
  const captionClass = isDark ? 'text-xs text-zinc-500' : 'text-xs text-zinc-500';
  const primaryActionClass = refreshButtonClass;
  const secondaryActionClass = isDark
    ? 'inline-flex items-center gap-2 rounded-md bg-white/0 px-3 py-2 text-sm font-medium text-zinc-300 ring-1 ring-inset ring-white/10 transition hover:bg-white/5 hover:text-white hover:ring-white/20 active:scale-[0.98]'
    : 'inline-flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm font-medium text-zinc-600 transition hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-900 active:scale-95';
  const infoCardTitleClass = isDark
    ? 'text-lg font-semibold tracking-tight text-white'
    : 'text-lg font-semibold tracking-tight text-zinc-900';
  const listIconClass = isDark ? 'text-zinc-300' : 'text-zinc-500';
  const errorBannerClass = isDark
    ? 'mt-5 flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200'
    : 'mt-5 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700';
  const mapHeaderClass = isDark
    ? 'flex items-center justify-between border-b border-white/10 px-4 py-3 text-zinc-300'
    : 'flex items-center justify-between border-b border-zinc-200/70 px-4 py-3 text-zinc-600';
  const mapOverlayClass = isDark
    ? 'pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-zinc-900/60 to-zinc-900/40'
    : 'pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-white/80 to-zinc-200/60';
  const mapMessageClass = isDark ? 'text-xs text-zinc-400' : 'text-xs text-zinc-600';
  const footerClass = isDark
    ? 'mt-10 flex items-center justify-between border-t border-white/10 py-6 text-xs text-zinc-500'
    : 'mt-10 flex items-center justify-between border-t border-zinc-200/70 py-6 text-xs text-zinc-500';
  const footerLinkClass = isDark
    ? 'rounded px-2 py-1 text-zinc-400 ring-1 ring-inset ring-white/10 transition hover:bg-white/5 hover:text-white hover:ring-white/20'
    : 'rounded px-2 py-1 text-zinc-500 transition hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-900 active:scale-95';

  const flag = useMemo(() => ccToFlagEmoji(details.countryCode), [details.countryCode]);
  const hasCoords = typeof details.lat === 'number' && typeof details.lon === 'number' && !Number.isNaN(details.lat) && !Number.isNaN(details.lon);

  const mapEmbed = useMemo(() => (hasCoords ? openStreetMapEmbed(details.lat, details.lon) : 'about:blank'), [details.lat, details.lon, hasCoords]);
  const mapLink = useMemo(() => (hasCoords ? openStreetMapLink(details.lat, details.lon) : '#'), [details.lat, details.lon, hasCoords]);
  const mapStatus = useMemo(() => {
    if (loading) return 'Loading…';
    return hasCoords ? 'Approximate' : 'No coordinates';
  }, [hasCoords, loading]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(details.ip ?? '');
      setCopyState('Copied');
      setTimeout(() => setCopyState('Copy'), 1400);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async () => {
    const text = `IP: ${details.ip}\nType: ${details.version}\nISP: ${details.isp}\nASN: ${details.asn}\nLocation: ${details.city ? `${details.city}, ` : ''}${details.region ? `${details.region}, ` : ''}${details.country}\nCoords: ${formatCoords(details.lat)}, ${formatCoords(details.lon)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My IP Details', text });
      } else {
        await navigator.clipboard.writeText(text);
        setShareState('Copied');
        setTimeout(() => setShareState('Share'), 1400);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={appClass}>
      <header className={`${headerClass} transition-colors`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className={`${headerIconClass} transition-colors`}>
              <span className="tracking-tight">IP</span>
            </div>
            <div className="hidden sm:block">
              <h1 className={`${headerTitleClass} transition-colors`}>What is my IP</h1>
              <p className={`${headerSubtitleClass} transition-colors`}>Instant IP, ISP, and location insights</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className={primaryActionClass}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-pressed={isDark}
              aria-label="Toggle color theme"
              className={themeToggleClass}
            >
              <span
                className={`absolute left-1 top-1 z-20 h-7 w-7 rounded-full bg-white shadow-md transition-transform duration-300 ease-out dark:bg-zinc-800 dark:shadow-[0_8px_16px_rgba(15,23,42,0.35)] flex items-center justify-center ${
                  isDark ? 'translate-x-6' : 'translate-x-0'
                }`}
              >
                {isDark ? (
                  <Moon className="h-5 w-5 text-gray-400 drop-shadow pointer-events-none" strokeWidth={1.0} fill="currentColor" />
                ) : (
                  <Sun className="h-5 w-5 text-zinc-900 pointer-events-none" strokeWidth={1.0} fill="currentColor" />
                )}
              </span>
            </button>
            <a
              id="openMapLink"
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className={openMapClass}
            >
              <Map className="h-4 w-4" />
              Open map
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <section className={summaryCardClass}>
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <div className={`hidden sm:flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                isDark ? 'bg-white/5 ring-1 ring-inset ring-white/10 text-zinc-200' : 'border border-zinc-200 bg-white text-zinc-600 shadow-sm'
              }`}
              >
                <Globe className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className={ipLabelClass}>Your public IP</p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <div className={ipValueClass} id="ipValue">
                    {details.ip}
                  </div>
                  <span id="ipVersionBadge" className={badgeClass}>
                    {details.version}
                  </span>
                  <span className={captionClass}>Approximate location; may vary.</span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className={primaryActionClass}
              >
                <Clipboard className="h-4 w-4" />
                {copyState}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className={secondaryActionClass}
              >
                <Share2 className="h-4 w-4" />
                {shareState}
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="col-span-1 lg:col-span-2">
            <div className={cardClass}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <List className={`h-4 w-4 ${listIconClass}`} />
                  <h2 className={infoCardTitleClass}>Connection details</h2>
                </div>
                <span className={status.tone === 'ok' ? pillClass.ok : pillClass.warn}>{status.label}</span>
              </div>

              <div className={detailDividerClass}>
                <div className="space-y-4 p-4">
                  <DetailRow icon={RadioTower} label="ISP" value={details.isp} dark={isDark} />
                  <DetailRow icon={Shield} label="ASN" value={details.asn} dark={isDark} />
                  <DetailRow icon={Flag} label="Country" value={`${flag ? `${flag} ` : ''}${details.country}`} dark={isDark} />
                  <DetailRow icon={MapPin} label="Region" value={details.region} dark={isDark} />
                </div>
                <div className="space-y-4 p-4">
                  <DetailRow icon={Building2} label="City" value={details.city} dark={isDark} />
                  <DetailRow icon={Mail} label="ZIP" value={details.postal} dark={isDark} />
                  <DetailRow icon={Clock} label="Timezone" value={details.timezone} dark={isDark} />
                  <DetailRow icon={Compass} label="Coordinates" value={`${formatCoords(details.lat)}, ${formatCoords(details.lon)}`} dark={isDark} />
                </div>
              </div>

              {error ? (
                <div className={errorBannerClass}>
                  <AlertTriangle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="col-span-1">
            <div className={mapCardClass}>
              <div className={mapHeaderClass}>
                <div className="flex items-center gap-2">
                  <Navigation2 className={`h-4 w-4 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`} />
                  <h2 className="text-sm font-semibold tracking-tight">Approximate location</h2>
                </div>
                <span className="text-xs">{mapStatus}</span>
              </div>
              <div className="relative aspect-[4/3]">
                {hasCoords ? null : (
                  <div className={mapOverlayClass}>
                    <div className={`h-8 w-8 animate-pulse rounded-md ${isDark ? 'bg-white/10' : 'bg-zinc-300/40'}`} />
                    <p className={mapMessageClass}>{loading ? 'Loading map…' : 'No coordinates available'}</p>
                  </div>
                )}
                {hasCoords && loading ? (
                  <div className={mapOverlayClass}>
                    <div className={`h-8 w-8 animate-pulse rounded-md ${isDark ? 'bg-white/10' : 'bg-zinc-300/40'}`} />
                    <p className={mapMessageClass}>Loading map…</p>
                  </div>
                ) : null}
                <iframe title="Location map" className="h-full w-full" src={mapEmbed} style={{ border: 0 }} />
              </div>
              <div className={`border-t px-4 py-3 text-xs ${isDark ? 'border-white/10 text-zinc-500' : 'border-zinc-200/70 text-zinc-500'}`}>
                <p>Map is approximate and may not reflect precise location.</p>
              </div>
            </div>
          </div>
        </section>

        <footer className={`${footerClass} transition-colors`}>
          <p>© {new Date().getFullYear()} IP Lookup. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <a href="#" className={`${footerLinkClass} transition`}> 
              Privacy
            </a>
            <a href="#" className={`${footerLinkClass} transition`}>
              Terms
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, dark }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 transition-colors ${dark ? 'text-zinc-200' : 'text-zinc-500'}`} />
        <span className={`text-sm font-medium transition-colors ${dark ? 'text-zinc-200' : 'text-zinc-600'}`}>{label}</span>
      </div>
      <div className={`truncate text-sm font-medium transition-colors ${dark ? 'text-white' : 'text-zinc-800'}`}>{value}</div>
    </div>
  );
}
