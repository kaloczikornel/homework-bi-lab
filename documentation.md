# Brit szupermarket adatok elemzése - Dokumentáció

## Célok:
- árak összehasonlítása a különböző szupermarketekben
- termékek árának változása az idő függvényében
- termékek árának változása a különböző szupermarketekben különböző kategóriákra

## Adatok forrása:
Az adatokat a [UK Supermarket Prices](https://www.kaggle.com/datasets/declanmcalinden/time-series-uk-supermarket-data) adathalmaz tartalmazza.

## Adatok előkészítése
Az adatok előkészítéséhez a következő lépéseket hajtottam végre:
### Az adatok betöltése
Az adatokat az adatforrás által kínált CSV fájlokból töltöttem be. A betöltési folyamatot egy ETL folyamatban valósítottam meg.
A folyamat során a Node.js pipeline-jai segítségével olvastam be az adatokat, amiket betöltés közben tisztítottam és formáztam.
A betöltési folyamat végén az adatokat Elasticsearch-be töltöttem. Az adatok betöltéséhez a [createIndex.js](./scripts/createIndex.js) scriptet használtam.
Ez a script létrehozza az indexeket, és a megfelelő mappingekkel rendelkező dokumentumokat tölti be az adatbázisba. Az indexeket a következőképpen hoztam létre:
```json
{
    "supermarket": {
        "type": "keyword"
    },
    "price": {
        "type": "double"
    },
    "price_per_unit": {
        "type": "double"
    },
    "unit": {
        "type": "keyword"
    },
    "name": {
        "type": "text"
    },
    "date": {
        "type": "date"
    },
    "category": {
        "type": "keyword"
    },
    "own_brand": {
        "type": "boolean"
    }
}
```

### Az adatok formázása
Az adatok formázása során az objectek kerültek létrehozásra. Erre azért volt szükség, hogy az Elasticsearch megfelelően tudja kezelni az adatokat.

### Az adatok tisztítása

## Adatok elemzése


## Adatok megjelenítése Kibanában


## Fejlesztői környezet
A projekt fejlesztéséhez a következő technológiákat használtam:
- Node.js
- Elasticsearch
- Kibana
- Docker

További csomagok:


