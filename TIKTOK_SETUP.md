# ÁrPárbaj LIVE – TikTok-ready verzió

## Indítás
1. Nyiss terminált ebben a mappában.
2. `npm install`
3. `npm start` vagy `node server.js`
4. Admin: a projekt meglévő admin URL-je.
5. Az admin TikTok LIVE részében add meg a saját `@felhasználóneved`, amikor már LIVE-ban vagy, majd Csatlakozás.

## Beépített TikTok funkciók
- Egyszerű, egybetűs LIVE kommentek továbbítása játék-válaszként.
- TikTok felhasználónév és profilkép továbbítása.
- Ajándékesemények továbbítása a meglévő 2x/3x szorzórendszerbe.
- Streak ajándékoknál a sorozat lezárását várja meg.
- Admin csatlakozás/leválasztás és állapot.
- Tesztválasz és dobogó teszt gombok.

## Fontos
A TikTok kapcsolat a nem hivatalos `tiktok-live-connector` csomagot használja. TikTok-változás esetén a csomag frissítése szükséges lehet.
A meglévő `uploads`, `data/questions.json` és `data/rankings.json` megmaradt.
