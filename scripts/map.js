(function() {
	var map = L.map('map', {
		scrollWheelZoom: false
	}).setView([47.6097, -122.3331], 13);

	var mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v3/domoritz.h6ibh733/{z}/{x}/{y}.png', {
	    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
	}).addTo(map);

	var table = '<table class="table table-striped table-bordered table-condensed"><tbody>{body}</tbody></table>',
        row ='<tr><th>{key}</th><td>{value}</td></tr>'

	d3.json("data/moves_log.json", function(data) {

		// Convert data to geojson
		var features = [];
		data.segments.forEach(function(e) {
			if (e.type === "place") {
				var loc = e.place.location;
				var feature = {
					type: "Feature",
					geometry: {
						type: "Point",
						coordinates: [loc.lon, loc.lat]
					},
					properties: {
						type: "place"
					}
				};
				if (e.place.name) {
					feature.properties.name = e.place.name;
				};
				features.push(feature);
			}
			e.activities.forEach(function(activity) {
				var coords = [];
				activity.trackPoints.forEach(function(tp) {
					coords.push([tp.lon, tp.lat]);
				});
				delete activity['trackPoints'];
				var properties = activity;
				properties.type = "move";
				var feature = {
					type: "Feature",
					geometry: {
						type: "LineString",
						coordinates: coords
					},
					properties: properties
				}
				features.push(feature);
			});
		});

		var collection = {"type":"FeatureCollection", "features" : features};

		var geojson = L.geoJson(collection, {
			style: function(feature) {
				var props = feature.properties;
				if (props.type == "move") {
					switch (feature.properties.activity) {
			            case 'trp': return {color: "green"};
			            case 'wlk': return {color: "blue"};
			            case 'run': return {color: "red"};
			        }
				} else {
					return {};
				}
		    },
		    onEachFeature: function (feature, layer) {
				var body = '';
				$.each(feature.properties, function(key, value){
					if (value != null && typeof value === 'object') {
						value = JSON.stringify(value);
					}
					body += L.Util.template(row, {key: key, value: value});
				});
				var popupContent = L.Util.template(table, {body: body});
				layer.bindPopup(popupContent);
		    }
		});

		map.fitBounds(geojson.getBounds());
		geojson.addTo(map);
	});
}());
