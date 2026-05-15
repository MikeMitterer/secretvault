# SecretVault

Browser-basiertes Werkzeug zum Verschlüsseln und Splitten von Secret Keys.
Kein Server, keine Datenübertragung — alles läuft lokal über die Web Crypto API.

## Kernidee

Secret Key + Passwort → AES-256-GCM Ciphertext → zwei Teile (Interleaving)

- **Teil 1** → wird z. B. auf einer Website gespeichert
- **Teil 2** → bleibt beim Besitzer (Text oder QR-Code)
- **Passwort** → muss auswendig gemerkt werden

Alle drei Faktoren zusammen sind nötig, um den Original-Key wiederherzustellen.

## Krypto-Stack

| Komponente        | Detail                                             |
|-------------------|----------------------------------------------------|
| Verschlüsselung   | AES-256-GCM (mit Integritätsprüfung)               |
| Schlüsselableitung| PBKDF2-SHA256, 250.000 Iterationen, 16 Byte Salt   |
| IV/Nonce          | 12 Byte, pro Verschlüsselung neu zufällig generiert |
| Secret Splitting  | Interleaving: Index gerade → Teil 1, ungerade → Teil 2 |

### Binärformat des Encrypted Blob

```
[Salt 16B][IV 12B][AES-GCM Ciphertext + 16B Tag] → Base64-String
```

## Dateistruktur

```
src/
  SecretVault.tsx          ← Hauptkomponente
  main.tsx                 ← React-Einstiegspunkt (Dev/Build)
  __tests__/
    setup.ts               ← Vitest/jsdom Mocks
    SecretVault.test.tsx   ← Integrations- und Unit-Tests
index.html
package.json
vite.config.ts
Makefile
```

## Komponenten (alle in der TSX-Datei)

| Komponente    | Aufgabe                                                    |
|---------------|------------------------------------------------------------|
| `SecretVault` | Hauptkomponente, State-Management, Encrypt/Decrypt-Flows   |
| `Loader`      | Splash-Screen beim Start (1,9 s)                           |
| `PwField`     | Passwort-Input mit Sichtbarkeits-Toggle                    |
| `StrengthBar` | Passwort-Stärke-Indikator (4 Stufen: Schwach → Sehr Stark) |
| `QRModal`     | QR-Code Anzeige + Download (qrcodejs, lazy via CDN geladen)|
| `HelpModal`   | Technische Dokumentation                                   |
| `Card`, `CardTitle`, `BtnPrimary`, `BtnSecondary`, `OutputRow`, `Warning` | UI-Primitives |

## Einschränkungen / Bekannte Grenzen

- **Max. 100 Zeichen** für den Secret Key (Eingabe)
- **Passwort min. 6 Zeichen**, Stärke mind. „MITTEL" nötig
- **QR-Code** benötigt Internet (qrcodejs von cdnjs.cloudflare.com)
- **iOS**: Kein direkter QR-Download — Long-Press-Hinweis wird angezeigt
- **Keine Typen**: Die TSX-Datei enthält kein TypeScript — `noImplicitAny: false`, `checkJs: false`

## Entwicklung

```bash
make install       # npm-Abhängigkeiten installieren
make dev           # Dev-Server starten → http://localhost:5173
make test          # Tests einmalig ausführen
make test-watch    # Tests im Watch-Modus
make build         # Production Build
make clean         # node_modules + dist löschen
```

## Tests

Tests laufen mit **Vitest + jsdom + @testing-library/react**.

Abgedeckte Bereiche:
- Loader-Verhalten (Fake-Timer)
- Tab-Navigation (Encrypt ↔ Decrypt)
- Validierungsfehler (fehlendes Secret, schwaches Passwort, Zeichenlimit)
- Info- und Hilfe-Modals
- Krypto-Roundtrip: Verschlüsseln → Teile extrahieren → Entschlüsseln → Original verifizieren

## Externe Abhängigkeiten

| Lib        | Einbindung      | Zweck                    |
|------------|-----------------|--------------------------|
| qrcode     | npm             | QR-Code Rendering        |
| React 18   | npm             | UI-Framework             |
| Web Crypto | Browser-nativ   | AES-GCM, PBKDF2, Random  |