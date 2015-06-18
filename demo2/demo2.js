/*
to do:
  + change all function names to a single style (snake_case)
  one minute run and plotting
    + add buttons for live vs one minute
    + add automatic disturbance vs manual button
    + random dist generator
    - one minute runner
    - automatic recalculation on changing params
  separate ploting to a different file

  + colors and indicators
*/

var fl, feedback_loop, init, animate;


var simulation = {
  mode : 'live', //'time-domain',
  disturbance_mode : 'auto', //'manual',
  colors: { p : "#8e81ce", r : "#b15e6c", d : "#014981", e:"#5c4b5e", qo: "#242028", qi:"#aaaaaa", qo: "#105060"},
  plot_vars : ['p', 'r', 'd', 'qo', 'e'],
  fl : feedback_loop(),
  data : { p: [], e : [], r: [], d : [], qi : [], qo : [], f : [] },
  signal_names: ['p','r','d','e','f','qi','qo'],
  add_data : function (signals) {
    for (i = 0; i < 7; i += 1) {
      k = this.signal_names[i];
      this.data[k].push(signals[k]);
    }
  },
  svg_plot: ""
};


window.onload = function () {
  "use strict";
  //simulation.fl = feedback_loop();
  run(simulation);
};



function run(sim) {
  "use strict";
  var requestAnimFrame, label_names, signal_names, DOM_labels, i, plot_data, counter = 0,
      disturbance_signal, dist_mode, plot, signal_indicators;

  requestAnimFrame = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (c) {window.setTimeout(c, 1000 / 60); };

  init_screen(sim);
  disturbance_signal = dist_maker(0.02, 30);

  plot = plot_mult({canvas: 'c1', yScale: 2.5, clr: sim.colors});

  label_names = sim.signal_names;
  signal_names = label_names;
  DOM_labels = [];
  signal_indicators = [];

  for (i = 0; i < 7; i += 1) {
    DOM_labels.push(document.getElementById(label_names[i]));
    signal_indicators.push(document.getElementById("ind-bar-" + label_names[i]));
    signal_indicators[i].style.backgroundColor = sim.colors[label_names[i]];
  }

  function update_screen() {
    var s, width, left, signals = sim.fl.get_signals();
    for (i = 0; i < 7; i += 1) {
      s = parseFloat(signals[signal_names[i]]);
      width = s; //(s/50.0)*50;
      left = ((width<0) ? (25 + width) : 25); // assuming width of the bar is 50

      DOM_labels[i].innerHTML = s.toFixed(2);
      signal_indicators[i].style.width = Math.abs(width) + "px";
      signal_indicators[i].style.left = left + "px";
    }
  }

  function step() {
    update_screen();

    if (sim.disturbance_mode === 'auto') sim.fl.params.d = disturbance_signal.next();

    sim.fl.next();

    var t = sim.fl.get_signals();
    sim.add_data(t);

    if (counter < 1) {  counter++;
    } else {
      plot.update([t.p, t.e, t.r, t.d, t.qo]);
      counter = 0;
    }

      if (sim.mode === 'live') requestAnimFrame(step);
  }
  //fl.data = run_loop(loop,600);
  if (sim.mode === 'live') requestAnimFrame(step);
}


function time_domain_runner (sim) {
  var i, k, maximum = 600;

  function reset () {
    sim.data.p = [];
    sim.data.e = [];
    sim.data.qi= [];
    sim.data.qo = [];
    sim.data.f = [] ;
  }


  var cycles = 600;

  function next_dist() {
    var d_variable = dist_maker(0.02,30),
        d_const = sim.fl.params.d;

    function next(n) {
      if (sim.disturbance_mode === 'auto') {
        if (sim.data.d.length === 600) {
          return sim.data.d[n];
        } else {
          return d_variable.next();
        };
      } else {
          return d_const;
        }

    }
    return {
      next:next
    }
  }

  function next_ref() {
    var r_const = sim.fl.params.r;

    function next(n) {
          return r_const;
    }
    return {
      next:next
    }
  }

  var nd = next_dist(), nr = next_ref();

  var i = 0, s;
  reset();
  sim.fl.reset();
  for (i = 0; i < cycles; i++) {
    sim.fl.set_params({ 'r' : nr.next(i), 'd' : nd.next(i) });
    sim.fl.next();
    s = sim.fl.get_signals();
    for (k in sim.data) {
      sim.data[k][i] = s[k];
    }
 //   if (sim.data[k].length > maximum) sim.data[k].shift();

  }
}



function svg_plot () {
  var point_strings = {p: "", r: "", d: "", qo:"", e:""};
  var i = 0, k;
  var g = {p:[], r:[], d:[], qo:[], e:[]};
  var elem = {p:"", r:"", d:"", qo:"", e:""};
  var names = ['p','r','e','qo','d'];

  for (k in g) {
     elem[k] = document.getElementById("g" + k );
     elem[k].style.stroke = simulation.colors[k];
  }
  for (var k in g) {
    i = 600;
    while (i--) {
      g[k].push(0);
      point_strings[k] += "0,100 ";
    }
  }

  function update(sim) {
   var t = sim.fl.get_signals();
    for ( k in g) {
      g[k].shift();
      g[k].push(t[k]);
    }
    for (i = 0;i<5;i++) {
      //  elem[i].setAttribute("points", toLine(g[names[i]], -5, 100));
    }
  }

  function toLine(arr, scale, offset) {
    var i = 0, l = arr.length, s = "";
    for (; i < l; i++) {
      s += "" + i + "," + (offset + arr[i]*scale) + " ";
    }
    return s;
}


  function new_plot(data) {
    for (k in g) {
      console.log(elem);
      elem[k].setAttribute("points", toLine(data[k], -5,100));
    }

  }
  return {
    update:update,
    new_plot:new_plot
  }

}


function init_screen(sim) {
  "use strict";
  var bind_names, i, slider_name, label_name, slider, label, param_value,
    binds = {
      "slider-reference"    : 'r',
      "slider-disturbance"  : 'd',
      "slider-input-gain"   : 'Ki',
      "slider-output-gain"  : 'Ko',
      "slider-feedback"     : 'Kf',
      "slider-slowing"      : 'S',
      "slider-delay"        : 'delay'
    };

  sim.svg_plot = svg_plot();

  function bind_slider(range_slider, label, param_val) {
    range_slider.oninput = function () {
      label.innerHTML = parseFloat(range_slider.value).toFixed(2);
      sim.fl.params[param_val] = parseFloat(range_slider.value);

      if (sim.mode === 'time-domain') {
        if (param_val === 'r') sim.data.r = [];
       time_domain_runner(sim);
       sim.svg_plot.new_plot(sim.data);
      }
    };
  }


  bind_names = Object.getOwnPropertyNames(binds);
  for (i = 0; i < bind_names.length; i += 1) {
    slider_name = bind_names[i];
    label_name = binds[slider_name];
    slider = document.getElementById(slider_name);
    label = document.getElementById(label_name);
    param_value = binds[slider_name];
    bind_slider(slider, label, param_value);
  }

  function set_slider(slider_id, min, max, step, start_val) {
    var slider = document.getElementById(slider_id);
    slider.setAttribute("min", min);
    slider.setAttribute("max", max);
    slider.setAttribute("step", step);
    slider.setAttribute("value", start_val);
    slider.oninput();
  }

  set_slider('slider-reference',   -15,    15,  0.01, sim.fl.params.r);
  set_slider('slider-disturbance', -15,    15,  0.01, sim.fl.params.d);
  set_slider('slider-input-gain', 0.01,     2,  0.01, sim.fl.params.Ki);
  set_slider('slider-output-gain',   0,   300,  0.01, sim.fl.params.Ko);
  set_slider('slider-slowing',       1,   100,  0.01, sim.fl.params.S);
  set_slider('slider-feedback',  -0.25,   2.5,  0.01, sim.fl.params.Kf);
  set_slider('slider-delay',         0,  1000, 16.67, sim.fl.params.delay);

  var dist_radios = {
    manual : document.getElementById("manual"),
    auto : document.getElementById("auto")
  };
  dist_radios.manual.onclick = function () {
    sim.disturbance_mode = 'manual';
  }
  dist_radios.auto.onclick = function () {
    sim.disturbance_mode = 'auto';
  }
  var live_mode_radios = {
    live : document.getElementById("live"),
    one_min : document.getElementById("minute-run")
  };
  live_mode_radios.live.onclick = function () {
    sim.mode = 'live';
    run(sim);
  }
  live_mode_radios.one_min.onclick = function () {
    sim.mode = 'time-domain';
  }


}

function feedback_loop() {
  "use strict";
  var
    p = 0,  r = 0,  d = 0, e = 0, qo = 0,
    f = 0, qi = 0, dt = 1 / 60, delay_FIFO = [],
    params = { r : 0, d : 0, Ki : 1, Ko : 100, Kf : 1,
               S : 30, delay : 133.32 };

  function get_signals() {
    return { p : p, r : r, e : e, qo : qo, f : f, d : d, qi : qi };
  }

  function reset () {
    p = 0; r = 0; d = 0; e = 0; qo = 0; qi = 0; delay_FIFO = []; f = 0;
  }

  function set_params(new_params) {
    var k;
    for (k in new_params) {
      this.params[k] = new_params[k];
    }

  }
  function get_delayed(new_p, delay) {
    var out, delay_in_dt = Math.round(delay / (1000 * dt));
    delay_FIFO.push(new_p);
    out = delay_FIFO[0];
    while (delay_FIFO.length > delay_in_dt) {
      delay_FIFO.shift();
    }
    return out;
  }

  function next(P) {
    r = P.r;
    d = P.d;

    qi = d + f;
    p = get_delayed(P.Ki * qi, P.delay);
    e = r - p;
    qo += (P.Ko * e - qo) * (dt / P.S);
    f = qo * P.Kf;

    constrain_all();
  }

  function constrain_all() {
    var limit = 100;
    p = constrain(p, -limit, limit);
    e = constrain(e, -limit, limit);
    f = constrain(f, -limit, limit);
    qi = constrain(qi, -limit, limit);
    qo = constrain(qo, -limit, limit);
  }

  return {
    reset : reset,
    params : params,
    get_signals : get_signals,
    set_params: set_params,
    next : function () {
      return next(this.params);
    }
  };
}

function constrain(x, min, max) {
  return (x < min) ? min
    : ((x > max) ? max
      : x);
}


// approximate amplitude random distrubance creation
function dist_maker(dificulty, amp) {
  var d1 = 0, d2 = 0, d3 = 0,
     k = amp * 800 * dificulty, high = amp / 2,
     low = - high, s = dificulty;
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

function plot_mult(prop) {
  'use strict';

  var canvas, ctx, width, zero, xScale, yScale, h, clr, t, height, imageData, past_point,
      fastImage;
  past_point = [0,0,0,0,0,0,0,0,0,0];
  yScale = prop.yScale;
  // also try shifting the bitmap
  canvas = document.getElementById(prop.canvas);
  canvas.width = 600;
  ctx = canvas.getContext('2d');
  width = canvas.width;
  height = canvas.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  zero = canvas.height / 2;

  var counter = 0;
  ctx.lineWidth = 1.5;
  clr = [prop.clr.p, prop.clr.r, prop.clr.d, prop.clr.e, prop.clr.qo, prop.clr.f, prop.clr.qi];

  function update (points) {
    imageData = ctx.getImageData(1, 0, width, height);
    ctx.putImageData(imageData, 0, 0);
    ctx.clearRect(width-1, 0, 4, height);


    for (t = 0; t < points.length; t += 1) {
      ctx.strokeStyle= clr[t];
      ctx.beginPath();
      ctx.moveTo(width-2, zero - past_point[t]);
      var y =yScale * points[t];
      ctx.lineTo(width-1, zero - y);
      ctx.stroke();
      past_point[t] = y;
    }
  }

  return {
    update : update
  }
}
