# Stánok – plán, materiál a inventúra (v5)

## Hlavná zmena v5: spotrebný materiál je súčasť receptúr

Poháre, slamky, servítky a podobný materiál, ktorý sa spotrebúva spolu s predaným produktom,
eviduj v sekcii **Suroviny & spotrebný materiál**.

Príklad:
- Pohár 0,5 l
- jednotka: `ks`
- obsah balenia: `100`
- cena balenia: `5 €`
- cena 1 ks sa automaticky vypočíta na `0,05 €`

Do receptúry piva pridaj:
- 0,5 L piva
- 1 ks pohára

Aplikácia potom:
1. započíta 0,05 € do nákladu jedného piva,
2. z plánu predaja vypočíta počet potrebných pohárov a celých balení,
3. vo finálnej inventúre vie pracovať so zvyškom v otvorenom balení,
4. do skutočného cash výsledku započíta celé zaplatené balenie, pokiaľ ho nemožno vrátiť.

Príklad:
- kúpené: 100 pohárov za 5 €
- použité: 67
- zostatok otvoreného balenia: 33
- náklad na jeden použitý pohár v kalkulácii produktu: 0,05 €
- skutočný cash náklad akcie: 5 €

## Doplnkové náklady
Sem patria náklady, ktoré nechceš viazať ku konkrétnemu predanému drinku:
- prenájom miesta,
- prenájom výčapu / techniky,
- doprava,
- personál,
- elektrina,
- paušálne poplatky,
- iné prevádzkové náklady.

Ak chceš vedieť náklad položky na jeden drink, eviduj ju radšej ako spotrebný materiál v receptúre.

## „Iný náklad / ks“
Pri produktoch ostáva voliteľný stĺpec pre jednoduchý jednotkový náklad, ktorý nechceš viesť cez sklad/balenia.
Nepoužívaj ho pre poháre či servítky, ak ich eviduješ ako spotrebný materiál.

## Finálna inventúra
Pri každej surovine alebo spotrebnom materiáli zadáš:
- kúpené balenia,
- prípadné vrátené celé nerozbalené balenia,
- zvyšok v otvorenom balení.

Aplikácia vypočíta:
- netto nakúpené množstvo,
- reálne minuté množstvo,
- reálny náklad po vratkách,
- kontrolu oproti receptúram a skutočne predaným kusom.

## Aktualizácia na GitHub Pages
Nahraj / nahraď v koreňovom priečinku repozitára:
- `index.html`
- `manifest.webmanifest`
- `service-worker.js`

`README.md` a `sample-data.json` sú voliteľné.

Aplikácia ukladá dáta do localStorage konkrétneho prehliadača.
Pred väčšou aktualizáciou odporúčame spraviť Export JSON.
