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

  console.log("parsed " + startTimeStr + " " + endTimeStr + " as " + [startTime, endTime])

  return [startTime, endTime];
};

var activityNames = {
  run: 'Running',
  wlk: 'Walking',
  trp: 'Transport'
}