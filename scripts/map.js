var map = (function() {
	var osm = L.tileLayer('http://{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors,' +
            'tiles from <a href="http://www.opencyclemap.org/">OpenCycleMap</a>'
    });

    var map = L.map('map', {
        center: [47.6210, -122.3328],
        zoom: 12,
        layers: [osm]
    });

	var table = '<table class="table table-striped table-bordered table-condensed"><tbody>{body}</tbody></table>',
        row ='<tr><th>{key}</th><td>{value}</td></tr>',
        rangeTmpl = '<a href="#" class="brushRange" data-begin="{tsb}" data-end="{tse}">from {begin} to {end}</a>';

    // place features, separate so that we can aggregate
    var places = {};

    $(document).on('click', '.brushRange', function(e) {
		e.preventDefault();
		chart.brushRange([new Date($(this).attr('data-begin')), new Date($(this).attr('data-end'))]);
	});

	d3.json("data/moves_log.json", function(data) {

		// Convert data to geojson
		var features = [];
		data.segments.forEach(function(e) {
			if (e.type === "place") {
				var loc = e.place.location;
				var feature = {}
				if (e.place.id in places) {
					feature = places[e.place.id];
					feature.properties.times.push(parseMovesDates(e.startTime, e.endTime));
				} else {
					feature = {
						type: "Feature",
						geometry: {
							type: "Point",
							coordinates: [loc.lon, loc.lat]
						},
						properties: {
							type: "place",
							times: [parseMovesDates(e.startTime, e.endTime)]
						}
					};
					if (e.place.name) {
						feature.properties.name = e.place.name;
					};
				}
				places[e.place.id] = feature;
			}
			e.activities.forEach(function(activity) {
				var coords = [];
				var properties = activity;
				properties.type = "move";
				properties.time = parseMovesDates(activity.startTime, activity.endTime);

				activity.trackPoints.forEach(function(tp) {
					coords.push([tp.lon, tp.lat]);

					// create a feature for each tracking point
					feature = {
						type: "Feature",
						geometry: {
							type: "Point",
							coordinates: [tp.lon, tp.lat]
						},
						properties: {
							type: "trackpoint"
						}
					};
					features.push(feature);
				});

				delete properties['trackPoints'];

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

		for (var key in places) {
			features.push(places[key]);
		}

		var collection = {"type":"FeatureCollection", "features" : features};

		var geojson = L.geoJson(collection, {
			style: function(feature) {
				var props = feature.properties;
				if (props.type == "move") {
					var style = {
						weight: 7
					};
					switch (feature.properties.activity) {
			            case 'trp': style.color = colorPalette.trp; break;
			            case 'wlk': style.color = colorPalette.wlk; break;
			            case 'run': style.color = colorPalette.run; break;
			        }
			        return style;
				} else if (props.type == "trackpoint") {
					return {
					    radius: 5,
					    color: "#333",
					    weight: 1
					};
				} else {
					return {
					    radius: 12,
					    fillColor: colorPalette[toKey[props.name]],
					    color: "#000",
					    weight: 2
					};
				}
		    },
		    onEachFeature: function (feature, featureLayer) {
		    	var body = '';
				$.each(feature.properties, function(key, value){
					if (value != null && typeof value === 'object') {
						value = JSON.stringify(value);
					}
					body += L.Util.template(row, {key: key, value: value});
				});
				var popupContent = L.Util.template(table, {body: body});

				if (feature.properties.type == 'place') {
					var times = '';
					$.each(feature.properties.times, function(key, value){
						times += L.Util.template('<li>' + rangeTmpl + '</li>', {
							tsb: value[0],
							tse: value[1],
							begin: timeFormat(value[0]),
							end: timeFormat(value[1])
						});
					});
					popupContent = L.Util.template('<strong>{name}</strong><br/><ul>{times}</ul>', {
						name: feature.properties.name ? feature.properties.name : "unknown",
						times: times
					});
				} else {
					popupContent = L.Util.template('<strong>{activity}</strong><br/>' + rangeTmpl, {
						activity: activityNames[feature.properties.activity],
						tsb: feature.properties.time[0],
						tse: feature.properties.time[1],
						begin: timeFormat(feature.properties.time[0]),
						end: timeFormat(feature.properties.time[1])
					});
				}

				featureLayer.bindPopup(popupContent);

				map.on("highlight", function(e) {
					var times = [];
					if (feature.properties.type == 'place') {
						times = feature.properties.times;
					} else {
						times = [feature.properties.time];
					}
					var style = {
						opacity: .2,
						fillOpacity: .2
					};

					if (e.range === undefined) {
						style = {
							opacity: .6,
							fillOpacity: .6
						};
					} else if (contains(e.range, times)) {
						style = {
							opacity: 1,
							fillOpacity: .9
						};
					}
					featureLayer.setStyle(style);
				});
		    },
		    pointToLayer: function (feature, latlng) {
		        return L.circleMarker(latlng);
		    },
		    filter: function(feature, layer) {
		     	// don't show track points
		        return feature.properties.type !== "trackpoint";
		    }
		});

		function zoomToFeature(e) {
		    map.fitBounds(e.target.getBounds());
		}

		// reset highlighting
		map.fireEvent("highlight", {range: undefined});

		map.fitBounds(geojson.getBounds());

		geojson.addTo(map);
	});

	return {
		filterRange: function(range) {
			map.fireEvent("highlight", {range: range});
		}
	};
}());
