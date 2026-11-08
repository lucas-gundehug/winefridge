# Winefridge

Personlig vinkøleskabs-app. Tag et foto af en flaske, få den genkendt via [WineAPI](https://wineapi.io/), registrér datoen den kommer i køleskabet, og se hvornår den er bedst at drikke. Fungerer som PWA på iPhone (Del → Tilføj til hjemmeskærm).

## Funktioner

- Foto af etikette → forslag fra WineAPI (manuel redigering altid mulig)
- Tekstsøgning i WineAPI-kataloget
- Vintyper: rød, hvid, rosé, mousserende, portvin, madeira, sherry, dessert, orange
- Søgning og filter efter vintype i køleskabet
- Antal flasker ved tilføjelse (fx hele kasser) og ved udtagning
- Inventar over flasker i køleskabet
- Drikkevindue (bedst fra / bedst til)
- Registrér når en flaske tages ud (historik)
- Data gemmes lokalt i browseren (`localStorage`)

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, WineAPI.

## Kom i gang

```bash
cd Projects/winefridge
npm install
cp .env.example .env.local
# indsæt din WINEAPI_API_KEY fra https://wineapi.io/
npm run dev
```

Åbn den lokale URL fra terminalen. På iPhone: åbn siden i Safari → Del → **Tilføj til hjemmeskærm**.

## API-nøgle

Opret en gratis personlig nøgle på [wineapi.io](https://wineapi.io/) og sæt:

```
WINEAPI_API_KEY=wapi_...
```

Uden nøgle kan du stadig tilføje flasker manuelt.

## Scripts

- `npm run dev` — udviklingsserver
- `npm run build` — production build
- `npm run start` — kør production build
- `npm run lint` — ESLint
