// Licence: MIT

/*
uses:

snap.svg.js - a vector graphics library, www.snapsvg.io
lib.js      - helper functions for drawing plots, generating disturbances and similar
stat.js     - some basic statistics

All can be found in the /js/ folder
*/



/*

The code is divided into sections represening each step of
the tutorial separately. HTML page contains draw areas, plot areas, buttons and other elements refered to in javascript code.

*/

// creates a 'circ' function which is just the circle rim without fill (default 'circle' a black filled circle)
Snap.plugin(function (Snap, Element, Paper, global) {
  Element.prototype.circ = function (x, y, r) {
    return this.circle(x, y, r).attr({
      'stroke': '#000',
      'fill': 'none'
    })
  }
});


// draws a box with a draggable number, check later code for examples of use
function parameter(snap_scr, opts) {
  var p = {};
  p.draw_rect = ((opts.draw_rect === undefined) || opts.draw_rect);
  p.name = opts.name || 'NN';
  p.value = opts.value || 0;
  p.prev_value = p.value;
  p.min = opts.min || 0;
  p.max = opts.max || 10;
  p.step = opts.step || 0.1;
  p.x = opts.x || 10;
  p.y = opts.y || 10;
  p.width = opts.width || 90;
  p.height = opts.height || 25;
  p.onchange = opts.onchange || function () {};

  if (p.draw_rect) snap_scr.rect(p.x, p.y, p.width, p.height).attr({
    fill: 'none',
    stroke: '#000'
  })

  snap_scr.text(p.x + 5, p.y + 17, p.name);

  function lim(num) {
    return num > p.max ? p.max :
      (num < p.min) ? p.min : num;
  }

  var t = snap_scr.text(p.x + 75, p.y + 17, p.value.toFixed(2)).attr({
    'text-anchor': 'end',
    cursor: 'col-resize'
  });

  function sq(x) {
    return Math.sign(x) * Math.floor(0.01 * x * x) * p.step;
  }

  function move(dx, dy) {
    t.attr('text', lim((Number(p.prev_value) + sq(dx))).toFixed(2));
    p.value = Number(t.attr('text'));
    p.onchange();
  }

  function start_move() {
    p.prev_value = p.value;

  }

  t.drag(move, start_move);

  return p;
}


// draws a black line and an arrow
function wire_line(snap_scr, opts) {

  var o = {};
  o.points = opts.points || [0, 0];
  o.stroke = opts.stroke || 'black';
  o.fill = opts.fill || 'none';

  function left(x, y) {
    o.arrow = snap_scr.polyline(x + 10, y + 4, x, y, x + 10, y - 4);
  }

  function up(x, y) {
    o.arrow = snap_scr.polyline(x - 4, y + 10, x, y, x + 4, y + 10);
  }

  function right(x, y) {
    o.arrow = snap_scr.polyline(x - 10, y - 4, x, y, x - 10, y + 4);
  }

  function down(x, y) {
    o.arrow = snap_scr.polyline(x - 4, y - 10, x, y, x + 4, y - 10);
  }

  o.line = snap_scr.polyline(o.points).attr({
    stroke: o.stroke,
    fill: o.fill
  });

  var l = o.points.length;

  if (opts.arrow === 'left') left(o.points[0], o.points[1]);
  if (opts.arrow === 'up') up(o.points[0], o.points[1]);
  if (opts.arrow === 'right') right(o.points[l - 2], o.points[l - 1]);
  if (opts.arrow === 'down') down(o.points[l - 2], o.points[l - 1]);

  return o;

}

// show a name of the signal and its value below the name
function signal_meter(snap_scr, opts) {
  var s = {
    x: opts.x || 0,
    y: opts.y || 0,
    color: opts.color || 'black',
    name: opts.name || "NN",
    value: opts.value || 0
  };

  var o = {
    'fill': s.color,
    'stroke': s.color,
    'stroke-width': 0.4,
    'text-anchor': 'middle',
  }
  s.text = snap_scr.text(s.x, s.y, s.name).attr(o);
  o["text-anchor"] = 'end';
  s.number = snap_scr.text(s.x + 20, s.y + 20, "0.00").attr(o);

  s.update = function (x) {
    //  console.log(s.name, x);
    s.number.attr('text', x.toFixed(2));
  }
  return s;
}

// this will probably go to the lib.js file
// Draws plot axes and redraws the plot when updated with latest values of signals
// not very flexible with the size of the plot area at the moment

function LivePlot(plot_area) {
  var num_signals, signals, plot, lines, num_data;

  num_signals = 0;
  num_data = 0;
  plot = Snap(plot_area);
  lines = [];
  signals = {};

  function add_signal(s, name, color) {
    num_signals++;
    signals[s] = [];

    plot.text(425, 15 * num_signals, name).attr({
      'font-size': 10,
      'fill': color,
      'stroke': color,
      'stroke-width': 0.2
    });
    lines[s] = plot.path("M420,50");
    lines[s].attr({
      'fill': 'none',
      'stroke': color
    });
  }


  function draw_axes() {
    var s, fsize, i, labels;

    fsize = 9;
    i = 0;
    plot.line(20, 50, 420, 50).attr('stroke', 'gray');
    plot.line(20, 0, 20, 100).attr('stroke', 'gray');

    labels = [
          plot.text(410, 62, "t"), plot.text(-2, 100, '-200'), plot.text(-2, 75, '-100'), plot.text(9, 52, '0'), plot.text(2, 28, '100'), plot.text(2, 7, '200')];

    labels.forEach(function (n) {
      n.attr('font-size', fsize);
    });

  }

  function to_line(arr, ioff) {
    var i = 0,
      iscale = 0.222,
      scale = -0.25,
      offset = 50,
      l = arr.length,
      s = "M" + (ioff + i * iscale) + "," + (offset + (arr[i] || 0) * scale);

    for (i = 1; i < l; i += 6) {
      s += "L" + (ioff + i * iscale) + "," + (offset + arr[i] * scale);
    }
    return s;
  }

  function update(s) {
    var k;
    for (k in s) {
      signals[k].push(s[k]);
    }

    if (num_data >= 1800) {
      for (k in s) {
        signals[k].shift();
      }
    } else {
      num_data += 1;
    }

    for (k in signals) {
      lines[k].attr("d", to_line(signals[k], 420 - (num_data * 0.222)));
    }
  }


  draw_axes();

  return {
    add_signal: add_signal,
    update: update
  }
};

// adds the handle and disturbacne parts of the diagram
// this is the only part that needed to be shifted in the draw area (probably possible to do that automaticaly...)
function add_environment(s, x, y, recalc) {
  s.circ(x + 55, y + 35, 10);
  wire_line(s, {
    points: [x + 65, y + 35, x + 155, y + 35],
    arrow: 'left'
  });
  wire_line(s, {
    points: [x + 245, y + 35, x + 330, y + 35],
    arrow: 'left'
  });
  wire_line(s, {
    points: [x + 245, y + 95, x + 330, y + 95],
    arrow: 'left'
  });
  wire_line(s, {
    points: [x + 55, y + 45, x + 55, y + 95, x + 155, y + 95],
    arrow: 'up'
  });
  s.circ(x + 340, y + 35, 10);
  s.circ(x + 340, y + 95, 10);

  // handle
  s.line(x + 358, y + 35, x + 390, y + 35).attr('stroke', '#000');
  s.hand = s.line(x + 373, y + 28, x + 373, y + 42).attr({
    'stroke': "green",
    'stroke-width': "3"
  });
  s.hand.update = function (x) {
    s.hand.transform("t" + x + ",0");
  }

  wire_line(s, {
    points: [55, y - 25, 55, y + 25],
    arrow: 'up'
  });


  s.h = signal_meter(s, {
    'color': 'green',
    x: 295 + x,
    y: 29 + y,
    name: "h"
  });
  s.kfh = signal_meter(s, {
    color: '#052',
    x: 110 + x,
    y: 29 + y,
    name: "Kf*h"
  });
  s.d = signal_meter(s, {
    color: 'red',
    x: 295 + x,
    y: 91 + y,
    name: "d"
  });
  s.kdd = signal_meter(s, {
    color: '#800',
    x: 110 + x,
    y: 91 + y,
    name: "Kd*d"
  });
  s.c = signal_meter(s, {
    color: 'black',
    x: 33 + x,
    y: y,
    name: "c"
  });

  s.Kf = parameter(s, {
    name: 'Kf',
    x: x + 155,
    y: y + 21,
    min: 0.0,
    max: 3,
    step: 0.01,
    value: 1.0,
    onchange: recalc
  });

  s.Kd = parameter(s, {
    name: 'Kd',
    x: x + 155,
    y: y + 81,
    min: 0.0,
    max: 3,
    step: 0.01,
    value: 1.0,
    onchange: recalc
  });

}

// generic Demo function for control systems diagrams, sets up basic functionality of the elements, grabs pointers to HTML elements and so on. Each step of the tutorial then adds particular components (environment, perception...)

function Demo(params) {
  var cursor, handle, diagram_screen, cursor_screen, plot, c, h, d, model, start_button, running, disturbance;

  var demo = {
    recalc: null
  };

  diagram_screen = Snap("#" + params.diagram_screen);
  handle = lib.$(params.handle);
  cursor_screen = Snap('#' + params.cursor_screen);
  start_button = lib.$(params.start_button);
  plot = LivePlot('#' + params.plot);

  demo.running = false;

  cursor_screen.attr("cursor", "crosshair");
  cursor_screen.mousemove(function (ev, x, y) {
    handle.value = -200 + x - this.node.getBoundingClientRect().left;
    if (!demo.running) demo.recalc()
  });


  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 1);
  handle.oninput = function () {
    if (!demo.running) demo.recalc();
  }


  cursor = cursor_screen.rect(199, 20, 1, 30);
  cursor_screen.polygon(197, 70, 200, 55, 203, 70);
  cursor_screen.polygon(197, 0, 200, 15, 203, 0);

  disturbance = lib.make_disturbance(3, 300);

  start_button.onclick = function () {
    if (!demo.running) {
      demo.running = true;
      start_button.setAttribute("value", "Pause");
      lib.request_anim_frame(animate);
    } else {
      demo.running = false;
      start_button.setAttribute("value", "Start");
    }
  }

  function animate() {
    if (demo.running) {
      demo.update_disturbance();
      demo.recalc();
      plot.update({
        c: demo.c,
        h: demo.h,
        d: demo.d
      });
    }
    lib.request_anim_frame(animate);
  }


  demo.update_disturbance = function () {
    demo.d = Math.floor(disturbance.next());
    diagram_screen.d.update(demo.d);
  }

  demo.update_screen = function (signals) {
    signals.forEach(function (k) {
      diagram_screen[k].update(demo[k])
    });
    cursor.attr('x', 200 + demo.c);
  }

  demo.cursor = cursor;
  demo.cursor_screen = cursor_screen;
  demo.diagram_screen = diagram_screen;
  demo.plot = plot;
  demo.handle = handle;
  demo.disturbance = disturbance;
  return demo;
}


(function StepB() {
  var m = Demo({
    diagram_screen: 'B-model',
    handle: 'B-handle-slider',
    cursor_screen: 'B-screen',
    start_button: 'B-start',
    plot: 'B-plot',
  })
  m.c = 0;
  m.h = 0;
  m.d = 0;
  m.kdd = 0;
  m.kfh = 0;

  m.recalc = function () {
    m.h = Number(m.handle.value);
    m.hand = 0.075 * m.h;

    m.kdd = m.diagram_screen.Kd.value * m.d;
    m.kfh = m.diagram_screen.Kf.value * m.h;
    m.c = m.kdd + m.kfh;
    m.update_screen(["c", "h", "kfh", "kdd", "hand"]);
  }

  add_environment(m.diagram_screen, 0, 40, m.recalc);

  m.plot.add_signal('c', 'cursor', 'black');
  m.plot.add_signal('h', 'handle', 'green');
  m.plot.add_signal('d', 'disturbance', 'red');

}());


function add_perception(s, recalc) {

  s.c.text.attr({
    'text': "qi"
      //    'y': 150
  });
  //s.c.number.attr({
  //  'y': 165
  //});

  // s.h.text.attr("text", 'h');

  // sys-env limit
  s.line(43, 140, 356, 140).attr({
    'stroke': '#000',
    'stroke-dasharray': [9, 10]
  });

  s.Ki = parameter(s, {
    name: 'Ki',
    x: 15,
    y: 100,
    min: 0.0,
    max: 3,
    step: 0.01,
    value: 1.0,
    onchange: recalc
  });

  wire_line(s, {
    points: [55, 100, 55, 65, 155, 65],
    arrow: 'right'
  });

  s.p = signal_meter(s, {
    color: 'dark-gray',
    x: 110,
    y: 58,
    name: "p"
  });

}

function add_reference(s, recalc) {
  s.r = parameter(s, {
    name: 'r',
    x: 180,
    y: 13,
    min: -200,
    max: 200,
    step: 0.5,
    value: 0.00,
    draw_rect: false,
    onchange: recalc
  });

  s.rect(155, 48, 90, 30).attr({
    fill: 'none',
    stroke: 'black'
  });

  s.text(162, 68, "Comparator");

  wire_line(s, {
    points: [200, 10, 200, 45],
    arrow: 'down'
  });

  s.e = signal_meter(s, {
    color: 'dark-gray',
    x: 300,
    y: 58,
    name: "e"
  });
  wire_line(s, {
    points: [245, 65, 340, 65, 340, 100],
    arrow: 'down'
  })
}

function add_output(s, recalc) {

  s.Ko = parameter(s, {
    name: 'Ko',
    x: 295,
    y: 100,
    min: 0.25,
    max: 50,
    step: 0.1,
    value: 1.0,
    onchange: recalc
  });

  s.qo = signal_meter(s, {
    name: "qo",
    color: 'black',
    x: 380,
    y: 145
  });
}

function add_close_loop(s, recalc) {
  s.feedback_wire = wire_line(s, {
    points: [340, 125, 340, 175],
    arrow: 'down'
  });
}


// Step C: Modeling perception

(function StepC() {
  var m = Demo({
    diagram_screen: 'C-model',
    handle: 'C-handle-slider',
    cursor_screen: 'C-screen',
    start_button: 'C-start',
    plot: 'C-plot',
  })

  m.plot.add_signal('c', 'qi', 'black');
  m.plot.add_signal('h', 'h', 'green');
  m.plot.add_signal('d', 'd', 'red');

  m.c = 0;
  m.h = 0;
  m.d = 0;
  m.p = 0;
  m.kdd = 0;
  m.kfh = 0;

  m.recalc = function () {
    m.h = Number(m.handle.value);
    m.hand = 0.075 * m.h;

    m.kdd = m.diagram_screen.Kd.value * m.d;
    m.kfh = m.diagram_screen.Kf.value * m.h;
    m.c = m.kdd + m.kfh;
    m.p = m.diagram_screen.Ki.value * m.c;

    m.update_screen(["c", "h", "p", "kfh", "kdd", "hand"]);
  };

  add_environment(m.diagram_screen, 0, 150, m.recalc);
  add_perception(m.diagram_screen, m.recalc);

})();




// Step D: Error and reference signals
(function StepD() {
  var m = Demo({
    diagram_screen: 'D-model',
    handle: 'D-handle-slider',
    cursor_screen: 'D-screen',
    start_button: 'D-start',
    plot: 'D-plot',
  })

  m.plot.add_signal('c', 'qi', 'black');
  m.plot.add_signal('h', 'h', 'green');
  m.plot.add_signal('d', 'd', 'red');

  m.c = 0;
  m.h = 0;
  m.d = 0;
  m.p = 0;
  m.e = 0;

  m.recalc = function () {
    m.h = Number(m.handle.value);
    m.hand = 0.075 * m.h;

    m.kdd = m.diagram_screen.Kd.value * m.d;
    m.kfh = m.diagram_screen.Kf.value * m.h;
    m.c = m.kdd + m.kfh;
    m.p = m.diagram_screen.Ki.value * m.c;
    m.e = m.diagram_screen.r.value - m.p;

    m.update_screen(["c", "h", "p", "e", "kfh", "kdd", "hand"]);
  };

  add_environment(m.diagram_screen, 0, 150, m.recalc);
  add_perception(m.diagram_screen, m.recalc);
  add_reference(m.diagram_screen, m.recalc);

})();


// Step E: The output function
(function StepE() {
  var m = Demo({
    diagram_screen: 'E-model',
    handle: 'E-handle-slider',
    cursor_screen: 'E-screen',
    start_button: 'E-start',
    plot: 'E-plot',
  })

  m.plot.add_signal('c', 'qi', 'black');
  m.plot.add_signal('h', 'h', 'green');
  m.plot.add_signal('d', 'd', 'red');

  m.c = 0;
  m.h = 0;
  m.d = 0;
  m.p = 0;
  m.e = 0;
  m.qo = 0;

  m.recalc = function () {
    m.h = Number(m.handle.value);
    m.hand = 0.075 * m.h;

    m.kdd = m.diagram_screen.Kd.value * m.d;
    m.kfh = m.diagram_screen.Kf.value * m.h;
    m.c = m.kdd + m.kfh;
    m.p = m.diagram_screen.Ki.value * m.c;
    m.e = m.diagram_screen.r.value - m.p;
    m.qo = m.diagram_screen.Ko.value * m.e;

    m.update_screen(["c", "h", "p", "e", "qo", "kfh", "kdd", "hand"]);
  };

  add_environment(m.diagram_screen, 0, 150, m.recalc);
  add_perception(m.diagram_screen, m.recalc);
  add_reference(m.diagram_screen, m.recalc);
  add_output(m.diagram_screen, m.recalc);
})();



// Step F: Closing the loop
(function StepF() {
  var loop_closed = false;
  var S, Ko, Ki, Kf, Kd;

  var m = Demo({
    diagram_screen: 'F-model',
    handle: 'F-handle-slider',
    cursor_screen: 'F-screen',
    start_button: 'F-start',
    plot: 'F-plot',
  })

  m.plot.add_signal('c', 'qi', 'black');
  m.plot.add_signal('h', 'h/qo', 'green');
  m.plot.add_signal('d', 'd', 'red');

  m.c = 0;
  m.h = 0;
  m.d = 0;
  m.p = 0;
  m.e = 0;
  m.qo = 0;

  m.recalc = function () {
    Kd = m.diagram_screen.Kd.value;
    Kf = m.diagram_screen.Kf.value;
    Ki = m.diagram_screen.Ki.value;
    Ko = m.diagram_screen.Ko.value;

    S = 1 + Ko * Kf * Kd;

    if (loop_closed) {
      m.h = m.qo;
    } else {
      m.h = Number(m.handle.value);
    }
    m.hand = 0.075 * m.h;

    m.kdd = Kd * m.d;
    m.kfh = Kf * m.h;
    m.c = m.kdd + m.kfh;
    m.p = Ki * m.c;
    m.e = m.diagram_screen.r.value - m.p;

    var out = m.e * Ko;

    if (loop_closed) {
      m.qo = m.qo + (out - m.qo) / S;
    } else {
      m.qo = out;
    }

    m.update_screen(["c", "h", "p", "e", "qo", "kfh", "kdd", "hand"]);
  };

  add_environment(m.diagram_screen, 0, 150, m.recalc);
  add_perception(m.diagram_screen, m.recalc);
  add_reference(m.diagram_screen, m.recalc);
  add_output(m.diagram_screen, m.recalc);
  add_close_loop(m.diagram_screen, m.recalc);

  show_wire(false);

  function show_wire(b_show) {
    var t = b_show ? "" : "none";
    m.diagram_screen.feedback_wire.line.attr("display", t);
    m.diagram_screen.feedback_wire.arrow.attr("display", t);
    m.diagram_screen.h.text.attr('text', b_show ? "qo" : 'h');
  }

  close_loop_button = lib.$('F-close-loop');

  close_loop_button.onclick = function () {
    if (loop_closed) {
      show_wire(false);
      loop_closed = false;
      close_loop_button.setAttribute("value", "Close loop");
      m.recalc();
    } else {
      show_wire(true);
      loop_closed = true;
      close_loop_button.setAttribute("value", "Open loop");
      m.recalc();
    }
  }

})();




// Step H: Higher level control
(function StepH() {
  var S, Ko, Kf, Ki, Kd;

  var m = Demo({
    diagram_screen: 'H-model',
    cursor_screen: 'H-screen',
    start_button: 'H-start',
    plot: 'H-plot',
    handle: "H-handle-slider"
  })

  m.plot.add_signal('c', 'qi', 'black');
  m.plot.add_signal('h', 'qo', 'green');
  m.plot.add_signal('d', 'd', 'red');

  m.c = 0;
  m.h = 0;
  m.d = 0;
  m.p = 0;
  m.e = 0;
  m.qo = 0;

  m.handle.style.visibility = "hidden";

  m.recalc = function () {
    Kd = m.diagram_screen.Kd.value;
    Kf = m.diagram_screen.Kf.value;
    Ki = m.diagram_screen.Ki.value;
    Ko = m.diagram_screen.Ko.value;

    S = 1 + Ko * Kf * Kd;

    m.kdd = Kd * m.d;
    m.kfh = Kf * m.h;
    m.c = m.kdd + m.kfh;
    m.p = Ki * m.c;
    m.e = m.diagram_screen.r.value - m.p;

    var out = m.e * Ko;
    m.qo = m.qo + (out - m.qo) / S;
    m.h = m.qo;
    m.hand = 0.075 * m.h;
    m.update_screen(["c", "h", "p", "e", "qo", "kfh", "kdd", "hand"]);
  };

  add_environment(m.diagram_screen, 0, 150, m.recalc);
  add_perception(m.diagram_screen, m.recalc);
  add_reference(m.diagram_screen, m.recalc);
  add_output(m.diagram_screen, m.recalc);
  add_close_loop(m.diagram_screen, m.recalc);

  m.diagram_screen.h.text.attr("text", "qo");

})();


// a draggable number with some differences from the 'parameter' element (positioning of numbers)
function eq_parameter(snap_scr, opts) {
  var p = {};
  p.color = opts.color || 'black';
  p.name = opts.name || 'NN';
  p.value = opts.value || 0;
  p.prev_value = p.value;
  p.min = opts.min || 0;
  p.max = opts.max || 10;
  p.step = opts.step || 0.1;
  p.x = opts.x || 10;
  p.y = opts.y || 10;
  p.onchange = opts.onchange || function () {};

  var o = {
    'fill': p.color,
    'stroke': p.color,
    'stroke-width': 0.4,
    'text-anchor': 'middle',
  }
  snap_scr.text(p.x, p.y, p.name).attr(o);
  o.cursor = 'col-resize';
  o["text-anchor"] = "end"

  p.number = snap_scr.text(p.x + 20, p.y + 20, p.value.toFixed(2)).attr(o);

  function lim(num) {
    return num > p.max ? p.max :
      (num < p.min) ? p.min : num;
  }

  function sq(x, y) {
    //var ee = Math.pow(2, Math.sqrt(Math.abs(y)) * Math.sign(y));
    //console.log(y, ee);
    var ee = p.step * 0.1 * x;
    return ee;

  }

  function move(dx, dy) {
    p.number.attr('text', lim((Number(p.prev_value) + sq(dx, dy))).toFixed(2));
    p.value = Number(p.number.attr('text'));
    p.onchange();
  }

  function start_move() {
    p.prev_value = p.value;

  }

  p.reset = function (x) {
    p.value = x || opts.value;
    p.number.attr('text', p.value.toFixed(2));
    p.onchange();
  }

  p.number.drag(move, start_move);


  return p;
}



// The Equations of Control
(function StepG() {
  var eq = Snap("#G-equations");
  var start_button = lib.$("G-start");

  var p = 0,
    r = 0,
    e = 0,
    qi = 0,
    qo = 0,
    Kf = 1,
    Ko = 50,
    Kd = 1,
    Ki = 1,
    d = 0,
    S = 50;

  var view = {};

  view.qi1 = signal_meter(eq, {
    name: 'qi',
    color: 'gray',
    x: 50,
    y: 20
  })

  eq_parameter(eq, {
    name: 'Kf',
    x: 120,
    y: 20,
    value: Kf,
    onchange: function () {
      Kf = this.value;
    }
  });

  view.qo1 = signal_meter(eq, {
    name: 'qo',
    color: 'gray',
    x: 190,
    y: 20
  })

  eq_parameter(eq, {
    name: 'Kd',
    x: 260,
    y: 20,
    value: Kd,
    min: 0,
    onchange: function () {
      Kd = this.value;
    }
  });

  eq_parameter(eq, {
    name: 'd',
    x: 330,
    y: 20,
    value: d,
    min: -1000,
    max: +1000,
    step: 10,
    onchange: function () {
      d = this.value;
    }
  });

  view.p1 = signal_meter(eq, {
    name: 'p',
    x: 50,
    y: 80,
    color: 'gray'
  })
  eq_parameter(eq, {
    name: "Ki",
    x: 120,
    y: 80,
    value: Ki,
    onchange: function () {
      Ki = this.value;
    }
  });

  view.qi2 = signal_meter(eq, {
    color: 'gray',
    name: 'qi',
    x: 190,
    y: 80
  });
  view.e1 = signal_meter(eq, {
    color: 'gray',
    name: 'e',
    x: 50,
    y: 140
  })
  eq_parameter(eq, {
    name: "r",
    x: 120,
    y: 140,
    value: r,
    min: -1000,
    max: +1000,
    step: 10,
    onchange: function () {
      r = this.value;
    }
  });
  view.p2 = signal_meter(eq, {
    color: 'gray',
    name: 'p',
    x: 190,
    y: 140
  })
  view.qo2 = signal_meter(eq, {
    color: 'gray',
    name: 'qo',
    x: 50,
    y: 200
  })
  eq_parameter(eq, {
    name: "Ko",
    x: 120,
    y: 200,
    value: Ko,
    max: 1000,
    step: 3,
    onchange: function () {
      Ko = this.value;
    }
  });
  view.e2 = signal_meter(eq, {
    color: 'gray',
    name: 'e',
    x: 190,
    y: 200
  })

  eq.text(76, 19, "=");
  eq.text(76, 79, "=");
  eq.text(76, 139, "=");
  eq.text(76, 199, "=");
  eq.text(146, 21, "*");
  eq.text(146, 81, "*");
  eq.text(146, 138, "-");
  eq.text(146, 201, "*");
  eq.text(216, 19, "+");
  eq.text(286, 21, "*");



  view.update = function () {
    view.qi1.update(qi);
    view.qi2.update(qi);
    view.p1.update(p);
    view.p2.update(p);
    view.e1.update(e);
    view.e2.update(e);
    view.qo1.update(qo);
    view.qo2.update(qo);
  }


  var running = false;

  start_button.onclick = function () {
    if (!running) {
      running = true;
      start_button.setAttribute("value", "Stop");
      solve();
    } else {
      running = false;
      start_button.setAttribute("value", "Start");
    }
  }

  function solve() {
    S = 1 + Ko * Kf * Kd;
    qi = Kf * qo + Kd * d;
    p = Ki * qi;
    e = r - p;
    qo = qo + (Ko * e - qo) / S;

    view.update();

    if (running) {
      lib.request_anim_frame(solve);
    }
  }

}());



// Dynamics: The Slowing Factor
(function StepH() {
  var eq = Snap("#H-equations");
  var step_button = lib.$("H-step");

  var r = 0,
    e = 1,
    qo_old = 0,
    qo_next = 0,
    Ko = 50,
    S = 2;

  var view = {};


  view.qo_new = signal_meter(eq, {
    name: 'qo_new',
    x: 30,
    y: 20,
    color: 'gray'
  })

  view.qo_old1 = signal_meter(eq, {
    name: 'qo_old',
    x: 100,
    y: 20,
    color: 'gray'
  })

  eq_parameter(eq, {
    name: 'Ko',
    x: 170,
    y: 20,
    value: Ko,
    min: -1000,
    max: +1000,
    step: 1,
    onchange: function () {
      Ko = this.value;
    }
  });

  eq_parameter(eq, {
    name: 'e',
    x: 240,
    y: 20,
    value: e,
    min: -100,
    max: +100,
    step: 1,
    onchange: function () {
      e = this.value;
    }
  });


  view.qo_old2 = signal_meter(eq, {
    name: 'qo_old',
    x: 310,
    y: 20,
    color: 'gray'
  })

  eq_parameter(eq, {
    name: "S",
    x: 380,
    y: 20,
    value: S,
    min: 0.01,
    step: 1,
    max: 1000,
    onchange: function () {
      S = this.value;
    }
  });

  eq.text(60, 19, "=");
  eq.text(132, 20, "+ (");
  eq.text(200, 21, "*");
  eq.text(260, 19, "-");
  eq.text(340, 20, ") /");

  view.update = function () {
    view.qo_old1.update(qo_old);
    view.qo_old2.update(qo_old);
    view.qo_new.update(qo_new);
  }

  step_button.onclick = function () {
    qo_new = qo_old + (Ko * e - qo_old) / S;

    view.update();

    qo_old = qo_new;

  };


}());




// The Equations of Control
(function StepG() {
  var eq = Snap("#I-equations");
  var start_button = lib.$("I-start");
  var step_button = lib.$("I-step");

  var p = 0,
    r = 0,
    e = 0,
    qi = 0,
    qo_new = 0,
    qo_old = 0,
    Kf = 1,
    Ko = 50,
    Kd = 1,
    Ki = 1,
    d = 0,
    S = 51;

  var view = {};
  var par = {};

  view.qi1 = signal_meter(eq, {
    name: 'qi',
    color: 'gray',
    x: 50,
    y: 20
  })

  par.Kf = eq_parameter(eq, {
    name: 'Kf',
    x: 120,
    y: 20,
    value: Kf,
    onchange: function () {
      Kf = this.value;
      update_gain();
    }
  });

  view.qo_new1 = signal_meter(eq, {
    name: 'qo_new',
    color: 'gray',
    x: 190,
    y: 20
  })

  par.Kd = eq_parameter(eq, {
    name: 'Kd',
    x: 260,
    y: 20,
    value: Kd,
    min: 0,
    onchange: function () {
      Kd = this.value;
    }
  });

  par.d = eq_parameter(eq, {
    name: 'd',
    x: 330,
    y: 20,
    value: d,
    min: -1000,
    max: +1000,
    step: 10,
    onchange: function () {
      d = this.value;
    }
  });

  view.p1 = signal_meter(eq, {
    name: 'p',
    x: 50,
    y: 80,
    color: 'gray'
  })
  par.Ki = eq_parameter(eq, {
    name: "Ki",
    x: 120,
    y: 80,
    value: Ki,
    onchange: function () {
      Ki = this.value;
      update_gain();
    }
  });

  view.qi2 = signal_meter(eq, {
    color: 'gray',
    name: 'qi',
    x: 190,
    y: 80
  });
  view.e1 = signal_meter(eq, {
    color: 'gray',
    name: 'e',
    x: 50,
    y: 140
  })
  par.r = eq_parameter(eq, {
    name: "r",
    x: 120,
    y: 140,
    value: r,
    min: -1000,
    max: +1000,
    step: 10,
    onchange: function () {
      r = this.value;
    }
  });
  view.p2 = signal_meter(eq, {
    color: 'gray',
    name: 'p',
    x: 190,
    y: 140
  })

  view.qo_new2 = signal_meter(eq, {
    name: 'qo_new',
    x: 50,
    y: 200,
    color: 'gray'
  })

  view.qo_old1 = signal_meter(eq, {
    name: 'qo_old',
    x: 120,
    y: 200,
    color: 'gray'
  })

  par.Ko = eq_parameter(eq, {
    name: 'Ko',
    x: 190,
    y: 200,
    value: Ko,
    min: -1000,
    max: +1000,
    step: 1,
    onchange: function () {
      Ko = this.value;
      update_gain();
    }
  });

  view.e2 = signal_meter(eq, {
    name: 'e',
    x: 260,
    y: 200,
    color: 'gray'
  });


  view.qo_old2 = signal_meter(eq, {
    name: 'qo_old',
    x: 330,
    y: 200,
    color: 'gray'
  })

  par.S = eq_parameter(eq, {
    name: "S",
    x: 390,
    y: 200,
    value: S,
    min: 0.01,
    step: 1,
    max: 1000,
    onchange: function () {
      S = this.value;
    }
  });


  eq.text(76, 19, "=");
  eq.text(76, 79, "=");
  eq.text(76, 139, "=");
  eq.text(80, 199, "=");
  eq.text(146, 21, "*");
  eq.text(146, 81, "*");
  eq.text(146, 138, "-");
  eq.text(228, 19, "+");
  eq.text(296, 21, "*");
  eq.text(151, 200, "+ (");
  eq.text(225, 201, "*");
  eq.text(285, 199, "-");
  eq.text(355, 200, ") /");


  view.update = function () {
    view.qi1.update(qi);
    view.qi2.update(qi);
    view.p1.update(p);
    view.p2.update(p);
    view.e1.update(e);
    view.e2.update(e);
    view.qo_new1.update(qo_new);
    view.qo_new2.update(qo_new);
    view.qo_old1.update(qo_old);
    view.qo_old2.update(qo_old);
  }

  par.reset = function () {
    par.Kf.reset();
    par.Ki.reset();
    par.Ko.reset();
    par.Kd.reset();
    par.S.reset();
    par.d.reset();
    par.r.reset();
  }
  var loop_gain, optimum_S;
  var span_loop_gain = lib.$("I-loop-gain");
  var span_optimum_S = lib.$("I-slowing-factor");

  function update_gain() {
    loop_gain = Kf * Ki * Ko;
    optimum_S = 1 + loop_gain;
    span_loop_gain.innerHTML = loop_gain.toFixed(2);
    span_optimum_S.innerHTML = optimum_S.toFixed(2);

  }
  update_gain();


  step_button.onclick = function () {
    solve()
  };

  function solve() {
    qo_new = qo_old + (Ko * e - qo_old) / S;
    qi = Kf * qo_new + Kd * d;
    p = Ki * qi;
    e = r - p;

    qo_new = lib.constrain(qo_new, -10000, 10000);
    qo_old = qo_new;
    view.update();
    if (running) lib.request_anim_frame(solve);
  }


  var running = false;

  start_button.onclick = function () {
    if (!running) {
      running = true;
      start_button.setAttribute("value", "Stop");
      step_button.disabled = true;
      solve();
    } else {
      running = false;
      step_button.disabled = false;
      start_button.setAttribute("value", "Start");
    }
  }

  var reset_button = lib.$("I-reset");
  reset_button.onclick = function () {
    par.reset();
    p = 0;
    e = 0;
    qi = 0;
    qo_new = 0;
    qo_old = 0;
    view.update();
    update_gain();
  };

}());


// Matching model to real behavior

(function StepJ() {

  var p = Snap("#J-screen");
  p.attr("cursor", "crosshair");
  p.mousemove(function (ev, x, y) {
    handle.value = -200 + x - p.node.getBoundingClientRect().left;
  });

  var user_data = lib.make_signals();
  user_data.add('c', 'controlled var', 'black');
  user_data.add('h', 'handle', 'green');
  user_data.add('d', 'disturbance', 'red');

  var plot = lib.Plot("#J-user-plot", user_data);
  var handle = lib.$('J-handle-slider');
  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 0.1);

  var start_button = lib.$("J-start-button");


  var dist;
  var selected_demo;
  var running = false;
  var counter = 0;
  var difficulty = 1;

  var buttons = ["J-cursor", "J-number", "J-sound", "J-one", "J-two", "J-three", "J-four"];

  function set_buttons_disabled(value) {
    buttons.forEach(function (b) {
      lib.$(b).disabled = value;
    });
  }

  var control_cursor = (function () {
    var cursor, target1, target2;
    return {
      instructions: "This is a compensatory tracking experiment. Hold the cursor between the two target bars. The run lasts about one minute.",

      setup: function () {
        cursor = p.rect(200, 20, 1, 30);
        target1 = p.polygon(197, 70, 200, 55, 203, 70);
        target2 = p.polygon(197, 0, 200, 15, 203, 0);
      },
      draw: function (c) {
        cursor.attr('x', 200.00 + Number(c));
      },
      clear: function () {
        cursor.remove();
        target1.remove();
        target2.remove();
      }
    }
  }());


  var play_reference_button = lib.$("J-play-reference");
  var control_sound = (function () {
    var context, oscillator, created_context;

    try {
      context = new(window.AudioContext || window.webkitAudioContext)();
      oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = 440;
      oscillator.start();
      created_context = true;
    } catch (e) {
      created_context = false;
    }

    var playing = false;

    play_reference_button.onclick = function () {
      if (!created_context) {
        alert("This browser does not support audioContext");
        return;
      };
      if (playing) {
        play_reference_button.value = "Play reference pitch";
        oscillator.disconnect(context.destination);
        playing = false;
      } else {
        play_reference_button.value = "Stop reference pitch";
        oscillator.frequency.value = 440;
        oscillator.connect(context.destination);
        playing = true;
      }
    }
    return {
      instructions: "Control the pitch of the sound, keeping it at the same as reference pitch (440Hz). The run lasts about one minute.",
      setup: function () {
        play_reference_button.style.visibility = "";
      },
      draw: function (c) {
        oscillator.frequency.value = 440 + c;
      },
      start_playing: function () {
        if (!created_context) {
          alert("This browser does not support audioContext");
          running = false;
          return;
        };
        if (!playing) {
          oscillator.connect(context.destination);
          playing = true;
        }
      },
      stop_playing: function () {
        if (playing) {
          oscillator.disconnect(context.destination);
          playing = false;
        }
      },
      clear: function () {
        if (playing) {
          oscillator.disconnect(context.destination);
          playing = false;
        }
      }
    }
  }());

  var control_number = (function () {
    var num, val;
    return {
      instructions: "Keep the displayed number at 50",
      setup: function () {
        val = 50;
        num = p.text(180, 45, val);
        num.attr('font-size', 35);
      },
      draw: function (c) {
        num.attr("text", val + Math.floor(0.5 * c));

      },
      clear: function () {
        num.remove();
      }
    }
  }());


  function reset() {
    dist = lib.make_disturbance(difficulty, 400, 3900);
    user_data.reset();
    plot.update(user_data);
    counter = 0;
  }

  function animate(demo) {
    if (running && counter < 3900) {
      d = dist[counter]
      h = Number(handle.value);
      c = h + d;

      demo.draw(c);

      if (counter >= 300) {
        user_data.c.data.push(c);
        user_data.h.data.push(h);
        user_data.d.data.push(d);
      }
      counter++;
      lib.request_anim_frame(function () {
        animate(demo)
      });

    } else if (counter >= 3600) {
      running = false;
      start_button.value = "Start 1 minute run";
      play_reference_button.disabled = false;
      set_buttons_disabled(false);
      demo.clear();
      demo.setup();
      plot.update(user_data);

      run_model();

      StepK.user_data = user_data;
      StepK.run_model();
    }
  }


  function select_new_demo(demo) {
    return function () {
      if (demo != control_sound) {
        play_reference_button.style.visibility = "hidden";
      }
      lib.$("J-instructions").innerHTML = demo.instructions;
      selected_demo.clear();
      selected_demo = demo;
      demo.setup();
    };
  }

  lib.$("J-cursor").onclick = select_new_demo(control_cursor);
  lib.$("J-sound").onclick = select_new_demo(control_sound);
  lib.$("J-number").onclick = select_new_demo(control_number);

  lib.$("J-one").onclick = function () {
    difficulty = 1;
  };
  lib.$("J-two").onclick = function () {
    difficulty = 2;
  }
  lib.$("J-three").onclick = function () {
    difficulty = 3;
  }
  lib.$("J-four").onclick = function () {
    difficulty = 4;
  }


  start_button.onclick = function () {
    if (!running) {
      set_buttons_disabled(true);
      start_button.value = "Stop";
      counter = 0;
      running = true;
      reset();
      if (selected_demo == control_sound) {
        control_sound.start_playing();
        play_reference_button.disabled = true;
      }
      animate(selected_demo);

    } else {
      if (selected_demo == control_sound) {
        control_sound.stop_playing();
        play_reference_button.disabled = false;
      }
      reset();
      running = false;
      set_buttons_disabled(false);
      selected_demo.clear();
      selected_demo.setup();
      start_button.value = "Start 1 minute run";
    }
  }

  // executes right after loading
  selected_demo = control_cursor;
  lib.$("J-instructions").innerHTML = selected_demo.instructions;
  selected_demo.setup();


  var model_adjust = Snap("#J-model-adjust");
  var pKo = eq_parameter(model_adjust, {
    x: 30,
    y: 20,
    value: 200,
    name: "Ko",
    min: 1,
    max: 1000,
    step: 2,
    onchange: run_model
  });
  var pS = eq_parameter(model_adjust, {
    x: 100,
    y: 20,
    value: 1000,
    name: "S",
    min: 1,
    max: 3000,
    step: 10,
    onchange: run_model
  });

  var pr = eq_parameter(model_adjust, {
    x: 170,
    y: 20,
    value: 0,
    name: "r",
    min: -200,
    max: +200,
    step: 1,
    onchange: run_model
  });

  var model_data = lib.make_signals();
  model_data.add('c', 'model cv', 'black');
  model_data.add('h', 'model handle', 'green');
  model_data.add('d', 'disturbance', 'red');

  var model_plot = lib.Plot("#J-model-plot", model_data);

  var dif_signal = {
    dif: {
      name: 'difference',
      color: 'gray',
      data: []
    }
  }

  var difference_plot = lib.Plot("#J-difference-plot", dif_signal);
  lib.$("J-integration-factor").innerHTML = (pKo.value / pS.value).toFixed(3);

  function rms(s) {
    var sum = 0,
      i = 0;
    len = s.length;
    for (i = 0; i < len; i++) {
      sum += ((s[i] * s[i]) / 3600);
    }
    return (Math.sqrt(sum));
  }


  function run_model() {


    var r = pr.value;
    var Ko = pKo.value;
    var S = pS.value;

    StepK.pr.reset(pr.value);
    StepK.pKo.reset(pKo.value);
    StepK.pS.reset(pS.value);

    if (user_data.h.data.length === 0) return;

    var h = 0,
      c = 0,
      d = 0,
      e = 0;
    model_data.h.data = [];
    model_data.c.data = [];
    model_data.d.data = [];
    dif_signal.dif.data = [];

    h = user_data.h.data[0] || 0;
    var len = user_data.h.data.length;
    for (var i = 0; i < len; i += 1) {
      d = user_data.d.data[i];

      c = h + d;
      e = r - c;
      h = h + (Ko * e - h) / S;

      model_data.h.data.push(h);
      model_data.c.data.push(c);
      model_data.d.data.push(d);
      dif_signal.dif.data.push(h - user_data.h.data[i]);
    }

    lib.$("J-rms-difference").innerHTML = rms(dif_signal.dif.data).toFixed(3);
    lib.$("J-integration-factor").innerHTML = (Ko / S).toFixed(3);
    lib.$("J-correlation").innerHTML = stat.pearson(user_data.h.data, model_data.h.data).toFixed(3);
    model_plot.update(model_data);
    difference_plot.update(dif_signal);
  }

}());




// Improving the model
// connected with step J, uses user data from the tracking run
//
var StepK = (function () {
  var self = this;

  var model_adjust = Snap("#K-model-adjust");
  self.pSS = eq_parameter(model_adjust, {
    x: 30,
    y: 20,
    value: 1,
    name: "ss",
    min: 1,
    max: 300,
    step: 1,
    onchange: run_model
  });
  self.pKo = eq_parameter(model_adjust, {
    x: 100,
    y: 20,
    value: 200,
    name: "Ko",
    min: 1,
    max: 1000,
    step: 2,
    onchange: run_model
  });
  self.pS = eq_parameter(model_adjust, {
    x: 170,
    y: 20,
    value: 1000,
    name: "S",
    min: 1,
    max: 3000,
    step: 10,
    onchange: run_model
  });

  self.pr = eq_parameter(model_adjust, {
    x: 240,
    y: 20,
    value: 0,
    name: "r",
    min: -200,
    max: +200,
    step: 1,
    onchange: run_model
  });

  self.user_data = {};

  var model_data = lib.make_signals();
  model_data.add('c', 'model cv', 'black');
  model_data.add('h', 'model handle', 'green');
  model_data.add('d', 'disturbance', 'red');
  var model_plot = lib.Plot("#K-model-plot", model_data);

  var dif_signal = {
    dif: {
      name: 'difference',
      color: 'gray',
      data: []
    }
  }

  var difference_plot = lib.Plot("#K-difference-plot", dif_signal);
  lib.$("K-integration-factor").innerHTML = (pKo.value / pS.value).toFixed(3);

  function rms(s) {
    var sum = 0,
      i = 0;
    len = s.length;
    for (i = 0; i < len; i++) {
      sum += ((s[i] * s[i]) / 3600);
    }
    return (Math.sqrt(sum));
  }

  function run_model() {
    var r = self.pr.value;
    var Ko = self.pKo.value;
    var S = self.pS.value;
    var ss = self.pSS.value;

    if (!self.user_data.hasOwnProperty('h')) return;

    var h = 0,
      c = 0,
      d = 0,
      e = 0;

    model_data.h.data = [];
    model_data.c.data = [];
    model_data.d.data = [];
    dif_signal.dif.data = [];

    h = user_data.h.data[0] || 0;

    var len = user_data.h.data.length;
    for (var i = 0; i < len; i += 1) {
      d = user_data.d.data[i];

      c = c + (h + d - c) / ss;
      e = r - c;
      h = h + (Ko * e - h) / S;

      model_data.h.data.push(h);
      model_data.c.data.push(c);
      model_data.d.data.push(d);
      dif_signal.dif.data.push(h - user_data.h.data[i]);
    }

    lib.$("K-rms-difference").innerHTML = rms(dif_signal.dif.data).toFixed(3);
    lib.$("K-integration-factor").innerHTML = (Ko / S).toFixed(3);
    lib.$("K-correlation").innerHTML = stat.pearson(user_data.h.data, model_data.h.data).toFixed(3);
    model_plot.update(model_data);
    difference_plot.update(dif_signal);
  }


  self.run_model = run_model;
  return self;
}());
