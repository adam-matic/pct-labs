// Based on TrackAnalyze from LCSIII, 2008
// Delphi code by Bill Powers and Bruce Abbott
// www.billpct.org

// JS version by A. Matic, 2016
// MIT licence


var Demo3 = (function () {
  "use strict";
  var user, model, running, max_data, ta, handle, h, cursor, target, dots, start_button, counter, difficulty;


  running = false;
  max_data = 3600;
  difficulty = 2;

  ta = Snap("#track-area");
  handle = lib.$("handle-slider");
  lib.setAttr(handle, {
    min: -300,
    max: +300,
    step: 1
  });


  cursor = ta.polygon(300, 50, 295, 60, 295, 90, 300, 100, 305, 90, 305, 60).attr('fill', 'green');

  target = ta.group();
  target.add(ta.polygon(295, 10, 295, 40, 300, 50, 305, 40, 305, 10).attr('fill', '#d00'));
  target.add(ta.polygon(295, 140, 305, 140, 305, 110, 300, 100, 295, 110).attr('fill', '#d00'));

  ta.attr("cursor", "crosshair");
  ta.mousemove(function (ev, x, y) {
    handle.value = -300 + x - ta.node.getBoundingClientRect().left;
    handle.oninput();
  });

  handle.oninput = function () {
    h = Number(handle.value);
    cursor.transform('t' + h + ",0");
  }


  var disturbance = lib.make_disturbance(difficulty, 580, max_data + 350);

  function set_dif(x) {
    return function () {
      difficulty = x;
      disturbance = lib.make_disturbance(difficulty, 580, max_data + 350);
    }
  }
  lib.$("dif-one").onclick = set_dif(1);
  lib.$("dif-two").onclick = set_dif(2);
  lib.$("dif-three").onclick = set_dif(3);
  lib.$("dif-four").onclick = set_dif(4);
  lib.$("dif-five").onclick = set_dif(5);


  dots = lib.$("dots");
  start_button = lib.$("start-button");
  counter = 0;


  function get_counter_text(c) {
    var t = "";
    if (c > 300) {
      return (65 - Math.floor(c / 60)).toFixed(0);
    }
    if (c <= 300) t += ".";
    if (c <= 240) t += ".";
    if (c <= 180) t += ".";
    if (c <= 120) t += ".";
    if (c <= 60) t += ".";
    return t;
  }


  var plot_options = {
    xrange: max_data,
    yrange: 600,
    ticks: ["-300", "-200", "-100", "0", "100", "200", "300"]
  }

  function sig(color) {
    return {
      color: color,
      data: []
    }
  }

  user = {
    cursor: sig('green'),
    target: sig('red'),
    distance: sig('black')
  };
  model = {
    'model curs': sig('blue'),
    target: sig('red'),
    distance: sig('black')
  }

  var comparison = {
    'cursor': sig('green'),
    'model curs': sig('blue'),
    'difference': sig('gray')
  }

  var plot1 = lib.svg_plot('plot1', user, plot_options);
  var plot2 = lib.svg_plot('plot2', comparison, plot_options);
  var plot3 = lib.svg_plot('plot3', model, plot_options);
  var t, cv;


  start_button.onclick = function () {
    if (running) {
      dots.innerHTML = "";
      running = false;
      start_button.value = "Start 1 minute run"
    } else {
      user.cursor.data = [];
      user.target.data = [];
      user.distance.data = [];

      counter = 0;
      running = true;
      recording();
    }
  }

  function recording() {

    dots.innerHTML = get_counter_text(counter);
    t = disturbance[counter];
    cv = h - t;
    target.transform('t' + t + ',0');

    if (counter === 300) {
      start_button.value = 'Abort'
    } else if (counter > 300) {
      user.cursor.data.push(h);
      user.distance.data.push(cv);
      user.target.data.push(t);
    };

    if (running && (counter < (max_data + 300))) {
      counter++;
      lib.request_anim_frame(recording);
    } else {
      dots.innerHTML = "";
      start_button.value = "Start 1 minute run";
      //console.log(user);
      running = false;

      if (counter === max_data + 300) {
        lib.$('tracking-rms').innerHTML = lib.rmse(user.distance.data, 600);
        plot1.new_plot(user);
        run_model();
        window.user = user;
      }
    }
  }


  var model_adjust = Snap("#model-params");
  var auto_fit_button = lib.$("auto-fit-button");

  var params = {
    Ko: 5,
    delay: 133.33,
    ref: 0,
    damping: 0.1
  }

  function par(name, x, y, min, max, step, fixed_digits) {
    model_adjust.text(x - 56, y, name + ':').attr({
      'text-anchor': 'end'
    });
    return model_adjust.drag_number({
      name: name,
      x: x,
      y: y,
      min: min,
      max: max,
      step: step,
      obj: params,
      onchange: run_model,
      value: params[name],
      fixed_digits: fixed_digits || 2
    });
  }

  var pko = par("Ko", 110, 20, -10, 100, 0.05);
  var pref = par("ref", 110, 40, -300, 300, 0.5);
  var pdel = par("delay", 280, 20, 0, 333.333, 16.666);
  var pdamp = par("damping", 280, 40, 0, 1, 0.005, 3);

  auto_fit_button.onclick = function () {
    var new_params;
    if (user.cursor.data.length >= max_data) {
      new_params = auto_tune(user);
      pko.update(new_params.Ko);
      pref.update(new_params.ref);
      pdel.update(new_params.delay);
      pdamp.update(new_params.damping);
      run_model();
    }
  }


  function run_model() {
    if (user.target.data.length !== max_data) return;

    model.target.data = user.target.data;
    model.distance.data = [];
    model['model curs'].data = [];
    comparison.difference.data = [];

    var i, mh, mcurs, p, t, d, dt, delay, Ko, r, e, damp, qi;
    dt = 1 / 60;
    delay = Math.round(params.delay / (1000 / 60));
    Ko = params.Ko;
    r = params.ref;
    damp = params.damping;
    mh = user.cursor.data[0];
    mcurs = model["model curs"].data;
    qi = [];

    function index_of_delayed(k) {
      var di = k - delay;
      return di >= 0 ? di : 0;
    }

    for (i = 0; i < max_data; i++) {
      mcurs.push(mh);
      comparison.difference.data.push(mh - user.cursor.data[i]);
      t = model.target.data[i];
      qi.push(mh - t);

      p = qi[index_of_delayed(i)];
      e = r - p;
      mh = mh + (Ko * e - damp * mh) * dt;

      model.distance.data.push(p);
    }

    comparison.cursor.data = user.cursor.data;
    comparison["model curs"].data = mcurs;

    plot2.new_plot(comparison);
    plot3.new_plot(model);

    lib.$("model-tracking-rms").innerHTML = lib.rmse(model.distance.data, 600);
    lib.$("cursor-model-rms").innerHTML = lib.rmse(comparison.difference.data, 600);

    //console.log(params);

  }

  return function set_user(user_data) {
    user = user_data;
  }
}());


function run_new_model(p, user) {
  var i, mc, mcurs, p, t, d, dt, diff, delay, Ko, r, e, damp, qi, max_data;
  max_data = user.cursor.data.length;
  dt = 1 / 60;
  delay = Math.round(p.delay / (1000 / 60));
  Ko = p.Ko;
  r = p.ref;
  damp = p.damping;
  mc = user.cursor.data[0];
  mcurs = [];
  qi = [];
  diff = [];

  function index_of_delayed(k) {
    var di = k - delay;
    return di >= 0 ? di : 0;
  }

  for (i = 0; i < max_data; i++) {
    mcurs.push(mc);
    t = user.target.data[i];
    qi.push(mc - t);

    p = qi[index_of_delayed(i)];
    e = r - p;
    mc = mc + (Ko * e - damp * mc) * dt;

    diff.push(mcurs[i] - user.cursor.data[i]);
  }
  return lib.rms0(diff);
}


function tune_param(param_name, p_min, p_max, params, user_data) {
  var guess = (p_min + p_max) / 2,
    delta = (p_max - p_min) / 2,
    tollerance = 0.00001,
    best_fit = 100,
    new_fit, last_fit = 100,
    best_param = guess,
    new_params = params;


  while (Math.abs(delta) > tollerance) {
    new_params[param_name] = guess;
    new_fit = run_new_model(new_params, user_data);

    if (new_fit < best_fit) {
      best_fit = new_fit;
      best_param = guess;
    }
    if (new_fit >= last_fit) {
      delta = delta / (-5);
    }

    last_fit = new_fit;
    guess += delta;
  }
  return new_params;
}


function auto_tune(user_data) {
  var k, tries = 8;
  var params = {
    Ko: 10,
    delay: 133.33,
    damping: 0.1,
    ref: 0
  };
  var param_limits = {
    Ko: {
      min: 0,
      max: 30
    },
    delay: {
      min: 0,
      max: 300
    },
    damping: {
      min: 0.001,
      max: 1
    },
    ref: {
      min: -10,
      max: 10
    }
  }

  while (tries--) {
    for (k in params) {
      params = tune_param(k, param_limits[k].min, param_limits[k].max, params, user_data);
    }
  }

  params.delay = (Math.round(params.delay / 16.6666)) * 16.6666;
  return params;
}
