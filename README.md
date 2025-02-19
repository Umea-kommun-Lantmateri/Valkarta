# Valkartan
Valkartan är en karta som visar var man kan rösta i Umeå Kommun

Den är byggd med ASP.NET Core .net 6 och den använder MSSQL Server

![Valkartan](/Screenshot1.png)

## Databas
Det måste finns en tabell med alla adresser som heter __dbo_TF_BYG_ADRESS_V1__ om man vill att den ska heta något annat måste man ändra i filen [AdressSearch.cs](/Models/AdressSearch.cs)

__dbo_TF_BYG_ADRESS_V1__
| Kolumnnamn | Typ |
| --- | ---|
| BELADRESS | nvarchar(107) |
| POSTNR | nvarchar(6) |
| KOMDEL | nvarchar(35) |
| Lat | float (WGS84) |
| Long | float (WGS84)|

__tbValkartaVisitorLog__
| Kolumnnamn | Typ |
| --- | ---|
| VisitorLogId | Int |
| UserAgent | nvarchar(500) |
| DateVisited | datetime |
| ScreenWidth | Int |
| ScreenHeight | Int |

Databasanslutning sätter du i [appsettings.json](/appsettings.json)
```json
"ConnectionStrings": {
  "DB": "Data Source=DB-Server;Initial Catalog=databasename;Persist Security Info=True;User ID=user;Password=123"
}
```

## Vallokaler och valdistrikt
I mappen [wwwroot/data/](/wwwroot/data/) ska det finns 2 GeoJSON filer `valdistrikt.json` och `vallokaler.json`.

> GeoJSON filerna måste vara i SWEREF 99 20 TM (EPSG:3006)

`valdistrikt.json` ska se ut så här:

```json
{
	"type" : "FeatureCollection",
	"name" : "alla_valdistrikt",
	"crs" : {
		"type" : "name",
		"properties" : {
			"name" : "EPSG:3006"
		}
	},
	"features" : [
		{
			"type" : "Feature",
			"geometry" : {
				"type" : "Polygon",
				"coordinates" : [...]
            },
			"properties" : {
				"VD_NAMN" : "Berghem Norra"
			}
        }
    ]
}
    
```

`vallokaler.json` ska se ut så här:
```json
{
	"type" : "FeatureCollection",
	"name" : "vallokaler",
	"crs" : {
		"type" : "name",
		"properties" : {
			"name" : "EPSG:3006"
		}
	},
	"features" : [
		{
			"type" : "Feature",
			"geometry" : {
				"type" : "Point",
				"coordinates" : [ 759864, 7088748 ]
			},
			"properties" : {
				"Valdistriktsnamn" : "Berghem Norra,Berghem Södra,Sandbacka,Haga Östra",
				"Adress" : "Rothoffsvägen 8, 90342 Umeå",
				"Vallokalnamn" : "Umeå Energi Arena Vind",
				"Länk" : "umea.se/val2022",
				"Valdag" : "Ja",
				"Förtidsröstning" : "Nej",
				"LocationDescription": "Hall 1"
				"Datum_20220824" : "Stängt",
				"Datum_20220825" : "Stängt",
				"Datum_20220826" : "Stängt",
				"Datum_20220827" : "Stängt",
				"Datum_20220828" : "Stängt",
				"Datum_20220829" : "08.00-21.00",
				"Datum_20220830" : "Stängt",
				"Datum_20220831" : "Stängt",
				"Datum_20220901" : "Stängt",
				"Datum_20220902" : "Stängt",
				"Datum_20220903" : "08.00-14:00",
				"Datum_20220904" : "Stängt",
				"Datum_20220905" : "Stängt",
				"Datum_20220906" : "Stängt",
				"Datum_20220907" : "Stängt",
				"Datum_20220908" : "Stängt",
				"Datum_20220909" : "Stängt",
				"Datum_20220910" : "Stängt",
				"Datum_20220911" : "08.00 - 20.00"
			}
		}
    ]
}
```

> Kopplingen mellan valdistrikt och vallokaler är `VD_NAMN` och `Vallokalnamn`. Man kan ha en eller flera områden för en vallokal. Om man vill ha flera så separera det med ett komma.

> Datum när lokalen är öppen en egen kolumn som startar med `Datum_` + Datum utan mellanslag.

## Bakgrundskartan
För att ändra bakgrundskartan så måste man ändra i [wwwroot/js/site.ts](/wwwroot/js/site.ts) i funktionen CreateMap:

```javascript
    CreateMap() {
        map.AddLayer("WMS", map.WMS.getWMS({
            Layer: "Projektkarta_V2",
            Projection: ol.proj.get("EPSG:3006"),
            ZoomRange: 20,
            Resolutions: [3532.8773948498006, 1766.4386974249003...]
        }));
```

Byt ut raderna som här till `map.AddLayer` till något som passar för dina kartor.

Här finns ett exempel för ArcGis som är taget från [openlayers.org/en/latest/examples/arcgis-tiled.html](https://openlayers.org/en/latest/examples/arcgis-tiled.html):
```javascript
map.AddLayer("WMS", new TileLayer({
    extent: [-13884991, 2870341, -7455066, 6338219], //utbredning av lagret
    source: new TileArcGISRest({
      url: "https://arcgis-server" + "/ArcGIS/rest/services/" + "layername",
      projection: ol.proj.get("EPSG:3006")
    }),
  }));
```
> Lagret måste var i SWEREF 99 TM annars måste du ändra på GeoJson och kanske på fler ställen

### Vallänk
När man trycker på en förtidsröstningslokal så finns en länk som det finns mer information om valet.
Du måste ändra i [wwwroot/js/site.ts](/wwwroot/js/site.ts) i början av classen app finns:
```javascript
public Settings = {
    BaseValLink: { url: "http://www.umea.se/val", title: "www.umea.se/val" },
    Valdag: new Date("2024-06-09"), //Sett the election day date
    ValdagsOppetTider: "08.00-21.00" //opening hours for election day
};
```

### BaseUrl
Webbsidan förutser att den ligger i mappen /valkarta/ om man vill ändra det måste man ändra `init` i [wwwroot/js/site.ts](/wwwroot/js/site.ts)
```javascript
init() {
    if (location.host.indexOf("localhost") > -1) {
        this.BaseUrl = "/";
    } else {
        this.BaseUrl = "/valkarta/";
    }
```

### Logo
För att kunna byta Logo Längst ner i högra hörnet i filen [Views/Home/Index.cshtml](/Views/Home/Index.cshtml) byt ut `alt` och `src`
 ```html
<img class="Umea" alt="Umeå Kommun" src="~/img/Umea_kommun_SVV.png" style="height:35px;" />
 ```

### byta länkar i start skärmen
I filen [Views/Home/Index.cshtml](/Views/Home/Index.cshtml) i div#InfroScreen kan man byta ut 
 ```html
<a class="btn" href="https://www.umea.se/" target="_blank">Umeå kommun valinformation</a
 ```

 ### Title på sidan
 För att ändra title på sidan så ändrar du i [Views/Home/Index.cshtml](/Views/Home/Index.cshtml)
  ```c#
ViewData["Title"] = "Rösta i Umeå kommun för val 2022";
 ```

 
## Saker att tänka på 

### koordinatsystem
Om man använder ett koordinatsystem som inte finns med i början av [wwwroot/js/map.ts](/wwwroot/js/site.ts) kan man vara tvungen att lägga till den se ex:
 ```javascript
proj4.defs("EPSG:3016", "+proj=tmerc +lat_0=0 +lon_0=20.25 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:3006", "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs ");
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");
proj4.defs("EPSG:3857", "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs");
```
Och i slutet så läggs utbredning av koordinatsystem se exempel:
 ```javascript
map.AddProjection("SWEREF 99 20 15", new ol.proj.Projection({
    code: "EPSG:3016", //SWEREF 99 20 15
    extent: [-93218.3385, 7034909.8738, 261434.62459999998, 7744215.8],
    units: 'm'
}));
```
> Man kan hämta Extent för ett koordinatsystem på [epsg.io](https://epsg.io/)

### Ändrigar av TypeScript filer (.ts) kan TypeScript CLI behövs 
Du kan installera från npm:
```
npm install typescript
```

### Visual Studio 2022
Vi använder  Visual Studio 2022 och vi använder de här extentions:
* Web Compiler 2022+ (minimering av javascript och kompilering av .less filer)


# License
[MIT](/LICENSE)