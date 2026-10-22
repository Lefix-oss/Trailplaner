# Changelog – Trailplaner HSV Giebelstadt

Jede Änderung erhöht die Version um 0.1: V1.0 bis V1.9, danach V2.0 bis V2.9 und so weiter. Die aktuelle Version steht in der App neben der Überschrift.

## V2.0 – 22.10.2026

GPX-Import: Übergangswege nach der fachlichen Regel statt nach alten Generatorgrenzen.

- **Regel für den Weg vom Ziel zum nächsten Start:** Er darf keinen noch nicht gelaufenen Trail kreuzen, berühren oder benutzen. Geprüft wird direkt statt mit einem festen Abstand: welche Wegstücke ein Trail laut Zuordnung benutzt (metergenau), über welche Kreuzungen er läuft und wo seine GPX-Linie einen Weg schneidet oder berührt. Bereits gelaufene Trails sperren nichts.
- **Startstück des nächsten Trails:** Der Weg darf sich dem Start auf dem Wegstück nähern, auf dem der nächste Trail beginnt (bis zur ersten Abzweigung): von hinten oder über einen Seitenweg an dieser Abzweigung, den der Trail nicht benutzt. Er endet am Start und läuft nie in dessen weiteren Verlauf. Hat der Trail keine Abzweigung (ein einziges Wegstück), gibt es nur den Zugang von hinten.
- **Keine harten Grenzen mehr bei importierten Trails:** Unter 75 m zwischen Ziel und nächstem Start und über 250 m Fußweg gibt es nur noch Warnungen, dazu „Umweg“ ab der dreifachen Luftlinie. Gesucht wird bis 1,5 km; das ist eine technische Grenze der Suche, keine Regel.
- **Lücken nur noch, wenn wirklich kein zulässiger Weg existiert,** mit Grund, zum Beispiel „Start von Trail 3 nur über Trail 4 erreichbar“. Die Luftlinie steht nur zur Information daneben.
- **Anzeige:** Vorschau, Trailkarte und Karte zeigen jeden gefundenen Weg mit Länge und Hinweisen. Die Hinweise werden im Prüfungsstand mitgespeichert.
- Reihenfolge und Nummerierung, die importierten Strecken und die automatische Trailplanung bleiben unverändert.
- **Offener Punkt:** Die Reihenfolge wird noch mit der alten Fußwegregel bewertet (75–250 m, nur der nächste Trail gesperrt), die Übergänge danach mit der neuen Regel. Das ist bewusst so, damit sich die Nummerierung nicht verschiebt. Folge: In seltenen Fällen könnte eine andere Reihenfolge nach der neuen Regel kürzere Übergänge haben. Eine Angleichung würde die Nummerierung bestehender Importe ändern und ist deshalb eine eigene Entscheidung.
- **Bekannte Grenze:** Liegen zwei Starts fast an derselben Stelle (Konflikt), endet der Übergang zwangsläufig direkt neben dem späteren Trail. Die Konfliktliste meldet das.

## V1.9 – 22.10.2026

GPX-Import: Orte automatisch erkennen, Reihenfolge nach kürzesten Übergängen.

- **Keine Orte mehr vorher anlegen:** Liegt ein Trail in einem Ort der Ortsliste, wird dieser genommen. Sonst gruppiert die App die übrigen Trails nach Lage und schlägt je Gruppe einen Ort vor: Mitte der Trails, kleinster passender Radius, Gelände „Auch Feld und Wald“, Name über OpenStreetMap (Nominatim). Ohne verlässlichen Namen heißt der Ort wie beim Tippen auf die Karte „Kartenpunkt …“. In die Ortsliste kommen die neuen Orte erst mit „Übernehmen“.
- **Nicht raten:** Passt eine Strecke in keinen Suchkreis oder wären mehr als vier Orte nötig, ist der Trail mit „?“ markiert. Er bekommt eine Auswahlliste für den Ort.
- **Reihenfolge:** Die importierten Trails werden je Ort so geordnet, dass möglichst wenige Lücken und möglichst kurze Übergänge entstehen (Ziel → nächster Start). Bis 12 Trails je Ort wird die beste Reihenfolge exakt berechnet. Die Dateireihenfolge spielt keine Rolle mehr. MT-I läuft weiter vor MT-II. Ein Fußweg zählt nur, wenn er die bestehenden Regeln erfüllt (75–250 m, mind. 75 m Luftlinie, Abstand zu später gelaufenen Trails).
- **Vorschau:** Sortiert nach vorgesehener Trailnummer. Jede Zeile zeigt Datei, Länge, Stufe, Ort (auch „neuer Ort“), PO-Ergebnis und den Übergang vom vorigen Trail: Fußweg, Lücke mit Luftlinie (Warnung, bei mehr als 250 m „großer Sprung“) oder Ortswechsel.
- Die automatische Trailplanung und die importierten Strecken bleiben unverändert. Die Kette für importierte Trails ist außerdem schneller (bei 7 Trails 0,1 s statt 3,6 s).

## V1.8 – 22.10.2026

Trails aus GPX-Dateien importieren (nur Prüfungsmodus).

- **Neuer Knopf „Import Trails …“:** Mehrere GPX-Dateien (zum Beispiel Export aus Mapy.com) lassen sich per Ziehen oder Auswählen einlesen. Jede Datei erscheint in einer Liste mit Länge, Stufe, Ort und Prüfergebnis (✓, ⚠, ✕) samt Gründen.
- **Die Strecke bleibt unverändert:** Gespeichert, gezeichnet und gedruckt wird die GPX-Linie. Die Länge ist die Länge der Linie, die Stufe ergibt sich allein daraus (MT-I 270–330 m, MT-II 540–660 m, MT-III 900–1100 m).
- **Regelprüfung:** Die Linie wird dem Wegenetz zugeordnet und mit denselben Regeln wie geplante Trails geprüft (Richtungswechsel, Wegarten, Kreisverkehr, Bundes- und Staatsstraßen, Abholung am Ziel …). Liegt viel von der Linie neben bekannten Wegen, erscheint ein Warnhinweis, dass die Prüfung ungenau ist.
- **Nichts wird still aussortiert:** Durchgefallene Trails und Trails, die zu nah beieinander liegen, werden gemeldet. Ob sie übernommen werden, entscheidet der Haken. Gesperrt sind nur unlesbare Dateien, Längen ohne Stufe und Trails außerhalb aller Orte der Ortsliste.
- **Kette:** Die Trails werden zur Kette geordnet (MT-I vor MT-II, Fußwege 75–250 m, Lücken werden angezeigt, nichts wird gewürfelt oder gedehnt). Die Karte zeigt die Kette vor dem Übernehmen.
- **Übernehmen:** Es entsteht ein normaler Prüfungsstand mit Teamliste „Team 1 …“ in Kettenreihenfolge. Speichern, Zuteilung, Bögen und WhatsApp funktionieren wie bei geplanten Trails. Importierte Trails sind als „importiert“ gekennzeichnet, ihre Wegbeschreibung ist abgeleitet und ungefähr.
- **Ersetzen** ist bei importierten Trails gesperrt. „Nur Ort … neu planen“ fragt vorher ausdrücklich, weil importierte Trails dabei verworfen werden.
- **Sicherheit:** Die GPX-Dateien werden von einem kleinen eigenen Leser gelesen (höchstens 1 MB, 50 Dateien, 5000 Punkte, gültige Koordinaten). Namen aus den Dateien erscheinen nur als Text.

## V1.7 – 22.10.2026

Absicherung für die Weitergabe an externe Tester.

- **Dateien öffnen:** Beim Öffnen eines gespeicherten Stands werden Zahlenfelder (Länge, Richtungswechsel, Entscheidungsstellen, Kreuzungen, Fußwege, Meterangaben der Schritte) geprüft. Enthält eine Datei dort Text oder HTML, wird sie als „beschädigt“ abgelehnt. Bisher hätte eine präparierte Datei Skript in der Seite ausführen können. Alte, gültige Dateien öffnen weiter wie bisher.
- **Keine Schriften und kein Leaflet mehr von Google und Cloudflare:** Die Schriften (Barlow, Barlow Condensed, IBM Plex Mono) und die Kartenbibliothek Leaflet 1.9.4 liegen jetzt im Ordner `vendor/` und werden von der App selbst ausgeliefert. Beim Öffnen wird die IP-Adresse nicht mehr an Google oder Cloudflare übertragen. Die Prüfsummen von Leaflet stimmen mit den offiziellen Werten überein.
- **Overpass:** Der Server `maps.mail.ru` ist aus der Liste entfernt. Es bleiben drei Server.
- **Hinweis „Testversion · Datenschutz“** unten in der Seitenleiste: Wer verantwortlich ist, dass die Eingaben nur im Browser liegen, welche Dienste Dritter angefragt werden und dass in der Testversion keine echten Namen eingegeben werden sollen.
- Der alte Apps-Script-Export `Trailplaner_neu.json` ist aus dem Repository entfernt (bleibt in der Git-Historie).

## V1.6 – 22.10.2026

- **Ersetzen in der Kette findet öfter einen Ersatz:** Der Planer sucht jetzt auch rückwärts. Er würfelt Trails, die am Start des nächsten Trails beginnen, dreht sie um und prüft sie komplett neu gegen die PO. So enden sie in Fußweite vor dem nächsten Start. Das hilft vor allem am Anfang und in der Mitte einer Kette.
- **Mitte der Kette:** Gesucht wird vorwärts vom vorigen Ziel und rückwärts vom nächsten Start. Bei gleich guter Kette gewinnt der Trail mit weniger zusätzlichen Entscheidungsstellen.
- **Bestehende Lücken** neben dem ersetzten Trail schließen sich, wenn es passt.
- **Passt kein Ersatz lückenlos:** Die App fragt nach und setzt auf Wunsch einen Ersatz mit Lücke ein. Bisher blieb der Trail dann unverändert. Die Statuszeile sagt, wo die Kette unterbrochen ist.
- **Mehrfaches Ersetzen:** Es kommt nicht mehr fast derselbe Trail mit ein paar Metern verschobenem Start. Schon gezeigte Trails kommen erst wieder, wenn es keine anderen mehr gibt.
- **Lücke zum nächsten Trail:** Die angezeigte Luftlinie wird nach dem Ersetzen neu berechnet.

## V1.5 – 22.10.2026

- **Keine Kreisverkehre in Prüfungen:** Im Prüfungsmodus führt kein Trail mehr durch einen Kreisverkehr, weil das im Zweifel zu schwer ist (Vereinsvorgabe). Im Training bleiben Kreisverkehre erlaubt. Erkannt werden alle Wege, die in OpenStreetMap als Kreisverkehr eingetragen sind.

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
