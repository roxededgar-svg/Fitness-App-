# VITALIS – Rise of Legends ⚡

**Trainiere. Kämpfe. Werde legendär.**
Fitness-Battle-App, die per Kamera deine Körperbewegung erkennt und Wiederholungen automatisch zählt.
Tritt 1 gegen 1 an – der Tauziehen-Balken verschiebt sich live mit jeder Wiederholung.

## Features

| Bereich | Inhalt |
|---|---|
| **Kamera-Erkennung** | MediaPipe Pose, komplett lokal im Browser. Zählt Liegestütze, Kniebeugen, Burpees, Jumping Jacks, Sit-ups, Mountain Climber und Plank (Sekunden). Beide Körperseiten werden gemittelt, kurze Aussetzer überbrückt, die Startposition kalibriert sich selbst. Liegestütze und Kniebeugen funktionieren seitlich und frontal. Halbe Wiederholungen zählen nicht. |
| **Arena** | Ranked (Trophäen, Gegner im Tempo deines Rangs), Schnellkampf, Eigenes Tempo. 7 Ränge mit eigenen Emblemen, monatliche **Saisons** mit Belohnung und weichem Reset. KI-Gegner sind in der Rangliste gekennzeichnet. |
| **Freundes-Duelle** | Lauf aufzeichnen → Duell-Link teilen → Freund kämpft live gegen deinen Ghost. |
| **Trainingspfad** | 7 Welten mit Kulisse, Monstern, Schatzkisten und Bossen; 1–3 Sterne pro Station. |
| **Trainingspläne** | 6-Wochen-Pläne (100 Liegestütze, 200 Kniebeugen, Core, 3 min Plank) mit Starttest, 5 Sätzen pro Einheit, Kamera-Zählung und Pausen-Timer. |
| **Progression** | Level schalten Shop-Artikel frei. Gold & Edelsteine für Avatar-Rahmen, Titel und Streak-Schutz. 22 drehbare 3D-Abzeichen, Fortschrittskurve pro Übung, Missionen, Streak. |
| **Daten** | Lokal gespeichert, Speicher als „dauerhaft“ angefragt. Sicherung als Datei exportieren/importieren (Einstellungen → Datensicherung). |
| **App** | Installierbar (PNG-Icons für iOS), offline nutzbar per Service Worker, Einführung für neue Spieler. |

## Starten

```bash
npm install
npm run dev        # http://localhost:5173 (lädt Modell & WASM einmalig nach public/)
npm test           # Unit-Tests (Zähl-Logik, Ränge, Pfad, Duell-Links …)
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
  lib/         Spiellogik: Ränge/Level, Saisons, Shop, Pläne, Bots, Pfad, Missionen, Abzeichen, Duell-Links, Store
  screens/     Auth, Einführung, Start, Pfad, Arena, Karriere, Training, Pläne, Workout, Shop, Matchmaking, Kampf, Ergebnis, Einstellungen, Duell
  components/  UI-Bausteine (Level-Ring, Wochen-Chart, Tauziehen-Balken, Verlaufsgrafik …)
```

Daten werden lokal gespeichert (localStorage) – mit Export/Import als Sicherung. Arena-Gegner sind gekennzeichnete
KI-Gegner mit realistischem Tempo. Geräteübergreifende Konten, echte Online-Gegner und fälschungssichere Duelle
benötigen ein Backend (z. B. Supabase/Firebase) – die Datenschicht (`src/lib/store.ts`) ist dafür die zentrale Stelle.
