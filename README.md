# Buchholzer FC – Pro & Contra Dashboard

Einfaches Tool für den Vorstand: Themen anlegen und Pro/Contra-Punkte sammeln.

---

## 1. Firebase einrichten

1. Gehe zu [console.firebase.google.com](https://console.firebase.google.com) und erstelle ein neues Projekt (z.B. `buchholzer-fc-procontra`).
2. Im linken Menü → **Firestore Database** → **Datenbank erstellen** → Produktionsmodus → Region wählen (z.B. `europe-west1`).
3. **Firestore-Regeln** (für öffentlichen Zugriff ohne Login):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
   > ⚠️ Diese Regel erlaubt vollen Zugriff. Für den internen Vorstand ist das ausreichend. Später kann eine IP-Beschränkung oder einfache Auth ergänzt werden.

4. Im Zahnrad-Menü → **Projekteinstellungen** → **Deine Apps** → Web-App hinzufügen → App-Konfiguration kopieren.

---

## 2. Lokale Umgebung einrichten

```bash
# Abhängigkeiten installieren
npm install

# Env-Datei anlegen
cp .env.local.example .env.local
```

Trage in `.env.local` die Firebase-Werte aus Schritt 1 ein:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Lokal testen:
```bash
npm run dev
# → http://localhost:3000
```

---

## 3. GitHub-Repository anlegen (GitHub Desktop)

1. Öffne **GitHub Desktop** → **File → Add Local Repository** → Ordner `buchholzer-fc` wählen.
2. Wenn kein Git-Repo vorhanden: → **Initialize Repository**.
3. Alle Dateien committen: Commit-Message z.B. `Initial commit`.
4. **Publish repository** → Name: `buchholzer-fc-procontra`, Visibility: **Private**.

---

## 4. Auf Vercel deployen

1. Gehe zu [vercel.com](https://vercel.com) → **Add New Project**.
2. GitHub-Account verbinden → Repository `buchholzer-fc-procontra` importieren.
3. Framework wird automatisch als **Next.js** erkannt.
4. Unter **Environment Variables** alle 6 Firebase-Variablen aus `.env.local` eintragen.
5. **Deploy** klicken → fertig! Vercel gibt eine URL aus (z.B. `buchholzer-fc-procontra.vercel.app`).

### Updates deployen

Nach jeder Änderung in GitHub Desktop:
- Änderungen committen → **Push origin**
- Vercel deployt automatisch.

---

## Projektstruktur

```
buchholzer-fc/
├── app/
│   ├── layout.tsx          # Header, globales Layout
│   ├── page.tsx            # Startseite: Themenliste
│   └── topic/[id]/page.tsx # Themen-Detailseite mit Pro/Contra
├── lib/
│   └── firebase.ts         # Firebase-Verbindung & Datenbankfunktionen
├── .env.local.example      # Vorlage für Firebase-Konfiguration
└── README.md
```
