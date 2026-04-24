# The Sellers Take — OBS Setup Guide

## One-time setup (20 minutes)

### 1. Install OBS (if not already)
https://obsproject.com/download

### 2. Create a new Scene Collection
OBS menu: Scene Collection → New → name it "The Sellers Take"

### 3. Create these 8 scenes
In the Scenes panel (bottom-left), click "+" for each:

1. Starting Soon
2. Intro
3. Main
4. Screen Share
5. Hot Take
6. Guest Split
7. BRB
8. Ending

### 4. Add Browser Sources

For each scene, click "+" in the Sources panel → **Browser** → configure:

| Scene | URL | Width | Height |
|---|---|---|---|
| Starting Soon | https://mrsellers.homes/take/scenes/starting-soon | 1920 | 1080 |
| Intro | https://mrsellers.homes/take/scenes/intro | 1920 | 1080 |
| Main | https://mrsellers.homes/take/scenes/main | 1920 | 1080 |
| Screen Share | https://mrsellers.homes/take/scenes/screen-share | 1920 | 1080 |
| Hot Take | https://mrsellers.homes/take/scenes/hot-take | 1920 | 1080 |
| Guest Split | https://mrsellers.homes/take/scenes/guest-split | 1920 | 1080 |
| BRB | https://mrsellers.homes/take/scenes/brb | 1920 | 1080 |
| Ending | https://mrsellers.homes/take/scenes/ending | 1920 | 1080 |

**Important:** Check "Refresh browser when scene becomes active" on each one.

### 5. Add your webcam
On **Main**, **Screen Share**, and **Guest Split**, add a "Video Capture Device" source for your webcam.

- **Main:** position however you like
- **Screen Share:** small, bottom-right-ish, circular crop looks good
- **Guest Split:** fills the left half of the frame

### 6. Add screen capture source (Screen Share scene only)
On the Screen Share scene, add a "Display Capture" or "Window Capture" source **BELOW the browser overlay** in the sources list. The overlay (name tag, LIVE badge, ticker) sits on top; your screen/window shows through in the middle.

### 7. Add audio sources

Once you've got the audio files in `take/shared/assets/` (see [Audio Pack](#audio-pack) below), add them as Media Sources:

- **Starting Soon:** `lofi-bed.mp3` — Loop: on, Volume ~40%
- **BRB:** `lofi-bed.mp3` — Loop: on, Volume ~30%
- **Ending:** `lofi-bed.mp3` — Loop: off, fades out naturally
- **Hot Take:** `hot-take-hit.mp3` — Loop: off, plays when scene activates
- **Intro:** `intro-stinger.mp3` — Loop: off, plays when scene activates

### 8. Link YouTube
Settings → Stream → Service: YouTube → paste your stream key from YouTube Studio → OK.

### 9. Hotkeys (recommended)
Settings → Hotkeys → assign keys under "Switch to scene":

- **F1:** Starting Soon
- **F2:** Intro
- **F3:** Main
- **F4:** Screen Share
- **F5:** Hot Take
- **F6:** Guest Split
- **F7:** BRB
- **F8:** Ending

---

## Daily go-live ritual (under 60 seconds)

1. Open your bookmarked control panel: **https://mrsellers.homes/take/control**
2. Optional: type today's topic → **SAVE & SHOW** (otherwise the evergreen lines rotate)
3. Open OBS → click **Start Streaming** (stream begins in Starting Soon)
4. When ready to actually start: press **F2** (Intro) → wait 6 seconds → press **F3** (Main)
5. Go.

## During the show

- **F4** — switch to Screen Share (have the window/screen you want to show already open)
- **F5** — drop a Hot Take for ~8–10 seconds, then **F3** back to Main
- **F7** — bathroom break / water; **F3** when back
- **F8** — wrap; hold ~15 sec; **Stop Streaming**

---

## Audio pack

Audio files live at `mrsellers-homes/take/shared/assets/` and are served from `https://mrsellers.homes/take/shared/assets/<filename>`.

Files to source from YouTube Audio Library (free, monetization-safe) — https://studio.youtube.com → Audio Library:

- **`lofi-bed.mp3`** — 3+ min chill lo-fi hip-hop loop, no vocals. Filter: Genre = Hip Hop & Rap, Mood = Calm.
- **`hot-take-hit.mp3`** — short (~0.5–1s) impact/boom. Search "impact" or "boom".
- **`intro-stinger.mp3`** — ~4s drum hit + scratch + boom combo. Either pick a single 4s stinger or combine in Audacity/GarageBand.
- **`transition-whoosh.mp3`** (optional) — ~0.3s whoosh for scene transitions.

Download → rename → save to `take/shared/assets/` → commit + push. Files auto-deploy with the site.

---

## Troubleshooting

**Ticker isn't updating after I save in the control panel?**
The overlay polls every 5 seconds. Wait 5–10s. If it's still stuck, right-click the Browser source in OBS → Properties → make sure "Refresh browser when scene becomes active" is checked → switch scenes away and back.

**Control panel keeps asking for password?**
Cookies expire after 30 days, or if you clear your browser data. Just re-enter the password.

**I forgot the password.**
Open Terminal:
```
cd ~/Documents/Claude\ Code\ MrSellersHomes/sellers-take-api
npx wrangler secret put CONTROL_PASSWORD
```
Type a new one.

**Date in intro animation looks wrong.**
It uses your Mac's clock. Check System Settings → Date & Time.

**The overlays are cached and won't update after I change them.**
In the Browser Source's Properties, click "Refresh cache of current page" after each edit. Or delete and re-add the source.

---

## URLs reference

- **Control panel:** https://mrsellers.homes/take/control
- **Public API (read-only, for OBS):** https://mrsellers.homes/api/topic
- **Scene URLs:** see table in Section 4 above
- **Audio pack:** https://mrsellers.homes/take/shared/assets/

---

## What each scene does

| Scene | Purpose | Duration |
|---|---|---|
| Starting Soon | Pre-roll: countdown + logo, lets viewers file in | 2–5 min |
| Intro | 6-sec branded stinger (date types in, logo reveals, red flash) | 6 sec |
| Main | You on camera — workhorse scene | ~80% of show |
| Screen Share | MLS / Twitter / Housing Wire / market stats on screen, you in corner | as needed |
| Hot Take | Full-screen pull-quote card — good for Shorts/Reels clips | 8–10 sec |
| Guest Split | Side-by-side when you have a guest | as needed |
| BRB | Honest "be right back" with count-up timer | under 5 min |
| Ending | Sign-off with next-episode date + all socials | ~15 sec hold |

---

*Built as a single-operator system. No OBS plugins required. Everything is web-based — change brand lines, topics, or next-episode text from your phone.*
