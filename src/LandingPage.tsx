import type { JSX, ReactNode } from "react";
import { Link } from "react-router-dom";
import { C } from "./theme";
import type { AppT, Lang } from "./i18n";
import { Footer } from "./App";

interface LandingPageProps {
  t:            AppT;
  lang:         Lang;
  onChangeLang: (lang: Lang) => void;
}

/** Landing Page — Hero, Use Cases, How it works, Security, Footer. */
export default function LandingPage({ t, lang, onChangeLang }: LandingPageProps): JSX.Element {
  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"system-ui,-apple-system,sans-serif",color:C.text}}>
      <Nav t={t} lang={lang} onChangeLang={onChangeLang}/>
      <Hero t={t}/>
      <UseCases t={t}/>
      <HowItWorks t={t}/>
      <Security t={t}/>
      <CallToAction t={t}/>
      <Footer t={t}/>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────

interface NavProps {
  t:            AppT;
  lang:         Lang;
  onChangeLang: (lang: Lang) => void;
}

/** Sticky Navigation mit Logo, Lang-Switcher und App-Link. */
function Nav({ t, lang, onChangeLang }: NavProps): JSX.Element {
  return (
    <header style={{
      position:"sticky",top:0,zIndex:50,
      background:`${C.bg}ee`,backdropFilter:"blur(12px)",
      borderBottom:`1px solid ${C.border}`,
    }}>
      <div style={{
        maxWidth:960,margin:"0 auto",
        padding:"0 16px",height:52,
        display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,
      }}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"baseline",gap:7,flexShrink:0}}>
          <span style={{
            fontSize:17,fontWeight:800,
            background:`linear-gradient(135deg,#fff,${C.accent})`,
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
          }}>
            SecretVault
          </span>
          <span style={{fontSize:8,letterSpacing:2,color:C.accent,fontFamily:"monospace",opacity:.6}}>AES-256</span>
        </div>

        {/* Actions */}
        <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
          <button
            onClick={() => onChangeLang(lang === "de" ? "en" : "de")}
            style={{
              height:28,padding:"0 10px",borderRadius:14,
              border:`1px solid ${C.border}`,background:C.surface,
              color:C.dim,fontFamily:"monospace",fontSize:10,cursor:"pointer",letterSpacing:1,
            }}
          >
            {t.langSwitchLabel}
          </button>
          <Link
            to="/app"
            style={{
              height:28,padding:"0 14px",borderRadius:14,
              border:"none",background:C.accent,color:"#000",
              fontFamily:"system-ui,sans-serif",fontWeight:700,fontSize:12,
              cursor:"pointer",display:"flex",alignItems:"center",
              textDecoration:"none",letterSpacing:.5,whiteSpace:"nowrap",
            }}
          >
            {t.navAppLink}
          </Link>
        </div>
      </div>
    </header>
  );
}

// ── Hero ──────────────────────────────────────────────────────────

/** Kompakter Hero mit Headline, Subline und CTA. */
function Hero({ t }: { t: AppT }): JSX.Element {
  return (
    <section style={{
      padding:"56px 20px 64px",
      display:"flex",flexDirection:"column",alignItems:"center",
      textAlign:"center",position:"relative",overflow:"hidden",
    }}>
      {/* Hintergrund-Glow */}
      <div style={{
        position:"absolute",top:"50%",left:"50%",
        transform:"translate(-50%,-50%)",
        width:480,height:320,
        background:`radial-gradient(ellipse,${C.accent}0e 0%,transparent 70%)`,
        pointerEvents:"none",
      }}/>

      <div style={{position:"relative",maxWidth:600,width:"100%"}}>
        {/* Badge */}
        <div style={{
          display:"inline-flex",alignItems:"center",gap:6,
          border:`1px solid ${C.border}`,borderRadius:20,
          padding:"4px 12px",marginBottom:22,
          fontSize:9,letterSpacing:2,color:C.accent,fontFamily:"monospace",
        }}>
          <span style={{width:5,height:5,borderRadius:"50%",background:C.accent,display:"inline-block",flexShrink:0}}/>
          AES-256-GCM · PBKDF2 · 100% LOCAL
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize:"clamp(2rem,5vw,3.2rem)",fontWeight:800,lineHeight:1.1,
          marginBottom:16,
          background:`linear-gradient(135deg,#fff 40%,${C.accent})`,
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
        }}>
          SecretVault
        </h1>

        <p style={{
          fontSize:"clamp(1rem,2.2vw,1.2rem)",
          color:C.text,marginBottom:6,lineHeight:1.5,fontWeight:500,
        }}>
          {t.heroTagline}
        </p>
        <p style={{
          fontSize:"clamp(.85rem,1.8vw,1rem)",
          color:C.dim,marginBottom:32,lineHeight:1.5,
        }}>
          {t.heroSubtagline}
        </p>

        <Link
          to="/app"
          style={{
            display:"inline-block",padding:"12px 32px",borderRadius:50,
            background:C.accent,color:"#000",fontWeight:700,fontSize:14,
            textDecoration:"none",letterSpacing:.5,
            boxShadow:`0 0 28px ${C.accent}44`,
          }}
        >
          {t.heroCTA}
        </Link>
      </div>
    </section>
  );
}

// ── Use Cases ─────────────────────────────────────────────────────

/** Drei Anwendungsfall-Karten. */
function UseCases({ t }: { t: AppT }): JSX.Element {
  return (
    <Section title={t.useCasesTitle}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
        {t.useCases.map((uc) => (
          <div key={uc.title} style={{
            background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,
            padding:"20px 18px",
          }}>
            <div style={{fontSize:26,marginBottom:10}}>{uc.icon}</div>
            <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:7}}>{uc.title}</div>
            <div style={{fontSize:12,color:C.dim,lineHeight:1.7}}>{uc.text}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── How It Works ──────────────────────────────────────────────────

/** Drei-Schritt-Erklärung. */
function HowItWorks({ t }: { t: AppT }): JSX.Element {
  return (
    <Section title={t.howItWorksTitle} accent>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
        {t.steps.map((step) => (
          <div key={step.num} style={{
            background:C.surface2,border:`1px solid ${C.border}`,borderRadius:14,
            padding:"20px 18px",position:"relative",overflow:"hidden",
          }}>
            <div style={{
              position:"absolute",top:-8,right:8,
              fontSize:64,fontWeight:900,color:`${C.accent}09`,
              fontFamily:"monospace",lineHeight:1,pointerEvents:"none",userSelect:"none",
            }}>
              {step.num}
            </div>
            <div style={{fontSize:10,letterSpacing:3,color:C.accent,fontFamily:"monospace",marginBottom:8}}>{step.num}</div>
            <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:7}}>{step.title}</div>
            <div style={{fontSize:12,color:C.dim,lineHeight:1.7}}>{step.text}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── Security ──────────────────────────────────────────────────────

/** Vier Sicherheitspunkte. */
function Security({ t }: { t: AppT }): JSX.Element {
  return (
    <Section title={t.securityTitle}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12}}>
        {t.securityItems.map((item) => (
          <div key={item.title} style={{
            background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,
            padding:"16px 14px",display:"flex",gap:12,alignItems:"flex-start",
          }}>
            <div style={{fontSize:20,flexShrink:0,marginTop:1}}>{item.icon}</div>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:C.accent,fontFamily:"monospace",letterSpacing:1,marginBottom:4}}>{item.title}</div>
              <div style={{fontSize:11,color:C.dim,lineHeight:1.7}}>{item.text}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── Call to Action ────────────────────────────────────────────────

/** Abschließender CTA-Block — kompakt, zentriert. */
function CallToAction({ t }: { t: AppT }): JSX.Element {
  return (
    <section style={{
      borderTop:`1px solid ${C.border}`,
      padding:"clamp(40px,7vw,60px) clamp(16px,4vw,20px)",
      textAlign:"center",
    }}>
      <p style={{fontSize:"clamp(1rem,2vw,1.2rem)",fontWeight:700,color:C.text,marginBottom:8}}>
        {t.ctaTitle}
      </p>
      <p style={{fontSize:12,color:C.dim,marginBottom:24,fontFamily:"monospace"}}>
        {t.ctaSubline}
      </p>
      <Link
        to="/app"
        style={{
          display:"inline-block",padding:"11px 28px",borderRadius:50,
          background:"transparent",color:C.accent,fontWeight:700,fontSize:13,
          textDecoration:"none",letterSpacing:.5,
          border:`1px solid ${C.accent}`,
        }}
      >
        {t.ctaBtn}
      </Link>
    </section>
  );
}

// ── Shared Section Wrapper ────────────────────────────────────────

interface SectionProps {
  title:   string;
  accent?: boolean;
  children:ReactNode;
}

/** Abschnitt-Container mit Titel und optionalem Hintergrund. */
function Section({ title, accent, children }: SectionProps): JSX.Element {
  return (
    <section style={{
      padding:"clamp(44px,8vw,72px) clamp(16px,4vw,20px)",
      background:accent ? C.surface : "transparent",
      borderTop:`1px solid ${C.border}`,
    }}>
      <div style={{maxWidth:960,margin:"0 auto"}}>
        <h2 style={{
          fontSize:"clamp(1.1rem,2.5vw,1.5rem)",fontWeight:800,
          marginBottom:28,textAlign:"center",color:C.text,
        }}>
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}
