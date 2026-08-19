# Stánok – kalkulačka, nákup a inventúra (v6)

## Čo opravuje v6

### 1. Nákupné údaje sú opäť priamo pri produkte
Pri bežnom produkte zadávaš rovno:
- názov,
- kategóriu,
- predávané množstvo (napr. 0,5 L),
- veľkosť nákupného balenia (napr. sud 50 L),
- nákupnú cenu balenia (napr. 66 €),
- predajnú cenu,
- plánované a skutočné kusy.

Aplikácia automaticky počíta náklad predávanej porcie.

Príklad:
- sud piva: 50 L
- cena sudu: 66 €
- predávaná porcia: 0,5 L
- cena nápoja na porciu: 0,66 €

### 2. Poháre a spotrebný materiál ostávajú v receptúre
Pohár 100 ks / 5 € = 0,05 € za kus.
Do receptúry piva pridáš 1 ks pohára a náklad piva bude obsahovať aj pohár.

### 3. Miešané drinky
Pri produkte zvoľ typ `Receptúra`.
Nákupné polia priamo v riadku sa skryjú a cenu vypočíta recept z viacerých surovín.

### 4. Opravené editovanie
Aplikácia už neprekresľuje tabuľku po každom stlačení klávesy.
Názov produktu môžeš napísať plynulo bez opakovaného klikania.

### 5. Desatinná čiarka
Ceny a množstvá prijímajú:
- `2,05`
- aj `2.05`

Po opustení poľa sa hodnota uloží a prepočíta.

## GitHub Pages – aktualizácia
Ak už máš aplikáciu na GitHube, nahraď:
- `index.html`
- `manifest.webmanifest`
- `service-worker.js`

Potom commitni zmeny. Dáta uložené v prehliadači sa zachovajú; pred aktualizáciou je aj tak dobré spraviť Export JSON.
