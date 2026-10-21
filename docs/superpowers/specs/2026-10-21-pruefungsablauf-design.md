# Prüfungsablauf im Trailplaner – Konzept

Stand: 21.10.2026 · Prüfung: **Samstag, 31.10.2026** · Verein: Hundesportverein Giebelstadt e.V.

## Worum es geht und warum

Der Trailplaner (`index.html`) plant Mantrailing-Trails nach DVG-PO (MT-I bis MT-III) aus OpenStreetMap-Daten. Für Prüfungen reicht das bisher nicht, aus zwei Gründen:

1. **Die vorgeschlagenen Trails sind noch nicht verlässlich genug.** Jeder Trail muss vorher vor Ort abgefahren werden. Fällt einer durch, wird nur dieser eine ersetzt. Der geprüfte Stand muss danach unverändert bis zum Prüfungstag erhalten bleiben.
2. **Die Bögen für die Richterin entstehen heute von Hand.** Die Trails werden in Google Maps nachgebaut, als Screenshots abgelegt und in ein Tabellendokument mit Kopfzeilen kopiert. Am Prüfungstag werden die Versteckpersonen den Trails zugewürfelt, danach die Teams. Die Namen trägt man von Hand ein.

Ziel ist ein durchgehender Ablauf im Planer: **planen → abfahren und abhaken → speichern → am Prüfungstag laden → zuteilen → Bögen drucken.**

Nutzer ist eine einzelne Person, die Prüfungsorganisation. Sie arbeitet in allen Schritten am **Laptop**. Tablet und Handy spielen keine Rolle.

## Ablauf

### Phase 1 – Planen und prüfen (Tage vor der Prüfung)

- Planen wie bisher: Ort wählen, Teams mit Stufe anlegen, „Trails planen“. Für diese Prüfung: **10 Trails, davon 7× MT-I und 3× MT-II.**
- Beim Planen stehen die Teamnamen noch nicht fest. Die Einträge in der Teamliste sind nur **Platzhalter für die Stufe**. Die Namen kommen erst am Prüfungstag dazu.
- Nach dem Abfahren wird jeder Trail entweder **als geprüft abgehakt** oder durch einen neu gewürfelten ersetzt. Der Planer kann das schon heute: „Alternativ-Trail“ auf der Trailkarte, passend zur Stufe und zu den übrigen Trails. Ein ersetzter Trail verliert sein Häkchen und muss neu abgefahren werden.
- **Speichern** schreibt den kompletten Stand als Datei auf den Laptop, und zwar **jederzeit**, auch mit erst teilweise abgehakten Trails. Das Abfahren kann sich über mehrere Tage ziehen. Die Häkchen werden mitgespeichert. Zusätzlich wird der laufende Stand automatisch im Browser gesichert. *(Entscheidung des Konzepts. Die frühere Idee „Speichern erst, wenn alles abgehakt ist“ ist verworfen, weil dabei angefangene Arbeit verloren ginge.)*
- **Ersetzen nach dem Laden:** Ein Trail lässt sich auch in einer geladenen Datei noch einzeln ersetzen, zum Beispiel wenn er am dritten Tag durchfällt oder kurz vor der Prüfung eine Straße gesperrt ist. Dafür wird das Wegenetz neu aus OpenStreetMap geholt, aber **nur, um einen Ersatz zu suchen**. Die übrigen Trails bleiben exakt so, wie sie gespeichert sind, und der Abstand wird gegen ihre gespeicherte Geometrie geprüft. Das Ersetzen fragt vorher nach und entfernt das Häkchen des ersetzten Trails. *(Entscheidung des Konzepts, sie folgt aus dem Ablauf, den der Nutzer beschrieben hat.)*
- Sind beim Prüfungstag noch Trails ohne Häkchen, weist der Planer deutlich darauf hin, sperrt aber nichts.

### Phase 2 – Prüfungstag

- **Datei öffnen** lädt den Stand: Karte und Trails erscheinen wieder. Die Strecken sind **fest**. Zum Anzeigen, Zuteilen und Drucken wird nichts neu berechnet und nichts neu aus OpenStreetMap geholt. Die einzige Ausnahme ist das bewusste Ersetzen eines einzelnen Trails (siehe Phase 1).
- **Zuteil-Tabelle**, eine Zeile pro Trail: Nr. · Stufe · Versteckperson · Team (vom Nutzer gewählt, Entwurf „Variante B“).
  - Die Namen der Teams und der Versteckpersonen gibt man einmal als Liste ein.
  - **Zuwürfeln** füllt die Tabelle zufällig aus.
    - Teams kommen nur auf Trails **ihrer eigenen Stufe**.
    - Versteckpersonen werden **ohne Einschränkung** verteilt.
  - Man kann die Tabelle auch **von Hand** ausfüllen und nach dem Würfeln einzelne Namen tauschen.
- **Wenn die Zahlen nicht aufgehen** (Entscheidung des Nutzers): Es wird nichts weggelassen. **Jeder Trail bleibt in der Tabelle und bekommt einen Bogen.** Kommen zum Beispiel nur 9 von 10 Teams, wird trotzdem gewürfelt. Ein Trail bleibt dann ohne Team und wird genauso ausgedruckt. Gleiches gilt für fehlende Versteckpersonen. Leere Felder erscheinen auf dem Bogen als Linie zum Handausfüllen, wie beim alten Bogen. Das Würfeln blockiert nie wegen ungleicher Zahlen und verschiebt nie ein Team in eine andere Stufe.
- Die Zuteilung wird mitgespeichert. Ein Absturz oder ein geschlossenes Fenster darf sie nicht kosten.
- **Prüfungsbögen als PDF**: ein Trail pro A4-Seite (siehe unten).

### Nur im Prüfungsmodus

Speichern und Laden, Häkchen, Zuteil-Tabelle und PDF-Bögen gibt es **nur, wenn oben „Prüfung“ gewählt ist**. Im Modus „Training“ bleibt der Planer, wie er ist.

## Der Prüfungsbogen

Vorlage ist der bisherige Bogen des Vereins (Tabellendokument mit Luftbild-Screenshot). Den Entwurf hat der Nutzer abgenommen. Eine A4-Hochformatseite pro Trail:

- **Kopfzeile**, gedruckt statt handschriftlich:
  - Trailnummer und Stufe (z. B. „Trail 2 · MT-I“)
  - **HF** (Hundeführer), **Hund**, **VP** (Versteckperson)
  - Länge in Metern
  - Ort mit Straßen von Start bis Ende (z. B. „Giebelstadt · Industriestraße → Bavariastraße“)
  - Datum der Prüfung
- Die Teamnamen sind im Format „Anna mit Luna“ eingetragen (erfundenes Beispiel). Sie werden an „ mit “ in **HF: Anna** und **Hund: Luna** getrennt. Ohne „ mit “ steht der ganze Text als HF da, und das Feld Hund bleibt leer.
- **Karte**, nimmt den größten Teil der Seite ein:
  - **Luftbild** wie beim alten Bogen, darauf der Trail als gut sichtbare Linie
  - Markierungen **START** und **ENDE**, beim Ende mit Länge
  - Nordpfeil und Maßstab
  - Pflichtangaben zur Quelle (Luftbild und OpenStreetMap)
  - Der Ausschnitt ist so gewählt, dass der ganze Trail gut lesbar draufpasst.
- **Fußzeile:** Koordinaten von Start und Ende, dazu „**Trailplaner · HSV Giebelstadt**“ mit dem **Vereinslogo**. Das Logo liegt als SVG schon im Kopf von `index.html` und ist laut Nutzer das richtige.
- Die Straßennamen kommen aus OpenStreetMap, also aus denselben Daten, mit denen der Planer arbeitet. Google Maps wird nicht gebraucht.

## Testdaten

Die echten Teamnamen der Prüfung liegen in `testdaten/pruefung-teams.txt`. Die Datei ist nur lokal vorhanden und durch `.gitignore` aus Git ausgeschlossen. Das Repository ist öffentlich, deshalb stehen die Namen auch nicht in diesem Konzept.

- **10 Teams:** 7× MT-I und 3× MT-II, alle im Format „Hundeführer mit Hund“
- Darunter ein besonders langer Name (Hund mit dreiteiligem Namen). Er ist der Test für lange Namen auf dem Bogen.
- **Versteckpersonen:** VP1 bis VP10 als Platzhalter, die echten Namen stehen noch nicht fest

Tests und Beispiele im Repository verwenden erfundene Namen.

## Ziele

- Der geprüfte Trailstand übersteht die Tage bis zur Prüfung **unverändert**: als Datei, unabhängig von Browser-Speicher und OpenStreetMap-Änderungen.
- Zuteilung und Bögen sind am Prüfungstag in wenigen Minuten erledigt.
- Die Bögen ersetzen den bisherigen Handbau mit Google Maps vollständig.

## Nicht-Ziele (diesmal nicht)

- Allgemeine Verbesserungen an Aussehen und Bedienung. Dafür gibt es danach eine eigene Runde.
- Bedienung auf Handy oder Tablet.
- Mehrere Personen, die gleichzeitig oder geteilt am selben Stand arbeiten.
- Einschränkungen bei den Versteckpersonen. Es gibt keine.
- Mehr als 10 Trails. Die heutige Obergrenze von 10 Teams reicht für diese Prüfung.
- Strecken von Hand zeichnen oder verbiegen. Ein Trail wird nur als Ganzes ersetzt.

## Anti-Ziele (das wäre ein Fehlschlag, auch wenn es technisch läuft)

- Ein gespeicherter, abgefahrener Trail sieht nach dem Laden **anders aus** als beim Abfahren, und sei es nur leicht.
- Ein Team landet auf einem Trail einer **anderen Stufe**.
- Die Zuteilung geht durch Neuladen oder Absturz verloren.
- Der Bogen zeigt eine Platzhalter- oder Fantasiekarte statt des echten Luftbilds mit dem echten Trail.
- Der Trainingsmodus verändert sich oder geht kaputt.

## Rahmenbedingungen

- **Bereits geplante Trails:** Der Nutzer hat mit der jetzigen Version schon Trails geplant, aber noch nicht abgefahren. Sie lassen sich nicht wiederherstellen, weil die jetzige Version Pläne nicht speichert. Sobald Phase 1 fertig ist, wird neu geplant. Das ist kein Verlust, denn es wurde noch nichts abgefahren.
- **Termin:** Die Prüfung ist am 31.10.2026. Speichern und Häkchen (Phase 1) müssen **zuerst** fertig sein, denn die Trails werden in dieser oder der nächsten Woche geplant und abgefahren. Zuteil-Tabelle und Bögen (Phase 2) müssen spätestens einige Tage vor dem 31.10. stehen, damit ein Probedruck möglich ist.
- **Aufbauen statt neu bauen:** Die bestehende `index.html` mit Prüfungsordnung, Wegenetz, Abstandsprüfung und Alternativ-Trails bleibt die Grundlage. Der Planer-Kern (`Planner`) wird schon heute für Node exportiert (`module.exports`) und ist damit testbar.
- **Eine einzige HTML-Datei**, ohne Server, ohne Anmeldung, ohne kostenpflichtige Dienste und API-Schlüssel. Fremde Bibliotheken nur aus einem CDN, so wie heute Leaflet von cdnjs.
- **Hosting:** Der Nutzer hat entschieden, dass die App künftig über **GitHub Pages** läuft und **Apps Script als Rückfallebene** bleibt. Die `index.html` muss deshalb in beiden Umgebungen funktionieren: als normale Webseite und im Apps-Script-Rahmen (`HtmlService`, eingebettet in einen iframe). Speichern, Öffnen und PDF müssen in beiden gehen. Der Umzug selbst ist ein eigenes, kleines Vorhaben. Er wird **vor** dem Prüfungstag erledigt, damit am 31.10. GitHub Pages läuft. Das Repository existiert schon: `github.com/Lefix-oss/Trailplaner` (öffentlich, noch leer). Apps Script bekommt vor der Prüfung nur einen kurzen Funktionstest.
- **Echte Namen** gehören nicht ins Git-Repository. Das Repository wird für GitHub Pages öffentlich.
- **Sprache der Oberfläche:** Deutsch, im Ton der bestehenden App.

## Dem Builder überlassen

- Dateiformat und Endung der Speicherdatei. Wichtig ist nur: Die Trail-Geometrie wird **direkt gespeichert**, als Punktfolge mit Stufe, Länge und den für Bogen und Anzeige nötigen Angaben. Sie wird also nicht aus Startwert und OSM-Daten neu erzeugt. Außerdem enthält die Datei Ort, Einstellungen, Häkchen, Namenslisten, Zuteilung und Prüfungsdatum.
- Die Technik für die PDFs, etwa Druckansicht mit „Als PDF speichern“ oder eine PDF-Bibliothek, solange das Ergebnis den Bogen oben einhält und in beiden Hosting-Umgebungen funktioniert.
- Die Quelle für das Luftbild, solange sie ohne Schlüssel und ohne Kosten nutzbar ist und die Quellenangabe auf dem Bogen steht. Naheliegend ist Esri World Imagery, weil der Planer schon Esri-Kacheln nutzt.
- Wie die Straßennamen für die Kopfzeile ermittelt werden, ob aus dem geladenen Wegenetz oder per Nominatim-Rückfrage.
- Wie Platzhalter-Teams in der Planungsphase heißen und angezeigt werden.
- Wie der laufende Stand am Prüfungstag zusätzlich gegen Absturz gesichert wird, zum Beispiel automatisch im Browser und zusätzlich über erneutes Speichern als Datei.
