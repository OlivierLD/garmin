function Graph(cName,       // Canvas Name
               cWidth,      // Canvas width
               cHeight,     // Canvas height
               graphData,   // x,y tuple array
               callback,    // Callback on mouseclick
               unit) {
  var instance = this;
  var xScale, yScale;
  var minx, miny, maxx, maxy;
  var context;
  
  var unit = unit;
  var lastClicked;

  var canvas = document.getElementById(cName);
  canvas.addEventListener('click', function(evt) {
      var x = evt.pageX - canvas.offsetLeft;
      var y = evt.pageY - canvas.offsetTop;
      
      var coords = relativeMouseCoords(evt, canvas);
      x = coords.x;
      y = coords.y;
//    console.log("Mouse: x=" + x + ", y=" + y);
      
      var idx = Math.round(x / xScale);
      if (idx < JSONParser.graphData.length) {
        if (callback !== undefined) {
          callback(idx);
        }
        lastClicked = idx;
      }
  }, 0);

  canvas.addEventListener('mousemove', function(evt) {
    if (document.getElementById("tooltip").checked) {
      var x = evt.pageX - canvas.offsetLeft;
      var y = evt.pageY - canvas.offsetTop;
      
      var coords = relativeMouseCoords(evt, canvas);
      x = coords.x;
      y = coords.y;
//    console.log("Mouse: x=" + x + ", y=" + y);

      var sf = getSpeedFactor();

      var idx = Math.round(x / xScale);
      if (idx < JSONParser.graphData.length) {
        var str = [];
        var heading;
        if (idx > 0) {
           heading = bearing({lat: JSONParser.graphData[idx - 1].getDataLat(), lon:JSONParser.graphData[idx - 1].getDataLon()}, {lat: JSONParser.graphData[idx].getDataLat(), lon: JSONParser.graphData[idx].getDataLon()});
        }
        try {
          str.push(reformatDate(JSONParser.graphData[idx].getDataTime(), "d-M-Y H:i:s"));
          str.push("Lat : " + formatPos(JSONParser.graphData[idx].getDataLat(), 'L') + " ");
          str.push("Lon : " + formatPos(JSONParser.graphData[idx].getDataLon(), 'G') + " ");
          str.push("Speed: " + (sf.sf * JSONParser.graphData[idx].getDataSpeed()).toFixed(2) + " " + sf.unit);
          if (heading !== undefined) {
            str.push("Heading: " + radiansToDegrees(heading).toFixed(0) + "\272");
          }
//        console.log("Bubble:" + str);
        } catch (err) { 
          console.log(err); 
        }
        
  //    context.fillStyle = '#000';
  //    context.fillRect(0, 0, w, h);
        instance.drawGraph(cName, graphData, lastClicked);
        var tooltipW = 120, nblines = str.length;
        context.fillStyle = "rgba(250, 250, 210, .7)"; 
//      context.fillStyle = 'yellow';
        var fontSize = 10;
        var x_offset = 10, y_offset = 10;

        if (x > (cWidth / 2)) {
          x_offset = -(tooltipW + 10);
        }
        if (y > (cHeight / 2)) {
          y_offset = -(10 + 6 + (nblines * fontSize));
        }
        context.fillRect(x + x_offset, y + y_offset, tooltipW, 6 + (nblines * fontSize)); // Background
        context.fillStyle = 'black';
        context.font = /*'bold ' +*/ fontSize + 'px verdana';
        for (var i=0; i<str.length; i++) {
          context.fillText(str[i], x + x_offset + 5, y + y_offset + (3 + (fontSize * (i + 1)))); //, 60); 
        }
      }
    }
  }, 0);
  
  var relativeMouseCoords = function (event, element) {
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = element;

    do {
      totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
      totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    } while (currentElement = currentElement.offsetParent)

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {x:canvasX, y:canvasY};
  };
  
  this.minX = function(data) {
    var min = Number.MAX_VALUE;
    for (var i=0; i<data.length; i++) {
      min = Math.min(min, data[i].getX());
    }
    return min;
  };
  
  this.minY = function(data) {
    var min = Number.MAX_VALUE;
    for (var i=0; i<data.length; i++) {
      min = Math.min(min, data[i].getY());
    }
    return min;
  };
  
  this.maxX = function(data) {
    var max = Number.MIN_VALUE;
    for (var i=0; i<data.length; i++) {
      max = Math.max(max, data[i].getX());
    }
    return max;
  };
  
  this.maxY = function(data) {
    var max = Number.MIN_VALUE;
    for (var i=0; i<data.length; i++) {
      max = Math.max(max, data[i].getY());
    }
    return max;
  };
  
  this.drawGraph = function(displayCanvasName, data, idx)
  {
    context = canvas.getContext('2d');
    
    var _idxX;
    if (idx !== undefined) {
      _idxX = idx * xScale;
    }
    
    var mini = Math.floor(this.minY(data));
    var maxi = Math.ceil(this.maxY(data));
    var gridXStep = Math.round((maxi - mini) / 3);
    var gridYStep = Math.round(JSONParser.graphData.length / 10);
    
    // Sort the tuples (on X, time)
    data.sort(sortTupleX);
    
    var smoothData = data;
    var _smoothData = [];
    var smoothWidth = Math.max(20, Math.round(data.length / 10));
    for (var i=0; i<smoothData.length; i++) {
      var yAccu = 0;
      for (var acc=Math.round(i-(smoothWidth / 2)); acc<Math.round(i+(smoothWidth/2)); acc++) {
        var y;
        if (acc < 0) {
          y = smoothData[0].getY();
        } else if (acc > (smoothData.length - 1)){
          y = smoothData[smoothData.length - 1].getY();
        } else {
          y = smoothData[acc].getY();
        }
        yAccu += y;
      }
      yAccu = yAccu / smoothWidth;
      _smoothData.push(new Tuple(smoothData[i].getX(), yAccu));
//    console.log("I:" + smoothData[i].getX() + " y from " + smoothData[i].getY() + " becomes " + yAccu);
    }
    // Clear
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);    

    smoothData = _smoothData;
    if (false) {
      context.fillStyle = "LightGray";
      context.fillRect(0, 0, canvas.width, canvas.height);    
    } else {
      var grV = context.createLinearGradient(0, 0, 0, context.canvas.height);
      grV.addColorStop(0, 'rgba(0,0,0,0)');
      grV.addColorStop(1, 'cyan'); // "LightGray"); // '#000');

      context.fillStyle = grV;
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    }
    // Horizontal grid (TWS)
    for (var i=Math.round(mini); gridXStep>0 && i<maxi; i+=gridXStep) {
      context.beginPath();
      context.lineWidth = 1;
      context.strokeStyle = 'gray';
      context.moveTo(0, cHeight - (i - mini) * yScale);
      context.lineTo(cWidth, cHeight - (i - mini) * yScale);
      context.stroke();

      context.save();
      context.font = "bold 10px Arial"; 
      context.fillStyle = 'black';
      str = i.toString() + " " + unit;
      len = context.measureText(str).width;
      context.fillText(str, cWidth - (len + 2), cHeight - ((i - mini) * yScale) - 2);
      context.restore();            
      context.closePath();
    }
    
    // Vertical grid (Time)
    for (var i=gridYStep; i<data.length; i+=gridYStep) {
      context.beginPath();
      context.lineWidth = 1;
      context.strokeStyle = 'gray';
      context.moveTo(i * xScale, 0);
      context.lineTo(i * xScale, cHeight);
      context.stroke();

      // Rotate the whole context, and then write on it (that's why we need the translate)
      context.save(); 
      context.translate(i * xScale, canvas.height);
      context.rotate(-Math.PI / 2);
      context.font = "bold 10px Arial"; 
      context.fillStyle = 'black';
      str = reformatDate(JSONParser.graphData[i].getDataTime(), "d-M H:i:s");
      len = context.measureText(str).width;
      context.fillText(str, 2, -1); //i * xScale, cHeight - (len));
      context.restore();            
      context.closePath();
    }

    if (document.getElementById("raw-data").checked) { // Raw data
      context.beginPath();
      context.lineWidth = 1;
      context.strokeStyle = 'green';
  
      var previousPoint = data[0];
      context.moveTo((data[0].getX() - minx) * xScale, cHeight - (data[0].getY() - miny) * yScale);
      for (var i=1; i<data.length; i++) {
    //  context.moveTo((previousPoint.getX() - minx) * xScale, cHeight - (previousPoint.getY() - miny) * yScale);
        context.lineTo((data[i].getX() - minx) * xScale, cHeight - (data[i].getY() - miny) * yScale);
    //  context.stroke();
        previousPoint = data[i];
      }
      context.lineTo(context.canvas.width, context.canvas.height);
      context.lineTo(0, context.canvas.height);
      context.closePath();
      context.stroke(); 
      context.fillStyle = 'rgba(0, 255, 0, 0.35)';
      context.fill();
    }
    
    if (document.getElementById("smooth-data").checked) { // Smoothed data
      data = smoothData;
      
      context.beginPath();
      context.lineWidth = 3;
      context.strokeStyle = 'red';
  
      previousPoint = data[0];
      context.moveTo((data[0].getX() - minx) * xScale, cHeight - (data[0].getY() - miny) * yScale);
      for (var i=1; i<data.length; i++) {
//      context.moveTo((previousPoint.getX() - minx) * xScale, cHeight - (previousPoint.getY() - miny) * yScale);
        context.lineTo((data[i].getX() - minx) * xScale, cHeight - (data[i].getY() - miny) * yScale);
//      context.stroke();
        previousPoint = data[i];
      }
      // Close the shape, bottom
      context.lineTo(context.canvas.width, context.canvas.height);
      context.lineTo(0, context.canvas.height);

      context.closePath();
      context.stroke();
      context.fillStyle = 'rgba(255, 0, 0, 0.35)';
      context.fill();
    }
    
    if (idx !== undefined) {
      context.beginPath();
      context.lineWidth = 1;
      context.strokeStyle = 'green';
      context.moveTo(_idxX, 0);
      context.lineTo(_idxX, cHeight);
      context.stroke();
      context.closePath();
    }
  };
  
  (function() {
     minx = instance.minX(graphData);
     miny = instance.minY(graphData);
     maxx = instance.maxX(graphData);
     maxy = instance.maxY(graphData);
     
//   console.log("MinX:" + minx + ", MaxX:" + maxx + ", MinY:" + miny + ", MaxY:" + maxy);
     
     xScale = cWidth / (maxx - minx);   // was Math.floor(canvas.getBoundingClientRect().width)
     yScale = cHeight / (maxy - miny);  // was canvas.getBoundingClientRect().height
     
//   console.log("xScale:" + xScale + ", yScale:" + yScale);
     
     instance.drawGraph(cName, graphData);
   })(); // Invoked automatically when new is invoked.  
};

function Tuple(_x, _y) {
  var x = _x;
  var y = _y;
  
  this.getX = function() { return x; };
  this.getY = function() { return y; };
};

function sortTupleX(t1, t2) {
  if (t1.getX() < t2.getX()) {
    return -1;
  }
  if (t1.getX() > t2.getX()){
    return 1;
  }
  return 0;  
};
