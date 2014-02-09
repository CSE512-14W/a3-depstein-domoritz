(function() {
  var margin = {top: 10, right: 10, bottom: 100, left: 40},
      margin2 = {top: 430, right: 10, bottom: 20, left: 40},
      width = parseInt(d3.select("#plot").style('width'), 10) - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom,
      height2 = 500 - margin2.top - margin2.bottom,
      location_height = 20,
      legend_width = 400,
      legend_height = 200;

  var parseDateFitbit = d3.time.format("%H:%M:%S").parse;
  var parseDateHeartrate = d3.time.format("%H:%M").parse;
  var parseMovesDates = function(startTime, endTime) { //Yes, this function is horrendous.
    startTime = d3.time.format("%Y%m%dT%H%M%SZ").parse(startTime);
    endTime = d3.time.format("%Y%m%dT%H%M%SZ").parse(endTime);

    if (startTime.getDate() == 5 && startTime.getHours() - 7 < 0) {
      startTime.setHours(0);
      startTime.setMinutes(0);
      startTime.setSeconds(0);
    } else {
      startTime.setHours((startTime.getHours() - 7));
    }
      startTime.setYear(1900);
      startTime.setMonth(0);
      startTime.setDate(1);
    if (endTime.getDate() == 6 && endTime.getHours() >= 7) {
      endTime.setHours(23);
      endTime.setMinutes(59);
      endTime.setSeconds(0);
    } else {
      endTime.setHours((endTime.getHours() - 7 + 24) % 24);
    }
    endTime.setYear(1900);
    endTime.setMonth(0);
    endTime.setDate(1);
    return [startTime, endTime];
  }

  var bisectDate = d3.bisector(function(d) { return d.date; }).left;

  var x = d3.time.scale().range([0, width]),
      x2 = d3.time.scale().range([0, width]),
      y = d3.scale.linear().range([height, 0]),
      y2 = d3.scale.linear().range([height2, 0]);

  var xAxis = d3.svg.axis().scale(x).orient("bottom"),
      xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
      yAxis = d3.svg.axis().scale(y).orient("left");

  var heartRateArea = d3.svg.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.heartrate); });

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

  d3.json("data/fitbit_steps.json", function(error, step_data) {

    step_data.forEach(function(d) {
      d.date = parseDateFitbit(d.date);
      d.steps = +d.value;
    });

    d3.json("data/fitbit_floors.json", function(error, floor_data) {

        floor_data.forEach(function(d) {
          d.date = parseDateFitbit(d.date);
          d.floors = +d.value;
        });

        d3.csv("data/heartrate_full.csv", type, function(error, heartrate_data) {

        x.domain(d3.extent(step_data.map(function(d) { return d.date; })));
        y.domain([0, d3.max(step_data.map(function(d) { return d.steps; }))]);
        x2.domain(x.domain());
        y2.domain(y.domain());

        focus.selectAll(".steps")
          .data(step_data)
          .enter().append("rect")
          .attr("class", "steps")
          .attr("x", function(d) { return x(d.date); })
          .attr("width", 0.5 )
          .attr("y", function(d) { return y(d.steps*0.9);})
          .attr("height", function(d) {return height - y(d.steps*0.9); });

        focus.selectAll(".floors")
          .data(floor_data)
          .enter().append("rect")
          .attr("class", "floors")
          .attr("x", function(d) { return x(d.date); })
          .attr("width", 0.5 )
          .attr("y", function(d) { return y(10*d.floors);})
          .attr("height", function(d) {return height - y(10*d.floors); });

        focus.append("path")
            .datum(heartrate_data)
            .attr("class", "heartrate")
            .attr("d", heartRateArea);

        focus.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        focus.append("g")
            .attr("class", "y axis")
            .call(yAxis);

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

              domainValues[datum.name] = 1;
              timespans.push(datum);
            } else if(s.type == "move") {
              s.activities.forEach(function(a) {
                var datum = {};
                var times = parseMovesDates(a.startTime, a.endTime);
                datum.startTime = times[0];
                datum.endTime = times[1];
                datum.name = a.activity;

                domainValues[datum.name] = 1;
                timespans.push(datum);
              });
            }
          });

          var colorScale = d3.scale.category10();
          domainEntries = [];
          var count = 0;
          for(var key in domainValues) {
            domainValues[key] = count++;
            var entry = {};
            entry["name"] = key;
            entry["index"] = domainValues[key];
            entry["color"] = colorScale(domainValues[key]);
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
            .style("fill", function(d) {return d["color"]; })
            .style("stroke", "black");

            legend_entries.append("text")
              .attr("dy", ".3em")
              .attr("x", 15)
              .attr("y", 5)
              .text(function(d) {return d["name"]; });
          
          //Context version
          context.selectAll(".timeregion")
          .data(timespans)
          .enter().append("rect")
          .attr("class", "timeregion")
          .attr("x", function(d) { return x(d.startTime); })
          .attr("width", function(d) { return x(d.endTime) - x(d.startTime); })
          .attr("y", 0)
          .attr("height", height2)
          .style("fill", function(d) { return colorScale(domainValues[d.name]); });

          //Focus version
          focus.selectAll(".location")
          .data(timespans)
          .enter().append("rect")
          .attr("class", "location")
          .attr("x", function(d) { return x(d.startTime); })
          .attr("width", function(d) { return x(d.endTime) - x(d.startTime); })
          .attr("y", 0)
          .attr("height", location_height)
          .style("fill", function(d) { return colorScale(domainValues[d.name]); })
          .on("click", clickLocation);
          
          var brush = d3.svg.brush()
          .x(x2)
          .on("brush", brushed);

          context.append("g")
            .attr("class", "x brush")
            .call(brush)
          .selectAll("rect")
            .attr("y", -6)
            .attr("height", height2 + 7);

          hoverBar.append("line")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", margin.top + location_height)
            .attr("y2", height + margin.top)
            .attr("stroke-width", 1)
            .attr("stroke", "black");

          hoverBar.append("text")
            .attr("x", 9)
            .attr("dy", ".35em");

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
            hoverBar.select("text").attr("transform", "translate(" + mouseX + "," + mouseY + ")");
            hoverBar.select("text").text(sprintf("Heart rate:%.2f, Steps:%d, Floors:%d", hr.heartrate, st.steps, fl.floors));
            hoverBar.select("line").attr("transform", "translate(" + mouseX + ",0)");
          }

          function clickLocation(d) {
            brushRange([d.startTime, d.endTime]);
          }

          function brushed() {
            brushRange(brush.empty() ? x2.domain() : brush.extent());
          }

          function brushRange(extent) {
            x.domain(extent);
            brush.extent(extent);
            context.selectAll(".brush").call(brush);
            focus.select(".heartrate").attr("d", heartRateArea);
            focus.selectAll(".location").attr("x", function(d) { return d3.max([x(d.startTime), 0]); })
            .attr("width", function(d) { return d3.max([d3.min([x(d.endTime) - d3.max([x(d.startTime), 0]), x(extent[1]) - d3.max([x(d.startTime), 0])]), 0]); });

            focus.selectAll(".steps").attr("x", function(d) { return x(d.date); })
            .attr("width", function(d) { return x(d.date)<x(extent[0])||x(d.date)>x(extent[1])?0:700/((extent[1]-extent[0])/60000); });

            focus.selectAll(".floors").attr("x", function(d) { return x(d.date); })
            .attr("width", function(d) { return x(d.date)<x(extent[0])||x(d.date)>x(extent[1])?0:700/((extent[1]-extent[0])/60000); });
            focus.select(".x.axis").call(xAxis);

            setSummaryStatistics(extent);
          }

          function setSummaryStatistics(extent) {
            //Change the statistics in the summary
            d3.select("#step_summary").html(d3.sum(step_data.filter(function (d) {
              return d.date >= extent[0] && d.date <= extent[1];
            }), function(d) {
              return d.steps;
            }));
            d3.select("#heart_summary").html(sprintf("%.2f", d3.mean(heartrate_data.filter(function (d) {
              return d.date >= extent[0] && d.date <= extent[1];
            }), function(d) {
              return d.heartrate;
            })));
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
}());