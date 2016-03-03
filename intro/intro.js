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

var ball, frame, ball2, frame2;
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
  svg_frame.style.height = '70px';

  var defs = lib.make_svg('defs');
  svg_frame.appendChild(defs);

  defs.appendChild(gradient);


  svg_frame.appendChild(ball);
  frame.appendChild(svg_frame);

  animate_red_ball();



  ball2 = make_red_ball(gradient);
  frame2 = g("artificial_div");
  frame2.style.width = '600px';
  frame2.style.height = '200px';
  frame2.style.margin = 'auto';

  var svg_frame2 = lib.make_svg('svg');
  svg_frame2.style.border = 'solid 1px';
  svg_frame2.style.width = '100%';
  svg_frame2.style.height = '70px';

  var defs2 = lib.make_svg('defs');
  svg_frame2.appendChild(defs2);

  defs2.appendChild(gradient);


  svg_frame2.appendChild(ball2);
  frame2.appendChild(svg_frame2);

  animate_red_ball2();
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

      if (streams.disturbance.data.length > (600 / 0.3)) {
        for (k in streams)
          streams[k].data.shift();
      }

      plot.update(streams);
      counter = 3;
    }
    requestAnimFrame(animate);
  }

  requestAnimFrame(animate);
}



function animate_red_ball2() {
  var requestAnimFrame = lib.requestAnimFrame();

  var signals = {
    d: 0,
    o: 0,
    x: 0
  };

  var slider1 = lib.make_big_slider(signals, 'o', {
    min: -10,
    max: 10,
    step: 1,
    width: 600,
    x: 0,
    y: 80
  });
  frame2.appendChild(slider1);

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
  frame2.appendChild(plot.frame);

  var counter = 0;
  var reference = 0;
  var err = 0,
    f = 0;

  var M = 0.01,
    A = 0,
    V = 0,
    dt = 1 / 60,
    F = 0,
    S = 0;

  function animate() {


    signals.d = +slider1.value;

    F = signals.o + signals.d;

    A = F / M;
    V = V + A * dt;
    S = S + 0.5 * V * dt;
    signals.x = S;


    err = reference - signals.x;

    signals.o += (err * 10 - signals.o - V * 150) * (0.016 / 30);

    //console.log(signals.x, signals.d, signals.o);

    ball2.setAttribute('cx', 300 + signals.x);

    if (counter++ > 2) {
      streams.disturbance.data.push(-signals.d * 0.2);
      streams.output.data.push(signals.o * 0.2);
      streams.position.data.push(signals.x * 0.2);

      if (streams.disturbance.data.length > (600 / 0.3)) {
        for (k in streams)
          streams[k].data.shift();
      }

      plot.update(streams);
      counter = 3;
    }
    //if (signals.x < 200)
    requestAnimFrame(animate);
  }

  requestAnimFrame(animate);
}
