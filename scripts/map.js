var map = L.map('map', {
	scrollWheelZoom: false
}).setView([47.6097, -122.3331], 13);

var mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v3/domoritz.h6ibh733/{z}/{x}/{y}.png', {
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
}).addTo(map);


var svg = d3.select(map.getPanes().overlayPane).append("svg"),
    g = svg.append("g").attr("class", "leaflet-zoom-hide");

d3.json("data/moves_log.json", function(data) {

	var features = [];
	data.segments.forEach(function(e) {
		if (e.type === "place") {
			var loc = e.place.location;
			var feature = {
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [-87.359296,35.00118]
				}
			}
			features.push(feature);
		}
	});

	console.log(features)
	var collection = {"type":"FeatureCollection", "features" : features};

	var transform = d3.geo.transform({point: projectPoint}),
	    path = d3.geo.path().projection(transform),
	    bounds = path.bounds(collection);

	console.table(bounds)

	var feature = g.selectAll("path")
	    .data(collection.features);

	feature.enter()
		.append("path");

	map.on("viewreset", reset);
	reset();

	// Reposition the SVG to cover the features.
	function reset() {
		var topLeft = bounds[0],
		    bottomRight = bounds[1];

		svg.attr("width", bottomRight[0] - topLeft[0])
		    .attr("height", bottomRight[1] - topLeft[1])
		    .style("left", topLeft[0] + "px")
		    .style("top", topLeft[1] + "px");

		g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

		feature.attr("d", function(d) {
			console.log(d)
			console.log(path(d));
			return path(d)
		});
	}

	// Use Leaflet to implement a D3 geometric transformation.
	function projectPoint(x, y) {
		var point = map.latLngToLayerPoint(new L.LatLng(y, x));
		this.stream.point(point.x, point.y);
	}
});
