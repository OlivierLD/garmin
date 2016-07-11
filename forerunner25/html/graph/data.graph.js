/*
 * @author olivier@lediouris.net

 Sample data:
  [
    {
      "lon": -122.508319925,
      "time": 1465825173000,
      "lat": 37.749492842,
      "speed-in-knots": 0.9
    },
    {
      "lon": -122.508313722,
      "time": 1465825183000,
      "lat": 37.749678585,
      "speed-in-knots": 2.591
    },
    {
      "lon": -122.508316321,
      "time": 1465825191000,
      "lat": 37.749860556,
      "speed-in-knots": 2.452
    },
    {
      "lon": -122.508321098,
      "time": 1465825199000,
      "lat": 37.750055686,
      "speed-in-knots": 2.12
    },
    ...
  ]
 */

var graph;

var updateOnClick = function(idx, lat, lon, speed) {
  setPosOnMap(lat, lon, idx, speed);
  var txtDate = JSONParser.graphData[idx].getDataTime();
//console.log("Date is : " + reformatDate(txtDate));
  var sf = getSpeedFactor();
  var heading;
  if (idx > 0) {
    heading = bearing({lat: JSONParser.graphData[idx - 1].getDataLat(), lon:JSONParser.graphData[idx - 1].getDataLon()}, {lat: lat, lon: lon});
  }
  document.getElementById("recno").innerHTML =
    "Record #<b style='color:red;'>" + (idx + 1) +
    "</b> of " + JSONParser.graphData.length + ", " +
    reformatDate(txtDate) + "  Lat: " + formatPos(lat, "L") +
                            ", Lon: " + formatPos(lon, 'G') +
                            ", Speed: " + (sf.sf * speed).toFixed(2) + " " + sf.unit +
                            (heading !== undefined ? ("<br>Heading: " + radiansToDegrees(heading).toFixed(0) + "\272") : "");

  graph.drawGraph("graphCanvas", graphdata, idx);
};

var reformatDate = function(d, fmt) {
  var utcDate = d;
  if (!isNaN(Number(d))) {
    utcDate = new Date(d)
  }
  var date;
  if (fmt === undefined) {
    fmt = "D d-M-Y H:i:s";
  }
  // 07-03 00:00
  var dateRegExpr = new RegExp("(\\d{2})-(\\d{2})\\s(\\d{2}):(\\d{2})");
  var matches = dateRegExpr.exec(utcDate);
  if (matches !== null) {      // Date is a string like "07-29 10:11"
    var month   = matches[1];
    var day     = matches[2];
    var hours   = matches[3];
    var minutes = matches[4];
    date = new Date();
    date.setMonth(parseInt(month - 1));
    date.setDate(parseInt(day));
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    date.setSeconds(0);
  } else {
    date = utcDate; // Already a date
  }

  var time = date.getTime();
  date = new Date(time);
//console.log("becomes: " + date.toString());
  return date.format(fmt);
};

var mouseMoveOnGraphCallback = function(idx) {
  if (JSONParser.graphData.length > idx) {
    data = JSONParser.graphData[idx];
    updateOnClick(idx,
                  data.getDataLat(),
                  data.getDataLon(),
                  data.getDataSpeed());
  }
};

var graphdata = [];

var setGraphData = function(gd) {
  JSONParser.parse(gd);
  displayData();
};

 // Parse the data
var onDataChange = function() {
  var text = document.getElementById("spot").value;

  if (text.length > 0) {
    var graphData = JSON.parse(text); // graphData is a json object.
    JSONParser.parse(graphData);
    displayData();
  }
};

var computeStats = function () {
    var graphData = JSONParser.graphData;
    var stats = {};
    if (graphData !== undefined && graphData.length > 0) {
        var minTime = graphData[0].getDataTime();
        var dist = 0;
        var speedAcc = 0;
        var maxTime = minTime;
        var prevPos;
        for (var i=0; i<graphData.length; i++) {
          maxTime = graphData[i].getDataTime();
          speedAcc += graphData[i].getDataSpeed();
          if (prevPos !== undefined) {
            dist += getDistance(prevPos, { lat: graphData[i].getDataLat(), lon: graphData[i].getDataLon() });
          }
          prevPos = { lat: graphData[i].getDataLat(), lon: graphData[i].getDataLon() };
        }
        stats = {
          'from-time': minTime,
          'to-time': maxTime,
          'dist-in-m': dist * 1852,
          'avg-speed': speedAcc / graphData.length
        };
    }
    return stats;
};

var displayStats = function() {
  var stats = computeStats();
  console.log(stats);
  var sf = getSpeedFactor();
  var distUnit = "km";
  var distFact = 1.0;
  switch (sf.unit) {
    case "kt":
      distUnit = "nm";
      distFact = 1 / 1852;
      break;
    case "km/h":
      distUnit = "km";
      distFact = 1 / 1000;
      break;
    case "mph":
      distUnit = "miles";
      distFact = 1 / 1609;
      break;
    case "m/s":
      distUnit = "m";
      distFact = 1.0;
      break;
    default:
      break;
  }
  var txt = 'From ' + reformatDate(stats['from-time']) + ' to ' + reformatDate(stats['to-time']) +
            ' (' + msToDuration(stats['to-time'] - stats['from-time']) + '), dist ' +
            (distFact * stats['dist-in-m']).toFixed(4) + " " + distUnit + ", avg speed " + (sf.sf * stats['avg-speed']).toFixed(3) + " " + sf.unit;
  $('#stats').text(txt);
};

var interval;

var getSpeedFactor = function() {
    var speedUnit = document.getElementById("speed-unit").value;
    var speedFactor = 1.0; // In ms in the data
//  console.log("Type: [" + type + "]");
    var unit = "kt";
    switch (speedUnit) {
      case "kts":
        speedFactor = 3.6 / 1.852;
        break;
      case "kmh":
        speedFactor = 3.6;
        unit = "km/h";
        break;
      case "mph":
        speedFactor = (3.6 / 1.609);
        unit = "mph";
        break;
      case "ms":
        speedFactor = 1.0;
        unit = "m/s";
        break;
      default:
        break;
    }
    return { sf: speedFactor, unit: unit };
};

var displayData = function() {
  var graphData = JSONParser.graphData;
  if (graphData !== null && graphData !== undefined && graphData.length > 0) {
    graphdata = [];
    var type = "SPEED";
    var sf = getSpeedFactor();
    for (var i=0; i<graphData.length; i++) {
      if (type === "SPEED") {
        graphdata.push(new Tuple(i, sf.sf * parseFloat(graphData[i].getDataSpeed())));
      }
    }
    var w = document.getElementById("graphCanvas").width;
    graph = new Graph("graphCanvas", w, 200, graphdata, mouseMoveOnGraphCallback, sf.unit);
    // Last value recorded
    var idx = JSONParser.graphData.length - 1;
    var data = JSONParser.graphData[idx];
    // Display value of last point.
    updateOnClick(idx,
                  data.getDataLat(),
                  data.getDataLon(),
                  data.getDataSpeed());
    drawTrack(graphData);
    displayStats();
  }
};

var JSONParser =
{
  graphData : [],

  parse : function(JSONContent, cb, cb2)
  {
    JSONParser.graphData  = [];
    var linkList = "";

    for (var i=0; i<JSONContent.length; i++)
    {
      var lat   = JSONContent[i].lat;
      var lon   = JSONContent[i].lon;
      var time  = JSONContent[i].time;
      var speed = JSONContent[i].speed;
      if (lat !== undefined &&
          lon !== undefined &&
          time !== undefined &&
          speed !== undefined) {
        JSONParser.graphData.push(new graphData(time, lat, lon, speed));
      }
    }    
  }
};

var graphData = function(time, lat, lon, speed)
{
  var dataTime  = time;
  var dataLat   = lat;
  var dataLon   = lon;
  var dataSpeed = speed;

  this.getDataTime  = function() { return dataTime; };
  this.getDataLat   = function() { return dataLat; };
  this.getDataLon   = function() { return dataLon; };
  this.getDataSpeed = function() { return dataSpeed; };
};

var formatPos = function(coord, type) { // type is 'L' or 'G'
  var n = coord;
  var sgn = (type === 'L' ? 'N' : 'E');
  if (n < 0) {
    n = -n;
    sgn = (type === 'L' ? 'S' : 'W');
  }
  var deg = Math.floor(n);
  var dec = (n - deg) * 60;
  return sgn + ' ' + deg + '\xB0' + dec.toFixed(2);
};

var lpad = function(s, len, pad) {
  var str = s;
  while (str.length < len) {
    str = (pad === undefined ? ' ' : pad) + str;
  }
  return str;
};

