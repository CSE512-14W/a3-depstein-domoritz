(function() {
  var margin = {top: 10, right: 10, bottom: 100, left: 40},
      margin2 = {top: 430, right: 10, bottom: 20, left: 40},
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom,
      height2 = 500 - margin2.top - margin2.bottom;

  var parseDateFitbit = d3.time.format("%H:%M:%S").parse;
  var parseDateHeartrate = d3.time.format("%H:%M").parse;

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

  d3.json("data/fitbit_steps.json", function(error, data) {

    data.forEach(function(d) {
      d.date = parseDateFitbit(d.date);
      d.steps = +d.value;
    });

    d3.json("data/fitbit_floors.json", function(error, data2) {

        data2.forEach(function(d) {
          d.date = parseDateFitbit(d.date);
          d.floors = +d.value;
        });

        d3.csv("data/heartrate_full.csv", type, function(error, data3) {

        x.domain(d3.extent(data.map(function(d) { return d.date; })));
        y.domain([0, d3.max(data.map(function(d) { return d.steps; }))]);
        x2.domain(x.domain());
        y2.domain(y.domain());

        focus.append("path")
            .datum(data)
            .attr("class", "steps")
            .attr("d", stepArea);

        focus.append("path")
            .datum(data2)
            .attr("class", "floors")
            .attr("d", floorArea);

        focus.append("path")
            .datum(data3)
            .attr("class", "heartrate")
            .attr("d", heartRateArea);

        focus.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        focus.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        context.append("path")
            .datum(data)
            .attr("class", "steps")
            .attr("d", minimap);

        context.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height2 + ")")
            .call(xAxis2);

        context.append("g")
            .attr("class", "x brush")
            .call(brush)
          .selectAll("rect")
            .attr("y", -6)
            .attr("height", height2 + 7);

        });

      });

  });

  function brushed() {
    brushRange(brush.empty() ? x2.domain() : brush.extent());
  }

  function brushRange(extent) {
    console.log(extent);
    x.domain(extent);
    focus.select(".steps").attr("d", stepArea);
    focus.select(".floors").attr("d", floorArea);
    focus.select(".heartrate").attr("d", heartRateArea);
    focus.select(".x.axis").call(xAxis);
  }

  function type(d) {
    d.date = parseDateHeartrate(d.date);
    d.heartrate = +d.heartrate;
    return d;
  }
}());