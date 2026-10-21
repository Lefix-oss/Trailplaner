# Mehrere Orte in einer Prüfung – Konzept

Stand: 21.10.2026 · baut auf `2026-10-21-pruefungsablauf-design.md` auf · Prüfung: 31.10.2026

## Worum es geht und warum

In Giebelstadt lassen sich nicht immer alle Trails einer Prüfung unterbringen. Die Trails dürfen sich nicht kreuzen und müssen Abstand halten, außerdem gibt es für MT-II nur wenige passende Trails. Deshalb soll eine Prüfung auf **mehrere Orte** verteilt werden können, zum Beispiel MT-I in Giebelstadt und MT-II in Eßfeld.

Die Stufen laufen nacheinander, erst alle MT-I, dann alle MT-II. MT-III gibt es beim Verein vorerst nicht. Auch eine Stufe kann sich auf zwei Orte verteilen, etwa 4 MT-I in Giebelstadt und 3 in Eßfeld. Das muss nicht vorkommen, soll aber gehen.

Der Nutzer hat den Entwurf im Browser abgenommen: Orte oben festlegen, bei jedem Team den Ort wählen.

## Verhalten

- **Orte:** Im Abschnitt „1 · Ortschaft“ gibt es eine Liste von Orten mit den Kennbuchstaben A, B, C … und dem Ortsnamen. Ein Ort ist jeweils **aktiv**. Ortssuche und Klick auf die Karte setzen die Mitte des aktiven Orts. Dazu kommen:
  - „+ weiteren Ort“ legt einen neuen Ort an und macht ihn aktiv.
  - Ein Ort lässt sich entfernen, solange mindestens einer bleibt. Seine Teams wandern dann zu Ort A.
- **Teams:** Jede Teamzeile bekommt zusätzlich zur Stufe eine Ortsauswahl. Standard ist Ort A. Gibt es nur einen Ort, wird die Auswahl nicht angezeigt, und alles sieht aus wie heute.
- **Gelände pro Ort** (Entscheidung des Nutzers): „Nur im Ort“ / „Ort und Ortsrand“ / „Auch Feld und Wald“ wird je Ort eingestellt. Radius, Fuß- und Feldwege, Mindestabstand und „nicht auf sich zurücklaufen“ gelten für alle Orte gleich.
- **Einen Ort allein neu planen** (Entscheidung des Nutzers): Im Modus „Prüfung“ gibt es pro Ort „nur diesen Ort neu planen“. Damit werden nur die Trails dieses Orts neu geplant, also die Trails der Teams, die diesem Ort zugeordnet sind. Trails, Häkchen und Zuteilung aller anderen Orte bleiben unverändert. Die neuen Trails bekommen kein Häkchen, ihre Zuteilungszeilen werden geleert. Vorher kommt eine Rückfrage. „Trails planen“ plant weiterhin alles neu, mit der bestehenden Rückfrage. Scheitert die Planung eines Orts, bleibt der bisherige Stand unverändert.
- **Planen:** „Trails planen“ plant jeden Ort für sich:
  - eigenes Wegenetz, eigene Kandidaten je Stufe, eigene Tagespläne
  - Mindestabstand und Kreuzungsfreiheit nur zwischen Trails am **selben** Ort
  - Das Ergebnis ist ein gemeinsamer Plan in der Reihenfolge der Teamliste.
  - Scheitert ein Ort, nennt die Meldung den Ort, zum Beispiel „In Eßfeld habe ich für MT-II keinen passenden Trail gefunden …“.
- **Anzeige:**
  - Die Karte zeigt die Suchkreise aller Orte und alle Trails.
  - Trailkarten nennen den Ort, etwa „Trail 8 · MT-II · Eßfeld“, aber nur bei mehr als einem Ort.
  - Das gilt für Training und Prüfung gleichermaßen.
- **Prüfungsablauf** (wie gehabt, mit Ort):
  - Ein Trail behält seinen Ort, auch gespeichert und wieder geladen.
  - „Ersetzen“ sucht am Ort des Trails. Hindernisse sind nur die übrigen Trails desselben Orts.
  - Die Zuteil-Tabelle zeigt den Ort je Zeile. Zugelost wird weiter nur innerhalb der Stufe. Ein Team kann dabei an einen anderen Ort als „sein“ Platzhalter kommen. Das ist in Ordnung, denn die Teamnamen stehen beim Planen noch nicht fest.
  - Auf dem Prüfungsbogen steht in der Zeile „Ort“ der Ort des Trails.
  - Die WhatsApp-Nachricht gliedert die Punkte nach Orten.
- **Datei:** Es bleibt eine Datei pro Prüfung, Format `trailplaner-pruefung`, neu in **Version 2** mit einer Liste von Orten und dem Ort je Trail. Dateien in Version 1 mit nur einem Ort werden beim Öffnen automatisch übernommen.

- **Orte im Prüfungsstand sind eingefroren** *(Entscheidung des Konzepts)*: Beim Planen übernimmt der Prüfungsstand Name und Mitte jedes Orts, so wie heute `ex.center`. Spätere Änderungen in „1 · Ortschaft“ (Ort verschieben, umbenennen, entfernen) wirken erst bei der nächsten Planung. Sie verändern keine gespeicherten Trails, und „Ersetzen“ sucht immer um die eingefrorene Mitte. Entfernt man einen Ort in der Liste, bleiben seine Trails im Prüfungsstand erhalten.

## Ziele

- MT-I und MT-II lassen sich an verschiedenen Orten planen, ebenso Teile einer Stufe.
- Mit nur einem Ort sieht und verhält sich alles wie bisher.
- Bestehende Prüfungsdateien und die gespeicherte Sicherung im Browser bleiben nutzbar.

## Nicht-Ziele

- Abstandsprüfung zwischen verschiedenen Orten
- Fahrzeiten oder Reihenfolge zwischen den Orten planen
- Eigener Radius, eigene Fußweg-Einstellung oder eigener Mindestabstand pro Ort (Entscheidung des Nutzers: gilt für alle Orte gleich)
- MT-III-spezifische Änderungen

## Anti-Ziele

- Ein gespeicherter Trail landet nach dem Laden an einem anderen Ort oder sieht anders aus.
- Ein Team kommt auf einen Trail einer anderen Stufe.
- Eine alte Datei oder Sicherung lässt sich nicht mehr öffnen.
- Der Training-Modus verliert Funktionen: Alternativ-Trail, Maps-Links, WhatsApp, GPX.

## Rahmenbedingungen

- Weiter eine einzige `index.html`, ohne Server. Die Logik in `Planner` und `Pruefung` bleibt DOM-frei und mit Node testbar.
- Die Wegedaten werden je Ort zwischengespeichert, mit dem bestehenden 14-Tage-Speicher, Schlüssel aus Ortsmitte und Radius.
- Bis 31.10.2026 nutzbar. Die Arbeit läuft auf dem Zweig `fix/trail-regeln`, der noch nicht online ist.

## Dem Builder überlassen

- Darstellung der Ortsliste: Farben, Kennbuchstaben, wie der aktive Ort hervorgehoben wird
- Wie Kandidaten an ihren Graphen gebunden werden. Bei mehreren Orten gibt es mehrere Graphen gleichzeitig.
- Wie die Sicherung im Browser (`trailplaner`, `trailplaner-pruefung`) auf das neue Format umgestellt wird, solange alte Stände weiter laden
