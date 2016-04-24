// lib

(function (global) {

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


    // two modes: (1) precalculated disturbance with exact length and range, returns an array
    //            (2) continuous random disturbance inside a given range (approximately), returns a function
    // if given data_length, returns an array, if not, returns a continuous function

    make_disturbance: function (difficulty, range, data_length) {

      // Disturbance array generation algorithm from TrackAnalyze (LCSIII)
      var dif_table = [2.2 / 8, 2.2 / 16, 2.2 / 22.6, 2.2 / 32, 2.2 / 45.55, 2.2 / 64];

      function new_disturbance_array(difficulty, range, data_length) {
        var dslow = dif_table[difficulty - 1],
          i, n, phase, amplitude,
          temp, data = [];

        // zero the array
        for (i = 0; i < data_length; i += 1) {
          data.push(0);
        }

        // add waves of different frequency with random phase
        for (n = 1; n < 120; n++) {
          phase = 2 * Math.PI * Math.random();
          amplitude = Math.exp(-0.7 * dslow * n);
          temp = 2 * Math.PI * n / data_length;
          for (i = 0; i < data_length; i++) {
            data[i] += amplitude * Math.cos(temp * i + phase);
          }
        }
        data = scale_to_range(data, -range / 2, range / 2);

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
            d2 = constrain(d2, low, high);
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
        if (arr.length === 0) return "M20,50";

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

    }
  };

  global.lib = obj;

}(window));
