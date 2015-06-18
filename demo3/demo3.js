var mY = 0, target_svg, cursor_svg, target_g, cursor_g, max_data = 1200, pl;

user_data = {
  cursor: [],
  target: [],
  disturbance: [],
  distance: [],
  distance_reference: [],
  distance_error: []
}


model_data = {
  cursor: [],
  target: [],
  disturbance: [],
  distance: [],
  distance_reference: [],
  distance_error: []
}


window.onload = function () {
  init();
  animate();
}


function init() {
  target_svg = document.getElementById("target");
  target_svg.setAttribute('points', "5,40 25,40 47,30 25,20 5,20");
  target_svg.setAttribute("style", "fill:darkred");

  cursor_svg = document.getElementById("cursor");
  cursor_svg.setAttribute('points', "95,40 75,40 53,30 75,20 95,20");
  cursor_svg.setAttribute("style", "fill:darkgreen");

  cursor_g = document.getElementById("cursor_g");
  target_g = document.getElementById("target_g");

  var svg_box = document.getElementById("main_svg");

  svg_box.onmousemove = function (e) {
    mY = e.clientY;
    //cursor_g.y = mY;
    cursor_g.setAttribute("y", mY-95);
  }


  var recalc;
  var sl1 = document.getElementById("sl1");
  var slider1 = document.getElementById("slider1");
  slider1.setAttribute('min',-5);
  slider1.setAttribute('max',10);
  slider1.setAttribute('step',0.001);
  slider1.oninput = function () {
    sl1.innerHTML = slider1.value;
    recalc();
  }
  var slider2 = document.getElementById("slider2");
  var sl2 = document.getElementById("sl2");
  slider2.setAttribute('min',0);
  slider2.setAttribute('max',20);
  slider2.oninput = function () {
    sl2.innerHTML = slider2.value;
    recalc();
  }
  var slider3 = document.getElementById("slider3");
  var sl3 = document.getElementById("sl3");
  slider3.setAttribute('min',1);
  slider3.setAttribute('max',100);
  slider3.oninput = function () {
    sl3.innerHTML = slider3.value;
    recalc();
  }


  function recalc() {
    pl.new_plot(model_runner({Ko: +slider1.value, delay:+slider2.value, S:+slider3.value}));
    console.log(rms(user_data.distance, model_data.distance));
  }



  user_data.disturbance = random_wave(max_data+300, 1, 550);

}

function animate() {
  var requestAnimFrame = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame || window.msRequestAnimationFrame ||
    function (c) {window.setTimeout(c, 1000 / 60); };

  var t, c, k, count = 0;

  function step() {
    target_g.setAttribute('y', 270 + user_data.disturbance[count]);
    t = target_g.getAttribute('y') - 270;
    c = cursor_g.getAttribute('y') - 270;
    user_data.cursor.push(c);
    user_data.target.push(t);
    user_data.distance.push(t-c);
    user_data.distance_reference.push(0);
    user_data.distance_error.push(user_data.distance_reference[count]
                                - user_data.distance[count]);

    count += 1;
    if (count < max_data+300) {
      requestAnimFrame(step);
    } else {
      for (k in user_data)
        user_data[k] = user_data[k].slice(300,user_data[k].length);
      analyze();
    }
  }


  requestAnimFrame(step);
}

var model_runner;
var pl;

function analyze() {
  var default_params = { Ko: -10, delay : 5, S : 1 };
  model_runner = model_runner_maker(user_data);
  model_data = model_runner (default_params);
  pl = svg_plot("model_plot", model_data);
  ul = svg_plot("user_plot", user_data);
}



function model_runner_maker (user_data) {
  var d = {}, dt = 1/60;
  d.target = user_data.target;
  d.distance_reference = user_data.distance_reference;
  d.disturbance = user_data.disturbance;
  d.cursor = [];
  d.cursor.push(user_data.cursor[0]);
  d.distance = [];
  d.error = [];

  return function (p) {
    var i = 0, len = d.target.length, delayed, dd;
    p.delay = Math.round(p.delay);
    for (; i < len; i += 1) {
      d.distance[i] = d.target[i] - d.cursor[i];
      dd = i - p.delay;
      delayed = d.distance[dd < 0 ? 0 : dd ];
      d.error[i] = d.distance_reference[i] - delayed;
      d.cursor[i+1] = d.cursor[i] +
        (d.error[i] * p.Ko * dt) - (d.cursor[i]* (dt / p.S)) ;

    }

    return d;
  }
}

function random_wave (data_length, difficulty, range) {
  var dif_table = [2.2/16, 2.2/22.6, 2.2/32, 2.2/45.55, 2.2/64],
      dslow = dif_table[difficulty],
      i, n, phase, amplitude,
      temp, data = [];

  for (i=0; i < data_length; i++) { data.push(0); }

  for (n = 1; n < 120; n++) {
    phase = 2 * Math.PI * Math.random();
	amplitude = Math.exp(-0.7*dslow*n);
	temp = 2 * Math.PI * n / data_length;
	for (i=0; i < data_length; i++) {
		data[i] += amplitude * Math.cos(temp * i + phase);
	}
  }

  data = scale_to_range(data, -range/2, range/2);

  return data;
}

function scale_to_range(data, low, high) {
  var new_data = [],
    min_val = Math.min.apply(null, data),
    max_val = Math.max.apply(null, data),
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


function svg_plot (area, data, clrs) {
  var c = document.getElementById(area);
  c.style.border = 'solid 1px';
  var i, k;
  this.elem = [];
  var clrs = {'cursor':'green', target:'red', distance:'gray'};

  for (k in data) {
    elem[k] = document.createElementNS("http://www.w3.org/2000/svg", 'polyline');
    this.elem[k].style.stroke = clrs[k];
    this.elem[k].style.fill = "none";
    c.appendChild(this.elem[k]);
  }

  function to_line(arr, scale, offset) {
    var i = 0, l = arr.length, s = "";
    for (; i < l; i++) {
      s += "" + i + "," + (offset + arr[i]*scale) + " ";
    }
    return s;
}

  function new_plot(data) {
    for (k in data) {
      this.elem[k].setAttribute("points", to_line(data[k], -0.2,100));
    }

  }

  new_plot(data);
  return {
    c:c,
    elem: elem,
    new_plot:new_plot
  }

}

function rms (a, b) {
  var len = a.length, i = 0, sum = 0;

  function sqr (x) { return x*x; }

  for (; i < len; i++) {
    sum += sqr(a[i]-b[i]);
  }

  return Math.sqrt(sum)/max_data;
}

// model_runner is an external object
// might be useful to convert this to functional style
// keep the object, but just the data, and then use a function
// to pass trough it ... or something
function tune_param (param_name, p_min, p_max, params) {
  var guess = (p_min + p_max) / 2,
      delta = (p_max - p_min) / 2,
      tollerance = 0.00001,
      best_fit = 100,
      new_fit, last_fit=100,
      best_param = guess,
      new_params = params;


  while (Math.abs(delta) > tollerance)  {
    new_params[param_name] = guess;
    new_fit = rms(model_runner(new_params).distance, user_data.distance);

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


function auto_tune () {

  var k, tries = 5;
  var params = { Ko: -10, delay : 5, S : 1 };
  var param_limits = {
    Ko   :  { min: 0, max: 300},
    delay:  { min: 0, max: 30},
    S    :  { min: 0.001, max: 2}
  }

  while (tries--) {
    for (k in params) {
      params = tune_param(k, param_limits[k].min, param_limits[k].max, params);
    }
  }
  console.log(rms(model_data.distance, user_data.distance));
  console.log(params);

}
