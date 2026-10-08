# Ciel-Alltagsupdate

## Installation
1. Vor dem Update unter Mehr eine Datensicherung herunterladen.
2. Dieses ZIP vollständig entpacken.
3. Alle Dateien direkt im bestehenden GitHub-Repository Ciel über Add file → Upload files hochladen und Commit changes klicken. Vorhandene Dateien werden ersetzt; extras.js kommt neu hinzu. Keine Ordner und nicht die ZIP hochladen.
4. Nach erfolgreicher GitHub-Pages-Veröffentlichung Ciel neu laden. Am PC Strg+Umschalt+R; am iPhone bei Bedarf in Safari neu laden.

## Neu
Abos: Name, Preis in Euro, monatlich/jährlich, Kündigungsfrist und Notiz. Aktive Abos werden auf einen Monatsdurchschnitt und eine Jahressumme umgerechnet. Beendete Abos bleiben sichtbar und zählen nicht mehr mit. Beträge wie 9,99 und 9.99 werden akzeptiert.
Verliehen: Gegenstand, Person, Verleihdatum, optional Rückgabedatum und Notiz. Mit Zurückbekommen abhaken; bei einem Versehen wieder als verliehen markieren.
Mehr: Heller Modus und größere Schrift. Beide sind kombinierbar und werden auf diesem Gerät gespeichert.

## Daten
Termine, Einkaufslisten, Aufgaben und Notizen werden unter demselben Speicherschlüssel weitergeladen. Alte Sicherungsdateien können eingelesen werden; die neuen Bereiche werden darin als leer behandelt. Neue Sicherungen enthalten auch Abos und verliehene Dinge. Ein Import ersetzt weiterhin alle Daten. Anzeigeeinstellungen gelten nur auf diesem Gerät und sind nicht Teil der Sicherung.

Keine Sprachfunktion. Eine eventuell noch vorhandene voice.js wird nicht geladen.
Keine automatischen Kündigungen oder Mitteilungen: Fristen werden in der App angezeigt. Verliehene Dinge und Abos werden nicht mit anderen Geräten synchronisiert.

Prüfung: JavaScript-Syntax, Migration bisheriger Daten, Abo-Monatsdurchschnitt, Ausschluss beendeter Abos, überfällige Rückgaben, Text-Escaping und Speichern der Anzeigeeinstellungen geprüft. Visueller Test auf deinem iPhone steht noch aus.
