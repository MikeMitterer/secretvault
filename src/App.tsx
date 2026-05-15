import { useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { JSX } from "react";
import { C } from "./theme";
import { TRANSLATIONS, detectLang } from "./i18n";
import type { AppT, Lang } from "./i18n";
import LandingPage from "./LandingPage";
import SecretVault from "./SecretVault";

/** Root-Komponente — verwaltet Language-State und Client-Side-Routing. */
export default function App(): JSX.Element {
  const [lang, setLang] = useState<Lang>(detectLang);
  const t: AppT         = TRANSLATIONS[lang];

  /** Wechselt Sprache und persistiert sie in localStorage. */
  const handleChangeLang = useCallback((next: Lang): void => {
    setLang(next);
    try { localStorage.setItem("sv_lang", next); } catch { /* ignore */ }
  }, []);

  return (
    <BrowserRouter>
      {/* Globales Hintergrund-Grid — fixed, überall sichtbar */}
      <div style={{position:"fixed",inset:0,backgroundImage:`linear-gradient(rgba(0,255,136,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.03) 1px,transparent 1px)`,backgroundSize:"40px 40px",pointerEvents:"none",zIndex:0}}/>
      <Routes>
        <Route
          path="/"
          element={<LandingPage t={t} lang={lang} onChangeLang={handleChangeLang}/>}
        />
        <Route
          path="/app"
          element={<SecretVault lang={lang} onChangeLang={handleChangeLang}/>}
        />
        {/* Alle anderen Pfade → Landing */}
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </BrowserRouter>
  );
}

// ── Footer ────────────────────────────────────────────────────────

/** Seitenabschluss mit Datenschutz-Hinweis und Impressum-Link. */
export function Footer({ t }: { t: AppT }): JSX.Element {
  return (
    <footer style={{
      borderTop:`1px solid ${C.border}`,
      padding:"24px 20px",
      display:"flex",flexWrap:"wrap",gap:12,
      alignItems:"center",justifyContent:"space-between",
      fontSize:11,color:C.dim,fontFamily:"monospace",
    }}>
      <div>
        <span style={{color:C.accent,marginRight:8}}>◈</span>
        {t.footerPrivacy}
      </div>
      <div style={{display:"flex",gap:20,alignItems:"center"}}>
        <span>© {new Date().getFullYear()} mangolila.at</span>
        <a
          href="https://mangolila.at/impressum"
          target="_blank"
          rel="noopener noreferrer"
          style={{color:C.dim,textDecoration:"none",borderBottom:`1px solid ${C.border}`}}
        >
          {t.footerImprint}
        </a>
      </div>
    </footer>
  );
}
