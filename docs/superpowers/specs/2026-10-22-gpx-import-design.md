# GPX-Trailimport – Konzept

Stand: 22.10.2026 · Status: **abgestimmt, noch nicht umgesetzt** · baut auf `2026-10-21-mehrere-orte-design.md` und `2026-10-22-trails-in-reihe-design.md` auf

## Worum es geht und warum

Die Mantrailing-Trainerin des Vereins sucht die Prüfungstrails selbst aus und plant sie extern in **Mapy.com**. Sie exportiert jeden Trail als GPX-Datei. Der Trailplaner soll diese Trails einlesen, nach den PO-Regeln prüfen, zu einer Kette ordnen und als Prüfungsstand übernehmen, damit Speichern, Zuteilung, Bögen und WhatsApp-Texte wie bei automatisch geplanten Trails funktionieren. Der Import ist eine **zusätzliche** Planungsmöglichkeit. Die automatische Planung bleibt unverändert.

Anlass: Prüfung am 31.10.2026. Als Muster liegen acht Mapy-Dateien der Trainerin vor (`testdaten/`, nicht im Repository): sieben MT-I, eine MT-II.

## Ziele

- Mehrere GPX-Dateien auf einmal einlesen (Drag-and-drop oder Dateiauswahl) und ohne weitere Eingaben auswerten: Länge, Stufe, Ort, Wegenetz-Zuordnung, PO-Prüfung, Kette, Nummern, Farben.
- Ergebnis auf der Karte als Vorschau zeigen. Erst „Übernehmen“ legt den Prüfungsstand an.
- Importierte Trails verhalten sich danach wie geplante Trails (Speichern, Öffnen, Häkchen, Zuteilung, Bögen, WhatsApp).
- **Die importierten Strecken werden nie verändert.** Gespeichert, gezeichnet und gedruckt wird die GPX-Linie.

## Nicht-Ziele

- Keine Bearbeitung von Strecken, kein Zeichnen, kein Zuschneiden oder Verschieben.
- Keine neuen Trails erzeugen und keine Trails „reparieren“.
- Kein GPX-Export-Ersatz (der Einzel-Export bleibt wie er ist).
- Kein Import im Trainingsmodus.
- Kein Upload. Dateien werden nur im Browser gelesen.
- Keine Ortschaften aus den GPX-Dateien anlegen: der Ort muss in der Ortsliste stehen.
- Keine Mehrbenutzer- oder Kontenfunktionen.

## Anti-Ziele

- Ein stillschweigend geänderter Trail oder eine veränderte Länge.
- Eine Datei, die Skript in die Seite bringt oder die App einfrieren lässt.
- Ein Import, der still Trails weglässt. Jede Datei erscheint im Ergebnis, auch wenn sie durchfällt.

## Entscheidungen des Nutzers

- Die acht Dateien sind ein **fester Satz**, den die Trainerin ausgewählt hat. Konflikte und durchgefallene Trails werden **gemeldet, nicht aussortiert**. Der Nutzer entscheidet.
- Alle Trails werden geführt, auch wenn Zahlen nicht aufgehen (bisherige Regel, gilt für Zuteilung und Bögen).
- Der Import ist zusätzlich. Bestehende Regeln, Funktionen und Datenstrukturen werden wiederverwendet.
- Die Bedienung ist möglichst einfach und weitgehend automatisch.

## Entscheidungen im Konzept (Vorschläge, vom Nutzer bestätigt: „passt so“)

- Nur im Prüfungsmodus, weil dort die Kette existiert.
- Alle Trails stehen im Ergebnis standardmäßig auf „übernehmen“, auch rote. Einzelne lassen sich abwählen.
- „Ersetzen“ ist bei importierten Trails gesperrt. Stattdessen neu importieren.
- MT-III bleibt technisch möglich (Länge 1000 m ± 10 %).
- Es gilt die Einstellung „Abstand zwischen Trails“.

## Verhalten

### Ablauf

1. Schaltfläche **„Import Trails“** im Prüfungsmodus öffnet ein Fenster mit Ablagefläche und Dateiauswahl.
2. Jede Datei wird gelesen (siehe „Einlesen“). Sofort danach läuft die Auswertung. Es gibt keine weiteren Eingaben.
3. Das Fenster zeigt eine Liste mit einer Zeile je Datei: Name, Länge, Stufe, Ort, Status (✓, ⚠ oder ✕) mit Gründen, ein Häkchen „übernehmen“ (standardmäßig an).
4. Darunter die Zusammenfassung der Kette je Ort („Kette ohne Lücke“, „Kette mit N Lücken“) und eine Liste der Konflikte (Trails näher als der eingestellte Mindestabstand).
5. Die Karte zeigt die Kette mit Nummern und Farben, dazu die gestrichelten Fußwege. Das ist dieselbe Darstellung wie bei geplanten Trails.
6. **„Übernehmen“** friert den Prüfungsstand ein (wie nach „Trails planen“): ab dann Zuteilung, Bögen, Speichern wie bisher. **„Verwerfen“** schließt das Fenster ohne Änderung.
7. Gibt es schon einen Prüfungsstand, fragt die App vor dem Übernehmen, ob er ersetzt werden soll (wie bei „Trails planen“).

### Einlesen

- Formate: GPX 1.1 mit `trk`/`trkseg`/`trkpt` und `rte`/`rtept`. Waypoints (`wpt`) werden ignoriert. Mehrere Segmente einer Datei werden zu einer Linie verbunden.
- Übernommen werden **nur Breite und Länge**. Höhe, Zeit, Gerät und andere Felder werden verworfen. Der Name der Strecke (`name`) wird nur als Text angezeigt, nie als HTML.
- Grenzen (Schutz vor großen oder kaputten Dateien): höchstens 1 MB je Datei, 50 Dateien, 5000 Punkte je Strecke, Koordinaten müssen Zahlen im gültigen Bereich sein, mindestens 2 Punkte. Eine Datei, die dagegen verstößt, erscheint als ✕ mit Grund und wird nicht ausgewertet.
- Parsen mit einem **kleinen eigenen Leser** in `Pruefung` (DOM-frei, mit Node testbar, siehe „Ergänzungen nach dem Konzept-Check“), nicht mit `DOMParser`. Kein `innerHTML` mit Dateiinhalten.

### Länge und Stufe

- Länge = Summe der Abstände entlang der **GPX-Linie**, nicht die Länge der zugeordneten Wegabschnitte. (Im Muster: 613 m laut GPX, 582 m nach Zuordnung.)
- Stufe nach den hinterlegten Sollwerten und der Toleranz `LENGTH_TOL` (±10 %): MT-I 270–330 m, MT-II 540–660 m, MT-III 900–1100 m. Die Bereiche überlappen nicht. Liegt die Länge in keinem Bereich, erscheint ✕ „Länge passt zu keiner Stufe“ (Trail bleibt in der Liste, Stufe = „?“, nicht übernehmbar; dem Nutzer wird gesagt warum).
- Die Stufe entscheidet allein die Länge. Ein Trail wird nie in eine andere Stufe herabgestuft, wenn er die Regeln seiner Stufe nicht erfüllt.

### Ort

- Jeder Trail wird dem Ort zugeordnet, dessen Suchkreis (Mitte + Radius, Ortsliste) Start **und** Ziel enthält. Mehrere Treffer: der Ort mit der nächsten Mitte zum Start.
- Liegt kein Ort passend: ✕ „außerhalb aller Orte der Ortsliste: Ort hinzufügen oder Radius vergrößern“. Der Trail kann ohne Wegenetz nicht geprüft werden und wird nicht übernommen.
- Gelände, Radius und Schalter (Fuß-/Feldwege, Rückannäherung, Streng) gelten wie bei der Planung für den Ort.

### Zuordnung zum Wegenetz (neu, Kern)

Die vorhandenen Regeln arbeiten mit Wegabschnitten (`G.segs`) und Knoten, nicht mit Linien. Jede GPX-Linie wird deshalb den Abschnitten zugeordnet. Das Ergebnis dient **nur der Prüfung und der Wegbeschreibung**, nie der Darstellung.

Prototyp (Wegwerf-Skript, an den acht Mustern erprobt, alle ohne Fehler): Die Linie wird alle 3 m verdichtet, jeder Punkt am nächsten Wegstück (`snapEdge` im Fußweg-Graphen) angelegt, aufeinanderfolgende Punkte desselben Abschnitts werden zu einem Bein (`seg`, `fwd`, `d0`, `d1`) zusammengefasst. Kurze Zwischenstücke unter 8 m (Sprünge an Kreuzungen) fallen weg, Mittel­beine laufen über die volle Abschnittslänge, Anfang und Ende dürfen mitten im Abschnitt liegen. Die so entstandene Beinfolge geht in `Planner.validate` wie bei einem geplanten Trail.

- **Genauigkeit im Muster:** Bei fünf von acht Dateien liegen alle Punkte höchstens 0,5 m neben einem Weg. Bei den übrigen verläuft ein Teil auf Wegen, die im OSM-Auszug anders oder nicht vorhanden sind (Datei 4: 21 von 106 Punkten mehr als 5 m daneben, bis 44 m; Datei 7: 11 von 214, bis 32 m) oder Start und Ziel liegen auf freien Koordinaten (Datei 1: Ziel 20 m neben dem Weg).
- **Befund „nicht sicher zugeordnet“** (⚠): Wenn mehr als 10 % der Linie weiter als 10 m neben bekannten Wegen liegt. Die PO-Prüfung läuft trotzdem, ihr Ergebnis ist dann ausdrücklich unsicher (Richtungswechsel und Entscheidungsstellen hängen an der Zuordnung). Der Trail bleibt übernehmbar. *(Schwellen sind die Annahme des Konzepts, sie lassen sich in der Umsetzung an den Mustern nachjustieren.)*
- Geht die Zuordnung gar nicht (zu wenige Punkte auf Wegen, Beinfolge nicht zusammenhängend): ✕ „Strecke lässt sich nicht auf das Wegenetz legen“. Der Trail wird nicht geprüft, bleibt aber in der Liste und lässt sich abwählen oder trotzdem übernehmen (Prüfung dann „nicht möglich“).
- **Start und Ziel** werden nicht verschoben. Die Abholregel (befahrbare Straße höchstens 30 m vom Ziel) prüft den echten GPX-Endpunkt. Im Muster fällt Datei 6 daran durch, weil Mapy dort eine freie Koordinate als Ziel hat. Das bleibt so und wird verständlich begründet.

### Regelprüfung

- Alle Prüfungen von `Planner.validate` im Prüfungsmodus (inkl. Kreisverkehr und Bundes-/Staatsstraße), aber die **Längenprüfung nimmt die GPX-Länge** (siehe oben). Anzeige wie bisher als „Regelprüfung: x von y Punkten“ mit weichem Hinweis auf zusätzliche Entscheidungsstellen.
- Status je Trail: ✓ alle Pflichtregeln erfüllt, ⚠ erfüllt aber mit Hinweis (weiches Ziel oder nicht sicher zugeordnet), ✕ mindestens eine Pflichtregel verletzt oder nicht prüfbar.
- Der Abstand zwischen Trails nutzt `compatible` mit dem eingestellten Mindestabstand (auch über Ortsgrenzen hinweg). Konflikte werden als Liste „Trail A und B nur X m auseinander“ gezeigt, nicht aufgelöst. (Im Muster bei 30 m: Datei 4/5 mit 26 m, Datei 6 / „export“ mit 16 m, Datei 1 / „export“ genau 30 m.)

### Kette

- Wiederverwendet wird `Planner.chain` im Modus **„fest“**: Sie darf nichts würfeln, nur ordnen. Reihenfolge der Stufen wie bisher (MT-I, MT-II, MT-III), je Ort eine Kette. Innerhalb einer Stufe wählt sie die Reihenfolge mit den wenigsten Lücken. Übergang 75–250 m Fußweg und mindestens 75 m Luftlinie, Fußwege meiden spätere Trails, wie im Konzept „Trails in Reihe“.
- **Im Modus „fest“ gilt:** keine neuen Kandidaten (`nearList` erzeugt nichts), alle importierten Trails werden verwendet (auch bei Konflikten untereinander), die Rückfallstufe „ohne Kette“ ordnet nur nach Stufe und Dateireihenfolge. Konflikte zwischen den Trails verhindern die Kette nicht.
- Lücken werden angezeigt und nicht behoben. Der Nutzer erfährt „Kette mit N Lücken“.
- Nummern und Farben ergeben sich aus der Reihenfolge, wie bisher. Bei mehreren Orten folgen die Ketten in der Reihenfolge der Ortsliste.

### Speichern und Weiterverwendung

- Der eingefrorene Trail speichert `ll` = **die GPX-Linie unverändert** (dieselbe Genauigkeit wie die Eingabe), dazu Länge laut GPX, Stufe, Kennzahlen aus der Zuordnung (Richtungswechsel, zusätzliche Entscheidungsstellen, Kreuzungen), die abgeleitete Wegbeschreibung (`steps`) und die Straßennamen an Start und Ziel. Neu: `imported: true` und optional `name` (Text aus der GPX-Datei).
- Dateiformat bleibt Version 2. Die neuen Felder sind optional, alte Dateien öffnen wie bisher, neue Dateien öffnen in der aktuellen Version. Beim Öffnen wird `imported` als Wahrheitswert und `name` als Text geprüft (V1.7-Importprüfung).
- Die Wegbeschreibung gilt als ungefähr (aus der Zuordnung abgeleitet). Auf dem Bogen und in der Trailkarte erscheint ein Hinweis „importiert“.
- Zuteilung, Bögen, WhatsApp, Häkchen, Kette (Fußwege und Lücken) funktionieren unverändert. Sie arbeiten mit `ll` und `link`.

### Ersetzen und Neuplanen

- „Ersetzen“ ist bei importierten Trails deaktiviert, Hinweis „importierter Trail: neu importieren“.
- „Nur Ort … neu planen“ würfelt neue Trails. Enthält der Ort importierte Trails, fragt die App vorher ausdrücklich, dass die importierten Trails verworfen werden.
- „Trails planen“ ersetzt wie bisher den ganzen Prüfungsstand.

## Wiederverwendung und Änderungen am Code (Überblick)

- **Neu:** GPX-Leser, Zuordnung zum Wegenetz, Auswertung je Datei, Dialog, Vorschau mit „Übernehmen“.
- **Angepasst:** `Planner.validate` (Länge aus Vorgabe), `Planner.chain` (Modus „fest“), `drawPlan`/`renderResults`/`snapshot` (zeichnen und speichern die Originallinie statt der Beinfolge), `parseExam` (optionale Felder), Trailkarte und Bogen (Hinweis „importiert“), „Ersetzen“ (gesperrt).
- **Unverändert:** Planungslogik, Generator, `compatible`, Fußwege, Zuteilung, PDF-Layout, WhatsApp.
- Rein logische Teile (Lesen, Zuordnung, Auswertung) kommen in die DOM-freien Blöcke `Planner`/`Pruefung` und werden mit Node getestet. Der Dialog gehört in den App-Block.

## Tests

- Erfundene Beispiele aus `gridOSM`/`wideOSM`: GPX-Text aus bekannten Beinen erzeugen, einlesen, zuordnen, prüfen. Erwartung: Stufe, Länge (GPX-Länge), Richtungswechsel, Ort.
- Randfälle: Linie neben den Wegen (⚠), Linie ganz außerhalb (✕), Start oder Ziel frei neben dem Weg, zu kurze und zu lange Strecke, kaputte Datei, zu viele Punkte, Koordinaten außerhalb des Bereichs, HTML im `name`.
- Kette „fest“: keine neuen Kandidaten, alle werden verwendet, MT-I vor MT-II, Konflikte verhindern die Kette nicht, Lücken werden gemeldet.
- Round-trip: Einfrieren, Speichern, Öffnen behält die GPX-Linie Punkt für Punkt.
- Geprüft wird nur mit erfundenen Daten. Echte Dateien aus `testdaten/` nutzt der Nutzer für den manuellen Probelauf (nicht im Repository).

## Ergänzungen nach dem Konzept-Check *(Entscheidungen des Konzepts, nicht des Nutzers)*

Ein unabhängiger Prüfer hat das Konzept gegen den Code gelesen. Seine Fragen sind so beantwortet:

- **Teams:** Der Import baut die Teamliste (`state.teams`) passend zu den importierten Trails neu auf: ein Team je Trail, Stufe und Ort aus der Auswertung, Namen „Team N“ in Kettenreihenfolge. Die Namen der echten Teams kommen wie bisher erst in der Zuteilung. Die Bestätigungsfrage vor „Übernehmen“ sagt, dass die bisherige Teamliste und der bisherige Prüfungsstand ersetzt werden. `state.planTeams` wird gleich befüllt. Damit bleiben „Nur Ort … neu planen“ und alles, was Teams braucht, benutzbar.
- **Kette „fest“ (Umfang der Änderung an `Planner.chain`):**
  - Die Suche nach Reihenfolgen bleibt dieselbe Tiefensuche mit Lückenbudget 0 … 3, zuletzt beliebig viele, und dem Zeitlimit wie heute. Bei höchstens rund 10 Trails je Stufe genügt das, es werden keine Permutationen erzwungen.
  - Entfallen im Modus „fest“: Erzeugen neuer Kandidaten (`nearList`), die Prüfung `compatible` **zwischen** den festen Trails (Konflikte werden nur in der Konfliktliste gemeldet) und die Rückfallstufe `plans()`. Stattdessen ordnet die Rückfallstufe nach Stufe und Dateireihenfolge, jeder Übergang ist eine Lücke.
  - Bleibt: `walkClear` und die gesperrten Kanten. Berührt der Fußweg einen später gelaufenen Trail, ist der Übergang eine Lücke (nicht erlaubt, nicht gedehnt), wie bei geplanten Trails.
  - Das 25er-Limit der allgemeinen Kandidatenliste gilt im Modus „fest“ nicht, es werden alle verwendet.
- **Geometrie:** `c.v.pts` eines importierten Trails sind die **GPX-Punkte**, mit `G.fromLatLon` ins Netz projiziert. Damit rechnen `compatible`, `chain`, `walkPath`, Zeichnen und Speichern. Die Beinfolge liefert nur Prüfung (`validate`), Kennzahlen und `describe`. Die Meter-Angaben (`at`) der Wegbeschreibung werden mit Länge(GPX) / Länge(Beine) auf die GPX-Linie umgerechnet, damit die Marker an der richtigen Stelle sitzen.
- **Gelände-Anteil** („mindestens x % im kartierten Wohngebiet“) bleibt wie bisher aus der Zuordnung berechnet. Nur die Längenprüfung nimmt die GPX-Länge.
- **Netz nötig:** Fällt die Verbindung aus oder läuft sie in die Zeit, bricht der Import mit der bekannten Meldung ab („OpenStreetMap ist gerade nicht erreichbar … Der bisherige Stand bleibt“). Es wird nichts übernommen.
- **Was sich übernehmen lässt:**
  - **Gesperrt** (kein Häkchen möglich, weil der Trail keinen Teamplatz bekommen kann): Datei unlesbar oder gegen die Grenzen verstoßend, Länge passt zu keiner Stufe, kein Ort der Ortsliste passt.
  - **Abwählbar, aber übernehmbar** (standardmäßig an): PO-Pflichtregel verletzt, Zuordnung unsicher oder nicht möglich, Konflikt mit einem anderen Trail. Der Bogen und die Trailkarte zeigen den Befund.
- **Nummern bei Lücken:** Die Nummern folgen der Kettenreihenfolge (Stufe, innerhalb der Stufe die Reihenfolge, die die Suche wählt). Haben die Rückfallstufe oder Lücken keine bessere Reihenfolge, gilt Stufe, dann Dateireihenfolge.
- **Eigener GPX-Leser statt `DOMParser`:** `Pruefung.parseGpx(text)` liest `<trkpt>` und `<rtept>` (Attribute `lat` und `lon` in beliebiger Reihenfolge, einfache oder doppelte Anführungszeichen), ignoriert Kommentare, CDATA, `<wpt>` und alle anderen Felder, liest `<name>` mit den Standard-Entitäten und gibt nur Text und Zahlen zurück. Die Grenzen (Größe, Anzahl, Punkte, Koordinatenbereich) prüft er selbst. Damit sind Lesen, Zuordnung und Auswertung in Node testbar, ohne Browser.

## Was dem Bauenden überlassen bleibt

- Genaue Schwellen der Zuordnung (3 m Verdichtung, 10-m-Schwelle, 10-%-Anteil) und das Aussehen des Dialogs.
- Wie die Fehlermeldungen im Einzelnen formuliert sind (verständliches Deutsch).
- Reihenfolge der Dateien in der Liste (Dateiname oder Reihenfolge der Auswahl).
- Konkrete Aufteilung in Funktionen.

## Bekannte Grenzen

- Mapy.com und der OSM-Auszug sind nicht dieselbe Datenbasis. Unsichere Zuordnung wird markiert, nicht versteckt.
- Bei festen Trails entstehen oft Lücken in der Kette. Der Planer kann sie nur anzeigen.
- Die Wegbeschreibung importierter Trails ist abgeleitet und ungefähr.
