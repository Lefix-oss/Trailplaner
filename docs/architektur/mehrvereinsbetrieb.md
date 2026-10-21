# Trailplaner für mehrere Vereine – was sich ändern muss

Stand: 21.10.2026 · Status: **nur dokumentiert, nicht umgesetzt**. Zuerst wird die aktuelle Version für den HSV Giebelstadt fertiggestellt.

## Ziel

Der Trailplaner soll später als kostenpflichtige Anwendung für mehrere Hundesportvereine angeboten werden:

- Jeder Verein hat eigene Benutzerkonten.
- Eine gültige Lizenz wird auf dem Server geprüft.
- Die Daten der Vereine sind strikt voneinander getrennt.

## Heutiger Stand

| Bereich | Heute |
|---|---|
| Auslieferung | Eine statische Datei `index.html` über GitHub Pages, Apps Script als Rückfallebene |
| Server | keiner |
| Daten | im Browser (`localStorage`) und als JSON-Datei auf dem Laptop (Format `trailplaner-pruefung`, Version 1) |
| Konten, Lizenz | keine; wer die Adresse kennt, kann die App nutzen |
| Vereinsbezug | fest auf den HSV Giebelstadt: Logo-SVG im Kopf von `index.html` und Objekt `CLUB` (Name, Kurzname, Kartenmitte) |
| Kartendaten | öffentliche Overpass-Server (OpenStreetMap), Esri-Kacheln, OSM-Kacheln |

**Was den Umbau schon jetzt erleichtert:**

- Die Planungslogik (`Planner`) und die Prüfungslogik (`Pruefung`) sind frei von DOM-Code und mit Node getestet. Sie lassen sich unverändert in ein Modul oder auf einen Server übernehmen.
- Das Dateiformat hat eine Kennung und eine Versionsnummer und kann deshalb später importiert und migriert werden.
- Die vereinsbezogenen Angaben stehen gesammelt in `CLUB` und nicht mehr verstreut im Code. Nur das Logo-SVG im HTML-Kopf ist noch fest eingebaut.

## Zielbild

```
Browser (App)  ──HTTPS + Anmeldung──▶  API-Server  ──▶  Datenbank (je Zeile mit verein_id)
   │                                      │
   └── Kartenkacheln ◀── Kachel-Anbieter   ├──▶ Lizenz/Abo (Zahlungsanbieter, Webhooks)
                                          └──▶ OSM-Daten (eigener Overpass oder Anbieter, mit Cache)
```

- **App:** bleibt eine Web-App, wird aber aus mehreren Modulen gebaut statt aus einer einzigen Datei, mit einem Build-Schritt. `Planner` und `Pruefung` werden eigene Module.
- **API-Server:** übernimmt Anmeldung, Lizenzprüfung, Speichern und Laden der Vereinsdaten und den Zugriff auf OSM-Daten.
- **Datenbank:** eine gemeinsame Datenbank, in der jede Tabelle eine Spalte `verein_id` hat, abgesichert durch Zugriffsregeln auf Zeilenebene (Row-Level-Security). Alternativ eine Datenbank je Verein. Das ist teurer, aber noch strenger getrennt.

## 1. Benutzerkonten

- **Anmeldung:** über einen etablierten Anbieter (zum Beispiel Auth0, Keycloak oder Supabase Auth) statt einer selbst gebauten Passwortverwaltung. Unterstützt werden E-Mail mit Link oder Passwort, optional mit zweitem Faktor für Vereinsadmins.
- **Rollen je Verein:**
  - **Vereinsadmin:** Lizenz, Mitglieder einladen, Vereinsdaten und Logo
  - **Prüfungsleitung/Trainer:** Trails planen, abhaken, zuteilen, Bögen drucken
  - **Lesend:** Bögen und Pläne ansehen, zum Beispiel Richter oder Trailleger
- **Einladungen:** Der Vereinsadmin lädt per E-Mail ein. Eine Person kann mehreren Vereinen angehören, die Rolle gilt dann je Verein.
- **Sitzungen:** kurzlebige Zugriffstoken, die der Server bei jedem Aufruf prüft. Die App speichert keine Passwörter.

## 2. Lizenzprüfung auf dem Server

- **Die Lizenz gehört zum Verein**, nicht zur Person. Sie umfasst Status (aktiv, Testphase, abgelaufen, gesperrt), Laufzeit und gegebenenfalls Grenzen wie die Zahl der Konten.
- **Geprüft wird nur auf dem Server**, bei jedem Aufruf, der Daten liest oder schreibt. Eine Prüfung im Browser lässt sich umgehen und taugt höchstens für Hinweise in der Oberfläche.
- **Abrechnung über einen Zahlungsanbieter** (zum Beispiel Stripe oder Paddle). Der Lizenzstatus wird über dessen Webhooks aktualisiert, nicht über Angaben aus dem Browser.
- **Verhalten bei abgelaufener Lizenz:**
  - Vorhandene Pläne bleiben lesbar und als Datei exportierbar. Ein Verein darf am Prüfungstag nicht ausgesperrt werden.
  - Neue Planungen sind gesperrt.
  - Eine Kulanzfrist ist eine noch offene Entscheidung.
- **Ohne Internet am Prüfungstag:** Der zuletzt geladene Prüfungsstand bleibt im Browser nutzbar, wie heute. Lizenz und Speichern werden erst wieder geprüft, wenn eine Verbindung besteht.

## 3. Getrennte Vereinsdaten

**Datenmodell (Entwurf):**

| Tabelle | Inhalt | Schlüssel |
|---|---|---|
| `verein` | Name, Kurzname, Logo, Standard-Kartenmitte (heute `CLUB`) | `id` |
| `mitgliedschaft` | Person ↔ Verein, Rolle | `verein_id`, `person_id` |
| `lizenz` | Status, Laufzeit, Zahlungsanbieter-ID | `verein_id` |
| `pruefung` | Ort, Mitte, Einstellungen, Datum (heute die Kopfdaten des Exam-Objekts) | `id`, `verein_id` |
| `trail` | Schnappschuss: Stufe, Punkte, Länge, Kennzahlen, Verlauf, Straßen, Häkchen, Schwierigkeitshinweis | `id`, `verein_id`, `pruefung_id` |
| `teilnehmer` | Teams (Hundeführer, Hund, Stufe) und Versteckpersonen | `id`, `verein_id`, `pruefung_id` |
| `zuteilung` | Trail ↔ Team ↔ Versteckperson | `verein_id`, `pruefung_id`, `trail_id` |

**Regeln:**

- Jede Abfrage filtert serverseitig nach der `verein_id` aus dem Token, nie nach einer ID, die der Browser mitschickt. Zusätzlich gilt Row-Level-Security in der Datenbank als zweite Sicherung.
- Logos und Dateien liegen je Verein in einem eigenen Speicherbereich.
- **Import:** Die heutigen JSON-Dateien (Format `trailplaner-pruefung`, Version 1) werden beim Hochladen in diese Tabellen übernommen.
- Ein Export als Datei bleibt erhalten, als Sicherung und für den Offline-Betrieb.

## 4. Datenschutz (DSGVO)

- Namen von Hundeführern, Hunden und Versteckpersonen sind personenbezogene Daten.
- Nötig sind dafür:
  - eine Auftragsverarbeitung (AVV) mit jedem Verein
  - Hosting in der EU
  - ein Lösch- und Aufbewahrungskonzept, zum Beispiel Teilnehmerdaten n Monate nach der Prüfung löschen
  - eine Auskunfts- und Exportfunktion
- Echte Namen gehören weiterhin nicht in das Code-Repository. Tests verwenden erfundene Namen.

## 5. Kartendaten und Lizenzen von Drittanbietern

Für einen kostenpflichtigen Dienst reicht die heutige kostenlose Nutzung nicht. Das muss vor dem Start geklärt sein:

- **Overpass:** Die öffentlichen Server sind für gelegentliche Abfragen gedacht und häufig überlastet. Das hat sich am 21.10.2026 gezeigt. Gebraucht wird ein eigener Overpass-Server oder ein kommerzieller Anbieter, dazu ein Zwischenspeicher je Ort auf dem Server.
- **Kartenkacheln:** Die Richtlinie der OSM-Kachelserver untersagt intensive, kommerzielle Nutzung. Die Nutzungsbedingungen der Esri-Kacheln, auch für das Luftbild auf den Prüfungsbögen, müssen für kommerzielle Nutzung geprüft werden. In Frage kommen ein kommerzieller Kachelanbieter (zum Beispiel MapTiler oder Stadia) oder amtliche Luftbilder (Bayern: DOP über die Bayerische Vermessungsverwaltung, mit Lizenzbedingungen).
- **Quellenangaben** (OpenStreetMap, Luftbildanbieter) bleiben in der App und auf den Bögen Pflicht.

## 6. Nötige Änderungen am Code (Reihenfolge)

1. **Vereinsangaben auslagern:** Das Logo-SVG aus dem HTML-Kopf ins `CLUB`-Objekt verschieben und `CLUB` später vom Server laden.
2. **In Module aufteilen:** Build-Schritt einführen, zum Beispiel Vite. Daraus entstehen die Module `planner`, `pruefung`, `karte`, `ui` und `drucken`. Die bestehenden Node-Tests laufen weiter.
3. **Speicher-Schicht:** Die heutigen direkten Aufrufe von `localStorage` und Datei-Download hinter einer Schnittstelle bündeln, also `speichern(exam)` und `laden()`. Erst lokal umgesetzt, später über die API.
4. **API und Datenbank** mit Mandantentrennung, Anmeldung und Rollen.
5. **Lizenzprüfung** und Anbindung des Zahlungsanbieters.
6. **Kartendaten** über den eigenen Server oder einen lizenzierten Anbieter.
7. **Import** der vorhandenen JSON-Dateien; Datenschutzunterlagen.

## Offene Entscheidungen

- Preismodell: je Verein und Jahr, gestaffelt nach Mitgliederzahl oder nach Prüfungen
- Hosting-Anbieter in der EU
- Eine gemeinsame Datenbank mit Row-Level-Security oder eine Datenbank je Verein
- Kulanzfrist und Verhalten bei abgelaufener Lizenz
- Luftbildquelle für die Prüfungsbögen
