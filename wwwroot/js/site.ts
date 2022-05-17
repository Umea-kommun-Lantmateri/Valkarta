
const monader = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
const dagar = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];


interface Adress {
    adr: string;
    ort: string;
    lat: number;
    lon: number;
}


class app {

    private FilterButton: HTMLButtonElement = null;
    private Filtering: boolean = false;
    private Styles: {};
    private Selection: ol.interaction.Select = null;
    private SelectionCollection: ol.Collection<ol.Feature> = null;
    private Results: Adress[] = [];
    private DinAdressOverlay: ol.Overlay;
    private DinVallokalOverlay: ol.Overlay;
    private BaseUrl: string;

    public ShowAreas: boolean = false; //Show valdistrikt Areas

    public Settings = {
        BaseValLink: { url: "http://www.umea.se/val2022", title: "www.umea.se/val2022" }
    };

    init() {
        console.log("init");

        if (location.host.indexOf("localhost") > -1) {
            this.BaseUrl = "/";
        } else {
            this.BaseUrl = "/valkarta/";
        }

        window.location.hash = "";

        window.onpopstate = this.navigate;



        this.CreateMap();
        this.HideMarker();
        this.initEvents();
    }

    navigate(e: PopStateEvent) {

        console.log(e.state);

        if (!e.state) {
            a.OpenInfoScreen();
        } else {
            var to = (e.state as { to: string }).to;

            if (to === "karta") {
                a.CloseInfoScreen();
                document.getElementById("Find")?.classList.remove("show");
            } else if (to === "sök") {
                a.CloseInfoScreen();
                document.getElementById("Find")?.classList.add("show");
            }
        }

    }

    CreateMap() {
        //Base Map
        map.AddLayer("WMS", map.WMS.getWMS({
            Layer: "Projektkarta_V2",
            Projection: ol.proj.get("EPSG:3006"),
            ZoomRange: 20,
            Resolutions: [3532.8773948498006, 1766.4386974249003, 883.2193487124501, 441.60967435622507, 220.80483717811254, 110.40241858905627, 55.201209294528134, 27.600604647264067, 13.800302323632033, 6.900151161816017, 3.4500755809080084, 1.7250377904540042, 0.8625188952270021, 0.431259447613501, 0.2156297238067505, 0.1078148619033753, 0.0539074309516876, 0.0269537154758438, 0.0134768577379219, 0.006738428868961, 0.0033692144344805]
        }));

        //GeoJSON Layers
        this.AddGeoJson("data/vallokaler.json", "punkter");
        this.AddGeoJson("data/valdistrikt.json", "valdistrikt");

        //Searched address point layer
        map.AddLayer("Adress", new ol.layer.Vector({
            source: new ol.source.Vector(),

            style: a.StyleFunction as ol.StyleFunction
        }));


        map.CreateMap("map", 13, 0, map.GetProjection("SWEREF 99 TM"), true);
        map.setCenter([758621.5650406014, 7088235.931180363], map.GetProjection("SWEREF 99 TM"));
        map.setZoom(7);
        map.GetMap().getView().setMaxZoom(15);
        map.GetMap().getView().setMinZoom(4);

        document.getElementById("ZoomPlus")?.addEventListener("click", () => { map.ZoomIn(); });
        document.getElementById("ZoomMinus")?.addEventListener("click", () => { map.ZoonOut(); });
    }

    initFilter() {
        const items = document.querySelectorAll("#Filter .item");
        for (let i = 0; i < items.length; i++) {
            items[i].addEventListener("click", (e) => {
                let target: HTMLButtonElement = e.target as HTMLButtonElement;

                if (target.localName !== "button") {
                    target = target.parentElement as HTMLButtonElement;
                }


                if (this.FilterButton === e.target) {
                    //är det samma så ska filtreringen tas bort.

                    this.FilterButton.classList.remove("on");
                    this.Filtering = false;
                    this.OnlyShow("");
                    this.FilterButton = null;

                    document.getElementById("FilterShowAll")?.classList.remove("show");
                } else {
                    //filtrera på den här typen

                    this.Filtering = true;
                    this.OnlyShow(target.getAttribute("data-type") as string);

                    target.classList.add("on");

                    if (this.FilterButton) {
                        this.FilterButton.classList.remove("on");
                    }

                    this.FilterButton = target
                    document.getElementById("FilterShowAll")?.classList.add("show");
                }

                if (window.innerWidth <= 876) {
                    document.getElementById("Filter")?.classList.remove("show");
                }

                document.getElementById("FilterCloseArea")?.classList.remove("show");
            });
        }

        document.getElementById("FilterButton")?.addEventListener("click", () => {
            document.getElementById("Filter")?.classList.add("show");

            document.getElementById("FilterCloseArea")?.classList.add("show");
        });

        document.getElementById("FilterCloseArea")?.addEventListener("click", () => {
            document.getElementById("Filter")?.classList.remove("show");
            document.getElementById("FilterCloseArea")?.classList.remove("show");
        });

        document.getElementById("FilterShowAll")?.addEventListener("click", () => {
            //Ta bort filtreringen helt

            this.FilterButton.classList.remove("on");
            this.Filtering = false;
            this.OnlyShow("");
            this.FilterButton = null;
            document.getElementById("FilterShowAll")?.classList.remove("show");
        });
    }

    initEvents() {

        const CloseInfroScreen = document.querySelectorAll(".CloseInfroScreen");

        for (let i = 0; i < CloseInfroScreen.length; i++) {
            CloseInfroScreen[i].addEventListener("click", () => {
                this.AddNavState("karta");
                this.CloseInfoScreen();
            });
        }



        this.Selection = new ol.interaction.Select({
            condition: ol.events.condition.click,
            layers: [map.GetLayer("punkter")],
            style: (feature: ol.Feature, resolution: number) => {

                if (feature.get("Selected") === "true") {
                    return [new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 10,
                            fill: new ol.style.Fill({
                                color: "#079592"
                            })
                        }),
                        stroke: new ol.style.Stroke({
                            color: "#000",
                            width: 2
                        })

                    })];

                }

                if (feature.get("Förtidsröstning") === "Ja") {
                    return [new ol.style.Style({
                        image: new ol.style.Icon({
                            src: a.BaseUrl + "img/Fortidsrostningslokal_aktiv.png",
                            anchor: [0.5, 0.8]
                        })

                    })];
                }

                return [new ol.style.Style({
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

                })];

            }
        });

        map.addInteraction(this.Selection);

        this.SelectionCollection = this.Selection.getFeatures();
        this.SelectionCollection.on("add", (Feature: ol.Feature) => {

            this.SelectionCollection.forEach((f) => {
                this.ShowMarker(f);
            });

        });

        this.SelectionCollection.on("remove", (Feature: ol.Feature) => {
            this.HideMarker();

        });


        document.getElementById("HittaButton")?.addEventListener("click", () => {
            document.getElementById("Find")?.classList.add("show");
            this.AddNavState("sök");
        });

        document.getElementById("CloseFind")?.addEventListener("click", () => {
            document.getElementById("Find")?.classList.remove("show");
        });

        document.getElementById("FindSearch")?.addEventListener("input", () => {
            this.Search(document.querySelector<HTMLInputElement>("#FindSearch").value, "SearchResults");
        });

        document.getElementById("FindSearch")?.addEventListener("keyup", function (e) {
            if (e.keyCode === 40) {
                const lis = (document.getElementById("SearchResults") as HTMLUListElement).getElementsByTagName("li") as HTMLCollectionOf<HTMLLIElement>;

                for (let i = 0; i < lis.length; i++) {
                    lis[i].focus();
                    break;
                }

            } else {
                //app.SearchAdresser(false);
            }
        });

        document.getElementById("FindSearch2")?.addEventListener("input", () => {
            this.Search(document.querySelector<HTMLInputElement>("#FindSearch2").value, "SearchResults2");
        });

    }

    OnlyShow(Type: string) {

        for (let l = 1; l < map.settings.layers.length; l++) {
            const items = (<ol.source.Vector>map.settings.layers[l].layer.getSource()).getFeatures();

            if (Type === "") {
                for (let i = 0; i < items.length; i++) {
                    items[i].set("FilterSymbol", "");
                }
            } else {
                for (let i = 0; i < items.length; i++) {
                    if ((<String>items[i].get("Symbol")).indexOf(Type) > -1) {
                        items[i].set("FilterSymbol", Type);
                    } else {
                        items[i].set("FilterSymbol", "");
                    }
                }
            }

            map.settings.layers[l].layer.getSource().refresh();
        }
    }

    StyleFunction(feature: ol.Feature, resolution: number) {
        if (feature.getGeometry().getType() === "Point") {

            if (feature.getProperties()["adress"]) {
                return [new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 10,
                        fill: new ol.style.Fill({
                            color: "#079592"
                        })
                    }),
                })];
            } else {

                if (feature.get("Selected") === "true") {


                    return [new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 10,
                            fill: new ol.style.Fill({
                                color: "#079592"
                            })
                        }),
                        zIndex: 1000
                    })];

                } else {

                    if (feature.get("Förtidsröstning") === "Ja") {
                        return [new ol.style.Style({
                            image: new ol.style.Icon({
                                src: a.BaseUrl + "img/Fortidsrostningslokal.png",
                                anchor: [0.5, 0.8]
                            })
                        })];
                    }
                }

            }
        }



        if (a.ShowAreas) {
            return new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: "Red",
                    width: 5

                }),
                text: new ol.style.Text({
                    text: feature.get("VD_NAMN"),
                    stroke: new ol.style.Stroke({
                        color: "Red",
                        width: 3
                    }),
                    fill: new ol.style.Fill({
                        color: "#FFFFFF"
                    })
                })
            })
        }


        return [new ol.style.Style()];
    }




    AddGeoJson(url: string, name: string) {
        map.AddLayer(name, new ol.layer.Vector({
            source: new ol.source.Vector({
                format: new ol.format.GeoJSON(),
                url: this.BaseUrl + url
            }),

            style: a.StyleFunction as ol.StyleFunction
        }));

        map.GetLayer(name).getSource().on("change", function (e) {
            if (map.GetLayer(name).getSource().getState() === "ready") {

                const s = map.GetLayer(name).getSource() as ol.source.Vector;
                const ff = s.getFeatures();

                for (let i = 0; i < ff.length; i++) {
                    ff[i].set("Layer", name);
                }
            }
        });
    }

    CloseInfoScreen() {
        document.getElementById("InfroScreen")?.classList.remove("open");
    }

    OpenInfoScreen() {
        document.getElementById("InfroScreen")?.classList.add("open");
    }

    ShowMarker(f: ol.Feature) {
        console.log(f);
        const d = document.createDocumentFragment();

        const close = document.createElement("button");
        close.innerText = "X";
        close.classList.add("CloseMarker");
        close.addEventListener("click", () => {
            this.HideMarker();
        });
        d.appendChild(close);

        const header = document.createElement("h3");
        header.innerText = (f.get("Vallokalnamn"));
        d.appendChild(header);

        const adress = document.createElement("h4");
        adress.innerText = f.get("Adress");
        d.appendChild(adress);

        const genericInfo = document.createElement("h4");
        genericInfo.innerHTML = "<h3><u>När du ska rösta: </u></h3><br><p>Ta med id-handling och ditt röstkort.<br>På röstkortet finns mer information.</p>";
        d.appendChild(genericInfo);

        const link = document.createElement("a");
        link.innerHTML = "<a href='" + this.Settings.BaseValLink.url + "' target='_blank'>" + this.Settings.BaseValLink.title + "</a>  ";
        d.appendChild(link);

        const oppettider = document.createElement("h4");
        oppettider.innerText = "Öppettider för lokalen finns nedan"
        d.appendChild(oppettider);

        let OpenDays = false;

        for (const item in f.getProperties()) {
            if (item.split("_")[0] === "Datum") {
                const datum = document.createElement("h3");

                const dat = new Date(item.split("_")[1].substr(0, 4) + "-" + item.split("_")[1].substr(4, 2) + "-" + item.split("_")[1].substr(6, 2));

                if (dat.getTime() > new Date().getTime()) {
                    if (f.get("Valdag") === "Ja" && f.getProperties()[item] === "Stängt") {

                    } else {
                        datum.innerText = dagar[dat.getDay()] + " " + dat.getDate() + " " + monader[dat.getMonth()];
                        d.appendChild(datum);



                        const oppet = document.createElement("p");
                        oppet.innerText = f.getProperties()[item];


                        d.appendChild(oppet);
                        OpenDays = true;

                    }



                }
            }
        }


        if (OpenDays === false) {
            const p = document.createElement("p");
            p.innerText = "Det finns inga öppna dagar för den här lokalen."
            d.appendChild(p);
        }

        (document.getElementById("Markerinfo") as HTMLDivElement).innerHTML = "";
        document.getElementById("Markerinfo")?.appendChild(d);
        document.querySelector("#Markerinfo")?.classList.add("show");
    }

    HideMarker() {
        if (this.SelectionCollection) {
            this.SelectionCollection.clear();
        }
        document.querySelector("#Markerinfo")?.classList.remove("show");
    }

    capitaliseAddresses(adr) {
        function capitaliseFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        adr = adr.toLowerCase();

        const words = adr.split(" ");
        adr = "";
        for (let i = 0; i < words.length; i++) {
            adr += capitaliseFirstLetter(words[i]) + " ";
        }

        return adr;
    }

    capitaliseFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }


    Search(query: string, SearchResults: string) {
        network.GET(this.BaseUrl + "api/Search/HomeAddress?query=" + query, (data: Adress[]) => {
            this.Results = data;

            (document.getElementById(SearchResults) as HTMLDivElement).innerHTML = "";

            const items = document.createElement("ul");

            for (let i = 0; i < data.length; i++) {
                const item = document.createElement("li");
                item.setAttribute("data-id", i.toString());
                item.setAttribute("tabindex", (10 + i).toString());
                item.innerText = this.capitaliseAddresses(data[i].adr.toLowerCase());

                const ort = document.createElement("span");
                ort.innerText = this.capitaliseFirstLetter(data[i].ort);
                item.appendChild(ort);

                item.addEventListener("click", function () {
                    a.GoToAdress(parseInt(this.getAttribute("data-id") as string));
                });

                item.addEventListener("keyup", function (e) {
                    //console.log(e);

                    const tabindex = this.tabIndex;

                    const lis = (document.getElementById(SearchResults) as HTMLUListElement).getElementsByTagName("li");

                    //if (e.key === "ArrowDown") {
                    if (e.keyCode === 40) {
                        let nx = false;
                        for (let i = 0; i < lis.length; i++) {
                            if (nx) {
                                lis[i].focus();
                                break;
                            }

                            if (tabindex === lis[i].tabIndex) {
                                nx = true;
                            }


                        }

                        //} else if (e.key === "ArrowUp") {
                    } else if (e.keyCode === 38) {
                        let nx = false;
                        for (let i = lis.length - 1; i >= 0; i--) {
                            if (nx) {
                                lis[i].focus();
                                break;
                            }

                            if (tabindex === lis[i].tabIndex) {
                                nx = true;
                            }


                        }
                    } else if (e.keyCode === 13) {
                        //a.Go parseInt(this.getAttribute("data-id")));

                        a.GoToAdress(parseInt(this.getAttribute("data-id") as string));
                    }
                });

                items.appendChild(item);
            }




            (document.getElementById(SearchResults) as HTMLDivElement).appendChild(items);

        }, (err) => { })
    }

    GoToAdress(id: number) {
        const item = this.Results[id];

        const valdistrikt = (map.GetLayer("valdistrikt") as ol.layer.Vector).getSource().getFeatures();
        const vallokaler = (map.GetLayer("punkter") as ol.layer.Vector).getSource().getFeatures();

        for (let i = 0; i < vallokaler.length; i++) {
            vallokaler[i].set("Selected", "false");
        }

        if (this.DinAdressOverlay) {
            map.GetMap().removeOverlay(this.DinAdressOverlay);
            map.GetMap().removeOverlay(this.DinVallokalOverlay);
        }

        document.getElementById("Find")?.classList.remove("show");
        document.getElementById("InfroScreen")?.classList.remove("open");
        a.AddNavState("karta");

        (document.getElementById("HittaButton") as HTMLButtonElement).innerText = "Ny sökning till vallokal";

        const coords = proj4("EPSG:4326", "EPSG:3006", [item.lon, item.lat]);


        const overlaydiv = document.createElement("div");
        overlaydiv.classList.add("DinAdress");
        overlaydiv.innerText = "Din adress";

        this.DinAdressOverlay = new ol.Overlay({
            position: coords,
            positioning: "bottom-center",
            element: overlaydiv
        })

        map.GetMap().addOverlay(this.DinAdressOverlay);

        for (let i = 0; i < valdistrikt.length; i++) {
            if (valdistrikt[i].getGeometry().intersectsCoordinate(coords)) {
                const valdistrikt_name = (valdistrikt[i].getProperties()["VD_NAMN"] as string).trim();


                for (let j = 0; j < vallokaler.length; j++) {
                    let Valdistriktsnamn_filter = (vallokaler[j].getProperties()["Valdistriktsnamn"] as string).split(",");

                    //om en vallokal har flera destrikt
                    for (let z = 0; z < Valdistriktsnamn_filter.length; z++) {
                        var namn = Valdistriktsnamn_filter[z];

                        //ta bort nummren i början
                        if (isNaN(namn.substr(0, 1) as any) == false) {
                            namn = namn.substr(namn.indexOf(" ")).trim();
                        }

                        if (namn === valdistrikt_name) {
                            console.log("vallokalersnamn: '" + namn + "' valdistrikt namn: '" + valdistrikt_name + "', OK: ", namn === valdistrikt_name);
                        }

                        if (namn === valdistrikt_name) {
                            this.SelectionCollection.push(vallokaler[j]);

                            vallokaler[j].set("Selected", "true");

                            const ext = ol.extent.boundingExtent([(vallokaler[j].getGeometry() as ol.geom.Point).getCoordinates(), coords])

                            var paddingleft = 300;

                            if (window.innerWidth <= 600) {
                                paddingleft = 60;
                            }

                            map.GetMap().getView().fit(ext, { padding: [120, 60, (screen.height / 2) + 35, paddingleft] });

                            const overlaydiv2 = document.createElement("div");
                            overlaydiv2.classList.add("Dinvallokal");
                            overlaydiv2.innerText = "Din vallokal";

                            this.DinVallokalOverlay = new ol.Overlay({
                                position: (vallokaler[j].getGeometry() as ol.geom.Point).getCoordinates(),
                                positioning: "bottom-center",
                                element: overlaydiv2,
                                offset: [0, -20]

                            })
                            map.GetMap().addOverlay(this.DinVallokalOverlay);

                            break;
                        }
                    }
                }

            }
        }




        //Log that a user has searched for an address
        const data = {
            userAgent: navigator.userAgent,
            currentScreenWidth: window.innerWidth,
            currentScreenHeight: window.innerHeight
        };

        network.POST(this.BaseUrl + "api/Search/LogSearch", data, () => { }, (err) => { });
    }

    AddNavState(to: string) {
        window.history.pushState({ to: to }, document.title, location.pathname + "#" + to);

    }

    Test_vallokaler() {

        const valdistrikt = (map.GetLayer("valdistrikt") as ol.layer.Vector).getSource().getFeatures();
        const vallokaler = (map.GetLayer("punkter") as ol.layer.Vector).getSource().getFeatures();

        console.log("Start TEST");

        for (let x = 0; x < valdistrikt.length; x++) {
            const valdistrikt_name = (valdistrikt[x].getProperties()["VD_NAMN"] as string).trim()

            console.log("valdistrikt: " + valdistrikt_name);
            var exist = false;

            for (let i = 0; i < vallokaler.length; i++) {
                if ((vallokaler[i].getProperties()["Valdag"] as string) === "Ja") {
                    const Valdistriktsnamn_filter = (vallokaler[i].getProperties()["Valdistriktsnamn"] as string).split(",");
                    //console.log(Valdistriktsnamn_filter);

                    for (let z = 0; z < Valdistriktsnamn_filter.length; z++) {
                        var namn = Valdistriktsnamn_filter[z];

                        //ta bort nummren i början
                        if (isNaN(namn.substr(0, 1) as any) == false) {
                            namn = namn.substr(namn.indexOf(" ")).trim();
                        }

                        if (namn === valdistrikt_name) {
                            console.log("   vallokal: " + namn);
                            exist = true;
                            break;
                        }
                    }
                }
            }

            if (exist === false) {
                console.error("Fail");
            }
        }

        console.log("End TEST");
    }

    TEST_Valdestrikt() {
        const valdistrikt = (map.GetLayer("valdistrikt") as ol.layer.Vector).getSource().getFeatures();

        for (let i = 0; i < valdistrikt.length; i++) {
            console.log(valdistrikt[i].get("VD_NAMN"));
        }
    }

}


const a = new app();


a.init();

