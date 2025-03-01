﻿"use strict";

var monader = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
var dagar = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];
var app = (function () {
    function app() {
        this.FilterButton = null;
        this.Filtering = false;
        this.Selection = null;
        this.SelectionCollection = null;
        this.Results = [];
    }
    app.prototype.init = function () {
        console.log("init");
        if (location.host.indexOf("localhost") > -1) {
            this.BaseUrl = "/";
        } else {
            this.BaseUrl = "/valkarta/";
        }
        this.CreateMap();
        this.HideMarker();
        this.initEvents();
    };
    app.prototype.CreateMap = function () {
        map.AddLayer("WMS", map.WMS.getWMS({
            Layer: "Projektkarta_V2",
            Projection: ol.proj.get("EPSG:3006"),
            ZoomRange: 20,
            Resolutions: [3532.8773948498006, 1766.4386974249003, 883.2193487124501, 441.60967435622507, 220.80483717811254, 110.40241858905627, 55.201209294528134, 27.600604647264067, 13.800302323632033, 6.900151161816017, 3.4500755809080084, 1.7250377904540042, 0.8625188952270021, 0.431259447613501, 0.2156297238067505, 0.1078148619033753, 0.0539074309516876, 0.0269537154758438, 0.0134768577379219, 0.006738428868961, 0.0033692144344805]
        }));
        this.AddGeoJson("data/vallokaler.json", "punkter");
        this.AddGeoJson("data/valdistrikt.json", "valdistrikt");
        map.AddLayer("Adress", new ol.layer.Vector({
            source: new ol.source.Vector(),
            style: a.StyleFunction
        }));
        map.CreateMap("map", 13, 0, map.GetProjection("SWEREF 99 TM"), true);
        map.setCenter([758621.5650406014, 7088235.931180363], map.GetProjection("SWEREF 99 TM"));
        map.setZoom(7);
        map.GetMap().getView().setMaxZoom(15);
        document.getElementById("ZoomPlus").addEventListener("click", function () {
            map.ZoomIn();
        });
        document.getElementById("ZoomMinus").addEventListener("click", function () {
            map.ZoonOut();
        });
    };
    app.prototype.initFilter = function () {
        var _this = this;
        var items = document.querySelectorAll("#Filter .item");
        for (var i = 0; i < items.length; i++) {
            items[i].addEventListener("click", function (e) {
                var target = e.target;
                if (target.localName !== "button") {
                    target = target.parentElement;
                }
                if (_this.FilterButton === e.target) {
                    _this.FilterButton.classList.remove("on");
                    _this.Filtering = false;
                    _this.OnlyShow("");
                    _this.FilterButton = null;
                    document.getElementById("FilterShowAll").classList.remove("show");
                } else {
                    _this.Filtering = true;
                    _this.OnlyShow(target.getAttribute("data-type"));
                    target.classList.add("on");
                    if (_this.FilterButton) {
                        _this.FilterButton.classList.remove("on");
                    }
                    _this.FilterButton = target;
                    document.getElementById("FilterShowAll").classList.add("show");
                }
                if (window.innerWidth <= 876) {
                    document.getElementById("Filter").classList.remove("show");
                }
                document.getElementById("FilterCloseArea").classList.remove("show");
            });
        }
        document.getElementById("FilterButton").addEventListener("click", function () {
            document.getElementById("Filter").classList.add("show");
            document.getElementById("FilterCloseArea").classList.add("show");
        });
        document.getElementById("FilterCloseArea").addEventListener("click", function () {
            document.getElementById("Filter").classList.remove("show");
            document.getElementById("FilterCloseArea").classList.remove("show");
        });
        document.getElementById("FilterShowAll").addEventListener("click", function () {
            _this.FilterButton.classList.remove("on");
            _this.Filtering = false;
            _this.OnlyShow("");
            _this.FilterButton = null;
            document.getElementById("FilterShowAll").classList.remove("show");
        });
    };
    app.prototype.initEvents = function () {
        var _this = this;
        var CloseInfroScreen = document.querySelectorAll(".CloseInfroScreen");
        for (var i = 0; i < CloseInfroScreen.length; i++) {
            CloseInfroScreen[i].addEventListener("click", function () {
                _this.CloseInfroScreen();
            });
        }
        this.Selection = new ol.interaction.Select({
            condition: ol.events.condition.click,
            layers: [map.GetLayer("punkter")],
            style: new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 10,
                    fill: new ol.style.Fill({
                        color: "#AA1F7D"
                    }),
                    stroke: new ol.style.Stroke({
                        color: "#000",
                        width: 2
                    })
                })
            })
        });
        map.addInteraction(this.Selection);
        this.SelectionCollection = this.Selection.getFeatures();
        this.SelectionCollection.on("add", function (Feature) {
            _this.SelectionCollection.forEach(function (f) {
                _this.ShowMarker(f);
            });
        });
        this.SelectionCollection.on("remove", function (Feature) {
            _this.HideMarker();
        });
        document.getElementById("HittaButton").addEventListener("click", function () {
            document.getElementById("Find").classList.add("show");
        });
        document.getElementById("CloseFind").addEventListener("click", function () {
            document.getElementById("Find").classList.remove("show");
        });
        document.getElementById("FindSearch").addEventListener("input", function () {
            _this.Search(document.querySelector("#FindSearch").value, "SearchResults");
        });
        document.getElementById("FindSearch").addEventListener("keyup", function (e) {
            console.log(e);
            if (e.keyCode === 40) {
                var lis = document.getElementById("SearchResults").getElementsByTagName("li");
                for (var i = 0; i < lis.length; i++) {
                    lis[i].focus();
                    break;
                }
            } else {}
        });
        document.getElementById("FindSearch2").addEventListener("input", function () {
            _this.Search(document.querySelector("#FindSearch2").value, "SearchResults2");
        });
    };
    app.prototype.OnlyShow = function (Type) {
        for (var l = 1; l < map.settings.layers.length; l++) {
            var items = map.settings.layers[l].layer.getSource().getFeatures();
            if (Type === "") {
                for (var i = 0; i < items.length; i++) {
                    items[i].set("FilterSymbol", "");
                }
            } else {
                for (var i = 0; i < items.length; i++) {
                    if (items[i].get("Symbol").indexOf(Type) > -1) {
                        items[i].set("FilterSymbol", Type);
                    } else {
                        items[i].set("FilterSymbol", "");
                    }
                }
            }
            map.settings.layers[l].layer.getSource().refresh();
        }
    };
    app.prototype.StyleFunction = function (feature, resolution) {
        if (feature.getGeometry().getType() === "Point") {
            if (feature.getProperties()["adress"]) {
                return [new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 10,
                        fill: new ol.style.Fill({
                            color: "#079592"
                        })
                    })
                })];
            } else {
                return [new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 10,
                        fill: new ol.style.Fill({
                            color: "#AA1F7D"
                        })
                    })
                })];
            }
        }
    };
    app.prototype.AddGeoJson = function (url, name) {
        map.AddLayer(name, new ol.layer.Vector({
            source: new ol.source.Vector({
                format: new ol.format.GeoJSON(),
                url: this.BaseUrl + url
            }),
            style: a.StyleFunction
        }));
        map.GetLayer(name).getSource().on("change", function (e) {
            if (map.GetLayer(name).getSource().getState() === "ready") {
                var s = map.GetLayer(name).getSource();
                var ff = s.getFeatures();
                for (var i = 0; i < ff.length; i++) {
                    ff[i].set("Layer", name);
                }
            }
        });
    };
    app.prototype.CloseInfroScreen = function () {
        document.getElementById("InfroScreen").classList.remove("open");
    };
    app.prototype.ShowMarker = function (f) {
        var _this = this;
        console.log(f);
        var d = document.createDocumentFragment();
        var close = document.createElement("button");
        close.innerText = "X";
        close.classList.add("CloseMarker");
        close.addEventListener("click", function () {
            _this.HideMarker();
        });
        d.appendChild(close);
        var header = document.createElement("h3");
        header.innerText = f.get("Vallokalnamn");
        d.appendChild(header);
        var adress = document.createElement("h4");
        adress.innerText = f.get("Adress");
        d.appendChild(adress);
        var genericInfo = document.createElement("h4");
        genericInfo.innerHTML = "<h3><u>När du ska rösta: </u></h3><br><p>Ta med id-handling och ditt röstkort.<br>På röstkortet finns mer information.</p>";
        d.appendChild(genericInfo);
        var link = document.createElement("a");
        link.innerHTML = "<a href='http://www.umea.se/val' target='_blank'>www.umea.se/val</a>  ";
        d.appendChild(link);
        var oppettider = document.createElement("h4");
        oppettider.innerText = "Öppettider för lokalen finns nedan";
        d.appendChild(oppettider);
        var OpenDays = false;
        for (var item in f.getProperties()) {
            if (item.split("_")[0] === "Datum") {
                var datum = document.createElement("h3");
                var dat = new Date(item.split("_")[1].substr(0, 4) + "-" + item.split("_")[1].substr(4, 2) + "-" + item.split("_")[1].substr(6, 2));
                if (dat.getTime() > new Date().getTime()) {
                    datum.innerText = dagar[dat.getDay()] + " " + dat.getDate() + " " + monader[dat.getMonth()];
                    d.appendChild(datum);
                    var oppet = document.createElement("p");
                    oppet.innerText = f.getProperties()[item];
                    d.appendChild(oppet);
                    OpenDays = true;
                }
            }
        }
        if (OpenDays === false) {
            var p = document.createElement("p");
            p.innerText = "Det finns inga öppna dagar för den här lokalen.";
            d.appendChild(p);
        }
        document.getElementById("Markerinfo").innerHTML = "";
        document.getElementById("Markerinfo").appendChild(d);
        document.querySelector("#Markerinfo").classList.add("show");
    };
    app.prototype.HideMarker = function () {
        if (this.SelectionCollection) {
            this.SelectionCollection.clear();
        }
        document.querySelector("#Markerinfo").classList.remove("show");
    };
    app.prototype.capitaliseAddresses = function (adr) {
        function capitaliseFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }
        adr = adr.toLowerCase();
        var words = adr.split(" ");
        adr = "";
        for (var i = 0; i < words.length; i++) {
            adr += capitaliseFirstLetter(words[i]) + " ";
        }
        return adr;
    };
    app.prototype.capitaliseFirstLetter = function (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };
    app.prototype.Search = function (query, SearchResults) {
        var _this = this;
        console.log("Search:", query);
        network.GET(this.BaseUrl + "api/Search?query=" + query, function (data) {
            _this.Results = data;
            console.log(data);
            document.getElementById(SearchResults).innerHTML = "";
            var items = document.createElement("ul");
            for (var i = 0; i < data.length; i++) {
                var item = document.createElement("li");
                item.setAttribute("data-id", i.toString());
                item.setAttribute("tabindex", (10 + i).toString());
                item.innerText = _this.capitaliseAddresses(data[i].adr.toLowerCase());
                var ort = document.createElement("span");
                ort.innerText = _this.capitaliseFirstLetter(data[i].ort);
                item.appendChild(ort);
                item.addEventListener("click", function () {
                    a.GoToAdress(parseInt(this.getAttribute("data-id")));
                });
                item.addEventListener("keyup", function (e) {
                    var tabindex = this.tabIndex;
                    var lis = document.getElementById(SearchResults).getElementsByTagName("li");
                    if (e.keyCode === 40) {
                        var nx = false;
                        for (var i_1 = 0; i_1 < lis.length; i_1++) {
                            if (nx) {
                                lis[i_1].focus();
                                break;
                            }
                            if (tabindex === lis[i_1].tabIndex) {
                                nx = true;
                            }
                        }
                    } else if (e.keyCode === 38) {
                        var nx = false;
                        for (var i_2 = lis.length - 1; i_2 >= 0; i_2--) {
                            if (nx) {
                                lis[i_2].focus();
                                break;
                            }
                            if (tabindex === lis[i_2].tabIndex) {
                                nx = true;
                            }
                        }
                    } else if (e.keyCode === 13) {
                        a.GoToAdress(parseInt(this.getAttribute("data-id")));
                    }
                });
                items.appendChild(item);
            }
            document.getElementById(SearchResults).appendChild(items);
        }, function (err) {});
    };
    app.prototype.GoToAdress = function (id) {
        var item = this.Results[id];
        if (this.DinAdressOverlay) {
            map.GetMap().removeOverlay(this.DinAdressOverlay);
            map.GetMap().removeOverlay(this.DinVallokalOverlay);
        }
        document.getElementById("Find").classList.remove("show");
        document.getElementById("InfroScreen").classList.remove("open");
        var coords = proj4("EPSG:4326", "EPSG:3006", [item.lon, item.lat]);
        var overlaydiv = document.createElement("div");
        overlaydiv.classList.add("DinAdress");
        overlaydiv.innerText = "Din adress";
        this.DinAdressOverlay = new ol.Overlay({
            position: coords,
            positioning: "bottom-center",
            element: overlaydiv
        });
        map.GetMap().addOverlay(this.DinAdressOverlay);
        var valdistrikt = map.GetLayer("valdistrikt").getSource().getFeatures();
        var vallokaler = map.GetLayer("punkter").getSource().getFeatures();
        for (var i = 0; i < valdistrikt.length; i++) {
            if (valdistrikt[i].getGeometry().intersectsCoordinate(coords)) {
                var name_1 = valdistrikt[i].getProperties()["VD_NAMN"];
                for (var i_3 = 0; i_3 < vallokaler.length; i_3++) {
                    var vallokalersnamn = vallokaler[i_3].getProperties()["Valdistriktsnamn"];
                    if (isNaN(vallokalersnamn.substr(0)) !== false) {
                        vallokalersnamn = vallokalersnamn.substr(4);
                        vallokalersnamn = vallokalersnamn.trim();
                    }
                    if (vallokalersnamn === name_1) {
                        this.SelectionCollection.push(vallokaler[i_3]);
                        var ext = ol.extent.boundingExtent([vallokaler[i_3].getGeometry().getCoordinates(), coords]);
                        map.GetMap().getView().fit(ext, { padding: [35, 35, screen.height / 2 + 35, 35] });
                        var overlaydiv2 = document.createElement("div");
                        overlaydiv2.classList.add("Dinvallokal");
                        overlaydiv2.innerText = "Din vallokal";
                        this.DinVallokalOverlay = new ol.Overlay({
                            position: vallokaler[i_3].getGeometry().getCoordinates(),
                            positioning: "bottom-center",
                            element: overlaydiv2,
                            offset: [0, -20]
                        });
                        map.GetMap().addOverlay(this.DinVallokalOverlay);
                        break;
                    }
                }
            }
        }
    };
    return app;
})();
var a = new app();
a.init();
//# sourceMappingURL=site.js.map

