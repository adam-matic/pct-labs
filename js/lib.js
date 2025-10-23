// lib

(function (global) {
  "use strict";
  var lib = {};

  lib.$ = function (id) {
    return document.getElementById(id);
  };

  // limit x to be at least min, at most max
  lib.constrain = function (x, min, max) {
    return (x < min) ? min : (x > max) ? max : x;
  };

  lib.min = function (data) {
    return Math.min.apply(null, data);
  };

  lib.max = function (data) {
    return Math.max.apply(null, data);
  };

  lib.scale_to_range = function (data, low, high) {
    var new_data = [],
      min_val = lib.min(data),
      max_val = lib.max(data),
      target_range = high - low,
      data_range = max_val - min_val,
      k = target_range / data_range,
      len = data.length,
      i;
    for (i = 0; i < len; i += 1) {
      new_data[i] = low + k * (data[i] - min_val);
    }
    return new_data;
  };

  lib.request_anim_frame = (function () {
    var request = global.requestAnimationFrame || global.webkitRequestAnimationFrame || global.mozRequestAnimationFrame || function (callback) {
      global.setTimeout(callback, 1000 / 60);
    };

    return function (callback) {
      request.call(window, callback);
    }
  }());


  // set multiple attributes of an object
  lib.setAttr = function (obj, attrs) {
    var attr;
    for (attr in attrs) {
      if (attrs.hasOwnProperty(attr)) {
        obj.setAttribute(attr, attrs[attr]);
      }
    }
  };

  lib.make_signals = function () {
    var obj = {};
    obj.add = function (s, name, color) {
      obj[s] = {
        name: name,
        color: color,
        data: []
      };
    };

    obj.reset = function () {
      var k;
      for (k in obj) {
        if (typeof obj[k] === 'object') {
          obj[k].data = [];
        }
      }
    };

    return obj;
  };


  // two modes: (1) precalculated disturbance with exact length and range, returns an array
  //            (2) continuous random disturbance inside a given range (approximately), returns a function
  // if given data_length, returns an array, if not, returns a continuous function

  lib.make_disturbance = function (difficulty, range, data_length) {

    // Disturbance array generation algorithm from TrackAnalyze (LCSIII)
    var dif_table = [2.2 / 8, 2.2 / 16, 2.2 / 22.6, 2.2 / 32, 2.2 / 45.55, 2.2 / 64];

    function new_disturbance_array(difficulty, range, data_length) {
      var dslow, i, n, phase, amplitude,
        temp, data = [];

      dslow = dif_table[difficulty - 1];
      // zero the array
      for (i = 0; i < data_length; i += 1) {
        data.push(0);
      }

      // add waves of different frequency with random phase
      for (n = 1; n < 120; n += 1) {
        phase = 2 * Math.PI * Math.random();
        amplitude = Math.exp(-0.7 * dslow * n);
        temp = 2 * Math.PI * n / data_length;
        for (i = 0; i < data_length; i += 1) {
          data[i] += amplitude * Math.cos(temp * i + phase);
        }
      }
      data = lib.scale_to_range(data, -range / 2, range / 2);

      return data;
    }


    function make_continuous_disturbance(difficulty, range) {
      var d1 = 0,
        d2 = 0,
        d3 = 0,
        k = range * difficulty * 10, // magic number 10!
        high = range / 2,
        low = -high,
        s = difficulty / 500; // and another magic number!
      return {
        next: function () {
          d1 += (k * (Math.random() - 0.5) - d1) * s;
          d2 += (d1 - d2) * s;
          d2 = lib.constrain(d2, low, high);
          d3 += (d2 - d3) * s;
          return d3;
        }
      };
    }

    if (data_length === undefined) {
      return make_continuous_disturbance(difficulty, range);
    } else {
      return new_disturbance_array(difficulty, range, data_length);
    }
  };

  lib.make_polyline = function (area, points, opts) {
    var line;
    points = points || [0, 0];
    opts = opts || {};
    opts.stroke = opts.stroke || 'black';
    opts.fill = opts.fill || 'none';
    line = document.createElementNS("http://www.w3.org/2000/svg", 'polyline');
    line.style.stroke = opts.stroke;
    line.style.fill = opts.fill;
    line.setAttribute("points", points);
    area.appendChild(line);
    return line;
  };

  lib.make_text = function (area, x, y, str, opts) {
    var text_elem, text_node;
    x = x || 0;
    y = y || 0;
    str = str || "";
    opts = opts || {};

    text_elem = document.createElementNS("http://www.w3.org/2000/svg", 'text');
    text_elem.setAttributeNS(null, "x", x);
    text_elem.setAttributeNS(null, "y", y);
    Object.keys(opts).forEach(function (prop) {
      text_elem.setAttributeNS(null, prop, opts[prop]);
    })
    text_node = document.createTextNode(str);
    text_elem.appendChild(text_node);
    area.appendChild(text_elem);
    return text_elem;
  }

  lib.svg_plot = function (area, signals, opts) {
    var c, i, k, lines, xscale, yscale, yoffset, xleft, xright, w, h;

    function init() {
      c = lib.$(area);
      lines = {};

      opts = opts || {};
      opts.xrange = opts.xrange || 1800;
      opts.yrange = opts.yrange || 300;

      xleft = opts.xleft || 30;
      xright = opts.xright || 60;

      w = c.getBoundingClientRect().width;
      h = c.getBoundingClientRect().height;
      xscale = (w - (xleft + xright)) / opts.xrange;
      yscale = -h / opts.yrange;
      yoffset = h / 2;


      for (k in signals) {
        if (signals.hasOwnProperty(k)) {
          lines[k] = lib.make_polyline(c, [], {
            stroke: signals[k].color
          });
        }
      }

      // draw axes
      var grl = {
        stroke: 'gray'
      };
      lib.make_polyline(c, [xleft, yoffset, w - xright, yoffset], grl);
      lib.make_polyline(c, [xleft, 0, xleft, h], grl);

      if (opts.ticks) {
        grl = {
          'text-anchor': 'end',
          'font-size': 10
        }
        var tc = (h - 10) / (opts.ticks.length - 1);
        opts.ticks.forEach(function (tick, i) {
          lib.make_text(c, xleft - 5, -2 + h - tc * i, tick, grl);
        });
      }

      Object.keys(signals).forEach(function (k, i) {
        lib.make_text(c, w - xright, 15 + i * 15, k, {
          'font-size': 11,
          'fill': signals[k].color
        })
      });

    }

    function to_line(s, y, x) {
      return s + (xleft + x * xscale) + "," + (yoffset + y * yscale) + " ";
    }

    function new_plot(signals) {
      // console.log(lines);
      var k;
      for (k in signals) {
        if (signals.hasOwnProperty(k)) {
          lines[k].setAttribute("points", signals[k].data.reduce(to_line, ""));
        }
      }
    }

    init();
    new_plot(signals);

    return {
      new_plot: new_plot
    };

  };

  lib.Plot = function (plot_area, signals) {
    var plot, lines, svgElement;

    plot = Snap(plot_area);
    svgElement = plot.node;

    // Ensure the SVG has a viewBox set for consistent coordinate system
    if (!svgElement.hasAttribute('viewBox')) {
      var width = svgElement.getAttribute('width') || svgElement.style.width || '500px';
      var height = svgElement.getAttribute('height') || svgElement.style.height || '100px';
      width = parseInt(width, 10);
      height = parseInt(height, 10);
      svgElement.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    }

    lines = [];

    function draw_axes() {
      var s, i, lbls;

      i = 0;
      plot.line(20, 50, 420, 50).attr('stroke', 'gray');
      plot.line(20, 0, 20, 100).attr('stroke', 'gray');

      lbls = {
        'font-size': 9
      };

      plot.text(410, 62, "t").attr(lbls);
      plot.text(-2, 100, '-200').attr(lbls);
      plot.text(-2, 75, '-100').attr(lbls);
      plot.text(9, 52, '0').attr(lbls);
      plot.text(2, 28, '100').attr(lbls);
      plot.text(2, 7, '200').attr(lbls);

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
      if (arr.length === 0) {
        return "M20,50";
      }

      var i = 0,
        iscale = 400 / arr.length,
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

  };

  // root mean square distance from zero
  lib.rms0 = function (x) {
    var len = x.length,
      sum = x.reduce(function (s, el) {
        return s + el * el;
      }, 0);
    return Math.sqrt(sum / len);
  }

  // root mean square distance as percent of range
  lib.rmse = function (x, range) {
    var
      rms = lib.rms0(x),
      rmse = (rms / range) * 100;
    return rmse.toFixed(3) + "%";
  }



  global.lib = lib;


}(window));



Snap.plugin(function (Snap, Element, Paper, global) {
  Element.prototype.circ = function (x, y, r) {
    return this.circle(x, y, r).attr({
      'stroke': '#000',
      'fill': 'none'
    })
  }

  Element.prototype.drag_number = function (p) {
    p = p || {};
    p.obj = p.obj || {};
    p.name = p.name || 'nn';
    p.prev_value = p.value;
    p.min = p.min || 0;
    p.max = p.max || 10;
    p.step = p.step || 0.1;
    p.x = p.x || 10;
    p.y = p.y || 10;
    p.fixed_digits = p.fixed_digits || 2;
    p["font-size"] = p["font-size"] || 13;
    p.onchange = p.onchange || function () {};
    p.value = p.value || 0;

    p.number = this.text(p.x, p.y, p.value.toFixed(p.fixed_digits)).attr({
      'text-anchor': 'end',
      cursor: 'col-resize',
      'font-size': p["font-size"]
    });

    function lim(num) {
      return num > p.max ? p.max :
        (num < p.min) ? p.min : num;
    };

    function sq(x, y) {
      //var pov = Math.pow(10, -(x / 100));
      //console.log('pov', pov);
      //return -0.1 * y * pov;
      //return Math.sign(x) * Math.floor(0.01 * x * x) * p.step;
      return Math.floor(0.1 * x) * p.step;
    }

    function move(dx, dy) {
      p.value = lim(Number(p.prev_value) + sq(dx, dy));
      if (p.value !== p.obj[p.name]) {
        p.number.attr('text', p.value.toFixed(p.fixed_digits));
        p.obj[p.name] = p.value;
        //console.log(p.obj[p.name], p.value, (p.obj[p.name] !== p.value));
        p.onchange();
      }
    }

    function start_move(x, y, e) {
      e.stopPropagation();
      p.prev_value = p.value;
    }


    p.number.drag(move, start_move);

    p.update = function (new_value) {
      p.value = lim(new_value);
      p.obj[p.name] = p.value;
      p.number.attr('text', p.value.toFixed(p.fixed_digits));
    }

    return p;
  }

  Element.prototype.wire_line = function (opts) {
    var l,
      o = {};
    o.points = opts.points || [0, 0];
    o.stroke = opts.stroke || 'black';
    o.fill = opts.fill || 'none';

    o.left = function (x, y) {
      return this.polyline(x + 10, y + 4, x, y, x + 10, y - 4);
    };
    o.up = function (x, y) {
      return this.polyline(x - 4, y + 10, x, y, x + 4, y + 10);
    };
    o.right = function (x, y) {
      return this.polyline(x - 10, y - 4, x, y, x - 10, y + 4);
    };
    o.down = function (x, y) {
      return this.polyline(x - 4, y - 10, x, y, x + 4, y - 10);
    };

    o.line = this.polyline(o.points).attr({
      stroke: o.stroke,
      fill: o.fill
    });

    l = o.points.length;
    if (opts.arrow !== undefined) o.arrow = o[opts.arrow](o.points[l - 2], o.points[l - 1]);

    return o;
  }

  // show a name of the signal and its value below the name
  Element.prototype.signal_meter = function (opts) {
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
    s.text = this.text(s.x, s.y, s.name).attr(o);
    o["text-anchor"] = 'end';
    s.number = this.text(s.x + 20, s.y + 20, "0.00").attr(o);

    s.update = function (x) {
      //  console.log(s.name, x);
      s.number.attr('text', x.toFixed(2));
    }

    return s;
  }

});
