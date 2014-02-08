(function() {
  var margin = {top: 10, right: 10, bottom: 100, left: 40},
      margin2 = {top: 430, right: 10, bottom: 20, left: 40},
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom,
      height2 = 500 - margin2.top - margin2.bottom;

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

  var x = d3.time.scale().range([0, width]),
      x2 = d3.time.scale().range([0, width]),
      y = d3.scale.linear().range([height, 0]),
      y2 = d3.scale.linear().range([height2, 0]);

  var xAxis = d3.svg.axis().scale(x).orient("bottom"),
      xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
      yAxis = d3.svg.axis().scale(y).orient("left");

  var brush = d3.svg.brush()
      .x(x2)
      .on("brush", brushed);

  var stepArea = d3.svg.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.steps); });

  var floorArea = d3.svg.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.floors*25); });

  var heartRateArea = d3.svg.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.heartrate); });

  var minimap = d3.svg.area()
      .interpolate("monotone")
      .x(function(d) { return x2(d.date); })
      .y0(height2)
      .y1(function(d) { return y2(d.steps); });

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

        focus.append("path")
            .datum(step_data)
            .attr("class", "steps")
            .attr("d", stepArea);

        focus.append("path")
            .datum(floor_data)
            .attr("class", "floors")
            .attr("d", floorArea);

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

        /*
        context.append("path")
            .datum(step_data)
            .attr("class", "steps")
            .attr("d", minimap);
        */

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

          var count = 0;
          for(var key in domainValues) {
            domainValues[key] = count++;
          }
          var colorScale = d3.scale.category10();
          
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
          .attr("height", 20)
          .style("fill", function(d) { return colorScale(domainValues[d.name]); })
          .on("click", clickLocation);
          
          context.append("g")
            .attr("class", "x brush")
            .call(brush)
          .selectAll("rect")
            .attr("y", -6)
            .attr("height", height2 + 7);
        });

        });

      });

  });

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
    focus.select(".steps").attr("d", stepArea);
    focus.select(".floors").attr("d", floorArea);
    focus.select(".heartrate").attr("d", heartRateArea);
    focus.selectAll(".location").attr("x", function(d) { return d3.max([x(d.startTime), 0]); })
    .attr("width", function(d) { return d3.max([d3.min([x(d.endTime) - d3.max([x(d.startTime), 0]), x(extent[1]) - d3.max([x(d.startTime), 0])]), 0]); });
    focus.select(".x.axis").call(xAxis);
  }

  function type(d) {
    d.date = parseDateHeartrate(d.date);
    d.heartrate = +d.heartrate;
    return d;
  }
}());