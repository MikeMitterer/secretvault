# SecretVault

Browser-basiertes Werkzeug zum Verschlüsseln und Aufteilen von Secret Keys.  
Läuft vollständig lokal — kein Server, keine Cloud, keine Datenübertragung.

**Live:** [sv.mangolila.at](https://sv.mangolila.at)

---

## Idee

Ein Secret Key (API-Token, Passwort, Seed Phrase, …) wird mit einem Passwort verschlüsselt und anschließend in zwei Hälften aufgeteilt:

- **Teil 1** → auf einer Website, im Repo oder Server ablegen
- **Teil 2** → selbst behalten (Text oder QR-Code)
- **Passwort** → auswendig merken

Alle drei Teile zusammen sind nötig, um den Original-Key wiederherzustellen. Keine der drei Komponenten allein ist wertlos.

## Krypto-Stack

| Komponente | Detail |
|---|---|
| Verschlüsselung | AES-256-GCM (inkl. Integritätsprüfung) |
| Schlüsselableitung | PBKDF2-SHA256, 250.000 Iterationen, 16 Byte Salt |
| IV/Nonce | 12 Byte, pro Verschlüsselung zufällig neu generiert |
| Secret Splitting | Interleaving — gerade Indizes → Teil 1, ungerade → Teil 2 |
| Implementierung | Web Crypto API (browser-nativ) |

Binärformat des Encrypted Blob: `[Salt 16B][IV 12B][AES-GCM Ciphertext + 16B Tag]` → Base64

## Entwicklung

```bash
make install       # Abhängigkeiten installieren
make dev           # Dev-Server → http://localhost:5173
make test          # Tests einmalig ausführen
make test-watch    # Tests im Watch-Modus
make build         # Production Build → dist/
make clean         # node_modules + dist/ löschen
```

## Deploy

```bash
make deploy                              # Build + rsync mit Default-Konfiguration
make deploy DEPLOY_HOST=user@server      # Anderen Host angeben
```

Standardwerte in der `Makefile`:
```
DEPLOY_HOST = deploy@mangolila.at
DEPLOY_PATH = /var/www/sv.mangolila.at
```

Nginx-Konfiguration: [`nginx/sv.mangolila.at.conf`](nginx/sv.mangolila.at.conf)

## Projektstruktur

```
src/
  App.tsx              ← Root-Komponente, Routing, Language-State
  LandingPage.tsx      ← Landingpage (Hero, Use Cases, Sicherheit, CTA)
  SecretVault.tsx      ← Verschlüsselungs-App
  i18n.ts              ← Übersetzungen DE / EN
  theme.ts             ← Farb-Konstanten
  constants.ts         ← Geteilte Konstanten (MAX_LEN)
  main.tsx             ← React-Einstiegspunkt
  __tests__/
    setup.ts           ← Vitest/jsdom Mocks
    SecretVault.test.tsx
nginx/
  sv.mangolila.at.conf ← Nginx-Konfiguration für die Subdomain
index.html
package.json
vite.config.ts
Makefile
```

## Tech Stack

| | |
|---|---|
| Framework | React 18 |
| Build | Vite |
| Sprachen | TypeScript |
| Tests | Vitest + jsdom + Testing Library |
| i18n | Eigene Lösung (kein externes Paket) |
| Krypto | Web Crypto API (browser-nativ, kein npm-Paket) |
| QR-Code | [qrcode](https://www.npmjs.com/package/qrcode) |
