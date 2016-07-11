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

var TO_NORTH = 0;
var TO_SOUTH = 1;
var TO_EAST  = 2;
var TO_WEST  = 3;

var sign = function (d) {
    if (d === 0.0) {
      return 0;
    }
    return (d >= 0.0 ? 1 : -1);
};

/**
* Rhumbline aka loxodrome
* Points coordinates in Radians { lat: xx, lon: xx }
* returned value in radians
*/
var bearing = function(from, to) {
    var _nsDir = 0;
    if (to.lat > from.lat) {
      _nsDir = TO_NORTH;
    } else {
      _nsDir = TO_SOUTH;
    }
    var arrG = to.lon;
    var staG = from.lon;
    if (sign(arrG) !== sign(staG) && Math.abs(arrG - staG) > Math.PI) {
      if (sign(arrG) > 0) {
        arrG -= (2 * Math.PI);
      } else {
        arrG = Math.PI - arrG;
      }
    }
    var _ewDir;
    if (arrG - staG > 0.0) {
      _ewDir = TO_EAST;
    } else {
      _ewDir = TO_WEST;
    }
    var deltaL = radiansToDegrees(to.lat - from.lat) * 60;
    var radianDeltaG = to.lon - from.lon;
    if (Math.abs(radianDeltaG) > Math.PI) {
      radianDeltaG = (2 * Math.PI) - Math.abs(radianDeltaG);
    }
    var deltaG = radiansToDegrees(radianDeltaG) * 60;
    if (deltaG < 0.0) {
      deltaG = -deltaG;
    }
    var startLC = Math.log(Math.tan((Math.PI / 4) + from.lat / 2));
    var arrLC = Math.log(Math.tan((Math.PI / 4) + to.lat / 2));
    var deltaLC = 3437.7467707849396 * (arrLC - startLC);
    var _rv = 0.0;
    if (deltaLC !== 0) {
      _rv = Math.atan(deltaG / deltaLC);
    } else if (radianDeltaG > 0) {
      _rv = (Math.PI / 2);
    } else {
      _rv = (3 * Math.PI / 2);
    }
    var _dLoxo = deltaL / Math.cos(_rv);
    if (_dLoxo < 0.0) {
      _dLoxo = -_dLoxo;
    }
    if (_rv < 0.0) {
      _rv = -_rv;
    }
    if (_ewDir === TO_EAST) {
      if (_nsDir !== TO_NORTH) {
        _rv = Math.PI - _rv;
      }
    } else if (deltaLC !== 0) {
      if (_nsDir === TO_NORTH) {
        _rv = (2 * Math.PI) - _rv;
      } else {
        _rv = Math.PI + _rv;
      }
    }
    while (_rv >= (2 * Math.PI)) {
      _rv -= (2 * Math.PI);
    }
    return _rv;
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

