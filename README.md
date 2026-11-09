# Nachtwache mit Tanja 🌙

Eine kleine, ruhige Begleiterin für Tanjas Nachtdienst: kurze Gesprächsfragen,
kuriose Fakten, harmlose Witze, „Würdest du eher …?“, eine Wortkette,
persönliche Aufmunterungen und ein optionaler Check-in „Wie läuft’s gerade?“.

**Technik:** Progressive Web-App (PWA) aus reinem HTML, CSS und JavaScript –
ohne Build-Schritt und ohne Bibliotheken. Sie läuft in Chrome auf Android, lässt
sich auf den Startbildschirm legen und funktioniert danach auch offline.
Es werden keine Daten gesendet; Einstellungen und eigene Aufmunterungen liegen
nur im Speicher des Handys (localStorage).

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Aufbau der Seite |
| `styles.css` | Dunkles Nacht-Design, große Schaltflächen |
| `app.js` | Logik (Zufall, Spiele, Check-in, Einstellungen) |
| `inhalte.js` | Fragen, Fakten, Witze, Spiele, Check-in-Antworten |
| `aufmunterungen.js` | **Deine persönlichen Texte für Tanja** + Absendername |
| `sw.js` | Offline-Speicher (Service Worker) |
| `manifest.webmanifest` | Name, Farben und Icons für „Zum Startbildschirm“ |
| `icons/` | App-Icon (Mondsichel mit „T“) |
| `werkzeuge/icons-erzeugen.js` | Erzeugt die PNG-Icons neu |
| `start.command` | Startet die App lokal auf dem Mac (Doppelklick) |

## Auf dem Mac ausprobieren

Doppelklick auf `start.command` – oder im Terminal:

```bash
python3 -m http.server 8091 --bind 127.0.0.1
```

Dann `http://127.0.0.1:8091` öffnen.

## Auf dem Android-Handy testen (per USB, ohne Internet-Veröffentlichung)

1. Am Handy die Entwickleroptionen und **USB-Debugging** einschalten, Handy per USB anschließen.
2. Auf dem Mac die App starten (siehe oben) und dann:
   ```bash
   ~/android-werkzeuge/sdk/platform-tools/adb reverse tcp:8091 tcp:8091
   ```
3. Am Handy in Chrome `http://localhost:8091` öffnen.
4. Chrome-Menü ⋮ → **„Zum Startbildschirm hinzufügen“** bzw. **„App installieren“**.

## Aufmunterungen und Inhalte ändern

- Persönliche Texte in `aufmunterungen.js` eintragen (je ein Text in Anführungszeichen, mit Komma).
- Tanja kann auch selbst in der App unter ⚙ eigene Aufmunterungen speichern.
- Nach jeder Änderung in `sw.js` die Versionsnummer erhöhen (`nachtwache-tanja-v1` → `-v2`). Neue Texte erscheinen auf dem Handy beim übernächsten Öffnen der App (erst wird im Hintergrund geladen).

> **Datenschutz:** Liegt das Projekt in einem **öffentlichen** GitHub-Repository
> (z. B. für GitHub Pages), kann jeder `aufmunterungen.js` lesen. Sehr Persönliches
> dann lieber in der App unter ⚙ eintragen – das bleibt nur auf Tanjas Handy.

## Icons neu erzeugen

```bash
~/android-werkzeuge/node/bin/node werkzeuge/icons-erzeugen.js
```

## Mit GitHub weiterführen

Das Projekt ist ein lokales Git-Repository. Ein Remote ist noch **nicht** eingerichtet.
Privates Repository anlegen und hochladen (erst, wenn du es willst):

```bash
gh repo create nachtwache-tanja --private --source . --push
```

Damit Tanja die App ohne USB-Kabel über das Internet installieren kann, braucht
es HTTPS-Hosting, z. B. GitHub Pages. Pages aus einem privaten Repository
erfordert einen bezahlten GitHub-Plan; mit kostenlosem Konto müsste das Repository
öffentlich sein (Datenschutz-Hinweis oben beachten).
