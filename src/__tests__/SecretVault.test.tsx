import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import SecretVault from "../SecretVault";

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,mockQR"),
  },
}));

// Wartet auf App nach Loader (1,9s)
async function waitForApp() {
  await waitFor(() => screen.getByText("🔐 Verschlüsseln"), { timeout: 3500 });
}

// Liest den verschlüsselten Text direkt aus dem OutputRow-Div
function getOutputText(cardTitleText: string): string {
  const card = screen.getByText(cardTitleText).parentElement!;
  return card.querySelector("[style*='break-all']")?.textContent ?? "";
}

// ── Loader ────────────────────────────────────────────────────────────────
describe("Loader", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("zeigt Initialisierungsscreen beim Start", () => {
    render(<SecretVault />);
    expect(screen.getByText("INITIALISIERUNG...")).toBeInTheDocument();
  });

  it("blendet Loader nach 1,9s aus und zeigt App", async () => {
    render(<SecretVault />);
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByText("INITIALISIERUNG...")).not.toBeInTheDocument();
    expect(screen.getByText("🔐 Verschlüsseln")).toBeInTheDocument();
  });
});

// ── Navigation ────────────────────────────────────────────────────────────
describe("Navigation", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(async () => {
    user = userEvent.setup({ delay: null });
    render(<SecretVault />);
    await waitForApp();
  });

  it("startet im Encrypt-Modus", () => {
    expect(screen.getByPlaceholderText("Geheimen Text eingeben...")).toBeInTheDocument();
  });

  it("wechselt zu Decrypt-Modus", async () => {
    await user.click(screen.getByRole("button", { name: "🔓 Entschlüsseln" }));
    expect(screen.getByPlaceholderText("Teil 1 einfügen...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Teil 2 einfügen...")).toBeInTheDocument();
  });

  it("wechselt zurück zu Encrypt-Modus", async () => {
    await user.click(screen.getByRole("button", { name: "🔓 Entschlüsseln" }));
    await user.click(screen.getByRole("button", { name: "🔐 Verschlüsseln" }));
    expect(screen.getByPlaceholderText("Geheimen Text eingeben...")).toBeInTheDocument();
  });

  it("öffnet und schließt Info-Panel", async () => {
    await user.click(screen.getByRole("button", { name: "i" }));
    expect(screen.getByText(/Alles lokal/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "i" }));
    expect(screen.queryByText(/Alles lokal/)).not.toBeInTheDocument();
  });

  it("öffnet Hilfe-Modal", async () => {
    await user.click(screen.getByRole("button", { name: "?" }));
    expect(screen.getByText("◈ TECHNISCHE DOKUMENTATION")).toBeInTheDocument();
  });

  it("schließt Hilfe-Modal über X-Button", async () => {
    await user.click(screen.getByRole("button", { name: "?" }));
    await user.click(screen.getByRole("button", { name: "✕" }));
    expect(screen.queryByText("◈ TECHNISCHE DOKUMENTATION")).not.toBeInTheDocument();
  });
});

// ── Validierung Encrypt ───────────────────────────────────────────────────
describe("Validierung (Encrypt)", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(async () => {
    user = userEvent.setup({ delay: null });
    render(<SecretVault />);
    await waitForApp();
  });

  it("zeigt Fehler bei fehlendem Secret", async () => {
    await user.click(screen.getByRole("button", { name: "VERSCHLÜSSELN & SPLITTEN →" }));
    expect(await screen.findByText("Secret Key fehlt")).toBeInTheDocument();
  });

  it("zeigt Fehler bei leerem Passwort", async () => {
    await user.type(screen.getByPlaceholderText("Geheimen Text eingeben..."), "TestSecret");
    await user.click(screen.getByRole("button", { name: "VERSCHLÜSSELN & SPLITTEN →" }));
    expect(await screen.findByText("Passwort min. 6 Zeichen")).toBeInTheDocument();
  });

  it("zeigt Fehler bei zu kurzem Passwort (< 6 Zeichen)", async () => {
    await user.type(screen.getByPlaceholderText("Geheimen Text eingeben..."), "TestSecret");
    await user.type(screen.getByPlaceholderText("Passwort eingeben..."), "abc");
    await user.click(screen.getByRole("button", { name: "VERSCHLÜSSELN & SPLITTEN →" }));
    expect(await screen.findByText("Passwort min. 6 Zeichen")).toBeInTheDocument();
  });

  it("zeigt Fehler bei zu schwachem Passwort", async () => {
    await user.type(screen.getByPlaceholderText("Geheimen Text eingeben..."), "TestSecret");
    await user.type(screen.getByPlaceholderText("Passwort eingeben..."), "passwort");
    await user.click(screen.getByRole("button", { name: "VERSCHLÜSSELN & SPLITTEN →" }));
    expect(await screen.findByText("Passwort zu schwach")).toBeInTheDocument();
  });

  it("zeigt Fehler bei Überschreitung der 100-Zeichen-Grenze", async () => {
    // fireEvent.change statt type — setzt Wert direkt ohne 101 einzelne Events
    fireEvent.change(screen.getByPlaceholderText("Geheimen Text eingeben..."), {
      target: { value: "A".repeat(101) },
    });
    await user.type(screen.getByPlaceholderText("Passwort eingeben..."), "Sicher!Passwort99");
    await user.click(screen.getByRole("button", { name: "VERSCHLÜSSELN & SPLITTEN →" }));
    expect(await screen.findByText("Max. 100 Zeichen")).toBeInTheDocument();
  });

  it("zeigt Zeichenzähler korrekt an", async () => {
    await user.type(screen.getByPlaceholderText("Geheimen Text eingeben..."), "Hallo");
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});

// ── Validierung Decrypt ───────────────────────────────────────────────────
describe("Validierung (Decrypt)", () => {
  let user: ReturnType<typeof userEvent.setup>;

  // hookTimeout erhöht wegen waitForApp (1,9s Loader)
  beforeEach(async () => {
    user = userEvent.setup({ delay: null });
    render(<SecretVault />);
    await waitForApp();
    await user.click(screen.getByRole("button", { name: "🔓 Entschlüsseln" }));
  }, 10000);

  it("zeigt Fehler wenn beide Teile fehlen", async () => {
    await user.click(screen.getByRole("button", { name: "REKONSTRUIEREN →" }));
    expect(await screen.findByText("Beide Teile benötigt")).toBeInTheDocument();
  });

  it("zeigt Fehler wenn Passwort fehlt", async () => {
    await user.type(screen.getByPlaceholderText("Teil 1 einfügen..."), "Teil1Wert");
    await user.type(screen.getByPlaceholderText("Teil 2 einfügen..."), "Teil2Wert");
    await user.click(screen.getByRole("button", { name: "REKONSTRUIEREN →" }));
    expect(await screen.findByText("Passwort fehlt")).toBeInTheDocument();
  });

  it("zeigt Fehler bei falschem Passwort / fehlerhaften Teilen", async () => {
    await user.type(screen.getByPlaceholderText("Teil 1 einfügen..."), "UngueltigerTeil1");
    await user.type(screen.getByPlaceholderText("Teil 2 einfügen..."), "UngueltigerTeil2");
    await user.type(screen.getByPlaceholderText("Passwort eingeben..."), "IrgendeinPasswort99!");
    await user.click(screen.getByRole("button", { name: "REKONSTRUIEREN →" }));
    expect(
      await screen.findByText("⚠ Falsches Passwort oder fehlerhafte Teile")
    ).toBeInTheDocument();
  });
});

// ── Krypto-Roundtrip ──────────────────────────────────────────────────────
describe("Krypto-Roundtrip", () => {
  it(
    "verschlüsselt und stellt Original korrekt wieder her",
    async () => {
      const user = userEvent.setup({ delay: null });
      render(<SecretVault />);
      await waitForApp();

      const secret = "MeinGeheimesSecret";
      const password = "Sicher!Passwort99XY";

      // Verschlüsseln
      await user.type(screen.getByPlaceholderText("Geheimen Text eingeben..."), secret);
      await user.type(screen.getByPlaceholderText("Passwort eingeben..."), password);
      await user.click(screen.getByRole("button", { name: "VERSCHLÜSSELN & SPLITTEN →" }));

      await waitFor(() => screen.getByText("◈ Teil 1 → Website"), { timeout: 5000 });

      // Teile direkt aus DOM-Struktur lesen (kein Clipboard benötigt)
      const part1 = getOutputText("◈ Teil 1 → Website");
      const part2 = getOutputText("◈ Teil 2 → Text / QR");

      expect(part1.length).toBeGreaterThan(10);
      expect(part2.length).toBeGreaterThan(10);
      expect(part1).not.toBe(part2);

      // Entschlüsseln
      await user.click(screen.getByRole("button", { name: "🔓 Entschlüsseln" }));

      await user.type(screen.getByPlaceholderText("Teil 1 einfügen..."), part1);
      await user.type(screen.getByPlaceholderText("Teil 2 einfügen..."), part2);
      await user.type(screen.getByPlaceholderText("Passwort eingeben..."), password);
      await user.click(screen.getByRole("button", { name: "REKONSTRUIEREN →" }));

      await waitFor(
        () => {
          expect(screen.getByText(secret)).toBeInTheDocument();
          expect(screen.getByText("✓ SECRET KEY WIEDERHERGESTELLT")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    },
    // Erhöhtes Timeout: 2× PBKDF2 (250k Iterationen) + Loader + Typing
    30000
  );
});
