# VITALIS – Rise of Legends ⚡

**Trainiere. Kämpfe. Werde legendär.**
Fitness-Battle-App, die per Kamera deine Körperbewegung erkennt und Wiederholungen automatisch zählt.
Tritt 1 gegen 1 an – der Tauziehen-Balken verschiebt sich live mit jeder Wiederholung.

## Features

| Bereich | Inhalt |
|---|---|
| **Kamera-Erkennung** | MediaPipe Pose (läuft komplett lokal im Browser, keine Bilder verlassen das Gerät). Zählt Liegestütze, Kniebeugen, Burpees, Jumping Jacks, Sit-ups, Mountain Climber und Plank (Sekunden). Skelett-Overlay, Tiefen-Anzeige und Form-Hinweise („Tiefer runter!“, „Hüfte gerade halten“). Halbe Wiederholungen zählen nicht. |
| **Kampfansicht** | Spieler-Header mit Avatar, Rang & ELO, Countdown-Timer (letzte 10 s pulsiert rot), **Tauziehen-Balken** der sich mit den Wiederholungen verschiebt, springende Zähler, „FÜHRUNG!“-Einblendungen, Sound & Vibration. Startet automatisch, sobald dein Körper erkannt wird. |
| **Arena (PvP)** | Matchmaking nach ELO, VS-Intro, ELO-System (K=32), Arena-Punkte mit 7 Rängen à 4 Divisionen (Rookie Realm → Legend), Rangliste Global / Land / Freunde. |
| **Freundes-Duelle** | „Herausfordern“ zeichnet deinen 60-s-Lauf auf und erzeugt einen **Duell-Link**. Wer ihn öffnet, kämpft live gegen deinen aufgezeichneten Lauf (Ghost) und wird automatisch dein Freund – ganz ohne Server. |
| **Story-Modus** | Weltkarte mit 7 Dungeons & Bossen (je eigene Übung), Level-Freischaltung, Erstbesiegungs-Bonus mit Edelsteinen. |
| **Freies Training** | Alle Übungen, Dauer ∞ bis 30 min oder eigene Zeit, optional gegen den eigenen Rekord-Ghost. |
| **Progression** | Level & XP, Gold, Edelsteine, Streak, Wochen-Diagramm, 3 tägliche Missionen (mit echtem Fortschritt), 9 Abzeichen, 6 Lieblingsabzeichen, persönliche Bestwerte, Match-Verlaufsgrafik. |
| **Fair Play** | 0 Wiederholungen = keine Belohnung; Arena-Punkte fallen nie unter 0; Aufgeben = Niederlage; Tipp-Modus (zum Testen) ist immer ungewertet. |

## Starten

```bash
npm install
npm run dev        # http://localhost:5173 (lädt Modell & WASM einmalig nach public/)
npm test           # Unit-Tests (Zähl-Logik, ELO, Duell-Links …)
npm run build      # Produktions-Build nach dist/
```

### Auf dem iPad / Handy nutzen
Kamera-Zugriff funktioniert im Browser **nur über HTTPS**. Am einfachsten:

1. Branch nach `main` mergen.
2. Im Repo unter *Settings → Pages* als Quelle **GitHub Actions** wählen.
3. Der Workflow `.github/workflows/deploy.yml` baut & veröffentlicht die App.
4. Seite in Safari öffnen → *Teilen → Zum Home-Bildschirm* → läuft wie eine native App (PWA).

**Kamera-Tipps:** Für Liegestütze/Sit-ups/Plank das Gerät seitlich auf den Boden stellen (1,5–2 m), für Jumping Jacks frontal. Der ganze Körper muss im Bild sein. In den Einstellungen gibt es Front-/Rückkamera und die Zähl-Empfindlichkeit (Locker/Normal/Streng).

## Architektur

```
src/
  pose/        Kamera + MediaPipe + Wiederholungszähler (reine Funktionen, getestet)
  lib/         Spiellogik: ELO/Ränge/Level, Bots, Dungeons, Missionen, Abzeichen, Duell-Links, Store
  screens/     Auth, Start, Karte, Arena, Karriere, Training, Matchmaking, Kampf, Ergebnis, Einstellungen, Duell
  components/  UI-Bausteine (Level-Ring, Wochen-Chart, Tauziehen-Balken, Verlaufsgrafik …)
```

Daten werden lokal gespeichert (localStorage). Arena-Gegner sind KI-Gegner mit realistischem, ELO-abhängigem Tempo
(Reaktionszeit, Ermüdung, Pausen). Echte Echtzeit-Online-Kämpfe und geräteübergreifende Konten benötigen ein Backend
(z. B. Supabase/Firebase) – die Datenschicht (`src/lib/store.ts`) ist dafür als zentrale Stelle ausgelegt.
