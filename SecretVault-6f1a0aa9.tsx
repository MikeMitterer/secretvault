import { useState, useRef, useCallback, useEffect } from "react";

const C = {
  bg:"#0a0a0f",surface:"#13131a",surface2:"#1c1c27",
  border:"#2a2a3a",accent:"#00ff88",text:"#e8e8f0",dim:"#7070a0"
};

// ── Crypto ────────────────────────────────────────────────────────
async function deriveKey(password, salt) {
  const km = await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:250000,hash:"SHA-256"},km,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
const toB64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function encryptText(text, pw) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(pw, salt);
  const ct   = await crypto.subtle.encrypt({name:"AES-GCM",iv}, key, new TextEncoder().encode(text));
  const out  = new Uint8Array(28+ct.byteLength);
  out.set(salt,0); out.set(iv,16); out.set(new Uint8Array(ct),28);
  return toB64(out.buffer);
}

async function decryptText(b64, pw) {
  const buf = fromB64(b64);
  const key = await deriveKey(pw, buf.slice(0,16));
  const pt  = await crypto.subtle.decrypt({name:"AES-GCM",iv:buf.slice(16,28)}, key, buf.slice(28));
  return new TextDecoder().decode(pt);
}

function splitStr(s) {
  let a="",b="";
  for(let i=0;i<s.length;i++) { if(i%2===0) a+=s[i]; else b+=s[i]; }
  return [a,b];
}
function combineStr(a,b) {
  let r="";
  for(let i=0;i<Math.max(a.length,b.length);i++) { if(i<a.length) r+=a[i]; if(i<b.length) r+=b[i]; }
  return r;
}

const MAX_LEN = 100;

// ── Loading bar component ─────────────────────────────────────────
function Loader({ done }) {
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
      <div style={{fontSize:10,color:C.dim,fontFamily:"monospace",letterSpacing:3}}>INITIALISIERUNG...</div>
      <style>{`@keyframes ldbar{0%{width:0%}60%{width:72%}100%{width:100%}}`}</style>
    </div>
  );
}
// ── Password strength ─────────────────────────────────────────────
function pwStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  // Bonus for passphrase style (multiple words)
  if ((pw.match(/[-_ ]/g)||[]).length >= 2 && pw.length >= 16) score++;

  if (score <= 2) return { score: 1, label: "SCHWACH",       color: "#ff4466" };
  if (score <= 4) return { score: 2, label: "MITTEL",        color: "#ffaa00" };
  if (score <= 6) return { score: 3, label: "STARK",         color: "#00ccff" };
                  return { score: 4, label: "SEHR STARK",    color: "#00ff88" };
}

function StrengthBar({ pw }) {
  const { score, label, color } = pwStrength(pw);
  if (!pw) return null;
  return (
    <div style={{marginTop:6}}>
      <div style={{display:"flex",gap:4,marginBottom:3}}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{flex:1,height:3,borderRadius:4,background:i<=score?color:C.surface2,transition:"background 0.3s"}}/>
        ))}
      </div>
      <div style={{fontSize:9,fontFamily:"monospace",letterSpacing:2,color}}>{label}</div>
    </div>
  );
}

function PwField({ value, onChange, show, onToggle, placeholder, showStrength }) {
  return (
    <div>
      <div style={{position:"relative"}}>
        <input
          type={show?"text":"password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontFamily:"monospace",fontSize:16,padding:"8px 38px 8px 10px",outline:"none",boxSizing:"border-box"}}
        />
        <button onClick={onToggle} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:13,padding:3}}>
          {show?"🙈":"👁"}
        </button>
      </div>
      {showStrength && <StrengthBar pw={value}/>}
    </div>
  );
}

function Card({ children }) {
  return <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:13,marginBottom:10}}>{children}</div>;
}

function CardTitle({ children }) {
  return <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:C.accent,fontFamily:"monospace",marginBottom:11}}>{children}</div>;
}

function BtnPrimary({ onClick, children }) {
  return <button onClick={onClick} style={{width:"100%",padding:12,borderRadius:10,border:"none",fontFamily:"system-ui,sans-serif",fontWeight:700,fontSize:13,cursor:"pointer",letterSpacing:1,background:C.accent,color:"#000"}}>{children}</button>;
}

function BtnSecondary({ onClick, children }) {
  return <button onClick={onClick} style={{width:"100%",padding:"9px 12px",borderRadius:10,border:`1px solid ${C.border}`,fontFamily:"system-ui,sans-serif",fontWeight:600,fontSize:12,cursor:"pointer",background:C.surface2,color:C.text,marginTop:7}}>{children}</button>;
}

function OutputRow({ text, onCopy, onShowQR }) {
  return (
    <div style={{display:"flex",gap:6,alignItems:"stretch",marginBottom:7}}>
      <div style={{flex:1,background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 10px",fontFamily:"monospace",fontSize:11,wordBreak:"break-all",color:C.accent,lineHeight:1.6,minHeight:40}}>{text}</div>
      <button onClick={() => onCopy(text)} style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.dim,cursor:"pointer",padding:"0 11px",fontSize:15}}>⎘</button>
      <button onClick={() => onShowQR(text)} style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.dim,cursor:"pointer",padding:"0 11px",fontSize:11,fontFamily:"monospace",fontWeight:700,letterSpacing:1}}>QR</button>
    </div>
  );
}

function Warning({ children }) {
  return <div style={{background:"rgba(255,68,102,0.07)",border:"1px solid rgba(255,68,102,0.22)",borderRadius:8,padding:"8px 11px",fontSize:11,color:"#ff8899",fontFamily:"monospace",lineHeight:1.6,marginBottom:10}}>{children}</div>;
}

// ── QR Code Modal (rendered on-demand) ────────────────────────────
function QRModal({ data, onClose }) {
  const [imgSrc, setImgSrc] = useState("");
  const [hint, setHint]     = useState(false);

  useEffect(() => {
    if (!data) return;
    const render = () => {
      const div = document.createElement("div");
      div.style.cssText = "position:fixed;left:-9999px;top:-9999px";
      document.body.appendChild(div);
      try {
        new window.QRCode(div, {
          text: data, width: 220, height: 220,
          colorDark: "#000000", colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.M
        });
        setTimeout(() => {
          const canvas = div.querySelector("canvas");
          if (canvas) setImgSrc(canvas.toDataURL("image/png"));
          if (document.body.contains(div)) document.body.removeChild(div);
        }, 300);
      } catch(e) {
        if (document.body.contains(div)) document.body.removeChild(div);
      }
    };
    if (window.QRCode) { render(); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    s.onload = render;
    document.head.appendChild(s);
  }, [data]);

  const saveQR = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) { setHint(true); return; }
    if (!imgSrc) { setHint(true); return; }
    const a = document.createElement("a");
    a.download = "SecretVault_QR.png";
    a.href = imgSrc;
    a.click();
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:20,maxWidth:340,width:"100%"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{color:C.accent,fontFamily:"monospace",fontSize:11,letterSpacing:3}}>◈ QR CODE</div>
          <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:"50%",width:28,height:28,color:C.dim,cursor:"pointer",fontSize:14}}>✕</button>
        </div>

        <div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:14,background:"#fff",borderRadius:10,marginBottom:12,minHeight:220}}>
          {imgSrc
            ? <img src={imgSrc} width={220} height={220} alt="QR"/>
            : <span style={{color:"#999",fontSize:11,fontFamily:"monospace"}}>Generiere...</span>
          }
        </div>

        <div style={{fontSize:9,color:C.dim,fontFamily:"monospace",letterSpacing:2,marginBottom:6}}>INHALT (zur Kontrolle):</div>
        <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 10px",fontFamily:"monospace",fontSize:11,wordBreak:"break-all",color:C.accent,lineHeight:1.6,marginBottom:10}}>
          {data}
        </div>

        <BtnSecondary onClick={saveQR}>&#11015; QR Code speichern</BtnSecondary>

        {hint && (
          <div onClick={()=>setHint(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
            <div onClick={e=>e.stopPropagation()} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:24,maxWidth:300,textAlign:"center",fontFamily:"monospace"}}>
              <div style={{fontSize:32,marginBottom:12}}>👆</div>
              <div style={{color:C.accent,fontSize:11,letterSpacing:3,marginBottom:10}}>QR SPEICHERN</div>
              <div style={{color:C.text,fontSize:13,lineHeight:1.7}}>Drücke das QR-Bild <strong>länger</strong> und wähle <em>Bild sichern</em></div>
              <button onClick={()=>setHint(false)} style={{marginTop:18,padding:"10px 24px",background:C.accent,color:"#000",border:"none",borderRadius:50,fontWeight:700,fontSize:13,cursor:"pointer"}}>OK</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HelpModal({ onClose }) {
  const items = [
    ["1 · VERSCHLÜSSELUNG","AES-256-GCM — Industriestandard. GCM sichert zusätzlich die Integrität: Manipulation wird beim Entschlüsseln erkannt."],
    ["2 · SCHLÜSSELABLEITUNG","PBKDF2-SHA256 mit 250.000 Iterationen + zufälligem Salt (16 Byte) → 256-Bit-Schlüssel. Macht Brute-Force extrem aufwändig."],
    ["3 · ZUFALLSWERTE","Pro Verschlüsselung: Salt (16 Byte) für Schlüsselableitung + IV/Nonce (12 Byte) für AES-GCM. Beide im String gespeichert, aber nicht geheim."],
    ["4 · SECRET SPLITTING","Interleaving: gerade Positionen → Teil 1, ungerade → Teil 2. Beide Teile ohne den jeweils anderen wertlos."],
    ["5 · DATENSCHUTZ","Web Crypto API — alles lokal im Browser. Keine Daten werden übertragen, kein Server kontaktiert."],
    ["6 · SICHERHEITSMODELL","Beide Teile + Passwort nötig. Sicher solange Passwort geheim und Teile getrennt aufbewahrt."],
  ];
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:300,overflowY:"auto",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{maxWidth:480,margin:"0 auto",background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{color:C.accent,fontFamily:"monospace",fontSize:11,letterSpacing:3}}>◈ TECHNISCHE DOKUMENTATION</div>
          <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:"50%",width:28,height:28,color:C.dim,cursor:"pointer",fontSize:14}}>✕</button>
        </div>
        {items.map(([title,body]) => (
          <div key={title} style={{marginBottom:14}}>
            <div style={{color:C.accent,fontSize:10,letterSpacing:2,marginBottom:5,fontFamily:"monospace"}}>{title}</div>
            <div style={{color:"#b0b0d0",fontSize:12,lineHeight:1.9,fontFamily:"monospace"}}>{body}</div>
          </div>
        ))}
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12,color:C.dim,fontSize:10,fontFamily:"monospace"}}>
          Web Crypto API · AES-256-GCM · PBKDF2-SHA256 · 250k Iterationen · 16B Salt · 12B IV
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function SecretVault() {
  const [mode, setMode]         = useState("encrypt");
  const [showInfo, setShowInfo] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [toast, setToast]       = useState("");
  const [loaderDone, setLoaderDone] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setLoaderDone(true), 1900);
    return () => clearTimeout(t);
  }, []);

  // Encrypt
  const [secret, setSecret]       = useState("");
  const [encPw, setEncPw]         = useState("");
  const [showEncPw, setShowEncPw] = useState(false);
  const [qrModalData, setQrModalData] = useState(null);
  const [encResult, setEncResult] = useState(null);

  // Decrypt
  const [decP1, setDecP1]         = useState("");
  const [decP2, setDecP2]         = useState("");
  const [decPw, setDecPw]         = useState("");
  const [showDecPw, setShowDecPw] = useState(false);
  const [decResult, setDecResult] = useState(null);

  const toast$ = useCallback((msg) => {
    setToast(msg);
    if(timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(()=>setToast(""),2200);
  },[]);

  const copy = useCallback(async (text) => {
    try { await navigator.clipboard.writeText(text); toast$("Kopiert"); }
    catch { toast$("Kopieren fehlgeschlagen"); }
  },[toast$]);

  const handleEncrypt = async () => {
    const t = secret.replace(/[\r\n]/g,"").trim();
    if(!t){ toast$("Secret Key fehlt"); return; }
    if(t.length > MAX_LEN){ toast$(`Max. ${MAX_LEN} Zeichen`); return; }
    if(encPw.length<6){ toast$("Passwort min. 6 Zeichen"); return; }
    if(pwStrength(encPw).score < 2){ toast$("Passwort zu schwach"); return; }
    try {
      const enc = await encryptText(t, encPw);
      const [p1,p2] = splitStr(enc);
      setEncResult({p1,p2});
      toast$("✓ Verschlüsselt");
    } catch { toast$("Fehler beim Verschlüsseln"); }
  };

  const handleDecrypt = async () => {
    if(!decP1.trim()||!decP2.trim()){ toast$("Beide Teile benötigt"); return; }
    if(!decPw){ toast$("Passwort fehlt"); return; }
    try {
      const result = await decryptText(combineStr(decP1.trim(),decP2.trim()), decPw);
      setDecResult(result);
      toast$("✓ Rekonstruiert");
    } catch { toast$("⚠ Falsches Passwort oder fehlerhafte Teile"); }
  };

  const iBtn = (label, active, onClick) => (
    <button onClick={onClick} style={{width:26,height:26,borderRadius:"50%",border:`1px solid ${active?C.accent:C.border}`,background:C.surface,color:active?C.accent:C.dim,fontFamily:"monospace",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
      {label}
    </button>
  );

  if (!loaderDone) {
    return (
      <div style={{background:C.bg,minHeight:"100vh"}}>
        <Loader done={false}/>
      </div>
    );
  }

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"system-ui,-apple-system,sans-serif",color:C.text,overflowX:"hidden"}}>
      {/* Grid bg */}
      <div style={{position:"fixed",inset:0,backgroundImage:`linear-gradient(rgba(0,255,136,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.03) 1px,transparent 1px)`,backgroundSize:"40px 40px",pointerEvents:"none",zIndex:0}}/>

      <div style={{position:"relative",zIndex:1,maxWidth:480,margin:"0 auto",padding:"10px 14px 40px"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0 10px"}}>
          <div style={{display:"flex",alignItems:"baseline",gap:9}}>
            <span style={{fontSize:22,fontWeight:800,background:`linear-gradient(135deg,#fff,${C.accent})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>SecretVault</span>
            <span style={{fontSize:9,letterSpacing:3,color:C.accent,fontFamily:"monospace",opacity:.6}}>AES-256</span>
          </div>
          <div style={{display:"flex",gap:6}}>
            {iBtn("i",showInfo,()=>setShowInfo(v=>!v))}
            {iBtn("?",showHelp,()=>setShowHelp(true))}
          </div>
        </div>

        {/* Info */}
        {showInfo && (
          <div style={{background:"rgba(0,136,255,0.07)",border:"1px solid rgba(0,136,255,0.2)",borderRadius:8,padding:"10px 12px",fontSize:11,color:"#88bbff",fontFamily:"monospace",lineHeight:1.7,marginBottom:10}}>
            🔐 VERSCHLÜSSELN: Secret Key + Passwort → zwei Teile. Teil 1 für Website, Teil 2 optional als QR.<br/>
            🔓 ENTSCHLÜSSELN: Teil 1 + Teil 2 + Passwort → Key wiederhergestellt.<br/>
            ⚠ Alles lokal. Keine Daten übertragen.
          </div>
        )}

        {/* Tabs */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:10,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:4}}>
          {["encrypt","decrypt"].map((m,i)=>(
            <button key={m} onClick={()=>setMode(m)} style={{padding:8,borderRadius:8,border:"none",cursor:"pointer",fontFamily:"system-ui,sans-serif",fontWeight:600,fontSize:13,background:mode===m?C.accent:"transparent",color:mode===m?"#000":C.dim}}>
              {i===0?"🔐 Verschlüsseln":"🔓 Entschlüsseln"}
            </button>
          ))}
        </div>

        {/* ── ENCRYPT ── */}
        {mode==="encrypt" && (
          <>
            <Card>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:11}}>
                <CardTitle>◈ Eingabe</CardTitle>
                <span style={{fontFamily:"monospace",fontSize:10,color:secret.replace(/[\r\n]/g,"").trim().length>MAX_LEN?"#ff4466":C.dim}}>
                  <span style={{color:secret.replace(/[\r\n]/g,"").trim().length>MAX_LEN?"#ff4466":C.accent}}>{secret.replace(/[\r\n]/g,"").trim().length}</span>/{MAX_LEN}
                </span>
              </div>
              <div style={{marginBottom:9}}>
                <label style={{display:"block",fontSize:10,color:C.dim,marginBottom:4,fontFamily:"monospace",letterSpacing:1}}>SECRET KEY / GEHEIMER TEXT</label>
                <textarea value={secret}
                  onChange={e => setSecret(e.target.value.replace(/[\r\n]/g,""))}
                  placeholder="Geheimen Text eingeben..."
                  style={{width:"100%",background:C.surface2,border:`1px solid ${secret.replace(/[\r\n]/g,"").trim().length>MAX_LEN?"#ff4466":C.border}`,borderRadius:8,color:C.text,fontFamily:"monospace",fontSize:16,padding:"8px 10px",resize:"none",outline:"none",minHeight:62,boxSizing:"border-box"}}/>
              </div>
              <div style={{marginBottom:9}}>
                <label style={{display:"block",fontSize:10,color:C.dim,marginBottom:4,fontFamily:"monospace",letterSpacing:1}}>PASSWORT (auswendig merken!)</label>
                <PwField value={encPw} onChange={setEncPw} show={showEncPw} onToggle={()=>setShowEncPw(v=>!v)} placeholder="Passwort eingeben..." showStrength/>
              </div>
              <BtnPrimary onClick={handleEncrypt}>VERSCHLÜSSELN & SPLITTEN →</BtnPrimary>
            </Card>

            {encResult && (
              <>
                <Card>
                  <CardTitle>◈ Teil 1 → Website</CardTitle>
                  <OutputRow text={encResult.p1} onCopy={copy} onShowQR={setQrModalData}/>
                </Card>
                <Card>
                  <CardTitle>◈ Teil 2 → Text / QR</CardTitle>
                  <OutputRow text={encResult.p2} onCopy={copy} onShowQR={setQrModalData}/>
                </Card>
                <Warning>⚠️ Ohne Passwort sind beide Teile wertlos. Passwort auswendig merken!</Warning>
              </>
            )}
          </>
        )}

        {/* ── DECRYPT ── */}
        {mode==="decrypt" && (
          <>
            <Card>
              <CardTitle>◈ Rekonstruktion</CardTitle>
              <div style={{marginBottom:9}}>
                <label style={{display:"block",fontSize:10,color:C.dim,marginBottom:4,fontFamily:"monospace",letterSpacing:1}}>TEIL 1 (von Website)</label>
                <textarea value={decP1} onChange={e=>setDecP1(e.target.value)} placeholder="Teil 1 einfügen..."
                  style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontFamily:"monospace",fontSize:16,padding:"8px 10px",resize:"none",outline:"none",minHeight:62,boxSizing:"border-box"}}/>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,margin:"5px 0 9px",color:C.dim,fontSize:10,fontFamily:"monospace"}}>
                <div style={{flex:1,height:1,background:C.border}}/>+<div style={{flex:1,height:1,background:C.border}}/>
              </div>
              <div style={{marginBottom:9}}>
                <label style={{display:"block",fontSize:10,color:C.dim,marginBottom:4,fontFamily:"monospace",letterSpacing:1}}>TEIL 2 (Text oder QR Scan)</label>
                <textarea value={decP2} onChange={e=>setDecP2(e.target.value)} placeholder="Teil 2 einfügen..."
                  style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontFamily:"monospace",fontSize:16,padding:"8px 10px",resize:"none",outline:"none",minHeight:62,boxSizing:"border-box"}}/>
              </div>
              <div style={{marginBottom:9}}>
                <label style={{display:"block",fontSize:10,color:C.dim,marginBottom:4,fontFamily:"monospace",letterSpacing:1}}>PASSWORT</label>
                <PwField value={decPw} onChange={setDecPw} show={showDecPw} onToggle={()=>setShowDecPw(v=>!v)} placeholder="Passwort eingeben..."/>
              </div>
              <BtnPrimary onClick={handleDecrypt}>REKONSTRUIEREN →</BtnPrimary>
            </Card>

            {decResult && (
              <>
                <Card>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:11}}>
                    <CardTitle>◈ Ergebnis</CardTitle>
                    <span style={{fontFamily:"monospace",fontSize:10,color:C.dim}}><span style={{color:C.accent}}>{decResult.length}</span> Zeichen</span>
                  </div>
                  <div style={{background:"rgba(0,255,136,0.07)",border:"1px solid rgba(0,255,136,0.22)",borderRadius:8,padding:12,textAlign:"center"}}>
                    <div style={{fontSize:10,color:C.accent,letterSpacing:2,fontFamily:"monospace",marginBottom:6}}>✓ SECRET KEY WIEDERHERGESTELLT</div>
                    <div style={{fontFamily:"monospace",fontSize:12,color:C.text,wordBreak:"break-all",lineHeight:1.6}}>{decResult}</div>
                  </div>
                  <BtnSecondary onClick={()=>copy(decResult)}>⎘ Kopieren</BtnSecondary>
                </Card>
                <Warning>⚠️ Tab nach Verwendung schließen. Key wird nicht gespeichert.</Warning>
              </>
            )}
          </>
        )}
      </div>

      {/* Help */}
      {showHelp && <HelpModal onClose={()=>setShowHelp(false)}/>}
      {qrModalData && <QRModal data={qrModalData} onClose={()=>setQrModalData(null)}/>}

      {/* Toast */}
      <div style={{position:"fixed",bottom:18,left:"50%",transform:`translateX(-50%) translateY(${toast?"0":"70px"})`,background:C.accent,color:"#000",padding:"9px 20px",borderRadius:50,fontWeight:700,fontSize:12,transition:"transform 0.3s",zIndex:100,whiteSpace:"nowrap",pointerEvents:"none"}}>
        {toast}
      </div>
    </div>
  );
}
