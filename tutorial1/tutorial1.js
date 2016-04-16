"use strict";

var lib = (function () {

  // limit x to be at least min, at most max
  function constrain(x, min, max) {
    return (x < min) ? min : (x > max) ? max : x;
  }

  function min(data) {
    return Math.min.apply(null, data);
  }

  function max(data) {
    return Math.max.apply(null, data);
  }

  function scale_to_range(data, low, high) {
    var new_data = [],
      min_val = min(data),
      max_val = max(data),
      target_range = high - low,
      data_range = max_val - min_val,
      k = target_range / data_range,
      len = data.length,
      i;
    for (i = 0; i < len; i += 1) {
      new_data[i] = low + k * (data[i] - min_val);
    }
    return new_data;
  }

  var obj = {
    constrain: constrain,

    requestAnimFrame: function () {
      return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
          window.setTimeout(callback, 1000 / 60);
        };
    },

    // set multiple attributes of an object
    setAttr: function (obj, attrs) {
      var attr;
      for (attr in attrs) {
        if (attrs.hasOwnProperty(attr)) {
          obj.setAttribute(attr, attrs[attr]);
        }
      }
    },

    Signals: function () {
      this.add = function (s, name, color) {
        this[s] = {
          name: name,
          color: color,
          data: []
        };
      };
      this.reset = function () {
        var k;
        for (k in this) {
          if (typeof this[k] === 'object') {
            this[k].data = [];
          }
        }
      };
    },

    // make_dist returns an object that generates a disturbance signal
    // each time object.next is called, it returns the next value of the signal
    // select dificulty (dif, range 1 to 10) and amplitude (amp)

    make_dist: function (dif, amp, length) {
      var d1 = 0,
        d2 = 0,
        d3 = 0,
        k = amp * 800 * dif * 0.005,
        high = amp / 2,
        low = -high,
        s = 0.005 * dif / 4,
        len = length || 2100,
        arr = [],
        counter = 0;


      function new_dist() {
        var arr1 = [],
          i;
        for (i = 0; i < len; i += 1) {
          d1 += (k * (Math.random() - 0.5) - d1) * s;
          d2 += (d1 - d2) * s;
          d2 = constrain(d2, low, high);
          d3 += (d2 - d3) * s;
          arr1.push(d3);
        }
        return arr1;
      }

      arr = scale_to_range(new_dist(), low * 0.95, high * 0.95);


      function set_counter(x) {
        counter = x;
      }

      return {
        arr: arr,
        set_counter: set_counter,
        next: function () {
          var x = arr[counter];
          counter += 1;
          return x;
        }
      };
    },

    Plot: function (plot_area, signals) {
      var plot, lines;

      plot = Snap(plot_area);
      lines = [];

      function draw_axes() {
        var s, fsize, i, labels;

        fsize = 9;
        i = 0;
        plot.line(20, 50, 420, 50).attr('stroke', 'gray');
        plot.line(20, 0, 20, 100).attr('stroke', 'gray');

        labels = [
          plot.text(410, 62, "t"), plot.text(-2, 100, '-200'), plot.text(-2, 75, '-100'),
          plot.text(9, 52, '0'), plot.text(2, 28, '100'), plot.text(2, 7, '200')];

        labels.forEach(function (n) {
          n.attr('font-size', fsize);
        });

        for (s in signals) {
          if (typeof signals[s] === 'object') {
            i += 1;
            plot.text(425, 15 * i, signals[s].name).attr({
              'font-size': 10,
              'fill': signals[s].color,
              'stroke': signals[s].color,
              'stroke-width': 0.2
            });

            lines[s] = plot.path("M20,50");
            lines[s].attr({
              'fill': 'none',
              'stroke': signals[s].color
            });

          }
        }
      }

      function to_line(arr) {
        var i = 0,
          iscale = 0.222,
          ioff = 20,
          scale = -0.25,
          offset = 50,
          l = arr.length,
          s = "M" + (ioff + i * iscale) + "," + (offset + (arr[i] || 0) * scale);

        for (i = 1; i < l; i += 1) {
          s += "L" + (ioff + i * iscale) + "," + (offset + arr[i] * scale);
        }
        return s;
      }

      function update(s) {
        var k;
        for (k in s) {
          if (typeof lines[k] === 'object') {
            lines[k].attr("d", to_line(s[k].data));
          }
        }
      }

      draw_axes();

      return {
        update: update
      };

    }
  };


  obj.stat = (function () {

    function min(data) {
      return Math.min.apply(null, data);
    }

    function max(data) {
      return Math.max.apply(null, data);
    }

    function sum(data) {
      var s = 0,
        len = data.length,
        i;
      for (i = 0; i < len; i += 1) {
        s += data[i];
      }
      return s;
    }

    function mean(data) {
      var len = data.length;
      return sum(data) / len;
    }

    function covariance(data1, data2) {
      var len = data1.length,
        u = mean(data1),
        v = mean(data2),
        sum_dev = 0,
        i;
      for (i = 0; i < len; i += 1) {
        sum_dev += (data1[i] - u) * (data2[i] - v);
      }
      return (sum_dev / (len - 1));
    }

    function s_sum(data) {
      var len = data.length,
        md = mean(data),
        sum_sq = 0,
        tmp,
        i;
      for (i = 0; i < len; i += 1) {
        tmp = data[i] - md;
        sum_sq += tmp * tmp;
      }
      return sum_sq;
    }


    function stdev(data) {
      var len = data.length,
        variance = s_sum(data) / (len - 1);
      return (Math.sqrt(variance));
    }

    /*
      var pearson = function (data1, data2) {
        return covariance(data1, data2) / (stdev(data1) * stdev(data2));
      };
    */
    function pearson(a, b) {
      var len, ma, mb, adif, bdif, adif_sq, bdif_sq, diffprod, i;
      len = a.length;
      if (len !== b.length || len < 1) {
        return null;
      }
      ma = mean(a);
      mb = mean(b);
      diffprod = 0;
      adif_sq = 0;
      bdif_sq = 0;
      for (i = 0; i < len; i += 1) {
        adif = a[i] - ma;
        bdif = b[i] - mb;
        diffprod += adif * bdif;
        adif_sq += adif * adif;
        bdif_sq += bdif * bdif;
      }
      return diffprod / Math.sqrt(adif_sq * bdif_sq);
    }

    function sum_squares(data) {
      var len = data.length,
        sum_sq = 0,
        i;
      for (i = 0; i < len; i += 1) {
        sum_sq += data[i] * data[i];
      }
      return sum_sq;
    }

    function sum_products(data1, data2) {
      var len = data1.length,
        sum_p = 0,
        i;
      for (i = 0; i < len; i += 1) {
        sum_p += data1[i] * data2[i];
      }
      return sum_p;
    }

    function cross_corr(data1, data2) {
      var corr = sum_products(data1, data2),
        norm = Math.sqrt(sum_squares(data1) * sum_squares(data2));
      return corr / norm;
    }

    return {
      min: min,
      max: max,
      sum: sum,
      mean: mean,
      cross_corr: cross_corr,
      sum_products: sum_products,
      sum_squares: sum_squares,
      s_sum: s_sum,
      stdev: stdev,
      covariance: covariance,
      pearson: pearson
    };

  }());

  return obj;
}());

// STEP C: Measuring action
(function StepC() {
  var handle, handle_indicator, p, mouse_offset;

  p = Snap("#C-screen");
  mouse_offset = p.node.getBoundingClientRect().left;
  p.attr("cursor", "crosshair");
  p.mousemove(function (ev, x, y) {
    handle.value = -200 + x - mouse_offset;
    handle.oninput();
  });

  handle = document.getElementById("C-handle-slider");
  handle_indicator = document.getElementById('C-handle-pos-indicator');

  lib.setAttr(handle, {
    'min': -200,
    'max': 200,
    'step': 1
  });

  handle.oninput = function () {
    handle_indicator.innerHTML = +handle.value;
  };
}());


// STEP D: Effect of handle on cursor
(function StepD() {
  var p, mouse_offset, cursor, handle, handle_ind, cursor_ind;

  p = Snap("#D-screen");
  mouse_offset = p.node.getBoundingClientRect().left;
  p.attr("cursor", "crosshair");
  p.mousemove(function (ev, x, y) {
    handle.value = -200 + x - mouse_offset;
    handle.oninput();
  });

  cursor = p.rect(200, 20, 1.5, 30);

  handle = document.getElementById('D-handle-slider');
  handle_ind = document.getElementById('D-handle-indicator');
  cursor_ind = document.getElementById('D-cursor-indicator');


  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 1);

  handle.oninput = function () {
    handle_ind.innerHTML = +handle.value;
    cursor_ind.innerHTML = +handle.value;
    cursor.attr('x', (200 + Number(handle.value)) + 'px');
  };
}());

// Step E: Disturbances
(function StepE() {
  var p, mouse_offset, cursor, handle, handle_ind, cursor_ind, dist_ind,
    start_button, disturbance, requestAnimFrame, running, c, h, d, counter;

  p = Snap("#E-screen");
  mouse_offset = p.node.getBoundingClientRect().left;
  p.attr("cursor", "crosshair");
  p.mousemove(function (ev, x, y) {
    handle.value = -200 + x - mouse_offset;
    handle.oninput();
  });

  cursor = p.rect(200, 20, 2, 30);

  handle = document.getElementById('E-handle-slider');
  handle_ind = document.getElementById('E-handle-indicator');
  cursor_ind = document.getElementById('E-cursor-indicator');
  dist_ind = document.getElementById('E-dist-indicator');
  start_button = document.getElementById('E-start');

  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 1);

  requestAnimFrame = lib.requestAnimFrame();
  running = false;
  // handle, cursor, disturbance signals:
  h = 0;
  c = 0;
  d = 0;
  counter = 0;

  handle.oninput = function () {
    handle_ind.innerHTML = +handle.value;
    h = Number(handle.value);
    if (!running) {
      cursor_ind.innerHTML = h;
      cursor.attr('x', 200 + h);
    }
  };

  start_button.onclick = function () {
    if (!running) {
      disturbance = lib.make_dist(3, 200);
      running = true;
      start_button.setAttribute("value", "Stop disturbance");
      requestAnimFrame(animate);
    } else {
      d = 0;
      running = false;
      start_button.setAttribute("value", "Start disturbance");
    }
  }

  function animate() {
    c = h + d;
    dist_ind.innerHTML = d;
    cursor_ind.innerHTML = c.toFixed(0);
    cursor.attr('x', 200 + Number(c));

    if (running && counter < 2100) {
      d = Math.floor(disturbance.next());
      counter++;
      requestAnimFrame(animate);
    } else {
      counter = 0;
      d = 0;
      running = false;
      start_button.setAttribute("value", "Start disturbance");

    }
  }

})();


// Step F: Compensatory tracking
(function StepF() {
  var p = Snap("#F-screen");
  var mouse_offset = p.node.getBoundingClientRect().left;
  p.attr("cursor", "crosshair");
  p.mousemove(function (ev, x, y) {
    handle.value = -200 + x - mouse_offset;
  });

  var signals = new lib.Signals();
  signals.add('c', 'cursor', 'black');
  signals.add('h', 'handle', 'green');
  signals.add('d', 'disturbance', 'red');

  var plot = lib.Plot("#F-plot", signals);


  var cursor = p.rect(199, 20, 1, 30);
  p.polygon(197, 70, 200, 55, 203, 70);
  p.polygon(197, 0, 200, 15, 203, 0);

  var start_button = document.getElementById("F-start");
  var handle = document.getElementById('F-handle-slider');
  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 0.1);

  var corr_ch = document.getElementById("F-corr-cursor-handle");
  var corr_hd = document.getElementById("F-corr-handle-disturbance");

  var requestAnimFrame = lib.requestAnimFrame();
  var disturbance;
  var running = false;

  var h = 0,
    c = 0,
    d = 0;

  var counter = 0;

  function animate() {
    if (running && counter < 2100) {
      d = disturbance.next();
      h = Number(handle.value);
      c = h + d;

      cursor.attr('x', 200.00 + Number(c));

      // wait for about 5 seconds before recording
      if (counter > 300) {
        signals.c.data.push(c);
        signals.h.data.push(h);
        signals.d.data.push(d);
      }

      // record for about 30 (+5) sec
      counter++;
      requestAnimFrame(animate);

    } else {
      counter = 0;
      running = false;
      start_button.disabled = false;
      plot.update(signals);
      corr_ch.innerHTML = lib.stat.pearson(signals.c.data, signals.h.data).toFixed(3);
      corr_hd.innerHTML = lib.stat.pearson(signals.h.data, signals.d.data).toFixed(3);
    }
  }


  start_button.onclick = function () {
    disturbance = lib.make_dist(3, 400);
    signals.reset();
    plot.update(signals);
    running = true;
    start_button.disabled = true;
    requestAnimFrame(animate);
  }

}());



// Step G: Pursuit tracking
(function StepG() {
  var p = Snap("#G-screen");
  var mouse_offset = p.node.getBoundingClientRect().left;
  p.attr("cursor", "crosshair");
  p.mousemove(function (ev, x, y) {
    handle.value = -200 + x - mouse_offset;
  });

  var signals = new lib.Signals();
  signals.add('c', 'C-T distance', 'black');
  signals.add('h', 'handle', 'green');
  signals.add('d', 'd1 - d2', 'red');

  var plot = lib.Plot("#G-plot", signals);

  var cursor = p.rect(199, 20, 1, 30);
  var t1 = p.polygon(197, 70, 200, 55, 203, 70);
  var t2 = p.polygon(197, 0, 200, 15, 203, 0);

  var start_button = document.getElementById("G-start");
  var handle = document.getElementById('G-handle-slider');
  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 0.1);

  var corr_ch = document.getElementById("G-corr-hc");
  var corr_hd = document.getElementById("G-corr-hd");

  var requestAnimFrame = lib.requestAnimFrame();
  var dist1, dist2;

  var running = false;

  var h = 0,
    c = 0,
    t = 0,
    d = 0;

  var counter = 0;


  start_button.onclick = function () {
    dist1 = lib.make_dist(3, 200);
    dist2 = lib.make_dist(3, 200);
    signals.reset();

    plot.update(signals);
    running = true;
    start_button.disabled = true;
    requestAnimFrame(animate);
  }


  var animate = function () {
    if (running && counter < 2100) {
      t = dist1.next();
      d = dist2.next();
      h = Number(handle.value);
      c = h + d;

      cursor.attr('x', 200.00 + Number(c));
      t1.transform("t" + t + ",0");
      t2.transform("t" + t + ",0");


      // wait for about 5 seconds before recording
      if (counter > 300) {
        signals.c.data.push(c - t);
        signals.h.data.push(h);
        signals.d.data.push(d - t);
      }

      // record for about 30 (+5) sec
      counter++;
      requestAnimFrame(animate);
    } else {
      counter = 0;
      running = false;
      start_button.disabled = false;
      plot.update(signals);
      corr_ch.innerHTML = lib.stat.pearson(signals.c.data, signals.h.data).toFixed(3);
      corr_hd.innerHTML = lib.stat.pearson(signals.h.data, signals.d.data).toFixed(3);
    }
  }



}());



// Step H: Beyond tracking
(function StepH() {
  var p = Snap("#H-screen");
  var mouse_offset = p.node.getBoundingClientRect().left;
  p.attr("cursor", "crosshair");
  p.mousemove(function (ev, x, y) {
    handle.value = -200 + x - mouse_offset;
    //selected_demo.draw(h, d);
  });

  var signals = new lib.Signals();
  signals.add('c', 'controlled var', 'black');
  signals.add('h', 'handle', 'green');
  signals.add('d', 'disturbance', 'red');

  function $(x) {
    return document.getElementById(x);
  };

  var plot = lib.Plot("#H-plot", signals);
  var handle = $('H-handle-slider');
  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 0.1);

  var corr_ch = $("H-corr-hc");
  var corr_hd = $("H-corr-hd");

  var start_button = $("H-start-button");
  var requestAnimFrame = lib.requestAnimFrame();

  var dist;
  var selected_demo;
  var running = false;
  var counter = 0;
  var h, c, d;


  var buttons = [
    "H-rel-size-start",
    "H-orient-start",
    "H-shape-start",
    "H-pitch-start",
    "H-numbers-start"];

  function set_buttons_disabled(value) {
    buttons.forEach(function (b) {
      $(b).disabled = value;
    });
  }

  var rel_size = (function () {
    var circle, square;

    return {
      instructions: "Keep rectangle the same size as circle",

      setup: function () {
        circle = p.circle(100, 75, 30);
        circle.attr('fill', 'none');
        circle.attr('stroke', 'black');

        square = p.rect(250, 50, 53, 53);
        square.attr('fill', 'none');
        square.attr('stroke', 'black');
      },
      draw: function (h, d) {
        var scale = 0.01 * (100 + h + d);
        square.transform("s" + scale + ',' + scale);
      },
      clear: function () {
        circle.remove();
        square.remove();
      }
    }
  }());

  var orient = (function () {
    var p1 = "m150,130",
      p2 = "L250,130",
      o;

    return {
      instructions: "Keep point of angle straight up",
      setup: function () {
        o = p.path(p1 + "L200,20" + p2);
        o.attr("fill", 'none');
        o.attr("stroke", 'black');
      },

      draw: function (h, d) {
        o.attr("d", p1 + "L" + (200 + h + d) + ", 20" + p2);
      },

      clear: function () {
        o.remove();
      }
    }
  }());


  var keep_shape = (function () {
    var ax = 50,
      ay = 50,
      bx = 150,
      by = 150,
      cx = 100,
      cy = 20,
      dx = 70,
      dy = 130,
      left, right;

    return {
      instructions: "Match the left shape",
      setup: function () {
        left = p.polyline(ax, ay, bx, by, cx, cy, dx, dy);
        right = p.polyline(ax + 200, ay, bx + 200, by, cx + 200, cy, dx + 200, dy);
        left.attr("fill", 'none');
        left.attr("stroke", 'black');
        right.attr("fill", 'none');
        right.attr("stroke", 'black');
      },

      draw: function (h, d) {
        var x = -0.6 * (h + d);
        right.attr("points", [200 + ax + x, ay,
                        200 + bx, by - x,
                        200 + cx, cy + x,
                        200 + dx - x, dy - x]);
      },

      clear: function () {
        left.remove();
        right.remove();
      }
    };
  }());

  var pitch = (function () {
    var context, oscillator;

    return {
      instructions: "Maintain this pitch of the sound",

      setup: function () {
        context = new AudioContext();
        oscillator = context.createOscillator();
        oscillator.type = "sine";
        oscillator.connect(context.destination);
        oscillator.frequency = 440;
        oscillator.start(0);
      },
      draw: function (h, d) {
        var x = (h + d);
        oscillator.frequency.value = 440 + x;
      },

      clear: function () {
        oscillator.stop();
      }
    }
  }());

  var numbers = (function () {
    var num, val;
    return {
      instructions: "Keep the displayed number at 50",
      setup: function () {
        val = 50;
        num = p.text(180, 75, val);
        num.attr('font-size', 35);
      },
      draw: function (h, d) {
        num.attr("text", val + Math.floor(0.5 * (h + d)));

      },
      clear: function () {
        num.remove();
      }
    }
  }());


  function reset() {
    dist = lib.make_dist(3, 400);
    signals.reset();
    plot.update(signals);
    counter = 0;
  }

  var animate = function (demo) {
    if (running && counter < 2100) {
      d = dist.next();
      h = Number(handle.value);
      c = h + d;

      demo.draw(h, d);

      if (counter > 300) {
        signals.c.data.push(c);
        signals.h.data.push(h);
        signals.d.data.push(d);
      }

      counter++;
      requestAnimFrame(function () {
        animate(demo)
      });

    } else if (counter === 2100) {
      running = false;
      start_button.value = "Start";
      set_buttons_disabled(false);
      demo.clear();
      demo.setup();
      plot.update(signals);
      corr_ch.innerHTML = lib.stat.pearson(signals.c.data, signals.h.data).toFixed(3);
      corr_hd.innerHTML = lib.stat.pearson(signals.h.data, signals.d.data).toFixed(3);
    }
  }


  function select_new_demo(demo) {
    return function () {
      $("H-instructions").innerHTML = demo.instructions;
      selected_demo.clear();
      selected_demo = demo;
      demo.setup();
    };
  }

  $("H-orient-start").onclick = select_new_demo(orient);
  $("H-pitch-start").onclick = select_new_demo(pitch);
  $("H-rel-size-start").onclick = select_new_demo(rel_size);
  $("H-shape-start").onclick = select_new_demo(keep_shape);
  $("H-numbers-start").onclick = select_new_demo(numbers);

  start_button.onclick = function () {
    if (!running) {
      set_buttons_disabled(true);
      start_button.value = "Stop";
      counter = 0;
      running = true;
      reset();
      animate(selected_demo);

    } else {
      reset();
      running = false;
      set_buttons_disabled(false);
      console.log(selected_demo);
      selected_demo.clear();
      selected_demo.setup();
      start_button.value = "Start";
    }
  }

  // executes right after loading
  selected_demo = rel_size;
  $("H-instructions").innerHTML = selected_demo.instructions;
  selected_demo.setup();

}());




// Step I: detecting the consequences
(function StepI() {
  var p = Snap("#I-screen");
  var mouse_offset = p.node.getBoundingClientRect().left;
  p.attr("cursor", "crosshair");
  p.mousemove(function (ev, x, y) {
    handle.value = -200 + x - mouse_offset;
  });

  var signals = new lib.Signals();

  signals.add('c1', 'top cursor', 'orange');
  signals.add('c2', 'middle cursor', 'purple');
  signals.add('c3', 'bottom cursor', 'blue');
  signals.add('h', 'handle', 'green');
  signals.add('d1', 'disturbance', 'red');
  signals.add('d2', 'disturbance', 'red');
  signals.add('d3', 'disturbance', 'red');

  var s1 = {
    c1: signals.c1,
    d1: signals.d1,
    h: signals.h
  };
  var s2 = {
    c2: signals.c2,
    d2: signals.d2,
    h: signals.h
  };
  var s3 = {
    c3: signals.c3,
    d3: signals.d3,
    h: signals.h
  };

  var plot1 = lib.Plot("#I-plot1", s1);
  var plot2 = lib.Plot("#I-plot2", s2);
  var plot3 = lib.Plot("#I-plot3", s3);

  function $(x) {
    return document.getElementById(x);
  };

  var handle = $('I-handle-slider');
  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 0.1);

  var cursor1 = p.rect(199, 30, 1, 22).attr('stroke', s1.c1.color);
  var cursor2 = p.rect(199, 65, 1, 22).attr('stroke', s2.c2.color);
  var cursor3 = p.rect(199, 100, 1, 22).attr('stroke', s3.c3.color);


  p.polygon(197, 5, 200, 20, 203, 5);
  p.polygon(197, 145, 200, 130, 203, 145);

  var requestAnimFrame = lib.requestAnimFrame();
  var dist1, dist2, dist3;


  var running = false;
  var counter = 0;

  var start_button = $("I-start");

  start_button.onclick = function () {
    if (!running) {
      dist1 = lib.make_dist(3, 200);
      dist2 = lib.make_dist(3, 200);
      dist3 = lib.make_dist(3, 200);
      counter = 0;
      start_button.value = "Stop";
      running = true;
      animate();
    } else {
      counter = 0;
      signals.reset();
      start_button.value = "Start";
      running = false;
    }
  };

  var d1, d2, d3, c1, c2, c3, h;

  var animate = function () {

    if (running && counter < 2100) {
      d1 = dist1.next();
      d2 = dist2.next();
      d3 = dist3.next();

      h = Number(handle.value);
      c1 = h + d1;
      c2 = h + d2;
      c3 = h + d3;

      cursor1.attr('x', 200.00 + Number(c1));
      cursor2.attr('x', 200.00 + Number(c2));
      cursor3.attr('x', 200.00 + Number(c3));

      // wait for about 5 seconds before recording
      if (counter > 300) {
        signals.c1.data.push(c1);
        signals.c2.data.push(c2);
        signals.c3.data.push(c3);
        signals.h.data.push(h);
        signals.d1.data.push(d1);
        signals.d2.data.push(d2);
        signals.d3.data.push(d3);
      }

      // record for about 30 (+5) sec
      counter++;
      requestAnimFrame(animate);
    } else if (counter === 2100) {
      counter = 0;
      running = false;
      plot1.update(s1);
      plot2.update(s2);
      plot3.update(s3);
      start_button.value = "Start";
      detect_controlled();
    }
  }


  function detect_controlled() {
    var sol = $("I-controlled-cursor");
    var r = lib.stat.pearson;
    var hn = signals.h.data;
    var c1d = signals.c1.data;
    var c2d = signals.c2.data;
    var c3d = signals.c3.data;

    var r1 = Math.abs(r(hn, c1d));
    var r2 = Math.abs(r(hn, c2d));
    var r3 = Math.abs(r(hn, c3d));

    if (r1 < r2 && r1 < r3) {
      sol.innerHTML = "top cursor";
      sol.style.color = signals.c1.color;
    } else if (r2 < r3 && r2 < r1) {
      sol.innerHTML = "middle cursor";
      sol.style.color = signals.c2.color;
    } else if (r3 < r2 && r3 < r1) {
      sol.innerHTML = "bottom cursor";
      sol.style.color = signals.c3.color;
    }
  }
}());




// Step J: Changing the feedback factor
(function StepJ() {
  function $(x) {
    return document.getElementById(x);
  };

  var p = Snap("#J-screen");
  var mouse_offset = p.node.getBoundingClientRect().left;
  p.attr("cursor", "crosshair");
  p.mousemove(function (ev, x, y) {
    handle.value = -200 + x - mouse_offset;
  });

  var signals = new lib.Signals();
  signals.add('c', 'cursor', 'black');
  signals.add('h', 'handle', 'green');
  signals.add('d', 'disturbance', 'red');

  var plot = lib.Plot("#J-plot", signals);

  var cursor = p.rect(199, 20, 1, 30);
  p.polygon(197, 70, 200, 55, 203, 70);
  p.polygon(197, 0, 200, 15, 203, 0);

  var start_button = $("J-start");
  var handle = $('J-handle-slider');
  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 0.1);

  var feedback_input = $("J-feedback-factor");
  var handle_effect_percent = $("J-handle-effect");
  var Kf;
  var requestAnimFrame = lib.requestAnimFrame();
  var disturbance;
  var running = false;

  var h = 0,
    c = 0,
    d = 0;

  var counter = 0;

  start_button.onclick = function () {
    disturbance = lib.make_dist(3, 200);

    var tmp = Number(feedback_input.value) || 100;
    Kf = lib.constrain(tmp, 50, 200);
    feedback_input.value = Kf;
    handle_effect_percent.innerHTML = Kf;

    Kf = Kf / 100;

    signals.reset();
    plot.update(signals);
    running = true;
    start_button.disabled = true;
    requestAnimFrame(animate);
  }

  var animate = function () {
    if (running && counter < 2100) {
      d = disturbance.next();
      h = Number(handle.value);
      c = Kf * h + d;

      cursor.attr('x', 200.00 + Number(c));

      if (counter > 300) {
        signals.c.data.push(c);
        signals.h.data.push(h);
        signals.d.data.push(d);
      }

      counter++;
      requestAnimFrame(animate);

    } else {
      counter = 0;
      running = false;
      start_button.disabled = false;
      plot.update(signals);
    }
  }

}());






// Step K: Control of remote effect
(function StepK() {
  var p = Snap("#K-screen");
  var mouse_offset = p.node.getBoundingClientRect().left;
  p.attr("cursor", "crosshair");
  p.mousemove(function (ev, x, y) {
    handle.value = -200 + x - mouse_offset;
  });

  var signals = new lib.Signals();
  signals.add('cv', 'free end', 'black');
  signals.add('h', 'handle', 'green');
  signals.add('d', 'd1 - d2', 'red');

  var plot = lib.Plot("#K-plot", signals);

  var pulley1 = p.circle(100, 45, 20);
  var pulley2 = p.circle(300, 85, 20);

  var free_string = p.line(100, 25, 200, 25).attr('stroke', "#000");
  var conn_string = p.line(100, 65, 300, 65).attr('stroke', "#000");
  var end_string = p.line(200, 105, 300, 105).attr('stroke', "#000");

  var cursor = p.rect(199, 105, 1, 20);
  var mark = p.polygon(197, 0, 200, 15, 203, 0);

  var start_button = document.getElementById("K-start");
  var handle = document.getElementById('K-handle-slider');
  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 0.1);

  var requestAnimFrame = lib.requestAnimFrame();
  var dist1, dist2;

  var running = false;

  var d1, d2;
  var c, h, d, t;

  var counter = 0;


  start_button.onclick = function () {
    dist1 = lib.make_dist(3, 150);
    dist2 = lib.make_dist(3, 150);
    signals.reset();

    plot.update(signals);
    running = true;
    start_button.disabled = true;
    requestAnimFrame(animate);
  }

  var animate = function () {
    if (running && counter < 2100) {
      d1 = dist1.next();
      d2 = dist2.next();
      h = Number(handle.value);

      // controlled variable
      var cv = d1 - d2 + h;

      pulley1.transform("t" + d1 + ",0");
      pulley2.transform("t" + d2 + ",0");

      free_string.attr('x1', 100 + d1);

      free_string.attr('x2', 200 + cv);

      conn_string.attr('x1', 100 + d1);

      conn_string.attr('x2', 300 + d2);
      end_string.attr('x2', 300 + d2);

      end_string.attr('x1', 200 + h);
      cursor.attr('x', 200.00 + h);


      // wait for about 5 seconds before recording
      if (counter > 300) {
        signals.cv.data.push(cv);
        signals.h.data.push(h);
        signals.d.data.push((d1 - d2));
      }

      // record for about 30 (+5) sec
      counter++;
      requestAnimFrame(animate);
    } else {
      counter = 0;
      running = false;
      start_button.disabled = false;
      plot.update(signals);

    }
  }
}());




// Step L: Feedforward vs feedback
(function StepL() {
  function $(x) {
    return document.getElementById(x);
  }

  var p = Snap("#L-screen");
  var mouse_offset = p.node.getBoundingClientRect().left;
  var handle = 0;
  p.attr("cursor", "none");
  p.mousemove(function (ev, x, y) {
    handle = -200 + x - mouse_offset;
  });

  var signals = new lib.Signals();
  signals.add('c', 'cursor', 'black');
  signals.add('h', 'handle', 'green');
  signals.add('d', 'disturbance', 'red');

  var plot = lib.Plot("#L-plot", signals);

  var cursor = p.rect(199, 20, 1, 30);
  p.polygon(197, 70, 200, 55, 203, 70);
  p.polygon(197, 0, 200, 15, 203, 0);

  var selected_ff = $("L-radio-ff");
  var selected_fb = $("L-radio-fb");

  var start_btn = $("L-start");
  var corr_ch_ff = $("L-corr-cursor-handle-ff");
  var corr_hd_ff = $("L-corr-handle-disturbance-ff");

  var corr_ch_fb = $("L-corr-cursor-handle-fb");
  var corr_hd_fb = $("L-corr-handle-disturbance-fb");

  var requestAnimFrame = lib.requestAnimFrame();
  var disturbance = lib.make_dist(3, 400);
  var running = false;

  var h = 0,
    c = 0,
    d = 0;

  var counter = 0;

  function rms(s) {
    var sum = 0,
      i = 0;
    len = s.length;
    for (i = 0; i < len; i++) {
      sum += ((s[i] * s[i]) / 1800);
    }
    //console.log(s, sum);
    return (Math.sqrt(sum));
  }

  var ff = {
    instructions: 'The "cursor" is now really the disturbance. Move the handle as much as necessary, and in the right direction, to counteract the effect of the disturbance on the invisible cursor position.',
    draw: function (c, h, d) {
      cursor.attr('x', 200.00 + d);
    },
    calc: function () {
      $("L-rms-ff").innerHTML = rms(signals.c.data).toFixed(2);
      corr_ch_ff.innerHTML = lib.stat.pearson(signals.c.data, signals.h.data).toFixed(2);
      corr_hd_ff.innerHTML = lib.stat.pearson(signals.h.data, signals.d.data).toFixed(2);
    }
  }

  var fb = {
    instructions: 'The cursor is now the real cursor. This is just like the previous compensatory tracking experiment. Keep the cursor between the stationary target lines. This step is giving you information you use in the feedforward experimental runs.',
    draw: function (c, h, d) {
      cursor.attr('x', 200.00 + c);
    },
    calc: function () {
      $("L-rms-fb").innerHTML = rms(signals.c.data).toFixed(2);
      corr_ch_fb.innerHTML = lib.stat.pearson(signals.c.data, signals.h.data).toFixed(2);
      corr_hd_fb.innerHTML = lib.stat.pearson(signals.h.data, signals.d.data).toFixed(2);
    }
  }

  var selected = ff;

  selected_ff.onclick = function () {
    selected = ff;
    $("L-instructions").innerHTML = ff.instructions;
  }

  selected_fb.onclick = function () {
    selected = fb;
    $("L-instructions").innerHTML = fb.instructions;
  }

  start_btn.onclick = function () {
    counter = 0;
    disturbance.set_counter(0);
    signals.reset();
    plot.update(signals);
    running = true;
    selected_fb.disabled = true;
    selected_ff.disabled = true;
    start_btn.disabled = true;
    animate();
  }

  var animate = function () {
    if (running && counter < 2100) {
      d = disturbance.next();
      h = Number(handle);
      c = h + d;
      selected.draw(c, h, d);

      if (counter > 300) {
        signals.c.data.push(c);
        signals.h.data.push(h);
        signals.d.data.push(d);
      }

      counter++;
      requestAnimFrame(animate);
    } else {
      counter = 0;
      plot.update(signals);
      running = false;
      selected_ff.disabled = false;
      selected_fb.disabled = false;
      start_btn.disabled = false;
      selected.calc();
    }
  }

}());
