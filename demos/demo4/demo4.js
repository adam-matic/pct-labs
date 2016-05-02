sim = {
  data: {
    position: [],
    velocity: [],
    force: [],
    pos_ref: []
  },

  // mass, spring, damping
  model_system: {
    P: 0,
    V: 0,
    A: 0,
    F: 0,
    M: 0.2,
    Ks: 0,
    Kd: 0,
    pos_sens: 0,
    pos_ref: 50,
    pos_err: 0,
    pos_out: 0,
    vel_sens: 0,
    vel_ref: 0,
    vel_err: 0,
    vel_out: 0,
    Kp: 1.5,
    Kv: 60,
    dt: 0.0005
  },

  bode1: {
    gain: [],
    phase: []
  },

  bode2: {
    gain: [],
    phase: []
  },

  bode3: {
    gain: [],
    phase: []
  }

}




function make_model_runner(params) {
  var P, V, A, F, M, Ks, Kd,
    pos_sens, pos_ref, pos_err, pos_out, Kp,
    vel_sens, vel_ref, vel_err, vel_out, Kv,
    dt, last_P;
  Kd = params.Kd;
  Ks = params.Ks;
  Kp = params.Kp;
  Kv = params.Kv;
  M = params.M;
  dt = params.dt;
  P = params.P;
  V = params.V;
  F = params.F;

  last_P = P;

  function next(target) {
    // physics - mass, spring and damper
    A = (F - Kd * V - Ks * P) / M;
    P = P + (V + 0.5 * A * dt) * dt;
    V = V + A * dt;


    // control system
    // sensors
    pos_sens = P;
    vel_sens = (P - last_P) / dt; // velocity is calculated as the change in pos

    // cascade control
    pos_err = target - pos_sens;
    pos_out = Kp * pos_err;
    vel_ref = pos_out;
    vel_err = vel_ref - vel_sens;
    F = Kv * vel_err;
    last_P = P;
    // shorter formula:
    // F = Kv * (Kp * (pos_ref - pos_sens) - vel_sens)
    // better, with independent kp and kv
    // F = Kp*pos_err - Kv * vel

    return {
      position: P,
      velocity: V,
      force: F,
      e3: pos_err
    };
  }

  return {
    next: next
  };
}


window.onload = function () {
  var mb = document.getElementById('main_box');

  s1 = make_slider(sim.model_system, 'Kp', {
    x: 50,
    y: 50,
    min: 0,
    max: 20,
    step: 0.01,
    tooltip: "Position gain"
  });
  s2 = make_slider(sim.model_system, 'Kv', {
    x: 50,
    y: 90,
    min: 0,
    max: 500,
    step: 1,
    tooltip: "Velocity gain"
  });
  s3 = make_slider(sim.model_system, 'M', {
    x: 50,
    y: 130,
    min: 0.2,
    max: 20,
    step: 0.01,
    tooltip: "Mass"
  });
  s4 = make_slider(sim.model_system, 'Ks', {
    x: 50,
    y: 170,
    min: 0,
    max: 250,
    step: 1,
    tooltip: "Spring constant"
  });
  s5 = make_slider(sim.model_system, 'Kd', {
    x: 50,
    y: 210,
    min: 0,
    max: 100,
    step: 0.01,
    tooltip: "Damping constant"
  });
  s6 = make_slider(sim.model_system, 'pos_ref', {
    x: 50,
    y: 250,
    min: -100,
    max: 100,
    step: 0.1,
    text: "Target"
  });

  mb.appendChild(s1);
  mb.appendChild(s2);
  mb.appendChild(s3);
  mb.appendChild(s4);
  mb.appendChild(s5);
  mb.appendChild(s6);

  var prop_load = make_bode_plot({
    x: 40,
    y: 600
  });
  var single_integral_load = make_bode_plot({
    x: 260,
    y: 600
  })
  var double_integral_load = make_bode_plot({
    x: 480,
    y: 600
  })

  mb.appendChild(prop_load.container);
  mb.appendChild(single_integral_load.container);
  mb.appendChild(double_integral_load.container);

  function add_callback(arr, fun) {
    var i = 0,
      len = arr.length;
    for (; i < len; i++) {
      arr[i].callback = fun;
    }
  }

  function run_model(len) {
    var model = make_model_runner(sim.model_system);
    var i = 0;
    var result, target;
    var data = {
      position: [],
      force: [],
      velocity: [],
      pos_ref: []
    };

    for (; i < len; i++) {
      target = (i < 300) ? 0 : sim.model_system.pos_ref;
      result = model.next(target);
      if (i % 10 === 0) {
        data.pos_ref.push(target);
        data.position.push(result.position);
        data.force.push(result.force * 0.001); // force scaled to fit graph
        data.velocity.push(result.velocity * 0.1); // scaled to fit
      }
    }
    return data;
  }

  pl = svg_plot("plot", run_model(3000));

  function plot_model() {
    pl.new_plot(run_model(3000));
  }

  add_callback([s1, s2, s3, s4, s5, s6], plot_model);

  var bt1 = document.getElementById("bode");

  bt1.onclick = function () {
    var data = frequency_analysis();

    prop_load.update(data.prop_load);
    single_integral_load.update(data.integral_load);
    double_integral_load.update(data.double_integral_load);
  }

}


function frequency_analysis() {
  var f, t, RMS, in_zero_cross, out_zero_cross,
    f_count, input_RMS, output_RMS,
    target, result, last_e3, last_F, dt,
    phase, x, y, model_count, i;
  // start frequency is 0.1 Hz
  var pi = Math.PI;

  function square(x) {
    return x * x
  };
  dt = sim.model_system.dt;

  sim.model_system.M = 0.2;
  sim.model_system.Ks = 250;
  sim.model_system.Kd = 0;
  var model_spring_only = make_model_runner(sim.model_system);

  sim.model_system.M = 0.2;
  sim.model_system.Ks = 0;
  sim.model_system.Kd = 100;
  var model_damp_only = make_model_runner(sim.model_system);

  sim.model_system.M = 20.2;
  sim.model_system.Ks = 0;
  sim.model_system.Kd = 0;
  var model_mass_only = make_model_runner(sim.model_system);

  var three_models = [model_spring_only, model_damp_only, model_mass_only];
  var bode_plots_gain = [[], [], []];
  var bode_plots_phase = [[], [], []];

  var model;

  for (model_count = 0; model_count < 3; model_count++) {
    model = three_models[model_count];

    f = 0.1 / (2 * pi);
    f_count = 13;

    function reset() {
      input_RMS = 0;
      output_RMS = 0;
      n_cycles = 0;
      t = 0; // time index
      last_e3 = 0;
      last_F = 0;
    }

    for (i = 0; i < f_count; i++) {
      reset();
      // do 8 cycles, and find zero crossings at the last
      // cycle to find phase shift
      while (n_cycles < 8) {
        target = 200 * Math.sin(2 * pi * f * t);
        result = model.next(target);
        input_RMS += square(result.e3);
        output_RMS += square(result.force);
        if (n_cycles === 7) {
          if ((result.e3 < 0) && (last_e3 >= 0)) in_zero_cross = t;
          if ((result.force < 0) && (last_F >= 0)) out_zero_cross = t;
          last_e3 = result.e3;
          last_F = result.force;
        }
        t = t + dt;
        if (f * t >= 1.0) t = 0;
        if (t === 0) n_cycles += 1;
      }
      RMS = Math.sqrt(output_RMS / input_RMS);
      x = Math.log10(10 * f * 2 * pi);
      y = 20 * Math.log10(RMS);

      phase = f * (out_zero_cross - in_zero_cross) * 360;
      phase = (phase > 180) ? phase - 360 : phase;

      bode_plots_gain[model_count].push([x, y]);
      bode_plots_phase[model_count].push([x, phase]);

      f = f * Math.exp(Math.log(130) / 12);
    }

  }
  return {
    prop_load: {
      gain: bode_plots_gain[0],
      phase: bode_plots_phase[0]
    },
    integral_load: {
      gain: bode_plots_gain[1],
      phase: bode_plots_phase[1]
    },
    double_integral_load: {
      gain: bode_plots_gain[2],
      phase: bode_plots_phase[2]
    }
  };
}

function make_bode_plot(options) {
  options = options || {};
  options.x = options.x || 0;
  options.y = options.y || 0;

  var container = document.createElement("div");
  container.style.position = "absolute";
  container.style.top = options.y + 'px';
  container.style.left = options.x + 'px';
  container.appendChild(make_bode_lines());

  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  canvas.style.position = 'absolute';
  canvas.style.top = '20px';
  canvas.style.left = '40px';
  canvas.style.zIndex = 3;
  canvas.width = 128;
  canvas.height = 128;
  container.appendChild(canvas);

  function update(data) {
    /*
    x = Math.log10(10 * f * 2 * pi);
      y = 20 * Math.log10(RMS);

      phase = f * (out_zero_cross-in_zero_cross)*360;
      phase = (phase > 180) ? phase - 360 : phase;
      */
    var i = 0;
    ctx.clearRect(0, 0, 200, 200);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(data.gain[0][0] * 128 / 3, 128 - data.gain[0][1] * 128 / 80 + 2);

    for (i = 1; i < data.gain.length; i++) {
      ctx.lineTo(data.gain[i][0] * 128 / 3, 128 - data.gain[i][1] * 128 / 80 + 2);
    }
    ctx.stroke();

    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(data.phase[0][0] * 128 / 3, 64 - data.phase[0][1] * 128 / 360 + 2);
    for (i = 1; i < data.gain.length; i++) {
      ctx.lineTo(data.phase[i][0] * 128 / 3, 64 - data.phase[i][1] * 128 / 360 + 2);
    }
    ctx.stroke();

  }

  return {
    container: container,
    update: update
  }

}

function make_bode_lines() {
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");

  canvas.style.position = "absolute";
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.zIndex = 4;
  canvas.width = 208;
  canvas.height = 188;
  canvas.style.border = 'solid 1px';

  function line(p1, p2) {
    ctx.beginPath();
    ctx.moveTo(p1[0], p1[1]);
    ctx.lineTo(p2[0], p2[1]);
    ctx.stroke();
  }

  ctx.strokeStyle = "gray";
  ctx.font = "9px Arial";

  var left_margin = 40,
    top_margin = 20,
    botom_margin = 40,
    right_margin = 40,
    plot_size = 128;

  var y_step = plot_size / 8;
  var j, i, x, y;
  var deg_scale = ["+180", "", "90", "", "0", "", "-90", "", "-180"];

  x = left_margin;
  for (i = 0; i < 9; i++) {
    y = top_margin + i * y_step;
    line([x, y], [x + plot_size, y]);
    ctx.fillText("" + (80 - i * 10), 24, y + 2);
    ctx.fillText(deg_scale[i], x + plot_size + 2, y + 2);
  }

  y = top_margin;
  for (j = 0; j < 3; j++) {
    for (i = 1; i < 10; i++) {
      x = 1 + left_margin + (plot_size / 3) * (Math.log10(i) + j);
      line([x, y], [x, y + plot_size]);
    }
  }
  var f_scale = ["   0.1", "  1.0", " 10.0", "100.0"];
  for (i = 0; i < 4; i++) {
    ctx.fillText(f_scale[i], -13 + left_margin + i * plot_size / 3, 14 + top_margin + plot_size);
  }
  ctx.fillText("Radians/Second", left_margin + plot_size / 2 - 35, top_margin + plot_size + 29);

  ctx.rotate(-Math.PI / 2);
  ctx.font = "11px Arial";
  ctx.fillStyle = "red";
  ctx.fillText("Decibels", -105, 16);
  ctx.fillStyle = "blue";
  ctx.fillText("Degrees", -105, 29 + plot_size + left_margin);

  return canvas;
}


function svg_plot(plot_area, data, clrs) {
  var c = document.getElementById(plot_area);
  c.style.border = 'solid 1px';
  c.style.width = '600px';
  var i, k;
  var elem = [];
  clrs = clrs || {
    'force': 'blue',
    position: 'red',
    velocity: 'green',
    pos_ref: 'gray'
  };

  for (k in data) {
    elem[k] = document.createElementNS("http://www.w3.org/2000/svg", 'polyline');
    elem[k].style.stroke = clrs[k];
    elem[k].style.fill = "none";
    c.appendChild(elem[k]);
    // clrs
  }

  function to_line(arr, scale, offset) {
    var i = 0,
      l = arr.length,
      s = "";
    for (; i < l; i++) {
      s += "" + i + "," + (offset + arr[i] * scale) + " ";
    }
    return s;
  }

  function new_plot(data) {
    for (k in data) {
      elem[k].setAttribute("points", to_line(data[k], -1, 100));
    }

  }

  new_plot(data);
  return {
    new_plot: new_plot
  }

}


// returns a slider connected to a variable in an object
function make_slider(object, variable_name, options) {
  // defaults
  options = options || {};
  this.min = options.min || 0;
  this.max = options.max || 100;
  this.step = options.step || 1;
  this.text = options.text || variable_name || "";
  this.x = (options.x || 0) + 'px';
  this.y = (options.y || 0) + 'px';
  this.init = options.init || this.min;
  this.tooltip = options.tooltip || undefined;

  options.oninput = options.oninput || function () {};

  var out_frame = document.createElement('div');
  out_frame.style.position = 'absolute';
  out_frame.style.width = '250px';
  out_frame.style.height = '30px';
  out_frame.style.top = this.y;
  out_frame.style.left = this.x;
  out_frame.style.margin = 'auto';
  out_frame.style.border = 'solid 1px';

  var label = document.createElement('div');
  label.innerHTML = this.text;
  label.style.width = '50px';
  label.style.margin = '6px';
  label.style.position = 'absolute';
  label.style.textAlign = 'right';
  this.tooltip ? (label.title = this.tooltip) : null;

  var value_indicator = document.createElement('p');
  value_indicator.innerHTML = '0';
  value_indicator.style.width = '50px';
  value_indicator.style.position = 'absolute';
  value_indicator.style.left = "200px"
  value_indicator.style.margin = '7px';

  var slider = document.createElement('input');
  slider.setAttribute('type', 'range');
  slider.setAttribute('min', this.min);
  slider.setAttribute('max', this.max);
  slider.setAttribute('step', this.step);
  slider.style.position = 'absolute';
  slider.style.left = '60px';
  slider.style.top = '0px';
  slider.style.margin = '5px';
  slider.style.width = '130px';
  slider.setAttribute('value', object[variable_name]);
  value_indicator.innerHTML = slider.value;

  out_frame.callback = function () {};

  slider.oninput = function () {
    object[variable_name] = +slider.value;
    value_indicator.innerHTML = slider.value;
    out_frame.callback();
    options.oninput();
  }

  out_frame.appendChild(label);
  out_frame.appendChild(slider);
  out_frame.appendChild(value_indicator);

  return out_frame;
}
