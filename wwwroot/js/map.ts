/// <reference path="Typings/openlayers.d.ts" />
declare var proj4: any;

//ol.proj.setProj4(proj4);
proj4.defs("EPSG:3016", "+proj=tmerc +lat_0=0 +lon_0=20.25 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:3006", "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs ");
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");
proj4.defs("EPSG:3857", "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs");

//@ts-ignore
//ol.proj.proj4 = proj4;

const map = {
    settings: {
        layers: [] as { name: string, layer: ol.layer.Vector | ol.layer.Tile }[],
        Projections: [] as { name: string, Projection: ol.proj.Projection }[],
        map: null as any as ol.Map,
        MapProjection: null
    },
    WMS: {
        getWMS: function (options) {
            var projectionExtent = options.Projection.getExtent();
            var size = ol.extent.getWidth(projectionExtent) / 256;
            var resolutions = new Array(options.ZoomRange); //9 kan behövas att ändras om man byter karta
            var matrixIds = new Array(options.ZoomRange);   //9 kan behövas att ändras om man byter karta
            for (var z = 0; z < options.ZoomRange; ++z) {
                // generate resolutions and matrixIds arrays for this WMTS
                resolutions[z] = size / Math.pow(2, z);
                matrixIds[z] = z;
            }

            var TileWMS = {
                origin: ol.extent.getTopLeft(projectionExtent),
                resolutions: options.Resolutions ? options.Resolutions : resolutions,
                matrixIds: matrixIds
            };

            if (options.Origin) {
                TileWMS.origin = options.Origin;
            }

            //console.log(TileWMS);

            return new ol.layer.Tile({
                extent: options.Projection.getExtent(),
                preload: 0,
                visible: true,
                source: new ol.source.TileWMS({
                    url: 'https://wms.umea.se/geoserver/gwc/service/wms',
                    tileGrid: new ol.tilegrid.WMTS(TileWMS),
                    params: {
                        'LAYERS': options.Layer,
                        'FORMAT': options.Format ? options.Format : 'image/jpeg',
                        'TILED': true,
                        'VERSION': '1.1.0',
                        'WIDTH': 256,
                        'HEIGHT': 256,
                        'SRS': options.Projection.getCode()
                    },
                    serverType: 'geoserver'
                })
            });
        }
    },
    AddLayer: function (name: string, layer) {
        map.settings.layers.push({
            name: name,
            layer: layer
        });
    },
    AddVectorLayer: function (name: string, style: ol.style.Style, StyleFunc?: boolean) {

        if (StyleFunc && StyleFunc === true) {
            map.AddLayer(name, new ol.layer.Vector({
                source: new ol.source.Vector(),
                style: style
            }))
        } else {
            map.AddLayer(name, new ol.layer.Vector({
                source: new ol.source.Vector(),
                style: function (feature, resolution) {
                    return [style];
                }
            }))
        }
    },
    GetLayer: function <E extends ol.layer.Base = ol.layer.Vector>(name: string): E {
        for (var i = 0; i < map.settings.layers.length; i++) {
            if (map.settings.layers[i].name === name) {
                return <any>map.settings.layers[i].layer;
            }
        }
        throw new Error("No Layer with that name");
    },
    AddProjection: function (name: string, Projection: ol.proj.Projection) {
        map.settings.Projections.push({
            name: name,
            Projection: Projection
        });
        ol.proj.addProjection(Projection);
    },
    GetProjection: function (name: string): ol.proj.Projection {
        for (var i = 0; i < map.settings.Projections.length; i++) {
            if (map.settings.Projections[i].name === name) {
                return map.settings.Projections[i].Projection;
            }
        }
        throw new Error("No Projection with that name");
    },
    CreateMap: function (id: Element | string, zoom: number, minZoom: number, projection: ol.proj.Projection, NoRotate?: boolean) {
        var layers = [] as (ol.layer.Vector | ol.layer.Tile)[];

        for (let i = 0; i < map.settings.layers.length; i++) {
            //console.log("LayerName:", map.settings.layers[i].name);
            layers.push(map.settings.layers[i].layer);
        }

        //console.log(layers);
        //console.log("projection:", projection.getCode());
        //console.log("id:", id);
        //console.log("zoom:", zoom);
        //console.log("minZoom:", minZoom);

        if (NoRotate === true) {
            map.settings.map = new ol.Map({
                layers: layers,
                target: id,
                pixelRatio: 1,
                interactions: ol.interaction.defaults({ altShiftDragRotate: false, pinchRotate: false }),
                view: new ol.View({
                    projection: projection,
                    zoom: zoom,
                    minZoom: minZoom
                })
            });

        } else {
            map.settings.map = new ol.Map({
                layers: layers,
                target: id,
                pixelRatio: 1,
                view: new ol.View({
                    projection: projection,
                    zoom: zoom,
                    minZoom: minZoom
                })
            });
        }

    },
    GetMap: function (): ol.Map {
        return map.settings.map;
    },
    setCenter: function (pos, Projection: ol.proj.Projection, ToProjection?: ol.proj.Projection) {
        if (ToProjection) {
            map.GetMap().getView().setCenter(ol.proj.transform(pos, Projection, ToProjection));
        } else {
            map.GetMap().getView().setCenter(ol.proj.transform(pos, Projection, map.GetMap().getView().getProjection()));
        }
    },
    setZoom: function (zoom) {
        map.settings.map.getView().setZoom(zoom);
    },
    ZoomIn: function () {
        map.GetMap().getView().setZoom(map.GetMap().getView().getZoom() + 1);
    },
    ZoonOut: function () {
        map.GetMap().getView().setZoom(map.GetMap().getView().getZoom() - 1);
    },
    on: function (event: string, callback: Function) {
        map.GetMap().on(event, callback);
    },
    addInteraction: function (interaction: ol.interaction.Interaction) {
        map.GetMap().addInteraction(interaction);
    },
    AddFeature: function (Type: "Point" | "Line" | "Polygon", Coords: any[], Propertys: any, LayerName: string) {
        if (Type === "Point") {


            var marker_coord = ol.proj.transform(<[number, number]>Coords, map.GetProjection("SWEREF 99 20 15"), map.GetMap().getView().getProjection());
            var marker_geom = new ol.geom.Point(marker_coord);
            Propertys.geometry = marker_geom;
            var marker = new ol.Feature(Propertys);

            map.GetLayer(LayerName).getSource().addFeatures([marker]);
        } else if (Type === "Line") {
            //console.log(Coords);
            var LineString = new ol.geom.LineString(Coords);

            Propertys.geometry = LineString.transform(map.GetProjection("SWEREF 99 20 15"), map.GetMap().getView().getProjection());
            var line = new ol.Feature(Propertys);
            //console.log(line);
            map.GetLayer(LayerName).getSource().addFeatures([line]);
        } else if (Type === "Polygon") {
            Coords.push([Coords[0][0], Coords[0][1]]);
            //console.log(Coords);

            var Polygon = new ol.geom.Polygon([Coords]);

            Propertys.geometry = Polygon.transform(map.GetProjection("SWEREF 99 20 15"), map.GetMap().getView().getProjection());
            var PolygonFeature = new ol.Feature(Propertys);
            //console.log(line);
            map.GetLayer(LayerName).getSource().addFeatures([PolygonFeature]);
        }
    }
};

map.AddProjection("SWEREF 99 20 15", new ol.proj.Projection({
    code: "EPSG:3016", //SWEREF 99 20 15
    extent: [-93218.3385, 7034909.8738, 261434.62459999998, 7744215.8],
    units: 'm'
}));

map.AddProjection("SWEREF 99 TM", new ol.proj.Projection({
    code: "EPSG:3006",
    //extent: [181896.33, 6101648.07, 864416.00, 7689478.31],
    //extent: [218128.7031, 6126002.9379, 1083427.2970, 7692850.9468],
    extent: [181896.32913603852, 6091282.433471196, 1086312.9422175875, 7900115.659634294],
    //extent: [-1200000, 4700000, 2600000, 8500000],
    units: 'm'
}));

//map.AddProjection("EPSG:4326", new ol.proj.Projection({
//    code: "EPSG:4326",
//    extent: [-180.0000, -90.0000, 180.0000, 90.0000],
//    units: 'Degree'
//}));

