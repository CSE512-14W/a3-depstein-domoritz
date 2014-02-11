var chart = (function() {
  var margin = {top: 10, right: 65, bottom: 100, left: 45},
      margin2 = {top: 450, right: 65, bottom: 20, left: 45},
      width = parseInt(d3.select("#plot").style('width'), 10) - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom,
      height2 = 500 - margin2.top - margin2.bottom,
      location_height = 20,
      legend_width = 400,
      legend_height = 200;

  var parseDateFitbit = d3.time.format("%H:%M:%S").parse;
  var parseDateHeartrate = d3.time.format("%H:%M").parse;

  var step_data = {},
    heartrate_data = {};

  var bisectDate = d3.bisector(function(d) { return d.date; }).left;

  var x = d3.time.scale().range([0, width]),
      x2 = d3.time.scale().range([0, width]),
      y = d3.scale.linear().range([height, 0]), // heartrate
      y2 = d3.scale.linear().range([height, 0]), // steps
      y3 = d3.scale.linear().range([height, 0]); // floors

  dateArr = [];
  for (var i = 0; i < 25; i++) {
    var dateVal = new Date((i+8)*1000*60*60);
    dateVal.setYear(1900);
    dateArr.push(dateVal);
  }
  console.log(dateArr);

  var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.time.format("%H:%M")),
      xAxis2 = d3.svg.axis().scale(x2).orient("bottom").tickFormat(d3.time.format("%H:%M")),
      xAxis3 = d3.svg.axis().scale(x).orient("bottom").tickFormat("").tickValues(dateArr).tickSize(-(height + location_height)),
      yAxis = d3.svg.axis().scale(y).orient("left");
      yAxisRight = d3.svg.axis().scale(y2).orient("right"),
      yAxisRight2 = d3.svg.axis().scale(y3).orient("left").ticks(5);

  var heartRateLine = d3.svg.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.heartrate); })
      .interpolate("cardinal");

  var svg = d3.select("#plot").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

  svg.append("defs").append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("width", width)
      .attr("height", height);

  var focus = svg.append("g")
      .attr("class", "focus")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var context = svg.append("g")
      .attr("class", "context")
      .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

  var hoverBar = svg.append("g")
    .attr("class", "hoverBar")
    .style("display", "none");


  var brush = d3.svg.brush()
    .x(x2)
    .on("brush", brushed);

  var brushRange = function(extent) {
    x.domain(extent);
    if (extent[0].getTime() != x2.domain()[0].getTime() || extent[1].getTime() != x2.domain()[1].getTime()) {
      brush.extent(extent);
      context.selectAll(".brush").call(brush);
    }
    focus.select(".heartrate").attr("d", heartRateLine);
    focus.selectAll(".location").attr("x", function(d) { return d3.max([x(d.startTime), 0]); })
    .attr("width", function(d) { return d3.max([d3.min([x(d.endTime) - d3.max([x(d.startTime), 0]), x(extent[1]) - d3.max([x(d.startTime), 0])]), 0]); });

    var widthCalc = 350/((extent[1]-extent[0])/60000);
    focus.selectAll(".steps").attr("width", function(d) { return x(d.date)<x(extent[0])||x(d.date)>x(extent[1])?0:widthCalc; })
    .attr("x", function(d) { return x(d.date) });

    focus.selectAll(".floors").attr("width", function(d) { return x(d.date)<x(extent[0])||x(d.date)>x(extent[1])?0:widthCalc; })
    .attr("x", function(d) { return x(d.date) + 9.0*widthCalc/8.0;});
    focus.select(".x.axis.major").call(xAxis);
    focus.select(".x.axis.minor").call(xAxis3);

    map.filterRange(brush.empty() ? undefined : extent);

    setSummaryStatistics(extent);
  }

  function brushed() {
    brushRange(brush.empty() ? x2.domain() : brush.extent());
  }

  function setSummaryStatistics(extent) {
    //Change the statistics in the summary
    d3.select("#step_summary").html(d3.sum(step_data.filter(function (d) {
      return d.date >= extent[0] && d.date <= extent[1];
    }), function(d) {
      return d.steps;
    }));
    d3.select("#heart_summary").html(sprintf("%.2f bpm", d3.mean(heartrate_data.filter(function (d) {
      return d.date >= extent[0] && d.date <= extent[1];
    }), function(d) {
      return d.heartrate;
    })));
    d3.select('#range_summary').html(sprintf("from %s to %s (%d minutes)", timeFormat(extent[0]), timeFormat(extent[1]), (extent[1] - extent[0])/(1000*60)));
  };

  d3.json("data/fitbit_steps.json", function(error, new_step_data) {

    step_data = new_step_data

    step_data.forEach(function(d) {
      d.date = parseDateFitbit(d.date);
      d.steps = +d.value;
    });

    d3.json("data/fitbit_floors.json", function(error, floor_data) {

        floor_data.forEach(function(d) {
          d.date = parseDateFitbit(d.date);
          d.floors = +d.value;
        });

        d3.csv("data/heartrate_full.csv", type, function(error, new_heartrate_data) {
          heartrate_data = new_heartrate_data;

          x.domain(d3.extent(heartrate_data.map(function(d) { return d.date; })));
          y.domain([0, 1.15 * d3.max(heartrate_data.map(function(d) { return d.heartrate; }))]);
          y2.domain([0, 1.4 * d3.max(step_data.map(function(d) { return d.steps; }))]);
          y3.domain([0, 1.4 * d3.max(floor_data.map(function(d) { return d.floors; }))]);
          x2.domain(x.domain());

          focus.selectAll(".steps")
            .data(step_data)
            .enter().append("rect")
            .attr("class", "steps")
            .attr("x", function(d) { return x(d.date) - 0.5; })
            .attr("width", 0.5 )
            .attr("y", function(d) { return y2(d.steps);})
            .attr("height", function(d) {return height - y2(d.steps); });

          focus.selectAll(".floors")
            .data(floor_data)
            .enter().append("rect")
            .attr("class", "floors")
            .attr("x", function(d) { return x(d.date) + 0.5; })
            .attr("width", 0.5 )
            .attr("y", function(d) { return y3(d.floors);})
            .attr("height", function(d) {return height - y3(d.floors); });

          focus.append("path")
              .datum(heartrate_data)
              .attr("class", "heartrate")
              .attr("d", heartRateLine);

          focus.append("g")
              .attr("class", "x axis minor")
              .attr("transform", "translate(0," + (height + location_height) + ")")
              .call(xAxis3);

          focus.append("g")
              .attr("class", "x axis major")
              .attr("transform", "translate(0," + (height + location_height) + ")")
              .call(xAxis);

          focus.append("g")
              .attr("class", "y axis")
              .style("fill", "red")
              .call(yAxis).append("text")
            .attr("transform", "rotate(-90)")
              .attr("y", 6)
              .attr("dy", -40)
              .attr("dx", -10)
              .style("text-anchor", "end")
              .text("Heart rate (bpm)");

          focus.append("g")
              .attr("class", "y axis")
              .attr("transform", "translate(" + (width + 25) + " ,0)")
              .style("fill", "steelblue")
              .call(yAxisRight).append("text")
            .attr("transform", "rotate(-90)")
              .attr("y", 6)
              .attr("dy", 30)
              .attr("dx", -10)
              .style("text-anchor", "end")
              .text("Steps");

          focus.append("g")
              .attr("class", "y axis")
              .attr("transform", "translate(" + (width + 20) + " ,0)")
              .style("fill", "forestgreen")
              .call(yAxisRight2).append("text")
            .attr("transform", "rotate(-90)")
              .attr("y", 6)
              .attr("dy", -28)
              .attr("dx", -10)
              .style("text-anchor", "end")
              .text("Floors");

          context.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height2 + ")")
              .call(xAxis2);

          d3.json("data/moves_log.json", function(error, moves_data) {
            var timespans = [];
            var domainValues = {};
            moves_data.segments.forEach(function(s) {
              if(s.type == "place") {
                var datum = {};
                var times = parseMovesDates(s.startTime, s.endTime);
                datum.startTime = times[0];
                datum.endTime = times[1];
                datum.name = s.place.name;
                datum.color = colorPalette[toKey[datum.name]];

                domainValues[datum.name] = 1;
                timespans.push(datum);
              } else if(s.type == "move") {
                s.activities.forEach(function(a) {
                  var datum = {};
                  var times = parseMovesDates(a.startTime, a.endTime);
                  datum.startTime = times[0];
                  datum.endTime = times[1];
                  datum.name = activityNames[a.activity];
                  datum.color = colorPalette[toKey[datum.name]];

                  domainValues[datum.name] = 1;
                  timespans.push(datum);
                });
              }
            });

            domainEntries = [];
            var count = 0;
            for(var key in domainValues) {
              domainValues[key] = count++;
              var entry = {};
              entry["name"] = key;
              entry["index"] = domainValues[key];
              entry["color"] = colorPalette[toKey[key]];
              domainEntries.push(entry);
            }

            var legend = d3.select("#legend").append("svg")
            .attr("width", legend_width)
            .attr("height", legend_height);

            var legend_entries = legend.selectAll(".legendentry")
              .data(domainEntries)
              .enter().append("g")
              .attr("class", "legendentry")
              .attr("transform", function(d) {return "translate(10," + (5+20*d["index"]) + ")"});

              legend_entries.append("rect")
              .attr("class", "legendentry")
              .attr("width", 10)
              .attr("height", 10)
              .style("fill", function(d) {return d.color; })
              .style("stroke", "black");

              legend_entries.append("text")
                .attr("dy", ".3em")
                .attr("x", 15)
                .attr("y", 5)
                .text(function(d) {return d.name; });

            //Context version
            context.selectAll(".timeregion")
            .data(timespans)
            .enter().append("rect")
            .attr("class", "timeregion")
            .attr("x", function(d) { return x(d.startTime); })
            .attr("width", function(d) { return x(d.endTime) - x(d.startTime); })
            .attr("y", 0)
            .attr("height", height2 - 4)
            .style("fill", function(d) { return d.color; });

            //Focus version
            focus.selectAll(".location")
            .data(timespans)
            .enter().append("rect")
            .attr("class", "location")
            .attr("x", function(d) { return x(d.startTime); })
            .attr("width", function(d) { return x(d.endTime) - x(d.startTime); })
            .attr("y", height)
            .attr("height", location_height)
            .style("fill", function(d) { return d['color']; })
            .on("click", clickLocation);

            context.append("g")
              .attr("class", "x brush")
              .call(brush)
            .selectAll("rect")
              .attr("y", -6)
              .attr("height", height2 + 8);

            hoverBar.append("line")
              .attr("x1", 0)
              .attr("x2", 0)
              .attr("y1", margin.top + location_height)
              .attr("y2", height + location_height + margin.top)
              .attr("stroke-width", 1)
              .attr("stroke", "black");

            var hoverRect = hoverBar
              .append("g")
              .attr('class', 'hover');

            hoverRect
              .append("rect")
              .attr('width', 200)
              .attr("height", 20)
              .attr("y", "-10px")
              .style('opacity', .8)
              .style('fill', 'black');

            hoverRect
              .append("text")
              .attr("x", 9)
              .attr("dy", "3px")
              .style("fill", "white");

            var timeRect = hoverBar
              .append("g")
              .attr('class', 'time');

            timeRect
              .append("rect")
              .attr('width', 100)
              .attr("height", 16)
              .style('opacity', .8)
              .style('fill', 'white');

            timeRect
              .append("text")
              .attr("x", 9)
              .attr("dy", "14px")
              .style("fill", "black");

            svg.append("rect")
              .attr("class", "overlay")
              .attr("x", margin.left)
              .attr("y", margin.top + location_height)
              .attr("width", width)
              .attr("height", height - location_height)
              .on("mouseover", function() { hoverBar.style("display", null); })
              .on("mouseout", function() { hoverBar.style("display", "none"); })
              .on("mousemove", mousemove);

            function mousemove() {
              var mouseX = d3.mouse(this)[0];
              var mouseY = d3.mouse(this)[1];
              var x0 = x.invert(mouseX - margin.left);
              var y0 = y.invert(mouseY - margin.top);
              var hr = heartrate_data[bisectDate(heartrate_data, x0)-1];
              var st = step_data[bisectDate(step_data, x0)-1];
              var fl = floor_data[bisectDate(floor_data, x0)-1];

              var xLoc = (x(roundToMinute(x0)) + margin.left);

              hoverBar.select("g.hover").attr("transform", "translate(" + xLoc + "," + mouseY + ")");
              hoverBar.select(".hover text").text(sprintf("Heart rate: %.2f, Steps: %d, Floors: %d", hr.heartrate, st.steps, fl.floors));

              hoverBar.select("g.time").attr("transform", "translate(" + xLoc + ", "+(height + location_height + 12)+")");
              hoverBar.select(".time text").text(sprintf("Time: %s", timeFormat(x0)));
              hoverBar.select("line").attr("transform", "translate(" + xLoc + ",0)");
            }

            function clickLocation(d) {
              brushRange([d.startTime, d.endTime]);
            }

            setSummaryStatistics(x.domain());
          });
        });

      });

  });

  function type(d) {
    d.date = parseDateHeartrate(d.date);
    d.heartrate = +d.heartrate;
    return d;
  }

  return {
    brushRange: brushRange
  };
}());