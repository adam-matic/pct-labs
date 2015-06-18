/*jslint browser: true*/
/*global stat*/


function constrain(x, min, max) {
  return (x < min) ? min
    : ((x > max) ? max
      : x);
}


// returns an random disturbance creator object of selected difficulty (range 0 -1)
// and selected amplitude (diff from lowest to highest, approximately), centered at zero.
// very approximate, though

function dist_maker(dif, amp) {
  var d1 = 0, d2 = 0, d3 = 0,
     k = amp*800*dif, high = amp / 2,
     low = - high, s = dif;
  return {
    next: function () {
       d1 += ( k * (Math.random() - 0.5) -  d1) *  s;
       d2 += ( d1 -  d2) *  s;
       d2 = constrain( d2,  low,  high);
       d3 += ( d2 -  d3) *  s;
      return  d3;
    }
  };
}


// multiply all items with k and return the new array
function scale(data, k) {
  var new_data = [],
    len = data.length,
    i;
  for (i = 0; i < len; i++) {
    new_data.push(data[i] * k);
  }
  return new_data;
}

// scale and offset any array to fit range [low, high]
function scaleToRange(data, low, high) {
  var new_data = [],
    min_val = stat.min(data),
    max_val = stat.max(data),
    target_range = high - low,
    data_range = max_val - min_val,
    k = target_range / data_range,
    len = data.length,
    i;
  for (i = 0; i < len; i++) {
    new_data[i] =  low + k * (data[i] - min_val);
  }
  return new_data;
}



// take mutation out, just produce a picture and return?
function plot(prop) {
  var canvas, ctx, width, zero, xScale, yScale, h;
  yScale = prop.yScale;
  canvas = document.getElementById(prop.canvas);

  ctx = canvas.getContext('2d');
  width = canvas.width;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  zero = canvas.height / 2;

  //data = prop.scaleToFit ? scaleToRange(prop.data, -h, h) : prop.data;
  var clr = ["#ff0000", "#6a6a6a", "#0afa0a", "#000000"];

  function draw_single(d, color) {
    var k;
    xScale = (d.length) / width;
    ctx.strokeStyle = color;
    //ctx.lineWidth = 2;
    ctx.moveTo(0, d[0]);
    ctx.beginPath();
    ctx.translate(0.5, 0.5);
    for (k = 0; k < width; k++) {
    //ctx.strokeRect(k, zero, 1, yScale * data[Math.floor(k * xScale)]);
    ctx.lineTo(k, zero - Math.floor(yScale * d[Math.floor(k * xScale)]));
    }
    ctx.stroke();
  }

  if (typeof prop.data[0] === 'number') {
    draw_single(prop.data);
  }
  else {
    for (var t = 0; t < prop.data.length; t++) {
      draw_single(prop.data[t], clr[t]);
    }
  }
}

function scaleToTen (data) {
  return scaleToRange(data, -10, 10);
}

function scaleAllToTen (list) {
  var i,
      len = list.length,
      result = [];
  for (i = 0; i < len; i++) {
    result.push(scaleToTen(list[i]));
  }
  return result;
}


function shape_tri(x, y, size, angle) {
  var s = size/2,
      A = [0, -2*s], B = [s,s], C = [-s,s];
  function rotate(P) {
    return [P[0] * Math.cos(angle) - P[1] * Math.sin(angle),
            P[0] * Math.sin(angle) + P[1] * Math.cos(angle)];
  }
  function translate(P) {
    return [P[0] + x, P[1] + y];
  }
  A = translate(rotate(A));
  B = translate(rotate(B));
  C = translate(rotate(C));

  function up(P) {
    return  P[0] + ',' + P[1] + " ";
  }
  return up(A) + up(B) + up(C);
}


 var requestAnimFrame, sliderValue, slider1,
pos_rec, size_rec, r_slider, angle_rec, tri_path, triangle, paper,
angle, disturbance_position, disturbance_size, disturbance_angle,

    cx,  csz, color, button1, mode,
    dist_p, dist_s, dist_a, slider_pos, slider_size, slider_angle;



/*

*/

window.onload = function () {
  console.log("loaded");

  requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame || window.msRequestAnimationFrame ||
    function (c) {window.setTimeout(c, 1000 / 60); };


  slider1 = document.getElementById('slider1');
  slider1.setAttribute('min', '-1000');
  slider1.setAttribute('max', '1000');
  slider1.setAttribute('value', '0');
  slider1.setAttribute('step', '1');

  button1 = document.getElementById('button1');
  button1.addEventListener('click', function () {
    r_slider = [];
    pos_rec    = [];
    size_rec   = [];
    angle_rec  = [];
    dist_a   = [];
    dist_s   = [];
    dist_p   = [];
    slider_angle = [];
    slider_size = [];
    slider_pos = [];
    mode     = 'record';
    console.log('started rec');
  });


  mode = 'animate';

  disturbance_position = dist_maker(0.02, 350);
  disturbance_size = dist_maker(0.03, 50);
  disturbance_angle = dist_maker(0.02, 6.0);
  sliderValue = 0;

  triangle = document.getElementById("triangle");


  var dp, ds, da;

  function animate() {
    dp = disturbance_position.next();
    ds = disturbance_size.next();
    da = disturbance_angle.next();

    sliderValue = parseInt(slider1.value);

    cx = 300 + dp + 0.2 * sliderValue;
    csz = 80 + ds + 0.07 * sliderValue;
    angle =  0 + da + 0.002 * sliderValue;

    cx = constrain(cx, 60, 540);
    csz = constrain(csz, 30, 150);
    angle = constrain(angle, -3,3);
    triangle.setAttribute('points', shape_tri(cx,150,  csz, angle));
  }

  function record() {
    animate();
    dist_p.push(dp);
    dist_s.push(ds);
    dist_a.push(da);

    pos_rec.push(-300 + cx);
    size_rec.push(-80 + csz);
    angle_rec.push(angle);

    slider_pos.push(0.2*sliderValue);
    slider_size.push(0.07*sliderValue);
    slider_angle.push(0.002*sliderValue);

    if (pos_rec.length >= 1000) {
      mode = 'analyze';
    }
  }

  function analyze() {
    var m = stat.pearson(dist_p, slider_pos);
    var n = stat.pearson(dist_s, slider_size);
    var k = stat.pearson(dist_a, slider_angle);

    var sol = (m < n) && (m < k) && (m < -0.5)? "position"
              : ((n < m) && (n < k) && (n< -0.5)) ? "size"
              : (k < -0.5) ? 'angle'
              : "*undetermined*";


    console.log(m, n, k);
    console.log("You were controlling " + sol + '.');
    var response_text = "You were controlling " + sol + "."
    var html_response = document.getElementById("Analysis");
    html_response.innerHTML = response_text;


    var h = stat.pearson(pos_rec, size_rec);
    var j = stat.pearson(size_rec, angle_rec);
    var k = stat.pearson(angle_rec, pos_rec);
    console.log("dist_p", stat.min(dist_p), stat.max(dist_p));
    console.log("dist_s", stat.min(dist_s), stat.max(dist_s));
    console.log("dist_a", stat.min(dist_a), stat.max(dist_a));
    //console.log(h, j, k);

    plot({canvas: 'c1', data : [ dist_p, pos_rec, slider_pos], yScale: 0.15});
    plot({canvas: 'c2', data : [ dist_s, size_rec, slider_size], yScale: 0.6});
    plot({canvas: 'c3', data : [ dist_a, angle_rec, slider_angle], yScale: 13 });
  //  plot({canvas: 'c4', data: r_slider, yScale: 0.01});
    mode = 'animate';
  }

  var select_mode = {'record' : record, 'animate' : animate, 'analyze' : analyze};

  function fnStep() {
    select_mode[mode]();
    requestAnimFrame(fnStep);
  }

  requestAnimFrame(fnStep);
};

