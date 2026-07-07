# Startprompt für Claude Code — Stoppuhr-Tracking-App

> Diesen gesamten Text in Claude Code einwerfen. Er ist als Spezifikation formuliert, damit möglichst wenig geraten werden muss.

---

Bau mir eine kleine **mobile-first Web-App** zum Zeiten-Tracking. Sie soll **rein statisch** sein (nur HTML/CSS/JS, kein Backend, kein Build-Step), damit ich sie ohne Konfiguration auf **GitHub Pages** deployen und **auf dem Handy** nutzen kann. Entwickeln werde ich am PC, genutzt wird sie am Handy über die Pages-URL bzw. als zum Startbildschirm hinzugefügte App.

## Funktionsumfang

### Stoppuhr
- Buttons: **Start**, **Pause/Fortsetzen** (ein Toggle-Button), **Stopp**.
- State-Machine sauber umsetzen: `idle → running → paused → running → … → stopped`. Pause darf die laufende Zeit nicht verlieren, Fortsetzen zählt korrekt weiter.
- Anzeige der laufenden Zeit gut lesbar, aktualisiert flüssig (z. B. alle 100 ms), Format `mm:ss.cs` (bei >1 h `hh:mm:ss`).
- Zeitmessung über Zeitstempel-Differenz (`performance.now()` oder `Date.now()`), **nicht** über einen hochgezählten Interval-Zähler (der driftet).

### Beim Stoppen: Eintrag mit Kommentar speichern
- Nach **Stopp** erscheint die gemessene Zeit zusammen mit einem **Textfeld für einen Kommentar** und einem **Speichern**-Button (sowie einem **Verwerfen**-Button, falls ich den Lauf doch nicht behalten will).
- Beim Speichern wird ein Eintrag angelegt mit: eindeutiger `id`, `timestamp` (ISO), `durationMs`, `comment` (String, darf leer sein).
- Danach ist die Stoppuhr wieder auf `idle` zurückgesetzt und bereit für den nächsten Lauf.

### Persistenz
- Alle Einträge in **localStorage** speichern (nicht nur die letzten 10 — die vollständige Historie), sodass sie Reload, App-Wechsel und Browser-Neustart überleben.
- **Export-Button:** lädt die komplette Historie als echte `.json`-Datei herunter.
- **Import-Button:** liest eine zuvor exportierte `.json`-Datei über den Datei-Picker wieder ein (als Sicherung / Übertragung auf ein anderes Gerät). Beim Import abfragen, ob ersetzen oder zusammenführen.
- Beachte: localStorage ist an genau diesen Browser auf diesem Gerät gebunden — der Export ist die einzige echte Sicherung. Das im UI dezent erwähnen ist ok, muss aber nicht aufdringlich sein.

### Anzeige der letzten Einträge
- Liste der **letzten 10 Zeiten** (neueste zuerst), jeweils mit Zeit, Kommentar und Zeitstempel.
- Pro Eintrag ein **Löschen-Button** (Papierkorb-Icon o. Ä.). Löschen entfernt den Eintrag aus localStorage und aktualisiert Liste und Chart sofort. Vor dem Löschen kurz bestätigen lassen.
- Der Kommentar eines bestehenden Eintrags soll nachträglich **editierbar** sein (inline).

### Chart: gleitender Durchschnitt
- **Line Chart** des Rolling Average über die gemessenen Zeiten in chronologischer Reihenfolge (über die **gesamte** gespeicherte Historie, nicht nur die letzten 10 — die 10 sind nur für die Liste).
- **Slider** (Wertebereich 1–10) steuert die Fenstergröße des gleitenden Durchschnitts. Chart bei jeder Slider-Änderung reaktiv neu berechnen.
- Randfälle explizit so umsetzen:
  - **Fenster = 1** → gleitender Durchschnitt ist der jeweils rohe Einzelwert (also die Rohkurve).
  - **Weniger Werte vorhanden als die Fenstergröße** (z. B. Fenster 10, aber erst 4 Messungen) → über die vorhandenen Werte mitteln, nicht erst ab dem 10. Wert zu zeichnen beginnen.
- **Chart.js per CDN** einbinden (kein npm/Build). Chart responsiv (`responsive: true`, `maintainAspectRatio: false`), damit er sich der schmalen Handy-Breite anpasst.

## Handy-first UI
- `<meta name="viewport" content="width=device-width, initial-scale=1">` setzen.
- Großzügige Touch-Flächen für Buttons und Slider (Mindesthöhe ~44 px).
- Layout in einer Spalte, ohne horizontales Scrollen, gut bedienbar mit dem Daumen.
- Schlichtes, klares Design; die Stoppuhr-Anzeige darf prominent sein.

## PWA (zum Startbildschirm hinzufügen)
- `manifest.json` mit Name, `display: standalone`, Theme-/Background-Color und Icons (192px + 512px).
- Kleiner **Service Worker**, der die statischen Dateien cached, damit die App auch offline startet.
- **Wichtig für GitHub Pages:** Die App läuft unter einem Unterpfad (`https://<user>.github.io/<repo>/`). Deshalb **alle Pfade relativ** halten (z. B. `./app.js`, `./manifest.json`), **keine absoluten Pfade mit führendem `/`** — sonst brechen Manifest, Service-Worker-Scope und Icons auf Pages. Den Service Worker mit relativem Scope registrieren.

## Technische Randbedingungen
- Vanilla HTML/CSS/JS, eine `index.html`. Kein Framework, kein Bundler, kein Build-Step nötig.
- Nur Chart.js als externe Abhängigkeit, per CDN.
- Sauber kommentierter, verständlicher Code — ich will nachvollziehen können, was passiert.

## Gewünschte Dateistruktur
```
/
├── index.html
├── style.css
├── app.js
├── manifest.json
├── sw.js            (Service Worker)
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

## Zum Schluss
- Kurz erklären, wie ich es **lokal teste** (z. B. `python -m http.server` im Projektordner und im Browser öffnen — wegen Service Worker nicht per `file://`).
- Kurz die Schritte fürs **GitHub-Pages-Deployment** nennen (Repo pushen, in den Settings Pages aktivieren, Quelle = Branch).
