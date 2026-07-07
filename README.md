# Stoppuhr

Eine mobile-first Web-App zum Zeiten-Tracking: Stoppuhr mit Kommentaren,
Verlauf und einem Chart des gleitenden Durchschnitts. Rein statisch
(HTML/CSS/JS, kein Backend, kein Build-Step) und als PWA nutzbar.

## Funktionen

- **Stoppuhr:** Start / Pause / Fortsetzen / Stopp. Beim Stoppen wird die
  gemessene Zeit zusammen mit einem optionalen Kommentar gespeichert.
- **Verlauf:** die letzten 10 Einträge werden angezeigt, mit editierbarem
  Kommentar und Löschen-Funktion (mit Bestätigung).
- **Export/Import:** die komplette Historie kann als `.json`-Datei
  exportiert und auf einem anderen Gerät wieder importiert werden
  (Ersetzen oder Zusammenführen). Alle Einträge liegen in `localStorage`
  und sind an diesen Browser auf diesem Gerät gebunden — der Export ist
  die einzige echte Sicherung.
- **Chart:** Liniendiagramm des gleitenden Durchschnitts über die gesamte
  Historie, mit einem Slider für die Fenstergröße (1–10). Der Chart
  zeichnet erst ab einem vollen Fenster von N Werten.
- **PWA:** lässt sich auf dem Handy zum Startbildschirm hinzufügen und
  startet dank Service Worker auch offline.

## Lokal testen

Da ein Service Worker registriert wird, funktioniert die App nicht über
`file://`. Stattdessen lokal per HTTP-Server ausliefern:

```bash
python -m http.server 8000
```

Danach im Browser öffnen: <http://localhost:8000/>

## Deployment auf GitHub Pages

1. Repo nach `origin` pushen.
2. In den Repo-Settings unter **Pages** die Source auf den `main`-Branch
   (Root) setzen.
3. App ist danach unter `https://axelmarquart.github.io/stopwatch/`
   erreichbar.

Da GitHub Pages die App unter einem Unterpfad ausliefert, sind alle
Pfade in der App bewusst relativ gehalten (`./app.js`, `./manifest.json`
usw.).

## Icons

Die PWA-Icons (`icons/icon-192.png`, `icons/icon-512.png`) wurden einmalig
mit `tools/generate_icons.py` (Pillow) erzeugt. Das Skript ist kein Teil
der Laufzeit-App und muss nur bei Bedarf erneut ausgeführt werden:

```bash
python tools/generate_icons.py
```

## Dateistruktur

```
/
├── index.html
├── style.css
├── app.js
├── manifest.json
├── sw.js            (Service Worker)
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── tools/
    └── generate_icons.py
```
