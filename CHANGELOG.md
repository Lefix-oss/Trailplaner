# Changelog – Trailplaner HSV Giebelstadt

Jede Änderung erhöht die Version um 0.1: V1.0 bis V1.9, danach V2.0 bis V2.9 und so weiter. Die aktuelle Version steht in der App neben der Überschrift.

## V1.4 – 22.10.2026

- **Trails in Reihe (nur Prüfungsmodus):** Pro Ort bilden die Trails eine Kette. Erst laufen die MT-I-Trails, dann die MT-II-Trails. Die Trails werden in der Reihenfolge der Kette nummeriert.
- **Übergang:** Vom Ziel zum nächsten Start sind es 75–250 m Fußweg und mindestens 75 m Luftlinie. Der Fußweg der Gruppe hält Abstand zu allen Trails, die später noch gelaufen werden.
- **Lücken:** Geht es nicht anders, wird die Kette an möglichst wenigen Stellen unterbrochen. Ein Übergang wird nie gedehnt.
- **Anzeige:**
  - Trailkarte: „Weg vom vorigen Ziel: X m“ oder „Lücke: neuer Abschnitt“
  - Statuszeile: „Kette ohne Lücke“ oder „Kette mit N Lücken“
  - Karte: gestrichelte Linie für den Fußweg
- **Ersetzen** hält die Kette ein. Passt kein Ersatz, bleibt der Trail unverändert.
- **Hinweis:** In engen Ortskernen ist eine Kette oft nicht möglich, weil der Fußweg dort kaum Abstand zu späteren Trails halten kann. Mit „Auch Feld und Wald“ und größerem Radius klappt es meist.

## V1.3 – 22.10.2026

- **Ortssuche ohne Gemeindeflächen:** Zu manchen Orten liefert die Suche zusätzlich die Gemeinde als Verwaltungsfläche. Deren Mittelpunkt liegt oft im Feld neben dem Ort, zum Beispiel bei Wonfurt. Solche Einträge fallen jetzt weg, sobald es den Ort gleichen Namens gibt. Bleibt nur ein Treffer übrig, wird er direkt übernommen.

## V1.2 – 22.10.2026

- **Radar beim Planen:** Solange der Planer rechnet, pulsiert über jedem Suchkreis ein Radar mit umlaufendem Lichtkegel. Die Karte zeigt dabei den ganzen Kreis. Das gilt für „Trails planen“, „Nur Ort … neu planen“ und „Ersetzen“.
- **PO-Auslegung „Kreuzungen“ und „befahrener Straßenbereich“:** Die PO zählt beides beim Gelände auf, genau wie „Wald, Wiese“. Es ist also erlaubt, aber keine Pflicht. Ein MT-II-Trail muss deshalb keine Kreuzung mehr enthalten, ein MT-III-Trail keinen Mindestanteil an Straßen mit Verkehr.

## V1.1 – 22.10.2026

**Planung: Richtungswechsel und Entscheidungsstellen getrennt**
- **Richtungswechsel:** Der Trail biegt an einer Abzweigung ab. Die PO verlangt eine Mindestzahl (MT-I 1, MT-II 2, MT-III 4). Das bleibt Pflicht.
- **Zusätzliche Entscheidungsstelle:** Der Trail läuft an einer Abzweigung geradeaus weiter. Eine solche Stelle zählt nie als Richtungswechsel.
- Die PO nennt keine Höchstzahlen. Zusätzliche Entscheidungsstellen und unnötige Richtungswechsel sind deshalb kein Ausschlussgrund mehr, sondern ein Nachteil: Der Planer bevorzugt immer die einfachste Variante.
- Neuer Schalter **„Streng“**: nur Trails ohne zusätzliche Entscheidungsstellen. Dabei kommen oft nur Trails am Ortsrand oder auf dem Feld heraus.
- **Kreuzung:** Hier treffen sich mindestens vier begehbare Wege. Zufahrten zählen als mögliche Abzweigung, aber nicht als Kreuzung.
- Die Kennzahlen heißen jetzt einheitlich „Richtungswechsel · zusätzliche Entscheidungsstellen · Kreuzungen“. Der Hinweis „schwerer als vorgesehen“ ist ersetzt durch „Hinweis: … zusätzliche Entscheidungsstellen. PO-konform und zulässig“.
- Der Text im Modus „Prüfung“ sagt jetzt klar, dass alle Vorschläge zulässig sind.

**Bedienung**
- Ortsliste auf schmalen Bildschirmen: Der Name steht oben, Gelände und Radius darunter. Es gibt keinen wortweisen Umbruch mehr.
- Die Vorschau der Prüfungsbögen wird auf schmalen Bildschirmen verkleinert und passt jetzt auf den Bildschirm. Gedruckt wird weiter in Originalgröße.
- Ortssuche: Gleichnamige Treffer dicht beieinander erscheinen nur noch einmal. Die Liste zeigt die Art des Orts (Dorf, Ortsteil …) und die Entfernung auf 0,1 km.
- „Zuwürfeln“ ohne eingetragene Namen erklärt jetzt, was fehlt.
- Die Versionsnummer steht neben der Überschrift und auf den Prüfungsbögen.

## V1.0 – bis 21.10.2026

Erster vollständiger Stand für die Prüfung am 31.10.2026.

**Planen**
- Trails nach DVG-PO 05/2024 (MT-I, MT-II, MT-III) aus OpenStreetMap-Daten
- Modi Training und Prüfung
- Länge, Liegezeit, Abholung mit dem Auto am Ziel, keine Querung von Bundes- oder Staatsstraßen bei MT-I und MT-II, kein Zurücklaufen auf sich selbst, Mindestabstand zwischen den Trails
- Fuß- und Feldwege lassen sich zu- oder abschalten; systematische Suche nach seltenen Trails

**Orte**
- Bis zu 4 Orte pro Prüfung, jeweils mit eigenem Gelände und Radius (400 m bis 2,2 km)
- Ort pro Team wählbar; Abstand wird auch über Ortsgrenzen hinweg geprüft

**Prüfungsablauf**
- Trails werden eingefroren; Häkchen „geprüft (abgefahren)“
- Einen einzelnen Trail ersetzen oder nur einen Ort neu planen
- Speichern, Öffnen und automatische Sicherung im Browser

**Prüfungstag**
- Zuteilung mit Zuwürfeln: Teams nur innerhalb ihrer Stufe
- Prüfungsbögen als PDF mit Luftbild und Vereinslogo
- WhatsApp-Versand der Start- und Endpunkte

**Wegedaten**
- Fester Auszug für Giebelstadt und Eßfeld
- Andere Orte: vier Server gleichzeitig, Zwischenspeicher für 14 Tage, Knopf „Wegedaten neu laden“
