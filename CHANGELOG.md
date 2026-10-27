# Changelog – Trailplaner HSV Giebelstadt

Jede Änderung erhöht die Version um 0.1: V1.0 bis V1.9, danach V2.0 bis V2.9 und so weiter. Die aktuelle Version steht in der App neben der Überschrift.

## V2.9 – 27.10.2026

Robustheit nach externem Review: Speichern, Dateiprüfung, Serverabfragen, ältere Kartendaten.

- **Speicherfehler sichtbar:** Lässt sich der Prüfungsstand nicht im Browser speichern (Speicher voll oder gesperrt, z. B. im privaten Fenster), erscheint eine dauerhafte Warnung mit dem Knopf „Als Datei speichern“. Sie verschwindet beim nächsten erfolgreichen Speichern.
- **Sicherung bleibt erhalten:** Ein im Browser gespeicherter Stand, der sich beim Seitenstart nicht öffnen lässt, wird nicht mehr gelöscht, sondern als Sicherung aufgehoben („Sicherung herunterladen“ oder „Verwerfen“ mit Rückfrage). Der Hinweis erscheint bei jedem Seitenaufruf, bis die Sicherung verworfen ist.
- **Strengere Prüfung geöffneter Dateien:** Koordinaten müssen gültige Breiten- und Längengrade sein; höchstens 60 Trails, 5000 Streckenpunkte je Trail, 300 Schritte im Trailverlauf; Namen und Zuteilungen müssen kurze Texte sein (höchstens 100 Namen je Liste, je 200 Zeichen); Ort-Kennungen eindeutig; Dateiversion ganzzahlig.
- **Overpass-Server werden nacheinander gefragt:** zuerst einer, der nächste erst nach 8 Sekunden ohne Antwort oder sofort nach einem Fehler. Das schont die kostenlosen Server; im schlechtesten Fall dauert eine Abfrage etwas länger.
- **Hinweis bei älteren Wegedaten:** Sind die Server nicht erreichbar und die App nimmt den im Browser gespeicherten Stand, steht dauerhaft „Wegedaten für …: Server nicht erreichbar, gespeicherter Stand vom … wird verwendet“. Ebenso, wenn der feste Auszug älter als 14 Tage ist. „Wegedaten neu laden“ entfernt den Hinweis, sobald es klappt.
- Mehrere solche Meldungen stehen gesammelt unter der Statuszeile.

## V2.8 – 27.10.2026

Kreuzungen bei MT-II als Pflicht (PO: „Kreuzungen“ im Gelände von MT-II und MT-III).

- **Neue Regel:** MT-II (und MT-III) brauchen mindestens eine Kreuzung. Neue Planungen erfüllen sie immer; importierte Trails ohne Kreuzung bekommen in der Importliste den Befund „PO: mind. 1 Kreuzung (ab drei Wegen)“. MT-I bleibt ohne Kreuzungspflicht.
- **Kreuzung ab drei Wegen:** Als Kreuzung zählt jetzt jede Stelle, an der sich mindestens drei begehbare Wege treffen, also auch eine Einmündung (bisher vier). Zufahrten zählen nicht mit. Die Zahl „Kreuzungen“ auf den Trailkarten fällt dadurch meist höher aus.
- Mit den Giebelstädter Wegedaten findet die Planung gleich viele MT-II-Trails wie vorher: Jeder Trail mit zwei Richtungswechseln an Abzweigungen hat praktisch immer auch eine Kreuzung.
- Bereits gespeicherte Prüfungsstände behalten ihre alte Kreuzungszahl, bis der Trail ersetzt oder neu importiert wird.

## V2.7 – 27.10.2026

Sicherheit: Texte in den Karten-Tooltips werden maskiert.

- Die Hinweise beim Überfahren der Karte (Abbiegepunkte, Trail, Start und Ziel) enthalten Straßennamen aus OpenStreetMap, Teamnamen und Texte aus geöffneten Prüfungsdateien. Sie wurden bisher als HTML eingesetzt; ein manipulierter Name hätte so Code in der Seite ausführen können. Jetzt werden sie wie alle anderen Texte maskiert. Sichtbar ändert sich nichts.

## V2.6 – 27.10.2026

Gelände der Prüfungstrails besser an der PO prüfen: Wohngebiet, Wald, Wiese.

- **Geländezeile auf der Trailkarte (Prüfungsansicht):** „Gelände laut Karte: 60 % Wohngebiet · 25 % Wiese/Feld/Park · 15 % anderes“. Grundlage sind die Flächen aus OpenStreetMap (Wohngebiet, Wald, Wiese, Feld, Park und andere), ausgewertet alle 5 m entlang der Strecke. Die kleinste Fläche gilt, ein Park im Wohngebiet zählt also als Park.
- **Hinweis bei Gelände, das die PO nicht nennt** (ab 5 % der Strecke): zum Beispiel Gewerbegebiet, Friedhof, Sportplatz, Parkplatz, Schulgelände, mit Art und ungefährer Länge, dazu ein ⚠ in der zugeklappten Zeile. Nur ein Hinweis, kein Ausschluss: beim Abfahren ansehen und mit der Richterin klären.
- Die Flächen werden getrennt vom Wegenetz geladen und zwischengespeichert. Die Trailplanung, das Wegenetz und der feste Auszug für Giebelstadt bleiben unverändert. Gelingt das Laden nicht (offline, Server überlastet), fehlt nur die Geländezeile; pro Seitenaufruf gibt es einen Versuch je Ort.
- Die Anteile werden im Prüfungsstand mitgespeichert (Feld `land`), bei ersetzten, importierten und neu aufgebauten Trails automatisch nachgetragen.
- **Bekannte Grenzen:** Straßen am Rand einer Fläche zählen noch zu ihr (15 m), außer bei „anderem“ Gelände. Wo OpenStreetMap keine Fläche kennt, steht „ohne Flächenangabe“. Nur die Prüfungsansicht, nicht die Trainingsansicht und nicht der Prüfungsbogen.

## V2.5 – 25.10.2026

Kürzere Seitenleiste: Trailkarten und Namenslisten zum Auf- und Zuklappen.

- **Trailkarten (Prüfungsansicht):** Standardmäßig zugeklappt, eine Zeile pro Trail: Nummer, Stufe, Länge, ⚠ bei Hinweis oder Lücke, Dateiname und das Häkchen „geprüft“, das direkt in der Zeile bleibt. Klick auf die Zeile klappt die volle Karte auf (Kennzahlen, Straßen, Übergang, Hinweise, Trailverlauf, Knöpfe). Dazu „Alle aufklappen“ und „Alle zuklappen“. Was aufgeklappt ist, merkt sich die Seite nur, solange sie offen ist.
- **Namenslisten:** Teams und Versteckpersonen stehen in einem Block „Namen eintragen“. Er ist offen, solange noch keine Namen eingetragen sind, danach zu (und bleibt so, wie zuletzt gewählt). Datum, Bilanz, Tabelle und Knöpfe bleiben sichtbar.
- Die Trainingsansicht ist unverändert.

## V2.4 – 25.10.2026

Obere Leiste am Desktop, kürzere Seitenleiste.

- **Ab 1100 px Fensterbreite** gibt es oben eine Leiste mit den Alltagsknöpfen in drei Gruppen: Training/Prüfung und „Planen“ (Trails planen, Import Trails, Kette neu aufbauen), „Stand“ (Speichern, Öffnen) und „Ausgeben“ (Prüfungsbögen, Übersicht pro Ort, WhatsApp Start und Ende). Die Seitenleiste bleibt für Eingaben und Ergebnisse (Ortschaft, Teams, Rahmen, Trailkarten, Zuteilung) und wird dadurch deutlich kürzer.
- **Handy und schmale Fenster** (unter 1100 px) bleiben wie bisher: alle Knöpfe in der Seitenleiste. Die Knöpfe werden zwischen beiden Anordnungen verschoben, nicht doppelt angelegt; beim Ändern der Fensterbreite wandern sie mit.
- „Eingaben löschen und neu anfangen“ bleibt bewusst unten in der Seitenleiste.

## V2.3 – 25.10.2026

Zuteilung: Übersicht, wer schon vergeben ist.

- **Auswahl in der Zuteilungstabelle** (Versteckperson und Team) hat zwei Gruppen: „Noch frei“ oben, „Schon zugeteilt“ darunter mit der Trailnummer („Angie · Trail 4“). Wer einen schon vergebenen Namen wählt, tauscht die Plätze (wie bisher).
- **Bilanz über der Tabelle:** je Versteckpersonen und je Teamstufe „x von y Trails besetzt“, übrige Namen und Trails ohne Besetzung. So fällt sofort auf, wenn Namen oder Trails übrig sind.

## V2.2 – 25.10.2026

Trails einzeln hinzufügen und löschen, Kette auf Knopfdruck neu aufbauen.

- **Hinzufügen:** Ist schon ein Prüfungsstand da, bietet der Import „Zu den vorhandenen Trails hinzufügen“ (Standard) oder „Alles ersetzen“. Beim Hinzufügen bleiben vorhandene Trails, Häkchen „geprüft“, Team und VP unverändert; die neuen Trails kommen ans Ende. Der Abstand zu den vorhandenen Trails wird mitgeprüft. Eine Datei, die schon importiert ist (gleicher Dateiname oder gleicher Verlauf), wird erkannt und nicht angehakt.
- **Löschen:** Jede Trailkarte hat „Löschen“ (mit Nachfrage). Die Nummern rücken auf; der letzte Trail lässt sich nicht löschen.
- **Kette neu aufbauen:** Knopf über den Trailkarten. Berechnet Reihenfolge und Übergangswege der importierten Trails neu (gleiche Regeln wie beim Import, V2.0). Die Trails selbst bleiben unverändert, „geprüft“, Team, VP und Dateiname wandern mit dem Trail; die Nummern können sich ändern (Nachfrage vorher). Nur wenn alle Trails importiert sind.
- **Kein automatischer Neuaufbau:** Nach Hinzufügen oder Löschen bleibt die bisherige Reihenfolge stehen. Der betroffene Übergang steht als „Noch nicht in die Kette eingeordnet“, dazu ein Hinweis mit Knopf. So ändern sich bereits ausgedruckte oder ausgeloste Nummern nicht von selbst.
- **Nach Review nachgebessert:** Hinweis und Knopf „Kette neu aufbauen“ erscheinen nur, wenn alle Trails importiert sind (bei gemischten Ständen gibt es keinen Neuaufbau, also auch keinen Hinweis). Der Neuaufbau prüft nach dem Warten auf das Wegenetz noch einmal, ob Stand und Modus gleich geblieben sind. Dublettenerkennung beim Hinzufügen: gleicher Verlauf, oder gleicher Dateiname mit fast gleicher Länge (viele Mapy-Exporte heißen „export.gpx“).
- Bekannt, nicht geändert: Abstand zu vorhandenen Trails wird nur in eine Richtung geprüft (neuer Trail gegen vorhandene Linie); in einem gemischten Stand sind neue Trails ans Ende gehängt, ohne dass die Orte zusammenhängen.
- Gespeicherte Stände ohne diese Felder laufen unverändert weiter. Die Ketten-Berechnung beim Import ist in eine gemeinsame Funktion gewandert (Ergebnis wie vorher).

## V2.1 – 23.10.2026

Übersicht pro Ort und Dateiname bei importierten Trails.

- **Übersicht pro Ort (PDF):** Neuer Knopf neben den Prüfungsbögen. Pro Ort eine A4-Seite mit Luftbild, allen Trails des Orts in eigenen Farben (Nummer am Start, Punkt am Ende) und einer Tabelle (Nr., Stufe, Länge, Start → Ende, Datei). Team und VP stehen nicht darauf, die Seite geht also schon vor der Auslosung.
- **Dateiname beim Import:** Der Name der GPX-Datei wird beim Trail gespeichert und steht am Ende der Trailkarte, auf dem Prüfungsbogen (Fußzeile) und in der Übersicht. So lässt sich ein Trail beim Austauschen der Datei zuordnen. Ältere Stände ohne Dateiname laufen weiter.

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
