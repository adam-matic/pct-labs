// draws a black line and an arrow
function wire_line(snap_scr, opts) {
  var l,
    o = {};
  o.points = opts.points || [0, 0];
  o.stroke = opts.stroke || 'black';
  o.fill = opts.fill || 'none';

  o.left = function (x, y) {
    return snap_scr.polyline(x + 10, y + 4, x, y, x + 10, y - 4);
  };
  o.up = function (x, y) {
    return snap_scr.polyline(x - 4, y + 10, x, y, x + 4, y + 10);
  };
  o.right = function (x, y) {
    return snap_scr.polyline(x - 10, y - 4, x, y, x - 10, y + 4);
  };
  o.down = function (x, y) {
    return snap_scr.polyline(x - 4, y - 10, x, y, x + 4, y - 10);
  };

  o.line = snap_scr.polyline(o.points).attr({
    stroke: o.stroke,
    fill: o.fill
  });

  l = o.points.length;
  if (opts.arrow !== undefined) o.arrow = o[opts.arrow](o.points[l - 2], o.points[l - 1]);
  return o;
}


// just a draggable number
function parameter(snap_scr, p) {
  p = p || {};
  p.obj = p.obj || {};
  p.name = p.name || 'nn';
  p.value = p.value || 0;
  p.prev_value = p.value;
  p.min = p.min || 0;
  p.max = p.max || 10;
  p.step = p.step || 0.1;
  p.x = p.x || 10;
  p.y = p.y || 10;
  p.fixed_digits = p.fixed_digits || 2;
  p["font-size"] = p["font-size"] || 13;
  p.onchange = p.onchange || function () {};

  function lim(num) {
    return num > p.max ? p.max :
      (num < p.min) ? p.min : num;
  };

  p.number = snap_scr.text(p.x, p.y, p.value.toFixed(2)).attr({
    'text-anchor': 'end',
    cursor: 'ns-resize',
    'font-size': p["font-size"]
  });

  function sq(x, y) {
    var pov = Math.pow(10, -(x / 100));
    //console.log('pov', pov);
    return -0.1 * y * pov;
    //return Math.sign(x) * Math.floor(0.01 * x * x) * p.step;
  }

  function move(dx, dy) {
    p.value = lim(Number(p.prev_value) + sq(dx, dy));
    p.number.attr('text', p.value.toFixed(p.fixed_digits));
    p.obj[p.name] = p.value;
    p.onchange();
  }

  function start_move(x, y, e) {
    e.stopPropagation();
    p.prev_value = p.value;
  }
  p.number.drag(move, start_move);

  return p;
}


// show a name of the signal and its value below the name
function signal_meter(snap_scr, opts) {
  var s = {
    x: opts.x || 0,
    y: opts.y || 0,
    color: opts.color || 'black',
    name: opts.name || "",
    value: opts.value || 0,
    show_plot: opts.show_plot || false
  };

  var o = {
    'font-size': opts['font-size'],
    'fill': (s.show_plot ? s.color : 'black'),
    'text-anchor': 'middle',
  };
  var off = 0;

  s.signal_name = snap_scr.group();
  s.name.forEach(function (line_text, i) {
    s.signal_name.add(snap_scr.text(s.x, s.y + 15 * i, line_text).attr(o));
    off = 15 * i;
  });

  s.signal_name.mouseover(function () {
    s.signal_name.attr('text-decoration', 'underline');
  });
  s.signal_name.mouseout(function () {
    s.signal_name.attr('text-decoration', 'none');
  });

  s.signal_name.click(function () {
    s.show_plot = !s.show_plot;
    //console.log(s.signal_name);
    if (!s.show_plot) {
      s.name.forEach(function (line_text, i) {
        s.signal_name[i].attr('fill', 'black');
        s.number.attr('fill', 'black');
      });
    } else {
      s.name.forEach(function (line_text, i) {
        s.signal_name[i].attr('fill', s.color);
      });
      s.number.attr('fill', s.color);
    }
  });


  o["text-anchor"] = 'end';
  s.number = snap_scr.text(s.x + 20, s.y + 25 + off, "0.00").attr(o);

  s.update = function (x) {
    //console.log(s.name, x);
    s.number.attr('text', x.toFixed(2));
  };

  return s;
}

// this will probably go to the lib.js file
// Draws plot axes and redraws the plot when updated with latest values of signals
// not very flexible with the size of the plot area at the moment

function make_live_plot(snap) {
  var num_signals = 0,
    num_data = 0,
    lines = [],
    signals = {},
    yoffset = 525,
    xoffset = 40;


  function add_signal(s, name, color) {
    num_signals += 1;
    signals[s] = [];
    /*
    plot.text(425, 15 * num_signals, name).attr({
      'font-size': 10,
      'fill': color,
      'stroke': color,
      'stroke-width': 0.2
    });
    */
    lines[s] = snap.path("M420,525");
    lines[s].attr({
      'fill': 'none',
      'stroke': color
    });
  }

  function draw_axes() {
    var fs = {
      "font-size": 9
    };
    snap.line(xoffset, yoffset, 520, yoffset).attr('stroke', 'gray');
    snap.line(xoffset, yoffset - 70, xoffset, yoffset + 70).attr('stroke', 'gray');
    /*
    plot.text(410, 62, "t").attr(fs);
    plot.text(-2, 100, '-200').attr(fs);
    plot.text(-2, 75, '-100').attr(fs);
    plot.text(9, 52, '0').attr(fs);
    plot.text(2, 28, '100').attr(fs);
    plot.text(2, 7, '200').attr(fs);
    */
  }

  function to_line(arr, ioff) {
    var i = 0,
      s = "",
      iscale = 0.222,
      scale = -5,
      l = arr.length;
    s = "M" + (ioff + i * iscale) + "," + (yoffset + (arr[i] || 0) * scale);
    for (i = 1; i < l; i += 1) {
      s += "L" + (ioff + i * iscale) + "," + (yoffset + arr[i] * scale);
    }
    return s;
  }

  function update(s, show_it) {
    var k;
    for (k in s) {
      //console.log(k);
      signals[k].push(s[k]);
    }

    if (num_data >= 2150) {
      for (k in s) {
        signals[k].shift();
      }
    } else {
      num_data += 1;
    }
    for (k in signals) {
      if (show_it[k].show_plot) {
        lines[k].attr("d", to_line(signals[k], 520 - (num_data * 0.222)));
      } else {
        lines[k].attr("d", "M0,0");
      }
    }
  }

  draw_axes();

  return {
    add_signal: add_signal,
    update: update
  };
};

/*
function make_box(snap, p) {
  p = p || {};
  p.x = p.x || 10;
  p.y = p.y || 10;
  p.name = p.name || "";
  p.factors = p.factors || {};
  p.width = p.width || 80;
  p.height = p.height || 50;

  p.box = snap.rect(p.x, p.y, p.width, p.height, 5, 5).attr({
    fill: 'white'
  });

  p.par = parameter(snap, {
    value: 1,
    x: p.x + 50,
    y: p.y + 20,
    min: 0,
    max: 15,
    onchange: function () {
      console.log(this.value)
    }
  });

  var r = snap.group();
  r.add(p.box);
  r.add(p.par.number);

  r.drag();

}
*/
function make_signal_generator() {
  var random = lib.make_disturbance(4, 30);
  var count = 0;
  var o = {
    a: 15,
    f: 0.01,
    val: 0,
    next: function () {}
  }
  o.set_constant = function () {
    o.next = function () {
      return o.val;
    }
  }
  o.set_random = function () {
    o.next = function () {
      return random.next();
    }
  }
  o.set_sine = function () {
    o.next = function () {
      count++;
      return o.a * Math.sin((1 / 60) * Math.PI * o.f * count);
    }
  }
  o.set_constant();
  return o;
};



function gen_box(c, gen, x, y) {
  function par(name, coor, min, max) {
    return parameter(c, {
      x: coor[0],
      y: coor[1],
      min: min,
      max: max,
      obj: gen,
      name: name,
      value: gen[name],
      'font-size': 13,
      onchange: function () {}
    })
  };

  c.rect(x, y, 180, 60, 10, 10).attr('fill', "#fff");
  var tattr = {
    'font-size': 13,
    'fill': 'gray'
  }

  var text_random = c.text(x + 10, y + 15, "Random").attr(tattr);
  var text_constant = c.text(x + 10, y + 35, "Constant: ").attr(tattr);
  var text_sine = c.text(x + 10, y + 55, "Sine a:").attr(tattr);
  var text_f = c.text(x + 113, y + 55, "f:").attr(tattr);
  var pv = par('val', [x + 140, y + 35], -15, 15);
  var pa = par('a', [x + 106, y + 55], 0, 15);
  var pf = par('f', [x + 165, y + 55], 0, 15);
  pf.number.attr('fill', 'gray');
  pa.number.attr('fill', 'gray');
  pv.number.attr('fill', 'gray');


  function select_random() {
    text_constant.attr('fill', 'gray');
    text_sine.attr('fill', 'gray');
    text_f.attr('fill', 'gray');
    pa.number.attr('fill', 'gray');
    pf.number.attr('fill', 'gray');
    pv.number.attr('fill', 'gray');
    text_random.attr('fill', 'black');
    gen.set_random();
  }

  function select_constant() {
    text_random.attr('fill', 'gray');
    text_sine.attr('fill', 'gray');
    pa.number.attr('fill', 'gray');
    pf.number.attr('fill', 'gray');
    text_constant.attr('fill', 'black');
    pv.number.attr('fill', 'black');
    gen.set_constant();
  }

  function select_sine() {
    text_random.attr('fill', 'gray');
    text_constant.attr('fill', 'gray');
    pv.number.attr('fill', 'gray');
    text_sine.attr('fill', 'black');
    pa.number.attr('fill', 'black');
    pf.number.attr('fill', 'black');
    text_f.attr('fill', 'black');
    gen.set_sine();
  }

  text_random.click(select_random);
  text_constant.click(select_constant);
  text_sine.click(select_sine);

  function show_underline() {
    this.attr('text-decoration', 'underline');
  }

  function no_underline() {
    this.attr('text-decoration', 'none');
  }
  text_random.mouseover(show_underline);
  text_constant.mouseover(show_underline);
  text_sine.mouseover(show_underline);

  text_random.mouseout(no_underline);
  text_constant.mouseout(no_underline);
  text_sine.mouseout(no_underline);

  select_constant();
}





(function Demo2() {
  var c = Snap("#diagram");
  var plot = make_live_plot(c);

  var t = {
    'font-size': 13,
    //stroke: 'black'
  };
  var b = {
    //stroke: 'black',
    fill: '#fff'
  };

  function wl(points, arrow) {
    return wire_line(c, {
      points: points,
      arrow: arrow
    })
  }

  function par(obj, name, coor, min, max) {
    return parameter(c, {
      x: coor[0],
      y: coor[1],
      min: min,
      max: max,
      obj: obj,
      name: name,
      value: obj[name],
      'font-size': 13,
      onchange: function () {
        // console.log(obj[name]);
      }
    })
  };

  function sig(name, x, y, color, show_plot) {
    return signal_meter(c, {
      x: x,
      y: y,
      name: name,
      color: color,
      'font-size': 13,
      show_plot: show_plot
    })
  }
  var params = {
    Ko: 100,
    Delay: 0,
    S: 100,
    Ki: 1,
    Kf: 1
  }
  var rgen = make_signal_generator();
  var dgen = make_signal_generator();

  var snum = {};

  var r_gen_box = gen_box(c, rgen, 40, 40);
  snum.r = sig(["Reference", "signal"], 340, 65, 'darkred');
  snum.p = sig(["Perceptual signal"], 150, 142, 'darkblue', true);
  snum.e = sig(["Error signal"], 440, 142, 'white');
  snum.qo = sig(["Output", "quantity"], 524, 270, 'green', true);
  snum.qi = sig(["Input", "quantity"], 68, 270, 'black');
  snum.qf = sig(["Feedback quantity"], 215, 322, 'darkgreen');
  snum.d = sig(["Disturbance"], 215, 392, 'red', true);


  c.rect(40, 185, 140, 70, 10, 10).attr(b);
  c.text(50, 200, "Input function").attr(t);
  c.text(56, 225, "Delay: ").attr(t);
  c.text(56, 245, "Ki: ").attr(t);
  c.rect(240, 135, 120, 40, 10, 10).attr(b);
  c.text(265, 158, "Comparator").attr(t);

  c.rect(420, 185, 140, 70, 10, 10).attr(b);
  c.text(430, 200, "Output function").attr(t);
  c.text(436, 225, "Ko: ").attr(t);
  c.text(436, 245, "S: ").attr(t);

  var ref_line = wl([220, 70, 300, 70, 300, 134], "down");
  var p_line = wl([110, 185, 110, 153, 240, 153], 'right');
  var out_line = wl([360, 153, 490, 153, 490, 185], 'down');

  c.rect(300, 305, 154, 43, 10, 10).attr(b);
  c.text(310, 320, "Feedback function").attr(t);
  c.text(316, 340, "Kf: ").attr(t);

  wl([490, 255, 490, 330, 457, 330], "left");

  var d_gen_box = gen_box(c, dgen, 300, 375);
  var empty = {
    fill: 'none',
    stroke: 'black'
  }

  var ddd = par(params, 'Delay', [144, 225], 0, 10);
  ddd.fixed_digits = 0;
  //ddd.value = 0;
  ddd.number.attr("text", "0");

  par(params, 'Ki', [144, 245], 0, 3);
  par(params, "Ko", [520, 225], 0, 300);
  par(params, "S", [520, 245], 0.01, 2000);
  par(params, "Kf", [386, 340], -3, 3);


  c.circle(110, 330, 15).attr(empty);
  wl([300, 330, 125, 330], 'left');
  wl([110, 315, 110, 255], 'up');
  wl([300, 400, 110, 400, 110, 345], 'up');

  c.text(280, 125, "+");
  c.text(220, 170, "-");

  c.text(135, 320, "+");
  c.text(120, 360, "+");

  var signals = {
    p: [],
    r: [],
    e: [],
    qo: [],
    qf: [],
    d: [],
    qi: []
  }

  plot.add_signal('p', 'perception', 'darkblue');
  plot.add_signal('r', 'reference', 'darkred');
  plot.add_signal('e', 'error', 'white');
  plot.add_signal('qo', 'output', 'green');
  plot.add_signal('d', 'disturbance', 'red');
  plot.add_signal('qf', 'feedback', 'darkgreen');
  plot.add_signal('qi', 'inputquantity', 'black');



  function model() {
    var qo = 0,
      qi = 0,
      qf = 0,
      r = 0,
      d = 0,
      p = 0,
      e = 0,
      dt = 1 / 60;

    var counter = 0;

    function update_numbers() {
      snum.d.update(d);
      snum.p.update(p);
      snum.r.update(r);
      snum.e.update(e);
      snum.qo.update(qo);
      snum.qi.update(qi);
      snum.qf.update(qf);

    }

    function update_signals() {
      signals.p.push(p);
      signals.r.push(r);
      signals.e.push(e);
      signals.d.push(d);
      signals.qi.push(qi);
      signals.qo.push(qo);
      signals.qf.push(qf);
    }

    function update_plot() {
      plot.update({
        p: p,
        qi: qi,
        qf: qf,
        r: r,
        d: d,
        e: e,
        qo: qo
      }, snum);
    }

    var delay_FIFO = [];

    function get_delayed(new_p, delay) {
      var out, del = Math.round(delay);
      delay_FIFO.push(new_p);
      out = delay_FIFO[0];
      while (delay_FIFO.length > del) {
        delay_FIFO.shift();
      }
      return out;
    }

    function constrain_all() {
      var limit = 20;
      p = lib.constrain(p, -limit, limit);
      e = lib.constrain(e, -limit, limit);
      qf = lib.constrain(qf, -limit, limit);
      qi = lib.constrain(qi, -limit, limit);
      qo = lib.constrain(qo, -limit, limit);

    }

    function step() {
      r = rgen.next();
      d = dgen.next();

      qf = qo * params.Kf;
      qi = d + qf;
      p = get_delayed(params.Ki * qi, params.Delay);
      e = r - p;
      qo = qo + (params.Ko * e - qo) * (dt / params.S);

      constrain_all();
      update_numbers();
      update_signals();
      update_plot();
      counter++;
      lib.request_anim_frame(step);
    }

    step();
  }

  model();
}());
