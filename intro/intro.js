/*jslint browser: true*/

function scaleToTen(data) {
  return scaleToRange(data, -10, 10);
}

function scaleAllToTen(list) {
  var i,
    len = list.length,
    result = [];
  for (i = 0; i < len; i++) {
    result.push(scaleToTen(list[i]));
  }
  return result;
}

function make_radial_red() {
  var gradient, stop1, stop2;

  gradient = lib.make_svg('radialGradient');
  stop1 = lib.make_svg('stop');
  stop2 = lib.make_svg('stop');

  gradient.setAttribute('id', 'radial_red');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', 'red');

  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', 'black');

  lib.setAttr(gradient, {
    'cx': '50%',
    cy: '50%',
    r: '70%',
    fx: '30%'
  });
  gradient.appendChild(stop1);
  gradient.appendChild(stop2);

  return gradient;

}

function make_red_ball(gradient) {
  var ball;

  ball = lib.make_svg('ellipse');
  ball.setAttribute('cx', '300');
  ball.setAttribute('cy', '35');
  ball.setAttribute('rx', '30');
  ball.setAttribute('ry', '30');
  ball.setAttribute('fill', 'url(#' + gradient.id + ')');
  return ball;
}

var ball, frame;
window.onload = function () {

  var g = function (x) {
    return document.getElementById(x);
  }

  gradient = make_radial_red();
  ball = make_red_ball(gradient);


  frame = g("red_ball_div");
  // frame.style.border = 'dashed 1px';
  frame.style.width = '600px';
  frame.style.height = '200px';
  frame.style.margin = 'auto';

  svg_frame = lib.make_svg('svg');
  svg_frame.style.border = 'solid 1px';
  svg_frame.style.width = '100%';
  svg_frame.style.height = '70';

  var defs = lib.make_svg('defs');
  svg_frame.appendChild(defs);

  defs.appendChild(gradient);


  svg_frame.appendChild(ball);
  frame.appendChild(svg_frame);

  animate_red_ball();

}

function animate_red_ball() {
  var requestAnimFrame = lib.requestAnimFrame();

  var signals = {
    d: 0,
    o: 0,
    x: 0
  };

  var slider1 = lib.make_big_slider(signals, 'o', {
    min: -200,
    max: 200,
    step: 0.01,
    width: 600,
    x: 0,
    y: 80
  });
  frame.appendChild(slider1);

  var disturbance = lib.make_dist(0.02, 300);

  var streams = {
    disturbance: {
      data: [],
      color: 'green'
    },
    output: {
      data: [],
      color: 'gray'
    },
    position: {
      data: [],
      color: 'red'
    }

  };
  var plot = lib.make_svg_plot(streams);
  frame.appendChild(plot.frame);

  var counter = 0;

  function animate() {
    signals.d = disturbance.next();
    signals.o = +slider1.value || 0;
    signals.x = signals.o - signals.d;
    ball.setAttribute('cx', 300 + signals.x);

    if (counter++ > 2) {
      streams.disturbance.data.push(-signals.d * 2);
      streams.output.data.push(signals.o * 2);
      streams.position.data.push(signals.x);

      if (streams.disturbance.data.length > 600) {
        for (k in streams)
          streams[k].data.shift();
      }

      plot.update(streams);
      counter = 0;
    }
    requestAnimFrame(animate);
  }

  requestAnimFrame(animate);
}

/*
slider1 = document.getElementById('slider1');
slider1.setAttribute('min', '-1000');
slider1.setAttribute('max', '1000');
slider1.setAttribute('value', '0');
slider1.setAttribute('step', '.5');
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
  */
/*

function analyze() {
  var m = stat.pearson(dist_p, slider_pos);
  var n = stat.pearson(dist_s, slider_size);
  var k = stat.pearson(dist_a, slider_angle);

  var sol = (m < n) && (m < k) && (m < -0.5) ? "position" : ((n < m) && (n < k) && (n < -0.5)) ? "size" : (k < -0.5) ? 'angle' : "*undetermined*";


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

  plot({
    canvas: 'c1',
    data: [dist_p, pos_rec, slider_pos],
    yScale: 0.15
  });
  plot({
    canvas: 'c2',
    data: [dist_s, size_rec, slider_size],
    yScale: 0.6
  });
  plot({
    canvas: 'c3',
    data: [dist_a, angle_rec, slider_angle],
    yScale: 13
  });
  //  plot({canvas: 'c4', data: r_slider, yScale: 0.01});
  mode = 'animate';
}

var select_mode = {
  'record': record,
  'animate': animate,
  'analyze': analyze
};

function fnStep() {
  select_mode[mode]();
  requestAnimFrame(fnStep);
}

requestAnimFrame(fnStep);
};
*/
