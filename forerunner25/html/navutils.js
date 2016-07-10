var degToRadians = function(angle) {
  return angle * Math.PI / 180.0;
};

var radiansToDegrees = function(angle) {
  return angle * 180.0 / Math.PI;
};

/**
 * from, to: {lat: 38.85643, lon: -123.98736}, in degrees
 * Return in nautical miles
 */
var getDistance = function(from, to) {
  var cos = Math.sin(degToRadians(from.lat)) *
            Math.sin(degToRadians(to.lat)) +
            Math.cos(degToRadians(from.lat)) *
            Math.cos(degToRadians(to.lat)) * Math.cos(degToRadians(to.lon) - degToRadians(from.lon));
  var dist = Math.acos(cos);
  return radiansToDegrees(dist) * 60; // in nm
};

var nm2km = function(nm) {
  return nm * 1.852;
};

var nm2sm = function(nm) {
  return nm * (1.852 / 1.609);
};

var nm2ms = function(nm) {
  return nm * (1.852 / 3.6);
};

var msToDuration = function(ms) {
  var seconds = ms / 1000;
  var numyears = Math.floor(seconds / 31536000);
  var numdays = Math.floor((seconds % 31536000) / 86400);
  var numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
  var numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
  var numseconds = (((seconds % 31536000) % 86400) % 3600) % 60;
  var hr = ""; // Human readable
  if (numyears > 0) {
    hr += (numyears + " years ");
  }
  if (numdays > 0 || hr.length > 0) {
    hr += (numdays + " days ");
  }
  if (numhours > 0 || hr.length > 0) {
    hr += (numhours + " hours ");
  }
  if (numminutes > 0 || hr.length > 0) {
    hr += (numminutes + " mins ");
  }
  if (numseconds > 0 || hr.length > 0) {
    hr += (numseconds + " secs ");
  }
  return hr.trim();
};

