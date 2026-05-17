# SecretVault

A browser-based tool for encrypting and splitting secret keys.  
Runs entirely locally — no server, no cloud, no data transmission.

**Live:** [sv.mangolila.at](https://sv.mangolila.at)

---

## Concept

A secret key (API token, password, seed phrase, …) is encrypted with a password and then split into two halves:

- **Part 1** → store on a website, in a repo, or on a server
- **Part 2** → keep yourself (text or QR code)
- **Password** → memorize it

All three components together are required to recover the original key. None of the three parts alone is sufficient.

## Crypto Stack

| Component | Detail |
|---|---|
| Encryption | AES-256-GCM (including integrity check) |
| Key derivation | PBKDF2-SHA256, 250,000 iterations, 16-byte salt |
| IV/Nonce | 12 bytes, randomly generated per encryption |
| Secret splitting | Interleaving — even indices → Part 1, odd → Part 2 |
| Implementation | Web Crypto API (browser-native) |

Encrypted blob binary format: `[Salt 16B][IV 12B][AES-GCM Ciphertext + 16B Tag]` → Base64

## Development

```bash
make install       # Install dependencies
make dev           # Dev server → http://localhost:5173
make test          # Run tests once
make test-watch    # Run tests in watch mode
make build         # Production build → dist/
make clean         # Delete node_modules + dist/
```

## Deploy

```bash
make deploy                              # Build + rsync with default config
make deploy DEPLOY_HOST=user@server      # Specify a different host
```

Defaults in `Makefile`:
```
DEPLOY_HOST = deploy@mangolila.at
DEPLOY_PATH = /var/www/sv.mangolila.at
```

Nginx config: [`nginx/sv.mangolila.at.conf`](nginx/sv.mangolila.at.conf)

## Project Structure

```
src/
  App.tsx              ← Root component, routing, language state
  LandingPage.tsx      ← Landing page (hero, use cases, security, CTA)
  SecretVault.tsx      ← Encryption app
  i18n.ts              ← Translations DE / EN
  theme.ts             ← Color constants
  constants.ts         ← Shared constants (MAX_LEN)
  main.tsx             ← React entry point
  __tests__/
    setup.ts           ← Vitest/jsdom mocks
    SecretVault.test.tsx
nginx/
  sv.mangolila.at.conf ← Nginx config for the subdomain
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
| Language | TypeScript |
| Tests | Vitest + jsdom + Testing Library |
| i18n | Custom solution (no external package) |
| Crypto | Web Crypto API (browser-native, no npm package) |
| QR Code | [qrcode](https://www.npmjs.com/package/qrcode) |