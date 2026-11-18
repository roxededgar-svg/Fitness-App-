# Illustrationen & Fotos für Vitalis

Die App ist so gebaut, dass **echte Bilder die gezeichneten Platzhalter automatisch ersetzen**.
Fehlt ein Bild, bleibt einfach die bisherige Grafik – man kann also nach und nach austauschen.

## So kommt ein Bild in die App

1. Datei mit dem **exakten Namen** aus den Tabellen unten in den Ordner `public/art/` legen, z. B. `public/art/boss-feuer.png`.
2. Den Dateinamen in `public/art/manifest.json` unter `"files"` eintragen:
   ```json
   { "files": ["flux.png", "boss-feuer.png"] }
   ```
3. Committen und veröffentlichen – fertig.

Erlaubte Formate: **PNG** oder **WebP** (mit transparentem Hintergrund), für Fotos auch **JPG**.

## Stil-Vorgaben („Tinte & Volt“)

- **Comic-Stil** mit kräftiger, schwarzer Kontur (ca. 3–4 % der Bildbreite), flache Farben, wenig Verläufe, **kein Neon-Glühen**.
- **Farben der App:** Hintergrund warmes Schwarz `#121110`, Signalfarbe Volt `#D7FF3B`, Orange `#FF8A3D`, Rot `#FF4D3D`, Papier `#FFF8E7`. Jede Welt hat zusätzlich ihre eigene Leuchtfarbe (siehe Tabelle Welten).
- Figuren **freigestellt** (transparenter Hintergrund), Blick leicht zur Kamera, gut erkennbar auch klein (ab 50 px).
- Lieber ein bisschen schräg, frech und handgemacht als glatt und perfekt.

## Begleiter Flux

Kleiner Energiegeist: rundlicher Tropfen-Körper in Volt-Gelbgrün, orange Flamme als Schopf, kurze Ärmchen, schwarze Kontur, rosa Wangen.
Format: **quadratisch, 512 × 512 px**, transparent.

| Dateiname | Stimmung |
|---|---|
| `flux.png` | Grundpose (wird genutzt, wenn eine Stimmung fehlt) |
| `flux-happy.png` | fröhlich, lächelt |
| `flux-excited.png` | begeistert, Arme hoch, Funkeln |
| `flux-think.png` | nachdenklich, schaut nach oben |
| `flux-wink.png` | zwinkert, winkt |
| `flux-proud.png` | stolz, Augen geschlossen, breites Lächeln |

## Monster (Trainingspfad)

Format: **quadratisch, 512 × 512 px**, transparent. Werden rund bzw. sechseckig ausgeschnitten – Figur mittig, etwas Rand lassen.

| Dateiname | Monster | Welt |
|---|---|---|
| `monster-neonwald-0` | Moosling | Neonwald |
| `monster-neonwald-1` | Rankenwolf | Neonwald |
| `monster-neonwald-3` | Glühpilz | Neonwald |
| `monster-neonwald-4` | Dornhirsch | Neonwald |
| `monster-kristall-0` | Frostkobold | Kristallhöhle |
| `monster-kristall-1` | Eisspinne | Kristallhöhle |
| `monster-kristall-3` | Splitterwurm | Kristallhöhle |
| `monster-kristall-4` | Gletschergolem | Kristallhöhle |
| `monster-feuer-0` | Glutwicht | Feueröde |
| `monster-feuer-1` | Aschehund | Feueröde |
| `monster-feuer-3` | Magmakäfer | Feueröde |
| `monster-feuer-4` | Schlackenriese | Feueröde |
| `monster-schatten-0` | Schattenfalter | Schattentempel |
| `monster-schatten-1` | Nachtmahr | Schattentempel |
| `monster-schatten-3` | Runenwächter | Schattentempel |
| `monster-schatten-4` | Leerenpriester | Schattentempel |
| `monster-himmel-0` | Windgeist | Himmelsfestung |
| `monster-himmel-1` | Donnervogel | Himmelsfestung |
| `monster-himmel-3` | Wolkenreiter | Himmelsfestung |
| `monster-himmel-4` | Sturmsphinx | Himmelsfestung |
| `monster-abyss-0` | Tiefseeaal | Abyss Zone |
| `monster-abyss-1` | Korallenkrabbe | Abyss Zone |
| `monster-abyss-3` | Laternenfisch | Abyss Zone |
| `monster-abyss-4` | Krakenbrut | Abyss Zone |
| `monster-olymp-0` | Goldener Hüter | Thron der Legenden |
| `monster-olymp-1` | Titanenwache | Thron der Legenden |
| `monster-olymp-3` | Sonnenläufer | Thron der Legenden |
| `monster-olymp-4` | Schatten des Champions | Thron der Legenden |

## Bosse

Format: **quadratisch, 768 × 768 px**, transparent. Bedrohlicher und detailreicher als die Monster.

| Dateiname | Boss | Beschreibung |
|---|---|---|
| `boss-neonwald` | Waldläufer Krix | Boss der Welt „Neonwald“ |
| `boss-kristall` | Eiskönigin Vex | Boss der Welt „Kristallhöhle“ |
| `boss-feuer` | Lavatitan Ignax | Boss der Welt „Feueröde“ |
| `boss-schatten` | Dunkelmagier Zoraq | Boss der Welt „Schattentempel“ |
| `boss-himmel` | Sturmherr Aeolos | Boss der Welt „Himmelsfestung“ |
| `boss-abyss` | Tiefenwächter Tholos | Boss der Welt „Abyss Zone“ |
| `boss-olymp` | Der Ewige Champion | Boss der Welt „Thron der Legenden“ |

## Welten (Titelbild hinter dem Kapitel-Namen)

Format: **Querformat, 1600 × 600 px**, JPG oder WebP. Wird oben halbtransparent hinter den Titel gelegt und nach unten ausgeblendet – wichtige Motive in die obere Bildhälfte.

| Dateiname | Welt | Stimmung |
|---|---|---|
| `world-neonwald` | Neonwald | Leuchtende Bäume, flinke Kreaturen |
| `world-kristall` | Kristallhöhle | Eisige Gänge voller Kristalle |
| `world-feuer` | Feueröde | Glühender Boden, brennende Luft |
| `world-schatten` | Schattentempel | Alte Runen, flüsternde Schatten |
| `world-himmel` | Himmelsfestung | Über den Wolken tobt der Sturm |
| `world-abyss` | Abyss Zone | Lichtlose Tiefe, uralte Wesen |
| `world-olymp` | Thron der Legenden | Der letzte Aufstieg zum Thron |

## Fotos

| Dateiname | Wo | Format |
|---|---|---|
| `photo-welcome.jpg` | Hintergrund der Anmeldeseite | Hochformat, mind. 1200 × 1800 px – z. B. du oder Freunde beim Training, echt und ungestellt |

## Kurz-Briefing zum Weitergeben

> Ich suche Illustrationen für eine Fitness-Spiele-App im **Comic-Stil** (kräftige schwarze Konturen, flache Farben, frech und handgemacht, kein glatter 3D- oder KI-Look).
> Benötigt: 1 Maskottchen in 6 Stimmungen, 28 Monster, 7 Bosse und 7 Welt-Panoramen (Wald, Eishöhle, Vulkanwüste, Schattentempel, Himmelsfestung, Tiefsee, Götterthron).
> Farben und Formate siehe Tabellen. Lieferung als PNG/WebP mit transparentem Hintergrund.
