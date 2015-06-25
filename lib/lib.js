/*jshint proto: true*/
var lib = (function () {
  "use strict";
  var f = {};

  f.setAttr = function (obj, attrs) {
    var attr;
    for (attr in attrs) {
      if (attrs.hasOwnProperty(attr)) {
        obj.setAttribute(attr, attrs[attr]);
      }
    }
  }

  f.requestAnimFrame = function () {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      function (callback) {
        window.setTimeout(callback, 1000 / 60);
      };
  }

  f.svgNamespaceURI = "http://www.w3.org/2000/svg";
  f.make_svg = function (e) {
    return document.createElementNS(f.svgNamespaceURI, e);
  }

  f.make_svg_plot = function make_svg_plot(options) {
    var c, i, k, lines, frame, streams;

    frame = f.make_svg('svg');
    frame.style.width = '600px';
    frame.style.height = '100px';
    //frame.style.border = 'solid 1px';

    streams = options;

    lines = [];
    for (k in options) {
      lines[k] = f.make_svg('polyline');
      lines[k].style.stroke = options[k].color;
      lines[k].style.fill = 'none';
      frame.appendChild(lines[k]);
    }

    function to_line(arr, scale, offset) {
      var i = 0,
        l = arr.length,
        s = "",
        xoff = (l < 600) ? 600 - l : 0;

      for (; i < l; i += 1) {
        s += "" + (xoff + i) + "," + (offset + arr[i] * scale) + " ";
      }
      return s;
    }

    function new_plot(data) {
      for (k in data) {
        lines[k].setAttribute("points", to_line(data[k], 1, 50));
      }
    }

    function update(streams) {
      for (k in streams)
        lines[k].setAttribute("points", to_line(streams[k].data, -0.1, 50));
    }

    return {
      update: update,
      frame: frame
    }
  }

  f.svg_plot = function svg_plot(plot_area, data, clrs) {
    var c, i, k, elem = [];

    c = document.getElementById(plot_area);
    c.style.border = 'solid 1px';
    c.style.width = '600px';
    clrs = clrs || ['blue', 'red', 'green', 'purple', 'black'];

    i = 0;
    for (k in data) {
      elem[k] = document.createElementNS("http://www.w3.org/2000/svg", 'polyline');
      elem[k].style.stroke = clrs[i += 1];
      elem[k].style.fill = "none";
      c.appendChild(elem[k]);
      // clrs
    }

    function to_line(arr, scale, offset) {
      var i = 0,
        l = arr.length,
        s = "";
      for (; i < l; i += 1) {
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

  f.canvas_plot = function canvas_plot(prop) {
    var canvas, ctx, width, zero, xScale, yScale, h;
    yScale = prop.yScale;
    canvas = document.getElementById(prop.canvas);

    ctx = canvas.getContext('2d');
    width = canvas.width;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    zero = canvas.height / 2;

    //data = prop.scaleToFit ? scaleToRange(prop.data, -h, h) : prop.data;
    var clr = ["#ff0000", "#6a6a6a", "#0afa0a", "#000000"];

    function draw_single(d, color) {
      var k;
      xScale = (d.length) / width;
      ctx.strokeStyle = color;
      //ctx.lineWidth = 2;
      ctx.moveTo(0, d[0]);
      ctx.beginPath();
      ctx.translate(0.5, 0.5);
      for (k = 0; k < width; k++) {
        //ctx.strokeRect(k, zero, 1, yScale * data[Math.floor(k * xScale)]);
        ctx.lineTo(k, zero - Math.floor(yScale * d[Math.floor(k * xScale)]));
      }
      ctx.stroke();
    }

    if (typeof prop.data[0] === 'number') {
      draw_single(prop.data);
    } else {
      for (var t = 0; t < prop.data.length; t++) {
        draw_single(prop.data[t], clr[t]);
      }
    }
  }

  f.make_big_slider = function make_big_slider(object, variable_name, options) {
    // defaults
    options = options || {};
    this.min = options.min || 0;
    this.max = options.max || 100;
    this.step = options.step || 1;
    this.x = (options.x || 0) + 'px';
    this.y = (options.y || 0) + 'px';
    this.width = (options.width || 130) + 'px';
    this.init = options.init || this.min;

    options.oninput = options.oninput || function () {};

    var slider = document.createElement('input');
    slider.setAttribute('type', 'range');
    slider.setAttribute('min', this.min);
    slider.setAttribute('max', this.max);
    slider.setAttribute('step', this.step);
    slider.style.left = this.x;
    slider.style.top = this.y;
    slider.style.width = this.width;
    slider.setAttribute('value', object[variable_name]);
    slider.style.webkitSliderThumb = '';
    slider.oninput = function () {
      object[variable_name] = +slider.value;
      options.oninput();
    }

    return slider;
  }

  // returns a slider connected to a variable in an object
  f.make_slider = function make_slider(object, variable_name, options) {
    // defaults
    options = options || {};
    this.min = options.min || 0;
    this.max = options.max || 100;
    this.step = options.step || 1;
    this.text = options.text || variable_name || "";
    this.x = (options.x || 0) + 'px';
    this.y = (options.y || 0) + 'px';
    this.width = options.frame_width || 250 + 'px';
    this.init = options.init || this.min;
    this.tooltip = options.tooltip || undefined;

    options.oninput = options.oninput || function () {};

    var out_frame = document.createElement('div');
    out_frame.style.position = 'absolute';
    out_frame.style.width = this.frame_width;
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

  // stat.js groups some statistics functions used in LCSIII
  //
  //

  f.stat = (function () {

    var min = function (data) {
      return Math.min.apply(null, data);
    };

    var max = function (data) {
      return Math.max.apply(null, data);
    };

    var sum = function (data) {
      var s = 0,
        len = data.length,
        i;
      for (i = 0; i < len; i++) {
        s += data[i];
      }
      return s;
    };

    var mean = function (data) {
      var len = data.length;
      return sum(data) / len;
    };

    var covariance = function (data1, data2) {
      var len = data1.length,
        u = mean(data1),
        v = mean(data2),
        sum_dev = 0,
        i;
      for (i = 0; i < len; i++) {
        sum_dev += (data1[i] - u) * (data2[i] - v);
      }
      return (sum_dev / (len - 1));
    };

    var s_sum = function (data) {
      var len = data.length,
        md = mean(data),
        sum_sq = 0,
        tmp,
        i;
      for (i = 0; i < len; i++) {
        tmp = data[i] - md;
        sum_sq += tmp * tmp;
      }
      return sum_sq;
    };


    var stdev = function (data) {
      var len = data.length,
        variance = s_sum(data) / (len - 1);
      return (Math.sqrt(variance));
    };

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
      for (i = 0; i < len; i++) {
        adif = a[i] - ma;
        bdif = b[i] - mb;
        diffprod += adif * bdif;
        adif_sq += adif * adif;
        bdif_sq += bdif * bdif;
      }
      return diffprod / Math.sqrt(adif_sq * bdif_sq);
    }

    var sum_squares = function (data) {
      var len = data.length,
        sum_sq = 0,
        i;
      for (i = 0; i < len; i++) {
        sum_sq += data[i] * data[i];
      }
      return sum_sq;
    };

    var sum_products = function (data1, data2) {
      var len = data1.length,
        sum_p = 0,
        i;
      for (i = 0; i < len; i++) {
        sum_p += data1[i] * data2[i];
      }
      return sum_p;
    };

    var cross_corr = function (data1, data2) {
      var corr = sum_products(data1, data2),
        norm = Math.sqrt(sum_squares(data1) * sum_squares(data2));
      return corr / norm;
    };

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




  function constrain(x, min, max) {
    return (x < min) ? min : (x > max) ? max : x;
  }


  // returns an random disturbance creator object of selected difficulty (range 0 -1)
  // and selected amplitude (diff from lowest to highest, approximately), centered at zero.
  // very approximate, though

  f.make_dist = function make_dist(dif, amp) {
    var d1 = 0,
      d2 = 0,
      d3 = 0,
      k = amp * 800 * dif,
      high = amp / 2,
      low = -high,
      s = dif;
    return {
      next: function () {
        d1 += (k * (Math.random() - 0.5) - d1) * s;
        d2 += (d1 - d2) * s;
        d2 = constrain(d2, low, high);
        d3 += (d2 - d3) * s;
        return d3;
      }
    };
  }


  // multiply all items with k and return the new array
  function scale(data, k) {
    var new_data = [],
      len = data.length,
      i;
    for (i = 0; i < len; i++) {
      new_data.push(data[i] * k);
    }
    return new_data;
  }

  // scale and offset any array to fit range [low, high]
  function scaleToRange(data, low, high) {
    var new_data = [],
      min_val = stat.min(data),
      max_val = stat.max(data),
      target_range = high - low,
      data_range = max_val - min_val,
      k = target_range / data_range,
      len = data.length,
      i;
    for (i = 0; i < len; i++) {
      new_data[i] = low + k * (data[i] - min_val);
    }
    return new_data;
  }


  return f;
})();
