import { MAX_LEN } from "./constants";

export type Lang = "de" | "en";

/** Vollständige Übersetzungsstruktur (App + Landing Page). */
export interface AppT {
  // ── Navigation & Tabs ────────────────────────────────────────────
  tabEncrypt:       string;
  tabDecrypt:       string;
  langSwitchLabel:  string;

  // ── Loader ───────────────────────────────────────────────────────
  loaderText: string;

  // ── Info-Panel ───────────────────────────────────────────────────
  infoPanelEncrypt: string;
  infoPanelDecrypt: string;
  infoPanelLocal:   string;

  // ── Eingabe-Labels & Platzhalter (Encrypt) ───────────────────────
  labelSecret:   string;
  labelPassword: string;
  phSecret:      string;
  phPassword:    string;
  btnEncrypt:    string;

  // ── Eingabe-Labels & Platzhalter (Decrypt) ───────────────────────
  labelPart1:          string;
  labelPart2:          string;
  labelPasswordDecrypt:string;
  phPart1:             string;
  phPart2:             string;
  btnDecrypt:          string;
  btnCopy:             string;

  // ── Card-Titel ───────────────────────────────────────────────────
  cardInput:       string;
  cardPart1:       string;
  cardPart2:       string;
  cardReconstruct: string;
  cardResult:      string;

  // ── Toast-Meldungen ──────────────────────────────────────────────
  toastMissingSecret: string;
  toastPwShort:       string;
  toastPwWeak:        string;
  toastMaxLen:        string;
  toastEncrypted:     string;
  toastEncryptError:  string;
  toastBothParts:     string;
  toastPwMissing:     string;
  toastWrongPw:       string;
  toastDecrypted:     string;
  toastCopied:        string;
  toastCopyFail:      string;

  // ── Warnungen & Ergebnis ─────────────────────────────────────────
  warnPassword:   string;
  warnClose:      string;
  resultRestored: string;
  resultChars:    string;

  // ── Passwort-Stärke ──────────────────────────────────────────────
  strengthWeak:      string;
  strengthMedium:    string;
  strengthStrong:    string;
  strengthVeryStrong:string;

  // ── QR-Modal ─────────────────────────────────────────────────────
  qrTitle:        string;
  qrContentLabel: string;
  qrSaveBtn:      string;
  qrHintTitle:    string;
  qrHintText:     string;
  qrHintAction:   string;
  qrGenerating:   string;

  // ── Hilfe-Modal ──────────────────────────────────────────────────
  helpTitle: string;
  helpItems: ReadonlyArray<readonly [string, string]>;

  // ── Landing Page ─────────────────────────────────────────────────
  navAppLink:    string;
  heroTagline:   string;
  heroSubtagline:string;
  heroCTA:       string;

  useCasesTitle: string;
  useCases: ReadonlyArray<{ icon: string; title: string; text: string }>;

  howItWorksTitle: string;
  steps: ReadonlyArray<{ num: string; title: string; text: string }>;

  securityTitle: string;
  securityItems: ReadonlyArray<{ icon: string; title: string; text: string }>;

  ctaTitle:   string;
  ctaSubline: string;
  ctaBtn:     string;

  footerPrivacy: string;
  footerImprint: string;
}

export const TRANSLATIONS: Record<Lang, AppT> = {
  de: {
    // ── Navigation & Tabs ─────────────────────────────────────────
    tabEncrypt:      "🔐 Verschlüsseln",
    tabDecrypt:      "🔓 Entschlüsseln",
    langSwitchLabel: "EN",

    // ── Loader ────────────────────────────────────────────────────
    loaderText: "INITIALISIERUNG...",

    // ── Info-Panel ────────────────────────────────────────────────
    infoPanelEncrypt: "🔐 VERSCHLÜSSELN: Secret Key + Passwort → zwei Teile. Teil 1 für Website, Teil 2 optional als QR.",
    infoPanelDecrypt: "🔓 ENTSCHLÜSSELN: Teil 1 + Teil 2 + Passwort → Key wiederhergestellt.",
    infoPanelLocal:   "⚠ Alles lokal. Keine Daten übertragen.",

    // ── Encrypt ───────────────────────────────────────────────────
    labelSecret:   "SECRET KEY / GEHEIMER TEXT",
    labelPassword: "PASSWORT (auswendig merken!)",
    phSecret:      "Geheimen Text eingeben...",
    phPassword:    "Passwort eingeben...",
    btnEncrypt:    "VERSCHLÜSSELN & SPLITTEN →",

    // ── Decrypt ───────────────────────────────────────────────────
    labelPart1:          "TEIL 1 (von Website)",
    labelPart2:          "TEIL 2 (Text oder QR Scan)",
    labelPasswordDecrypt:"PASSWORT",
    phPart1:             "Teil 1 einfügen...",
    phPart2:             "Teil 2 einfügen...",
    btnDecrypt:          "REKONSTRUIEREN →",
    btnCopy:             "⎘ Kopieren",

    // ── Cards ─────────────────────────────────────────────────────
    cardInput:       "◈ Eingabe",
    cardPart1:       "◈ Teil 1 → Website",
    cardPart2:       "◈ Teil 2 → Text / QR",
    cardReconstruct: "◈ Rekonstruktion",
    cardResult:      "◈ Ergebnis",

    // ── Toasts ────────────────────────────────────────────────────
    toastMissingSecret: "Secret Key fehlt",
    toastPwShort:       "Passwort min. 6 Zeichen",
    toastPwWeak:        "Passwort zu schwach",
    toastMaxLen:        `Max. ${MAX_LEN} Zeichen`,
    toastEncrypted:     "✓ Verschlüsselt",
    toastEncryptError:  "Fehler beim Verschlüsseln",
    toastBothParts:     "Beide Teile benötigt",
    toastPwMissing:     "Passwort fehlt",
    toastWrongPw:       "⚠ Falsches Passwort oder fehlerhafte Teile",
    toastDecrypted:     "✓ Rekonstruiert",
    toastCopied:        "Kopiert",
    toastCopyFail:      "Kopieren fehlgeschlagen",

    // ── Warnungen & Ergebnis ──────────────────────────────────────
    warnPassword:   "⚠️ Ohne Passwort sind beide Teile wertlos. Passwort auswendig merken!",
    warnClose:      "⚠️ Tab nach Verwendung schließen. Key wird nicht gespeichert.",
    resultRestored: "✓ SECRET KEY WIEDERHERGESTELLT",
    resultChars:    "Zeichen",

    // ── Passwort-Stärke ───────────────────────────────────────────
    strengthWeak:      "SCHWACH",
    strengthMedium:    "MITTEL",
    strengthStrong:    "STARK",
    strengthVeryStrong:"SEHR STARK",

    // ── QR-Modal ──────────────────────────────────────────────────
    qrTitle:        "◈ QR CODE",
    qrContentLabel: "INHALT (zur Kontrolle):",
    qrSaveBtn:      "⬇ QR Code speichern",
    qrHintTitle:    "QR SPEICHERN",
    qrHintText:     "Drücke das QR-Bild länger und wähle",
    qrHintAction:   "Bild sichern",
    qrGenerating:   "Generiere...",

    // ── Hilfe-Modal ───────────────────────────────────────────────
    helpTitle: "◈ TECHNISCHE DOKUMENTATION",
    helpItems: [
      ["1 · VERSCHLÜSSELUNG",    "AES-256-GCM — Industriestandard. GCM sichert zusätzlich die Integrität: Manipulation wird beim Entschlüsseln erkannt."],
      ["2 · SCHLÜSSELABLEITUNG", "PBKDF2-SHA256 mit 250.000 Iterationen + zufälligem Salt (16 Byte) → 256-Bit-Schlüssel. Macht Brute-Force extrem aufwändig."],
      ["3 · ZUFALLSWERTE",       "Pro Verschlüsselung: Salt (16 Byte) für Schlüsselableitung + IV/Nonce (12 Byte) für AES-GCM. Beide im Blob gespeichert, aber nicht geheim."],
      ["4 · SECRET SPLITTING",   "Interleaving: gerade Positionen → Teil 1, ungerade → Teil 2. Beide Teile ohne den jeweils anderen wertlos."],
      ["5 · DATENSCHUTZ",        "Web Crypto API — alles lokal im Browser. Keine Daten werden übertragen, kein Server kontaktiert."],
      ["6 · SICHERHEITSMODELL",  "Beide Teile + Passwort nötig. Sicher solange Passwort geheim und Teile getrennt aufbewahrt."],
    ],

    // ── Landing Page ──────────────────────────────────────────────
    navAppLink:    "Zur App",
    heroTagline:   "Teile deinen Secret Key in zwei Hälften auf.",
    heroSubtagline:"Kein Server. Keine Cloud. 100 % lokal.",
    heroCTA:       "Zur App ↓",

    useCasesTitle: "Anwendungsfälle",
    useCases: [
      {
        icon:  "⚡",
        title: "API Keys & Tokens",
        text:  "GitHub PATs, AWS-Schlüssel oder Stripe-Secrets sicher aufteilen. Teil 1 ins Repo oder auf eine Website — Teil 2 bleibt bei dir.",
      },
      {
        icon:  "🌱",
        title: "Seed Phrases",
        text:  "Wallet-Backups mit Zwei-Faktor-Schutz. Zugriff verlierst du nur, wenn beide Teile und das Passwort verloren gehen.",
      },
      {
        icon:  "🔑",
        title: "Passwort-Backup",
        text:  "Kritische Passwörter verschlüsselt aufteilen. Kein Single Point of Failure mehr.",
      },
    ],

    howItWorksTitle: "So funktioniert es",
    steps: [
      {
        num:   "01",
        title: "Secret & Passwort eingeben",
        text:  `Gib deinen Secret Key (max. ${MAX_LEN} Zeichen) und ein starkes Passwort ein.`,
      },
      {
        num:   "02",
        title: "Verschlüsseln & Splitten",
        text:  "AES-256-GCM verschlüsselt den Key. Der Ciphertext wird per Interleaving in zwei Teile geteilt.",
      },
      {
        num:   "03",
        title: "Teile verteilen",
        text:  "Teil 1 → Website oder Server. Teil 2 → als Text sichern oder QR-Code speichern. Passwort → auswendig merken.",
      },
      {
        num:   "04",
        title: "QR-Code scannen",
        text:  "Später: QR-Code mit dem Smartphone scannen oder einer QR-App öffnen. Den angezeigten Text in die Zwischenablage kopieren.",
      },
      {
        num:   "05",
        title: "Secret wiederherstellen",
        text:  "In der App: Teil 1 einfügen, Teil 2 aus der Zwischenablage pasten, Passwort eingeben — der geheime Text wird vollständig wiederhergestellt.",
      },
    ],

    securityTitle: "Sicherheit",
    securityItems: [
      { icon: "🛡", title: "AES-256-GCM",        text: "Militärischer Standard. GCM sichert zusätzlich die Integrität des Ciphertexts." },
      { icon: "🔄", title: "PBKDF2 · 250k Iter.", text: "Langsame Schlüsselableitung macht Brute-Force extrem aufwändig." },
      { icon: "💻", title: "100 % lokal",         text: "Web Crypto API. Kein Byte verlässt deinen Browser. Kein Server, keine Logs." },
      { icon: "📖", title: "Open Source",         text: "Code liegt offen. Vertrauen durch Transparenz." },
    ],

    ctaTitle:   "Bereit loszulegen?",
    ctaSubline: "Kein Account. Keine Installation. Direkt im Browser.",
    ctaBtn:     "App öffnen →",

    footerPrivacy: "Läuft vollständig lokal in deinem Browser",
    footerImprint: "Impressum",
  },

  en: {
    // ── Navigation & Tabs ─────────────────────────────────────────
    tabEncrypt:      "🔐 Encrypt",
    tabDecrypt:      "🔓 Decrypt",
    langSwitchLabel: "DE",

    // ── Loader ────────────────────────────────────────────────────
    loaderText: "INITIALIZING...",

    // ── Info-Panel ────────────────────────────────────────────────
    infoPanelEncrypt: "🔐 ENCRYPT: Secret Key + Password → two parts. Part 1 for website, Part 2 optionally as QR.",
    infoPanelDecrypt: "🔓 DECRYPT: Part 1 + Part 2 + Password → key reconstructed.",
    infoPanelLocal:   "⚠ All local. No data transmitted.",

    // ── Encrypt ───────────────────────────────────────────────────
    labelSecret:   "SECRET KEY / CONFIDENTIAL TEXT",
    labelPassword: "PASSWORD (memorize it!)",
    phSecret:      "Enter secret text...",
    phPassword:    "Enter password...",
    btnEncrypt:    "ENCRYPT & SPLIT →",

    // ── Decrypt ───────────────────────────────────────────────────
    labelPart1:          "PART 1 (from website)",
    labelPart2:          "PART 2 (text or QR scan)",
    labelPasswordDecrypt:"PASSWORD",
    phPart1:             "Paste part 1...",
    phPart2:             "Paste part 2...",
    btnDecrypt:          "RECONSTRUCT →",
    btnCopy:             "⎘ Copy",

    // ── Cards ─────────────────────────────────────────────────────
    cardInput:       "◈ Input",
    cardPart1:       "◈ Part 1 → Website",
    cardPart2:       "◈ Part 2 → Text / QR",
    cardReconstruct: "◈ Reconstruction",
    cardResult:      "◈ Result",

    // ── Toasts ────────────────────────────────────────────────────
    toastMissingSecret: "Secret key missing",
    toastPwShort:       "Password min. 6 characters",
    toastPwWeak:        "Password too weak",
    toastMaxLen:        `Max. ${MAX_LEN} characters`,
    toastEncrypted:     "✓ Encrypted",
    toastEncryptError:  "Encryption failed",
    toastBothParts:     "Both parts required",
    toastPwMissing:     "Password missing",
    toastWrongPw:       "⚠ Wrong password or corrupted parts",
    toastDecrypted:     "✓ Reconstructed",
    toastCopied:        "Copied",
    toastCopyFail:      "Copy failed",

    // ── Warnungen & Ergebnis ──────────────────────────────────────
    warnPassword:   "⚠️ Without the password both parts are worthless. Memorize your password!",
    warnClose:      "⚠️ Close this tab after use. The key is not stored.",
    resultRestored: "✓ SECRET KEY RESTORED",
    resultChars:    "chars",

    // ── Passwort-Stärke ───────────────────────────────────────────
    strengthWeak:      "WEAK",
    strengthMedium:    "MEDIUM",
    strengthStrong:    "STRONG",
    strengthVeryStrong:"VERY STRONG",

    // ── QR-Modal ──────────────────────────────────────────────────
    qrTitle:        "◈ QR CODE",
    qrContentLabel: "CONTENT (for verification):",
    qrSaveBtn:      "⬇ Save QR Code",
    qrHintTitle:    "SAVE QR",
    qrHintText:     "Long-press the QR image and choose",
    qrHintAction:   "Save Image",
    qrGenerating:   "Generating...",

    // ── Help Modal ────────────────────────────────────────────────
    helpTitle: "◈ TECHNICAL DOCUMENTATION",
    helpItems: [
      ["1 · ENCRYPTION",      "AES-256-GCM — industry standard. GCM also ensures integrity: any tampering is detected on decryption."],
      ["2 · KEY DERIVATION",  "PBKDF2-SHA256 with 250,000 iterations + random salt (16 bytes) → 256-bit key. Makes brute-force extremely costly."],
      ["3 · RANDOM VALUES",   "Per encryption: salt (16 bytes) for key derivation + IV/nonce (12 bytes) for AES-GCM. Both stored in the blob, but not secret."],
      ["4 · SECRET SPLITTING","Interleaving: even positions → Part 1, odd → Part 2. Either part alone is worthless without the other."],
      ["5 · PRIVACY",         "Web Crypto API — everything runs locally in the browser. No data is transmitted, no server is contacted."],
      ["6 · SECURITY MODEL",  "Both parts + password required. Secure as long as the password is secret and parts are stored separately."],
    ],

    // ── Landing Page ──────────────────────────────────────────────
    navAppLink:    "Try the App",
    heroTagline:   "Split your secret key into two halves.",
    heroSubtagline:"No server. No cloud. 100% local.",
    heroCTA:       "Try it ↓",

    useCasesTitle: "Use Cases",
    useCases: [
      {
        icon:  "⚡",
        title: "API Keys & Tokens",
        text:  "Split GitHub PATs, AWS keys or Stripe secrets safely. Part 1 goes to your repo or website — Part 2 stays with you.",
      },
      {
        icon:  "🌱",
        title: "Seed Phrases",
        text:  "Two-factor protection for wallet backups. You lose access only if both parts and the password are lost.",
      },
      {
        icon:  "🔑",
        title: "Password Backup",
        text:  "Split critical passwords encrypted. No single point of failure.",
      },
    ],

    howItWorksTitle: "How it works",
    steps: [
      {
        num:   "01",
        title: "Enter Secret & Password",
        text:  `Enter your secret key (max. ${MAX_LEN} characters) and a strong password.`,
      },
      {
        num:   "02",
        title: "Encrypt & Split",
        text:  "AES-256-GCM encrypts the key. The ciphertext is split into two parts via interleaving.",
      },
      {
        num:   "03",
        title: "Distribute the Parts",
        text:  "Part 1 → website or server. Part 2 → save as text or store as QR code. Password → memorize it.",
      },
      {
        num:   "04",
        title: "Scan the QR Code",
        text:  "Later: scan the QR code with your phone or a QR app. Copy the displayed text to your clipboard.",
      },
      {
        num:   "05",
        title: "Restore Your Secret",
        text:  "In the app: paste Part 1, paste Part 2 from clipboard, enter your password — the secret text is fully reconstructed.",
      },
    ],

    securityTitle: "Security",
    securityItems: [
      { icon: "🛡", title: "AES-256-GCM",        text: "Military-grade standard. GCM also ensures the integrity of the ciphertext." },
      { icon: "🔄", title: "PBKDF2 · 250k iter.", text: "Slow key derivation makes brute-force extremely costly." },
      { icon: "💻", title: "100% local",          text: "Web Crypto API. Not a single byte leaves your browser. No server, no logs." },
      { icon: "📖", title: "Open Source",         text: "Code is open. Trust through transparency." },
    ],

    ctaTitle:   "Ready to get started?",
    ctaSubline: "No account. No installation. Right in your browser.",
    ctaBtn:     "Open App →",

    footerPrivacy: "Runs entirely locally in your browser",
    footerImprint: "Imprint",
  },
};

/** Erkennt die initiale Sprache (localStorage → Browser → Deutsch). */
export function detectLang(): Lang {
  try {
    const stored = localStorage.getItem("sv_lang");
    if (stored === "de" || stored === "en") return stored;
  } catch { /* localStorage nicht verfügbar */ }
  return navigator.language.slice(0, 2).toLowerCase() === "de" ? "de" : "en";
}
