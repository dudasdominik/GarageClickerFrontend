# Garage Clicker Frontend

React + TypeScript (Vite) frontend a **Garage Clicker** idle/clicker játékhoz.  
A backend egy ASP.NET Core REST API, adatbázis: PostgreSQL (Docker).

---

## Funkciók

- Landing page (Sign Up / Login)
- Regisztráció / bejelentkezés
- Game page:
  - kattintásból credit gyűjtés
  - passzív credit (CPS)
  - offline gain (LastSaveAt alapján)
  - Shop: itemek listázása, vásárlás (quantity nő)
  - autosave (pl. 2 percenként)
  - opcionális kézi Save gomb (manual save)

---

## Tech stack

- React
- TypeScript
- Vite
- React Router
- Axios / fetch
- (Backend) ASP.NET Core + EF Core + PostgreSQL

---

## Előfeltételek

- Node.js (18+ ajánlott)
- Futó backend API (alapból: `http://localhost:5168`)
- Backend oldalon CORS engedélyezve a Vite originre: `http://localhost:5173`

---

## Telepítés & futtatás

### 1) Függőségek telepítése
```bash
npm install
```

### 2) Dev szerver inditása
```bash
npm run dev
```
