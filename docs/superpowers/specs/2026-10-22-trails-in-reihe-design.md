# Trails in Reihe (Kette) – Konzept

Stand: 22.10.2026 · Status: **abgestimmt, noch nicht umgesetzt** · baut auf `2026-10-21-mehrere-orte-design.md` auf

## Worum es geht und warum

Am Prüfungstag gehen nach jedem Fund **Richterin, Prüfungsleitung und zwei Begleitpersonen**, die den Trailer, die PL und die Richterin absichern, **zu Fuß vom Ziel zum nächsten Start**. Das nächste Team wartet dort schon. Liegen die Trails kreuz und quer im Ort, werden diese Wege lang. Deshalb sollen die Trails eine **Kette** bilden: Das Ziel eines Trails liegt in bequemer Fußweite vom Start des nächsten.

## Verhalten

- **Nur im Prüfungsmodus.** Training bleibt unverändert.
- **Eine Kette pro Ort.** Zwischen verschiedenen Orten wird gefahren.
- **Reihenfolge innerhalb eines Orts:** erst alle MT-I-Trails, dann die MT-II-Trails (und gegebenenfalls MT-III) am Ende der Kette. MT-II-Trails werden wegen der Liegezeit früher gelegt, aber zuletzt gelaufen.
- **Übergang:** Vom Ziel eines Trails bis zum Start des nächsten sind es **mindestens 75 m und höchstens 250 m Fußweg**, gemessen über begehbare Straßen und Wege (kürzester Weg im Wegenetz), nicht in Luftlinie. Die 75 m halten den nächsten Start vom Versteck der vorigen Versteckperson fern.
- **Nummerierung:** Die Trails werden in der Reihenfolge der Kette nummeriert. So erscheinen sie auch in Zuteilung, auf den Bögen und in den WhatsApp-Texten. Bei mehreren Orten folgen die Ketten in der Reihenfolge der Ortsliste aufeinander.
- **Stufen:** Der Planer nimmt die erste Stufe, die klappt.
  1. **Eine Kette:** Alle Übergänge liegen bei 75–250 m.
  2. **Kette mit Lücken:** Die Kette wird an möglichst wenigen Stellen unterbrochen. **Jeder Übergang innerhalb eines Kettenstücks bleibt bei 75–250 m.** Die Strecke wird nie gedehnt. Der Nutzer lehnt ausdrücklich alles ab, was in Richtung 400 m geht.
  3. **Ohne Kette:** Nur wenn kein einziger Übergang möglich ist. Dann wird wie bisher geplant.
- **Anzeige:**
  - **Trailkarte:** „Weg vom vorigen Ziel: 180 m“, an einer Lücke „Lücke: neuer Abschnitt, X m vom vorigen Ziel“.
  - **Statuszeile:** „Kette ohne Lücke“, „Kette mit 1 Lücke“ oder „Keine Kette möglich“.
  - **Karte:** Eine dünne gestrichelte Linie folgt dem Fußweg von jedem Ziel zum nächsten Start.
- **Ersetzen:** Ein Ersatz-Trail muss in die Kette passen. Sein Start liegt 75–250 m hinter dem vorigen Ziel, sein Ziel 75–250 m vor dem nächsten Start, soweit diese Übergänge vorher bestanden. Findet der Planer keinen, meldet er das, und der Trail bleibt unverändert.
- **Nur Ort … neu planen:** plant die ganze Kette dieses Orts neu.

## Ziele

- In Giebelstadt (2,2 km, „Auch Feld und Wald“) entsteht für 7× MT-I + 3× MT-II möglichst eine Kette ohne Lücke.
- Prüfungsdatei: Der Kettenzustand (Fußweg je Übergang, Lücken) wird gespeichert, damit Anzeige und Bögen nach dem Öffnen gleich sind.

## Nicht-Ziele

- Kette im Trainingsmodus
- Ketten über Ortsgrenzen hinweg
- Die Laufzeit der Gruppe oder Wartezeiten planen

## Anti-Ziele

- Ein Übergang innerhalb eines Kettenstücks über 250 m oder unter 75 m
- Eine gelockerte PO- oder Sicherheitsregel nur der Kette zuliebe: Richtungswechsel, Abstand zwischen den Trails, Bundes- und Staatsstraßen und so weiter
- Ein Prüfungsplan, der stillschweigend ohne Kette entsteht

## Rahmenbedingungen

- Bestehende Regeln bleiben hart: PO-Mindestzahl an Richtungswechseln, Mindestabstand zwischen den Trails, Querungsverbote für Trails, Gelände je Ort.
- **Fußweg-Messung** *(Entscheidung des Konzepts)*: Gemessen wird über alle öffentlich begehbaren Wege, also alles, was der Planer als begehbar einstuft. Das gilt unabhängig vom Gelände, vom Schalter „Fuß- und Feldwege“ und von der Stufe. Die Gruppe darf auf dem Weg dorthin auch Straßen mit Verkehr überqueren, weil sie von den Begleitpersonen abgesichert wird. Die Querungsverbote gelten nur für die Trails selbst.
- Bewertung wie bisher: zusätzliche Entscheidungsstellen und unnötige Richtungswechsel sind Nachteile. Bei der Wahl zwischen Ketten gilt: erst weniger Lücken, dann einfachere Trails.
- Eine einzige `index.html`, Logik testbar in `Planner`/`Pruefung` mit Node, Versionsnummer +0.1 und Eintrag im Changelog.

## Dem Builder überlassen

- Das Suchverfahren für die Kette, etwa Tiefensuche über die Kandidaten-Pools mit Fußwegdistanzen (Dijkstra im Graphen) und Zeitbudget
- Wie Lücken minimiert werden, solange die Zahl der Lücken klein bleibt
- Format der Kettendaten in der Prüfungsdatei (Dateiversion erhöhen, ältere Dateien ohne Kette weiter öffnen)
- Darstellung der gestrichelten Fußweglinie

## Offen für die Umsetzung

- Kosten sparen: kurz umsetzen, mit **einem** Review am Ende (Wunsch wegen begrenzten Kontingents)
