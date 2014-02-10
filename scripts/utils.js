var parseMovesDates = function(startTimeStr, endTimeStr) { //Yes, this function is horrendous.
  startTime = d3.time.format("%Y%m%dT%H%M%SZ").parse(startTimeStr);
  endTime = d3.time.format("%Y%m%dT%H%M%SZ").parse(endTimeStr);

  if (startTime.getDate() == 5 && startTime.getHours() < 7) {
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
};

var timeFormat = d3.time.format("%H:%M");

var activityNames = {
  run: 'Running',
  wlk: 'Walking',
  trp: 'Transport'
}

var contains = function(range, times) {
  // can't use forEach here because we need to return
  for (var i = times.length - 1; i >= 0; i--) {
    var time = times[i];
    if (range[0] < time[1] && time[0] < range[1]) {
      return true;
    }
  };
  return false;
};

var roundToMinute = function(time) {
  var coeff = 1000 * 60;
  return new Date(Math.floor(time.getTime() / coeff) * coeff)
}

var colorPalette = {
  home: '#b2182b',
  cse: '#542788',
  park: '#e08214',
  unknown: '#4d4d4d',

  trp: '#4daf4a',
  wlk: '#2166ac',
  run: '#053061'
};

var toKey = {
  'Home': 'home',
  'Transport' : 'trp',
  'Walking': 'wlk',
  'Running': 'run',
  'The Park In Bellevue': 'park',
  'UW: Paul G. Allen Center for Computer Science & Engineering' : 'cse',
  undefined: 'unknown'
};