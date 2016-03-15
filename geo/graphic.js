var d3 = require('d3');
require('d3-geo-projection')(d3);
var jsdom = require('jsdom');
var fs = require("fs");
var topojson = require("topojson");

var admin12 = JSON.parse(fs.readFileSync("./geo/admin12.json"));
var world50m = JSON.parse(fs.readFileSync("./geo/world-50m.json"));





function cross(o, a, b) {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
}

function convexHull(points) {
    points.sort(function(a, b) {
        return a[0] == b[0] ? a[1] - b[1] : a[0] - b[0];
    });

    var lower = [];
    for (var i = 0; i < points.length; i++) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
            lower.pop();
        }
        lower.push(points[i]);
    }

    var upper = [];
    for (var i = points.length - 1; i >= 0; i--) {
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
            upper.pop();
        }
        upper.push(points[i]);
    }

    upper.pop();
    lower.pop();
    return lower.concat(upper);
}

function renderlocation(name, lon, lat, width, height) {

    var document = jsdom.jsdom();
    var overview_projection = d3.geo.orthographic()
        .scale(150)
        .translate([width / 2, height / 2])
        .rotate([-lon, -lat, -3])
        .clipAngle(90)
        .precision(.1);

    var overview_path = d3.geo.path()
        .projection(overview_projection)
        .pointRadius(function(d) {return 3;});

    var overview_graticule = d3.geo.graticule();

    var projection = d3.geo.satellite()
        .distance(1.1)
        .scale(2500)
        .rotate([-lon, -lat, -3])
        .center([0, 0])
        .tilt(20)
        .clipAngle(Math.acos(1 / 1.1) * 180 / Math.PI - 1e-7)
        .precision(.1);

    var graticule = d3.geo.graticule()
        .step([2, 2]);

    var path = d3.geo.path()
        .projection(projection);

    var svg = d3.select(document.body).append("svg")
        .attr("width", width)
        .attr("height", height);


    var graticuleStyle = {'fill':'none', 'stroke': '#777', 'stroke-width': '.5px', 'stroke-opacity': '.5'};
    var boundaryStyle = {'fill': 'none', 'stroke': '#fff', 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-width': '.5px'};
    var boundaryBigStyle = {'fill': 'none', 'stroke': '#666', 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-width': '1.5px'};
    var landStyle = {'fill': '#222'};
    var landContextStyle = {'fill': '#aaa'};
    var dotStyle = {'fill': '#c7141a'};
    var ringStyle = {'fill': 'none', 'stroke':'#c7141a'};
    var oceanStyle = {'fill': '#fff'};
    var oceanBigStyle = {'fill': '#eee'};
    var bboxStyle = {'fill':'#B10000', 'fill-opacity':.3, 'stroke-wdith':0.5, 'stroke':'#B10000', 'stroke-linejoin':'round'};
    var markerOuterStyle = {'fill':'#B10000', 'fill-opacity':0.3, 'stroke-wdith':0.5, 'stroke':'#B10000', 'stroke-linejoin':'round'};
    var markerInnerStyle = {'fill':'#B10000', 'fill-opacity':1, 'stroke-wdith':0.5, 'stroke':'#B10000', 'stroke-linejoin':'round'};



    svg.append("path")
        .datum(graticule)
        //.attr("class", "graticule")
        .style(graticuleStyle)
        .attr("d", path);



    points = []
    interpolationPoints = 200;

    //sample projection to find what's visible
    xStep = width / interpolationPoints;
    yStep = height / interpolationPoints;

    for (var x = 0; x < interpolationPoints; x++){
        xVal = xStep * x;
        for (var y = 0; y < interpolationPoints; y++){
            yVal = yStep * y;
            coord = projection.invert([xVal, yVal]);
            if (!isNaN(coord[0]) && !isNaN(coord[1])){
                points.push(coord);
            }
        }
    }

    hull = convexHull(points);
    hull.push(hull[0]);



    //d3.json("./admin12.json", function (error, world)


    svg.append("path")
        .datum({type: "Sphere"})
        //.attr("class", "ocean")
        .style(oceanBigStyle)
        .attr("d", path)


    svg.append("path")
        .datum(topojson.feature(admin12, admin12.objects.land, function (a, b) {
            return a !== b;
        }))
        //.attr("class", "land-context")
        .style(landContextStyle)
        .attr("d", path);

    svg.append("path")
        .datum(topojson.feature(admin12, admin12.objects.states, function (a, b) {
            return a !== b;
        }))
        //.attr("class", "boundary")
        .style(boundaryStyle)
        .attr("d", path);

    svg.append("path")
        .datum(topojson.mesh(world50m, world50m.objects.countries))
        .style(boundaryBigStyle)
        .attr("d", path);

    svg.append("path")
        .datum({type: "Sphere"})
        //.attr("class", "ocean")
        .style(oceanStyle)
        .attr("d", overview_path)
        .attr("transform", "translate("+ -width / 4 +"," + height / 5 + ")");

    //d3.json("./world-50m.json", function (error, world) {


    svg.append("path", ".graticule")
        .datum(overview_graticule)
        //.attr("class", "graticule")
        .style(graticuleStyle)
        .attr("d", overview_path)
        .attr("transform", "translate("+ -width / 4 +"," + height / 5 + ")");

    svg.append("path", ".graticule")
        .datum(topojson.feature(world50m, world50m.objects.countries))
        //.attr("class", "land")
        .style(landStyle)
        .attr("d", overview_path)
        .attr("transform", "translate("+ -width / 4 +"," + height / 5 + ")");

    svg.append("path", ".graticule")
        .datum(topojson.mesh(world50m, world50m.objects.countries))
        //.attr("class", "boundary")
        .style(boundaryStyle)
        .attr("d", overview_path)
        .attr("transform", "translate("+ -width / 4 +"," + height / 5 + ")");



    svg.append("path")
        .datum({type: "LineString", coordinates: hull})
        .attr("class", "bbox")
        .attr("d", overview_path)
        //.style({'fill':'#B10000', 'fill-opacity':.3})
        //.style({'stroke-wdith':0.5, 'stroke':'#B10000', 'stroke-linejoin':'round'})
        .style(bboxStyle)
        .attr("transform", "translate("+ -width / 4 +"," + height / 5 + ")");

    svg.append("circle")
        //.style({'fill':'#B10000', 'fill-opacity':0.3})
        //.style({'stroke-wdith':0.5, 'stroke':'#B10000', 'stroke-linejoin':'round'})
        .style(markerOuterStyle)
        .attr("transform", "translate(" + projection([lon, lat]) + ")")
        .attr("r", 14);

    svg.append("circle")
        //.style({'fill':'#B10000', 'fill-opacity':1})
        //.style({'stroke-wdith':0.5, 'stroke':'#B10000', 'stroke-linejoin':'round'})
        .style(markerInnerStyle)
        .attr("transform", "translate(" + projection([lon, lat]) + ")")
        .attr("r", 3);

    svg.selectAll("g")
        .data(name)
        .enter().append("g")
        .attr("transform", "translate(" + projection([lon, lat]) + ")")
        .append("text")
        .text(name)
        .attr("x", 14)
        .attr("y", -14)
        .attr("dy", ".35em");

    svg.append("text")
        .data(name)
        .attr("transform", function(d) {return "translate(" + projection([lon, lat]) + ")"})

    svg.append("path")
        .datum({type: "Point", coordinates: [lon, lat]})
        .attr("d", overview_path)
        //.style({'fill':'#B10000', 'fill-opacity':1})
        //.style({'stroke-wdith':0.5, 'stroke':'#B10000', 'stroke-linejoin':'round'})
        .style(markerInnerStyle)
        .attr("transform", "translate("+ -width / 4 +"," + height / 5 + ")");



    ret =  '<?xml version="1.0"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' + d3.select(document.body).html();

    return ret.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" ');
}

module.exports = renderlocation;