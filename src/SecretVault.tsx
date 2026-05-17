import { useState, useRef, useCallback, useEffect } from "react";
import type { JSX, ReactNode, ChangeEvent, MouseEvent } from "react";
import QRCode from "qrcode";
import { C } from "./theme";
import { MAX_LEN } from "./constants";
import { TRANSLATIONS, detectLang } from "./i18n";
import type { AppT, Lang } from "./i18n";

// ── Types & Enums ─────────────────────────────────────────────────

/** Aktiver Tab der Anwendung. */
enum Mode {
  ENCRYPT = "encrypt",
  DECRYPT = "decrypt",
}

/** Ergebnis der Passwort-Stärkebewertung (ohne übersetzungsabhängiges Label). */
interface PasswordScore {
  /** Stufe 0 (leer) bis 4 (sehr stark). */
  score: number;
  /** CSS-Farbe für die Stärkeleiste. */
  color: string;
}

/** Verschlüsselungs-Ergebnis nach dem Splitten. */
interface EncryptResult {
  /** Gerade Interleaving-Positionen (für Website). */
  p1: string;
  /** Ungerade Interleaving-Positionen (für QR / Text). */
  p2: string;
}

/** Props der Hauptkomponente. */
interface SecretVaultProps {
  /** Aktive Sprache (default: automatisch erkannt). */
  lang?: Lang;
  /** Callback bei Sprachwechsel. */
  onChangeLang?: (lang: Lang) => void;
}

// ── Crypto ────────────────────────────────────────────────────────

/**
 * Leitet einen AES-256-GCM-Schlüssel aus Passwort und Salt ab (PBKDF2-SHA256).
 *
 * @param password - Klartext-Passwort
 * @param salt     - 16-Byte zufälliger Salt
 * @returns        CryptoKey für AES-GCM Encrypt/Decrypt
 */
async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 250_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Kodiert einen ArrayBuffer als Base64-String.
 * Nutzt einen Loop statt Spread-Operator — verhindert Stack-Overflow bei großen Puffern.
 *
 * @param buf - Eingabe-Puffer
 * @returns   Base64-String
 */
const toB64 = (buf: ArrayBuffer): string => {
  let bin = "";
  for (const b of new Uint8Array(buf)) bin += String.fromCharCode(b);
  return btoa(bin);
};

/**
 * Dekodiert einen Base64-String zu einem Uint8Array.
 *
 * @param s - Base64-kodierter String
 * @returns   Byte-Array
 */
const fromB64 = (s: string): Uint8Array =>
  Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/**
 * Verschlüsselt einen Text mit AES-256-GCM.
 * Binärformat des Blobs: [Salt 16B][IV 12B][Ciphertext + 16B GCM-Tag] → Base64.
 *
 * @param text - Zu verschlüsselnder Klartext (max. MAX_LEN Zeichen)
 * @param pw   - Passwort für die Schlüsselableitung
 * @returns    Base64-kodierter Encrypted Blob
 */
async function encryptText(text: string, pw: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(pw, salt);
  const ct   = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(text)
  );
  const out = new Uint8Array(28 + ct.byteLength);
  out.set(salt, 0);
  out.set(iv, 16);
  out.set(new Uint8Array(ct), 28);
  return toB64(out.buffer);
}

/**
 * Entschlüsselt einen AES-256-GCM Encrypted Blob.
 * Erwartet das Format: [Salt 16B][IV 12B][Ciphertext] als Base64.
 *
 * @param b64 - Base64-kodierter Encrypted Blob
 * @param pw  - Passwort für die Schlüsselableitung
 * @returns   Entschlüsselter Klartext
 * @throws    DOMException bei falschem Passwort oder korrupten Daten
 */
async function decryptText(b64: string, pw: string): Promise<string> {
  const buf = fromB64(b64);
  const key = await deriveKey(pw, buf.slice(0, 16) as Uint8Array<ArrayBuffer>);
  const pt  = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: buf.slice(16, 28) },
    key,
    buf.slice(28)
  );
  return new TextDecoder().decode(pt);
}

/**
 * Splittet einen String via Interleaving in zwei Teile.
 * Gerade Indizes → Teil A, ungerade Indizes → Teil B.
 *
 * @param s - Eingabe-String
 * @returns   Tupel [Teil-A, Teil-B]
 */
function splitStr(s: string): [string, string] {
  let a = "", b = "";
  for (let i = 0; i < s.length; i++) {
    if (i % 2 === 0) a += s[i];
    else             b += s[i];
  }
  return [a, b];
}

/**
 * Kombiniert zwei Interleaving-Teile zum Original-String.
 *
 * @param a - Teil A (gerade Positionen)
 * @param b - Teil B (ungerade Positionen)
 * @returns   Rekonstruierter Original-String
 */
function combineStr(a: string, b: string): string {
  let r = "";
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (i < a.length) r += a[i];
    if (i < b.length) r += b[i];
  }
  return r;
}

// ── Passwort-Stärke ───────────────────────────────────────────────

/** CSS-Farben je Stärkestufe (Index = Score 0–4). */
const STRENGTH_COLORS = ["", "#ff4466", "#ffaa00", "#00ccff", "#00ff88"] as const;

/**
 * Berechnet den Passwort-Stärke-Score (0 = leer, 1–4 = schwach–sehr stark).
 *
 * @param pw - Zu bewertendes Passwort
 * @returns   Score-Wert 0–4
 */
function pwScore(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (pw.length >= 16) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if ((pw.match(/[-_ ]/g) ?? []).length >= 2 && pw.length >= 16) s++;
  if (s <= 2) return 1;
  if (s <= 4) return 2;
  if (s <= 6) return 3;
  return 4;
}

/**
 * Gibt Score und Farbe für ein Passwort zurück.
 *
 * @param pw - Zu bewertendes Passwort
 * @returns   PasswordScore mit score (0–4) und CSS-Farbe
 */
function pwStrength(pw: string): PasswordScore {
  const score = pwScore(pw);
  return { score, color: STRENGTH_COLORS[score] };
}

// ── UI-Primitives ─────────────────────────────────────────────────

/** Initialisierungs-Splash mit Ladebalken-Animation (1,9 s). */
function Loader({ done, text }: { done: boolean; text: string }): JSX.Element | null {
  if (done) return null;
  return (
    <div style={{
      position:"fixed",inset:0,background:C.bg,zIndex:999,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,
    }}>
      <div style={{fontSize:28,fontWeight:800,background:`linear-gradient(135deg,#fff,${C.accent})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",letterSpacing:1}}>
        SecretVault
      </div>
      <div style={{width:240,height:4,background:C.surface2,borderRadius:10,overflow:"hidden"}}>
        <div style={{height:"100%",background:C.accent,borderRadius:10,animation:"ldbar 1.8s ease-out forwards"}}/>
      </div>
      <div style={{fontSize:10,color:C.dim,fontFamily:"monospace",letterSpacing:3}}>{text}</div>
      <style>{`@keyframes ldbar{0%{width:0%}60%{width:72%}100%{width:100%}}`}</style>
    </div>
  );
}

/** Visueller Passwort-Stärke-Indikator (4 Segmente + übersetztes Label). */
function StrengthBar({ pw, t }: { pw: string; t: AppT }): JSX.Element | null {
  if (!pw) return null;
  const { score, color } = pwStrength(pw);
  const labels = [t.strengthWeak, t.strengthMedium, t.strengthStrong, t.strengthVeryStrong];
  const label  = score > 0 ? labels[score - 1] : "";
  return (
    <div style={{marginTop:6}}>
      <div style={{display:"flex",gap:4,marginBottom:3}}>
        {[1,2,3,4].map((step) => (
          <div key={step} style={{flex:1,height:3,borderRadius:4,background:step<=score?color:C.surface2,transition:"background 0.3s"}}/>
        ))}
      </div>
      <div style={{fontSize:9,fontFamily:"monospace",letterSpacing:2,color}}>{label}</div>
    </div>
  );
}

interface PwFieldProps {
  value:         string;
  onChange:      (value: string) => void;
  show:          boolean;
  onToggle:      () => void;
  placeholder:   string;
  t:             AppT;
  showStrength?: boolean;
}

/** Passwort-Eingabefeld mit Sichtbarkeits-Toggle und optionalem Stärke-Indikator. */
function PwField({ value, onChange, show, onToggle, placeholder, t, showStrength }: PwFieldProps): JSX.Element {
  return (
    <div>
      <div style={{position:"relative"}}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontFamily:"monospace",fontSize:16,padding:"8px 36px 8px 10px",outline:"none",boxSizing:"border-box"}}
        />
        <button
          onClick={onToggle}
          style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:14,padding:2}}
        >
          {show ? "🙈" : "👁"}
        </button>
      </div>
      {showStrength && <StrengthBar pw={value} t={t}/>}
    </div>
  );
}

/** Umrandete Karte als Container-Element. */
function Card({ children }: { children: ReactNode }): JSX.Element {
  return <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:13,marginBottom:10}}>{children}</div>;
}

/** Akzent-farbiger Titel innerhalb einer Card. */
function CardTitle({ children }: { children: ReactNode }): JSX.Element {
  return <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:C.accent,fontFamily:"monospace",marginBottom:11}}>{children}</div>;
}

/** Primärer Aktions-Button (volle Breite, Akzentfarbe). */
function BtnPrimary({ onClick, children }: { onClick: () => void; children: ReactNode }): JSX.Element {
  return <button onClick={onClick} style={{width:"100%",padding:12,borderRadius:10,border:"none",fontFamily:"system-ui,sans-serif",fontWeight:700,fontSize:13,cursor:"pointer",letterSpacing:1,background:C.accent,color:"#000"}}>{children}</button>;
}

/** Sekundärer Button (Rahmen, volle Breite). */
function BtnSecondary({ onClick, children }: { onClick: () => void; children: ReactNode }): JSX.Element {
  return <button onClick={onClick} style={{width:"100%",padding:"9px 12px",borderRadius:10,border:`1px solid ${C.border}`,fontFamily:"system-ui,sans-serif",fontWeight:600,fontSize:12,cursor:"pointer",background:C.surface2,color:C.text,marginTop:7}}>{children}</button>;
}

interface OutputRowProps {
  text:      string;
  onCopy:    (text: string) => Promise<void>;
  onShowQR:  (data: string) => void;
}

/** Clipboard-Icon (zwei überlagerte Rechtecke). */
function IconCopy(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

/** QR-Code-Icon (drei Finder-Pattern-Quadrate + Datenpunkte). */
function IconQR(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="8" height="8" rx="1"/>
      <rect x="14" y="2" width="8" height="8" rx="1"/>
      <rect x="2" y="14" width="8" height="8" rx="1"/>
      <rect x="4.5" y="4.5" width="3" height="3" fill="currentColor" stroke="none"/>
      <rect x="16.5" y="4.5" width="3" height="3" fill="currentColor" stroke="none"/>
      <rect x="4.5" y="16.5" width="3" height="3" fill="currentColor" stroke="none"/>
      <rect x="14" y="14" width="3" height="3" fill="currentColor" stroke="none"/>
      <rect x="19" y="14" width="3" height="3" fill="currentColor" stroke="none"/>
      <rect x="14" y="19" width="3" height="3" fill="currentColor" stroke="none"/>
      <rect x="19" y="19" width="3" height="3" fill="currentColor" stroke="none"/>
    </svg>
  );
}

/** Ausgabezeile mit Base64-Text, Kopier-Button und QR-Button. */
function OutputRow({ text, onCopy, onShowQR }: OutputRowProps): JSX.Element {
  const btnStyle = {
    width:36,height:36,
    display:"flex" as const,alignItems:"center",justifyContent:"center",
    borderRadius:6,border:`1px solid ${C.border}`,
    background:C.surface2,color:C.dim,cursor:"pointer" as const,
    flexShrink:0,
  };
  return (
    <div style={{display:"flex",gap:6,alignItems:"stretch",marginBottom:7}}>
      <div style={{flex:1,background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 10px",fontFamily:"monospace",fontSize:11,wordBreak:"break-all",color:C.accent,lineHeight:1.6,minHeight:40}}>{text}</div>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        <button onClick={() => onCopy(text)} title="Kopieren" style={btnStyle}><IconCopy/></button>
        <button onClick={() => onShowQR(text)} title="QR-Code" style={btnStyle}><IconQR/></button>
      </div>
    </div>
  );
}

/** Rot eingefärbter Warnhinweis-Block. */
function Warning({ children }: { children: ReactNode }): JSX.Element {
  return <div style={{background:"rgba(255,68,102,0.07)",border:"1px solid rgba(255,68,102,0.22)",borderRadius:8,padding:"8px 11px",fontSize:11,color:"#ff8899",fontFamily:"monospace",lineHeight:1.6,marginBottom:10}}>{children}</div>;
}

// ── QR Code Modal ─────────────────────────────────────────────────

interface QRModalProps {
  data:    string;
  onClose: () => void;
  t:       AppT;
}

/**
 * Zeigt einen QR-Code für den übergebenen String an.
 * Generiert das Bild via qrcode-npm-Paket (kein CDN, offline-fähig).
 * Auf iOS: Long-Press-Hinweis statt direktem Download.
 */
function QRModal({ data, onClose, t }: QRModalProps): JSX.Element {
  const [imgSrc, setImgSrc]           = useState<string>("");
  const [isHintVisible, setIsHintVisible] = useState<boolean>(false);

  useEffect(() => {
    if (!data) return;
    QRCode.toDataURL(data, {
      width: 220,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setImgSrc)
      .catch(() => {});
  }, [data]);

  /** Lädt den QR-Code als PNG herunter. Auf iOS: Hinweis zum Long-Press. */
  const saveQR = (): void => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS || !imgSrc) { setIsHintVisible(true); return; }
    const a = document.createElement("a");
    a.download = "SecretVault_QR.png";
    a.href = imgSrc;
    a.click();
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}>
      <div onClick={(e: MouseEvent) => e.stopPropagation()} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:20,maxWidth:340,width:"100%"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{color:C.accent,fontFamily:"monospace",fontSize:11,letterSpacing:3}}>{t.qrTitle}</div>
          <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:"50%",width:28,height:28,color:C.dim,cursor:"pointer",fontSize:14}}>✕</button>
        </div>

        <div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:14,background:"#fff",borderRadius:10,marginBottom:12,minHeight:220}}>
          {imgSrc
            ? <img src={imgSrc} width={220} height={220} alt="QR"/>
            : <span style={{color:"#999",fontSize:11,fontFamily:"monospace"}}>{t.qrGenerating}</span>
          }
        </div>

        <div style={{fontSize:9,color:C.dim,fontFamily:"monospace",letterSpacing:2,marginBottom:6}}>{t.qrContentLabel}</div>
        <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 10px",fontFamily:"monospace",fontSize:11,wordBreak:"break-all",color:C.accent,lineHeight:1.6,marginBottom:10}}>
          {data}
        </div>

        <BtnSecondary onClick={saveQR}>{t.qrSaveBtn}</BtnSecondary>

        {isHintVisible && (
          <div onClick={() => setIsHintVisible(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
            <div onClick={(e: MouseEvent) => e.stopPropagation()} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:24,maxWidth:300,textAlign:"center",fontFamily:"monospace"}}>
              <div style={{fontSize:32,marginBottom:12}}>👆</div>
              <div style={{color:C.accent,fontSize:11,letterSpacing:3,marginBottom:10}}>{t.qrHintTitle}</div>
              <div style={{color:C.text,fontSize:13,lineHeight:1.7}}>
                {t.qrHintText} <strong>{t.qrHintAction}</strong>
              </div>
              <button onClick={() => setIsHintVisible(false)} style={{marginTop:18,padding:"10px 24px",background:C.accent,color:"#000",border:"none",borderRadius:50,fontWeight:700,fontSize:13,cursor:"pointer"}}>OK</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Hilfe-Modal ───────────────────────────────────────────────────

/** Technische Dokumentation der Krypto-Implementierung. */
function HelpModal({ onClose, t }: { onClose: () => void; t: AppT }): JSX.Element {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:300,overflowY:"auto",padding:20}}>
      <div onClick={(e: MouseEvent) => e.stopPropagation()} style={{maxWidth:480,margin:"0 auto",background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{color:C.accent,fontFamily:"monospace",fontSize:11,letterSpacing:3}}>{t.helpTitle}</div>
          <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:"50%",width:28,height:28,color:C.dim,cursor:"pointer",fontSize:14}}>✕</button>
        </div>
        {t.helpItems.map(([title, body]) => (
          <div key={title} style={{marginBottom:12}}>
            <div style={{fontSize:9,letterSpacing:2,color:C.accent,fontFamily:"monospace",marginBottom:3}}>{title}</div>
            <div style={{fontSize:11,color:C.text,lineHeight:1.7,fontFamily:"monospace"}}>{body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Hauptkomponente ───────────────────────────────────────────────

/** SecretVault — Browser-basiertes Werkzeug zum Verschlüsseln und Splitten von Secret Keys. */
export default function SecretVault({ lang, onChangeLang }: SecretVaultProps = {}): JSX.Element {
  const [activeLang, setActiveLang] = useState<Lang>(() => lang ?? detectLang());

  // Synchronisiert activeLang wenn der parent lang-Prop ändert
  useEffect(() => {
    if (lang !== undefined) setActiveLang(lang);
  }, [lang]);

  const t = TRANSLATIONS[activeLang];

  /** Wechselt die Sprache lokal und informiert den Parent (falls vorhanden). */
  const switchLang = (): void => {
    const next: Lang = activeLang === "de" ? "en" : "de";
    setActiveLang(next);
    try { localStorage.setItem("sv_lang", next); } catch { /* ignore */ }
    onChangeLang?.(next);
  };

  const [mode, setMode]                   = useState<Mode>(Mode.ENCRYPT);
  const [isInfoVisible, setIsInfoVisible] = useState<boolean>(false);
  const [isHelpVisible, setIsHelpVisible] = useState<boolean>(false);
  const [toast, setToast]                 = useState<string>("");
  const [isLoaderDone, setIsLoaderDone]   = useState<boolean>(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaderDone(true), 1900);
    return () => clearTimeout(timer);
  }, []);

  // Encrypt-State
  const [secret, setSecret]                   = useState<string>("");
  const [encPw, setEncPw]                     = useState<string>("");
  const [isEncPwVisible, setIsEncPwVisible]   = useState<boolean>(false);
  const [qrModalData, setQrModalData]         = useState<string | null>(null);
  const [encResult, setEncResult]             = useState<EncryptResult | null>(null);

  // Decrypt-State
  const [decPart1, setDecPart1]               = useState<string>("");
  const [decPart2, setDecPart2]               = useState<string>("");
  const [decPw, setDecPw]                     = useState<string>("");
  const [isDecPwVisible, setIsDecPwVisible]   = useState<boolean>(false);
  const [decResult, setDecResult]             = useState<string | null>(null);

  /** Zeigt eine temporäre Toast-Nachricht für 2,2 Sekunden an. */
  const showToast = useCallback((msg: string): void => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }, []);

  /** Kopiert Text in die Zwischenablage und zeigt Bestätigung. */
  const copy = useCallback(async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(t.toastCopied);
    } catch {
      showToast(t.toastCopyFail);
    }
  }, [showToast, t]);

  /** Validiert Eingaben, verschlüsselt den Secret Key und splittet das Ergebnis. */
  const handleEncrypt = async (): Promise<void> => {
    const trimmed = secret.replace(/[\r\n]/g, "").trim();
    if (!trimmed)                        { showToast(t.toastMissingSecret); return; }
    if (trimmed.length > MAX_LEN)        { showToast(t.toastMaxLen);        return; }
    if (encPw.length < 6)                { showToast(t.toastPwShort);       return; }
    if (pwStrength(encPw).score < 2)     { showToast(t.toastPwWeak);        return; }
    try {
      const enc      = await encryptText(trimmed, encPw);
      const [p1, p2] = splitStr(enc);
      setEncResult({ p1, p2 });
      showToast(t.toastEncrypted);
    } catch {
      showToast(t.toastEncryptError);
    }
  };

  /** Validiert Eingaben, kombiniert beide Teile und entschlüsselt den Secret Key. */
  const handleDecrypt = async (): Promise<void> => {
    if (!decPart1.trim() || !decPart2.trim()) { showToast(t.toastBothParts); return; }
    if (!decPw)                               { showToast(t.toastPwMissing); return; }
    try {
      const result = await decryptText(combineStr(decPart1.trim(), decPart2.trim()), decPw);
      setDecResult(result);
      showToast(t.toastDecrypted);
    } catch {
      showToast(t.toastWrongPw);
    }
  };

  /**
   * Rendert einen kleinen runden Icon-Button (Info / Hilfe).
   *
   * @param label    - Button-Beschriftung
   * @param isActive - Ob der Button aktiv/markiert ist
   * @param onClick  - Click-Handler
   */
  const renderIconButton = (label: string, isActive: boolean, onClick: () => void): JSX.Element => (
    <button
      onClick={onClick}
      style={{width:26,height:26,borderRadius:"50%",border:`1px solid ${isActive?C.accent:C.border}`,background:C.surface,color:isActive?C.accent:C.dim,fontFamily:"monospace",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
    >
      {label}
    </button>
  );

  const trimmedSecret = secret.replace(/[\r\n]/g, "").trim();
  const isOverLimit   = trimmedSecret.length > MAX_LEN;

  if (!isLoaderDone) {
    return (
      <div style={{background:C.bg,minHeight:"100vh"}}>
        <Loader done={false} text={t.loaderText}/>
      </div>
    );
  }

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"system-ui,-apple-system,sans-serif",color:C.text,overflowX:"hidden"}}>
      {/* Hintergrund-Grid */}
      <div style={{position:"fixed",inset:0,backgroundImage:`linear-gradient(rgba(0,255,136,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.03) 1px,transparent 1px)`,backgroundSize:"40px 40px",pointerEvents:"none",zIndex:0}}/>

      <div style={{position:"relative",zIndex:1,maxWidth:480,margin:"0 auto",padding:"10px 14px 40px"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0 10px"}}>
          <a href="/" style={{textDecoration:"none",display:"flex",alignItems:"baseline",gap:9}}>
            <span style={{fontSize:22,fontWeight:800,background:`linear-gradient(135deg,#fff,${C.accent})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>SecretVault</span>
            <span style={{fontSize:9,letterSpacing:3,color:C.accent,fontFamily:"monospace",opacity:.6}}>AES-256</span>
          </a>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <button
              onClick={switchLang}
              style={{height:26,padding:"0 8px",borderRadius:13,border:`1px solid ${C.border}`,background:C.surface,color:C.dim,fontFamily:"monospace",fontSize:10,cursor:"pointer",letterSpacing:1}}
            >
              {t.langSwitchLabel}
            </button>
            {renderIconButton("i", isInfoVisible, () => setIsInfoVisible((v) => !v))}
            {renderIconButton("?", isHelpVisible, () => setIsHelpVisible(true))}
          </div>
        </div>

        {/* Info-Panel */}
        {isInfoVisible && (
          <div style={{background:"rgba(0,136,255,0.07)",border:"1px solid rgba(0,136,255,0.2)",borderRadius:8,padding:"10px 12px",fontSize:11,color:"#88bbff",fontFamily:"monospace",lineHeight:1.7,marginBottom:10}}>
            {t.infoPanelEncrypt}<br/>
            {t.infoPanelDecrypt}<br/>
            {t.infoPanelLocal}
          </div>
        )}

        {/* Tabs */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:10,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:4}}>
          {([Mode.ENCRYPT, Mode.DECRYPT] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{padding:8,borderRadius:8,border:"none",cursor:"pointer",fontFamily:"system-ui,sans-serif",fontWeight:600,fontSize:13,background:mode===m?C.accent:"transparent",color:mode===m?"#000":C.dim}}
            >
              {m === Mode.ENCRYPT ? t.tabEncrypt : t.tabDecrypt}
            </button>
          ))}
        </div>

        {/* ── Verschlüsseln ── */}
        {mode === Mode.ENCRYPT && (
          <>
            <Card>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:11}}>
                <CardTitle>{t.cardInput}</CardTitle>
                <span style={{fontFamily:"monospace",fontSize:10,color:isOverLimit?"#ff4466":C.dim}}>
                  <span style={{color:isOverLimit?"#ff4466":C.accent}}>{trimmedSecret.length}</span>/{MAX_LEN}
                </span>
              </div>
              <div style={{marginBottom:9}}>
                <label style={{display:"block",fontSize:10,color:C.dim,marginBottom:4,fontFamily:"monospace",letterSpacing:1}}>{t.labelSecret}</label>
                <textarea
                  value={secret}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setSecret(e.target.value.replace(/[\r\n]/g,""))}
                  placeholder={t.phSecret}
                  style={{width:"100%",background:C.surface2,border:`1px solid ${isOverLimit?"#ff4466":C.border}`,borderRadius:8,color:C.text,fontFamily:"monospace",fontSize:16,padding:"8px 10px",resize:"none",outline:"none",minHeight:62,boxSizing:"border-box"}}
                />
              </div>
              <div style={{marginBottom:9}}>
                <label style={{display:"block",fontSize:10,color:C.dim,marginBottom:4,fontFamily:"monospace",letterSpacing:1}}>{t.labelPassword}</label>
                <PwField value={encPw} onChange={setEncPw} show={isEncPwVisible} onToggle={() => setIsEncPwVisible((v) => !v)} placeholder={t.phPassword} t={t} showStrength/>
              </div>
              <BtnPrimary onClick={handleEncrypt}>{t.btnEncrypt}</BtnPrimary>
            </Card>

            {encResult !== null && (
              <>
                <Card>
                  <CardTitle>{t.cardPart1}</CardTitle>
                  <OutputRow text={encResult.p1} onCopy={copy} onShowQR={setQrModalData}/>
                </Card>
                <Card>
                  <CardTitle>{t.cardPart2}</CardTitle>
                  <OutputRow text={encResult.p2} onCopy={copy} onShowQR={setQrModalData}/>
                </Card>
                <Warning>{t.warnPassword}</Warning>
              </>
            )}
          </>
        )}

        {/* ── Entschlüsseln ── */}
        {mode === Mode.DECRYPT && (
          <>
            <Card>
              <CardTitle>{t.cardReconstruct}</CardTitle>
              <div style={{marginBottom:9}}>
                <label style={{display:"block",fontSize:10,color:C.dim,marginBottom:4,fontFamily:"monospace",letterSpacing:1}}>{t.labelPart1}</label>
                <textarea
                  value={decPart1}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDecPart1(e.target.value)}
                  placeholder={t.phPart1}
                  style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontFamily:"monospace",fontSize:16,padding:"8px 10px",resize:"none",outline:"none",minHeight:62,boxSizing:"border-box"}}
                />
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,margin:"5px 0 9px",color:C.dim,fontSize:10,fontFamily:"monospace"}}>
                <div style={{flex:1,height:1,background:C.border}}/>+<div style={{flex:1,height:1,background:C.border}}/>
              </div>
              <div style={{marginBottom:9}}>
                <label style={{display:"block",fontSize:10,color:C.dim,marginBottom:4,fontFamily:"monospace",letterSpacing:1}}>{t.labelPart2}</label>
                <textarea
                  value={decPart2}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDecPart2(e.target.value)}
                  placeholder={t.phPart2}
                  style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontFamily:"monospace",fontSize:16,padding:"8px 10px",resize:"none",outline:"none",minHeight:62,boxSizing:"border-box"}}
                />
              </div>
              <div style={{marginBottom:9}}>
                <label style={{display:"block",fontSize:10,color:C.dim,marginBottom:4,fontFamily:"monospace",letterSpacing:1}}>{t.labelPasswordDecrypt}</label>
                <PwField value={decPw} onChange={setDecPw} show={isDecPwVisible} onToggle={() => setIsDecPwVisible((v) => !v)} placeholder={t.phPassword} t={t}/>
              </div>
              <BtnPrimary onClick={handleDecrypt}>{t.btnDecrypt}</BtnPrimary>
            </Card>

            {decResult !== null && (
              <>
                <Card>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:11}}>
                    <CardTitle>{t.cardResult}</CardTitle>
                    <span style={{fontFamily:"monospace",fontSize:10,color:C.dim}}><span style={{color:C.accent}}>{decResult.length}</span> {t.resultChars}</span>
                  </div>
                  <div style={{background:"rgba(0,255,136,0.07)",border:"1px solid rgba(0,255,136,0.22)",borderRadius:8,padding:12,textAlign:"center"}}>
                    <div style={{fontSize:10,color:C.accent,letterSpacing:2,fontFamily:"monospace",marginBottom:6}}>{t.resultRestored}</div>
                    <div style={{fontFamily:"monospace",fontSize:12,color:C.text,wordBreak:"break-all",lineHeight:1.6}}>{decResult}</div>
                  </div>
                  <BtnSecondary onClick={() => copy(decResult)}>{t.btnCopy}</BtnSecondary>
                </Card>
                <Warning>{t.warnClose}</Warning>
              </>
            )}
          </>
        )}
        {/* Footer */}
        <div style={{textAlign:"center",padding:"24px 0 8px",fontSize:10,color:C.dim,fontFamily:"monospace",letterSpacing:1,display:"flex",justifyContent:"center",alignItems:"center",gap:14}}>
          <a href="https://www.mangolila.at/" target="_blank" rel="noopener noreferrer" style={{color:C.dim,textDecoration:"none",borderBottom:`1px solid ${C.border}`}}>
            mangolila.at
          </a>
          <span style={{color:C.border}}>v{__APP_VERSION__}</span>
          <a href="https://www.mangolila.at/impressum" target="_blank" rel="noopener noreferrer" style={{color:C.dim,textDecoration:"none",borderBottom:`1px solid ${C.border}`}}>
            {t.footerImprint}
          </a>
        </div>
      </div>

      {isHelpVisible && <HelpModal onClose={() => setIsHelpVisible(false)} t={t}/>}
      {qrModalData !== null && <QRModal data={qrModalData} onClose={() => setQrModalData(null)} t={t}/>}

      {/* Toast */}
      <div style={{position:"fixed",bottom:18,left:"50%",transform:`translateX(-50%) translateY(${toast?"0":"70px"})`,background:C.accent,color:"#000",padding:"9px 20px",borderRadius:50,fontWeight:700,fontSize:12,transition:"transform 0.3s",zIndex:100,whiteSpace:"nowrap",pointerEvents:"none"}}>
        {toast}
      </div>
    </div>
  );
}
