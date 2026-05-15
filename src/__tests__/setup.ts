import "@testing-library/jest-dom";
import { vi } from "vitest";

// Clipboard API mocken (jsdom unterstützt sie nicht nativ)
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(""),
  },
  writable: true,
  configurable: true,
});

// Sprache auf Deutsch fixieren — Tests prüfen deutsche Texte
Object.defineProperty(navigator, "language", {
  value: "de-AT",
  writable: true,
  configurable: true,
});

// qrcode (npm) wird in Tests via vi.mock gemockt — kein globaler window-Mock nötig