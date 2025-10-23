// Licence: MIT

/* uses:

snap.svg.js - a vector graphics library, www.snapsvg.io
lib.js      - helper functions for drawing plots, generating disturbances and similar
stat.js     - some basic statistics

All can be found in the /js/ folder
*/



/*

The code is divided into sections represening each step of
the tutorial separately. HTML page contains draw areas, plot areas, buttons and other elements refered to in javascript code.

*/

// STEP C: Measuring action
(function StepC() {
  "use strict";

  var handle, handle_indicator, p;

  p = Snap("#C-screen");
  p.attr("cursor", "crosshair");
  p.mousemove(function (ev, x, y) {
    handle.value = -200 + x - p.node.getBoundingClientRect().left;
    handle.oninput();
  });

  handle = lib.$("C-handle-slider");
  handle_indicator = lib.$('C-handle-pos-indicator');

  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 1);

  handle.oninput = function () {
    handle_indicator.innerHTML = +handle.value;
  };
}());


// STEP D: Effect of handle on cursor
(function StepD() {
  "use strict";

  var p, cursor, handle, handle_ind, cursor_ind;

  p = Snap("#D-screen");
  p.attr("cursor", "crosshair");
  p.mousemove(function (ev, x, y) {
    handle.value = -200 + x - p.node.getBoundingClientRect().left;
    handle.oninput();
  });

  cursor = p.rect(200, 20, 1.5, 30);

  handle = lib.$('D-handle-slider');
  handle_ind = lib.$('D-handle-indicator');
  cursor_ind = lib.$('D-cursor-indicator');


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
  "use strict";

  var p, cursor, handle, handle_ind, cursor_ind, dist_ind,
    start_button, disturbance, requestAnimFrame, running, c, h, d, counter;

  p = Snap("#E-screen");
  p.attr("cursor", "crosshair");
  p.mousemove(function (ev, x, y) {
    handle.value = -200 + x - p.node.getBoundingClientRect().left;
    handle.oninput();
  });

  cursor = p.rect(200, 20, 2, 30);

  handle = lib.$('E-handle-slider');
  handle_ind = lib.$('E-handle-indicator');
  cursor_ind = lib.$('E-cursor-indicator');
  dist_ind = lib.$('E-dist-indicator');
  start_button = lib.$('E-start');

  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 1);

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
        disturbance = lib.make_disturbance(3, 200);
        running = true;
        start_button.setAttribute("value", "Stop disturbance");
        animate();
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
      lib.request_anim_frame(animate);
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
  "use strict";
  var p, signals, cursor, start_button, handle, corr_ch, corr_hd, disturbance, running, c, h, d, counter, plot;

  p = Snap("#F-screen");
  p.attr("cursor", "crosshair");

  signals = lib.make_signals();
  signals.add('c', 'cursor', 'black');
  signals.add('h', 'handle', 'green');
  signals.add('d', 'disturbance', 'red');

  plot = lib.Plot("#F-plot", signals);


  cursor = p.rect(200, 20, 1, 30);
  p.polygon(197, 70, 200, 55, 203, 70);
  p.polygon(197, 0, 200, 15, 203, 0);

  start_button = lib.$("F-start");
  handle = lib.$('F-handle-slider');
  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 0.1);

  corr_ch = lib.$("F-corr-cursor-handle");
  corr_hd = lib.$("F-corr-handle-disturbance");

  running = false;

  h = 0, c = 0, d = 0;

  counter = 0;

  p.mousemove(function (ev, x, y) {
    handle.value = -200 + x - p.node.getBoundingClientRect().left;
    if (!running) {
      h = Number(handle.value);
      cursor.attr('x', 200.00 + Number(h));
    }
  });

  start_button.onclick = function () {
    disturbance = lib.make_disturbance(2, 400);
    signals.reset();
    plot.update(signals);
    running = true;
    start_button.disabled = true;
    animate();
  }

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
      lib.request_anim_frame(animate);

    } else {
      counter = 0;
      running = false;
      start_button.disabled = false;
      plot.update(signals);
      corr_ch.innerHTML = stat.pearson(signals.c.data, signals.h.data).toFixed(3);
      corr_hd.innerHTML = stat.pearson(signals.h.data, signals.d.data).toFixed(3);
    }
  }


}());



// Step G: Pursuit tracking
(function StepG() {
  "use strict"
  var cursor, handle, t1, t2, start_button, dist1, dist2, counter, running, corr_ch, corr_hd,
    c = 0,
    h = 0,
    d = 0,
    t = 0,
    p = Snap("#G-screen"),
    signals = lib.make_signals(),
    plot = lib.Plot("#G-plot", signals)

  p.attr("cursor", "crosshair");
  p.mousemove(function (ev, x, y) {
    handle.value = -200 + x - p.node.getBoundingClientRect().left;
    if (!running) {
      h = Number(handle.value);
      cursor.attr('x', 200.00 + h);
    }
  });

  signals.add('c', 'C-T distance', 'black');
  signals.add('h', 'handle', 'green');
  signals.add('d', 'd1 - d2', 'red');


  cursor = p.rect(200, 20, 1, 30);
  t1 = p.polygon(197, 70, 200, 55, 203, 70);
  t2 = p.polygon(197, 0, 200, 15, 203, 0);

  start_button = lib.$("G-start");
  handle = lib.$('G-handle-slider');
  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 0.1);

  corr_ch = lib.$("G-corr-hc");
  corr_hd = lib.$("G-corr-hd");
  running = false;

  counter = 0;


  start_button.onclick = function () {
    dist1 = lib.make_disturbance(2, 200);
    dist2 = lib.make_disturbance(2, 200);
    signals.reset();

    plot.update(signals);
    running = true;
    start_button.disabled = true;
    animate();
  }

  function animate() {
    if (running && counter < 2100) {
      t = dist1.next();
      d = dist2.next();
      h = Number(handle.value);
      c = h + d;

      cursor.attr('x', 200.00 + Number(c));
      t1.transform("t" + t + ",0");
      t2.transform("t" + t + ",0");


      if (counter > 300) {
        signals.c.data.push(c - t);
        signals.h.data.push(h);
        signals.d.data.push(d - t);
      }

      counter++;
      lib.request_anim_frame(animate);
    } else {
      counter = 0;
      running = false;
      start_button.disabled = false;
      plot.update(signals);
      corr_ch.innerHTML = stat.pearson(signals.c.data, signals.h.data).toFixed(3);
      corr_hd.innerHTML = stat.pearson(signals.h.data, signals.d.data).toFixed(3);
    }
  }



}());



// Step H: Beyond tracking
(function StepH() {
  "use strict";

  var c = 0,
    h = 0,
    d = 0;

  var p = Snap("#H-screen");
  p.attr("cursor", "crosshair");
  p.mousemove(function (ev, x, y) {
    handle.value = -200 + x - p.node.getBoundingClientRect().left;
  });

  var signals = new lib.make_signals();
  signals.add('c', 'controlled var', 'black');
  signals.add('h', 'handle', 'green');
  signals.add('d', 'disturbance', 'red');


  var plot = lib.Plot("#H-plot", signals);
  var handle = lib.$('H-handle-slider');
  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 0.1);

  var corr_ch = lib.$("H-corr-hc");
  var corr_hd = lib.$("H-corr-hd");

  var start_button = lib.$("H-start-button");
  var play_reference_button = lib.$("H-play-reference");

  var dist;
  var selected_demo;
  var running = false;
  var counter = 0;

  var buttons = [
    "H-rel-size-start",
    "H-orient-start",
    "H-shape-start",
    "H-pitch-start",
    "H-numbers-start"];

  function set_buttons_disabled(value) {
    buttons.forEach(function (b) {
      lib.$(b).disabled = value;
    });
  }

  var rel_size = (function () {
    var circle, square;

    return {
      instructions: "Keep rectangle the same size as circle",

      setup: function () {
        circle = p.circle(100, 75, 35);
        circle.attr('fill', 'none');
        circle.attr('stroke', 'black');

        square = p.rect(250, 43, 62, 62);
        square.attr('fill', 'none');
        square.attr('stroke', 'black');
      },
      draw: function (c) {
        var scale = (c + 400) * 2 / 800;
        if (scale < 0) scale = 0;
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

      draw: function (c) {
        o.attr("d", p1 + "L" + (200 + c) + ", 20" + p2);
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

      draw: function (c) {
        var x = -0.6 * c;
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
      instructions: "Maintain this pitch of the sound (440Hz)",

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


  var numbers = (function () {
    var num, val;
    return {
      instructions: "Keep the displayed number at 50",
      setup: function () {
        val = 50;
        num = p.text(180, 75, val);
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
    dist = lib.make_disturbance(2, 400);
    signals.reset();
    plot.update(signals);
    counter = 0;
  }

  function animate(demo) {
    if (running && counter < 2100) {
      d = dist.next();
      h = Number(handle.value);
      c = h + d;

      demo.draw(c);

      if (counter > 300) {
        signals.c.data.push(c);
        signals.h.data.push(h);
        signals.d.data.push(d);
      }

      counter++;

      lib.request_anim_frame(function () {
        animate(demo)
      });

    } else if (counter === 2100) {
      running = false;
      start_button.value = "Start";
      set_buttons_disabled(false);
      demo.clear();
      demo.setup();
      plot.update(signals);
      corr_ch.innerHTML = stat.pearson(signals.c.data, signals.h.data).toFixed(3);
      corr_hd.innerHTML = stat.pearson(signals.h.data, signals.d.data).toFixed(3);
      play_reference_button.disabled = false;
    }
  }


  function select_new_demo(demo) {
    return function () {
      if (demo != pitch) {
        play_reference_button.style.visibility = "hidden";
      }
      lib.$("H-instructions").innerHTML = demo.instructions;
      selected_demo.clear();
      selected_demo = demo;
      demo.setup();
    };
  }

  lib.$("H-orient-start").onclick = select_new_demo(orient);
  lib.$("H-pitch-start").onclick = select_new_demo(pitch);
  lib.$("H-rel-size-start").onclick = select_new_demo(rel_size);
  lib.$("H-shape-start").onclick = select_new_demo(keep_shape);
  lib.$("H-numbers-start").onclick = select_new_demo(numbers);

  start_button.onclick = function () {
    if (!running) {
      set_buttons_disabled(true);
      start_button.value = "Stop";
      counter = 0;
      running = true;
      reset();
      if (selected_demo == pitch) {
        pitch.start_playing();
        play_reference_button.disabled = true;
      }
      animate(selected_demo);
    } else {
      if (selected_demo == pitch) {
        pitch.stop_playing();
        play_reference_button.disabled = false;
      }
      reset();
      running = false;
      set_buttons_disabled(false);
      selected_demo.clear();
      selected_demo.setup();
      start_button.value = "Start";
    }
  }

  // executes right after loading
  selected_demo = rel_size;
  lib.$("H-instructions").innerHTML = selected_demo.instructions;
  selected_demo.setup();

}());




// Step I: detecting the consequences
(function StepI() {
  var p = Snap("#I-screen");
  p.attr("cursor", "crosshair");

  var signals = lib.make_signals();

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


  var handle = lib.$('I-handle-slider');
  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 0.1);

  var cursor1 = p.rect(200, 30, 1, 22).attr('stroke', s1.c1.color);
  var cursor2 = p.rect(200, 65, 1, 22).attr('stroke', s2.c2.color);
  var cursor3 = p.rect(200, 100, 1, 22).attr('stroke', s3.c3.color);


  p.polygon(197, 5, 200, 20, 203, 5);
  p.polygon(197, 145, 200, 130, 203, 145);

  var dist1, dist2, dist3;


  var running = false;
  var counter = 0;

  var start_button = lib.$("I-start");

  p.mousemove(function (ev, x, y) {
    handle.value = -200 + x - p.node.getBoundingClientRect().left;
    if (!running) {
      h = Number(handle.value);
      cursor1.attr('x', 200.00 + h);
      cursor2.attr('x', 200.00 + h);
      cursor3.attr('x', 200.00 + h);
    }
  });

  start_button.onclick = function () {
    if (!running) {
      dist1 = lib.make_disturbance(3, 200);
      dist2 = lib.make_disturbance(3, 200);
      dist3 = lib.make_disturbance(3, 200);
      signals.reset();
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

  function animate() {

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
      lib.request_anim_frame(animate);
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
    var sol = lib.$("I-controlled-cursor");
    var r = stat.pearson;
    var hn = signals.h.data;
    var c1d = signals.c1.data;
    var c2d = signals.c2.data;
    var c3d = signals.c3.data;
    var d1d = signals.d1.data;
    var d2d = signals.d2.data;
    var d3d = signals.d3.data;

    // Correlations between handle and cursors
    var r1_hc = Math.abs(r(hn, c1d));
    var r2_hc = Math.abs(r(hn, c2d));
    var r3_hc = Math.abs(r(hn, c3d));

    // Correlations between cursors and disturbances
    var r1_cd = Math.abs(r(c1d, d1d));
    var r2_cd = Math.abs(r(c2d, d2d));
    var r3_cd = Math.abs(r(c3d, d3d));

    // Display cursor-disturbance correlations
    lib.$("I-corr-c1d1").innerHTML = r1_cd.toFixed(3);
    lib.$("I-corr-c2d2").innerHTML = r2_cd.toFixed(3);
    lib.$("I-corr-c3d3").innerHTML = r3_cd.toFixed(3);

    // Print correlation values for debugging
    console.log("Correlation values:");
    console.log("Top cursor: handle-cursor = " + r1_hc.toFixed(3) + ", cursor-disturbance = " + r1_cd.toFixed(3));
    console.log("Middle cursor: handle-cursor = " + r2_hc.toFixed(3) + ", cursor-disturbance = " + r2_cd.toFixed(3));
    console.log("Bottom cursor: handle-cursor = " + r3_hc.toFixed(3) + ", cursor-disturbance = " + r3_cd.toFixed(3));

    if (r1_cd < r2_cd && r1_cd < r3_cd) {
      sol.innerHTML = "top cursor (r_h-c=" + r1_hc.toFixed(3) + ", r_c-d=" + r1_cd.toFixed(3) + ")";
      sol.style.color = signals.c1.color;
    } else if (r2_cd < r3_cd && r2_cd < r1_cd) {
      sol.innerHTML = "middle cursor (r_h-c=" + r2_hc.toFixed(3) + ", r_c-d=" + r2_cd.toFixed(3) + ")";
      sol.style.color = signals.c2.color;
    } else if (r3_cd < r2_cd && r3_cd < r1_cd) {
      sol.innerHTML = "bottom cursor (r_h-c=" + r3_hc.toFixed(3) + ", r_c-d=" + r3_cd.toFixed(3) + ")";
      sol.style.color = signals.c3.color;
    }
  }
}());




// Step J: Changing the feedback factor
(function StepJ() {


  var c = 0,
    h = 0,
    d = 0;

  var p = Snap("#J-screen");
  p.attr("cursor", "crosshair");

  var signals = lib.make_signals();
  signals.add('c', 'cursor', 'black');
  signals.add('h', 'handle', 'green');
  signals.add('d', 'disturbance', 'red');

  var plot = lib.Plot("#J-plot", signals);

  var cursor = p.rect(199, 20, 1, 30);
  p.polygon(197, 70, 200, 55, 203, 70);
  p.polygon(197, 0, 200, 15, 203, 0);

  var start_button = lib.$("J-start");
  var handle = lib.$('J-handle-slider');
  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 0.1);

  var feedback_input = lib.$("J-feedback-factor");
  var handle_effect_percent = lib.$("J-handle-effect");
  var Kf = 1;
  var disturbance;
  var running = false;

  var counter = 0;

  feedback_input.onchange = function () {
    var tmp = Number(feedback_input.value) || 100;
    Kf = lib.constrain(tmp, 50, 200);
    feedback_input.value = Kf;
    handle_effect_percent.innerHTML = Kf;
    Kf = Kf / 100;
  }

  p.mousemove(function (ev, x, y) {
    handle.value = -200 + x - p.node.getBoundingClientRect().left;
    if (!running) {
      h = Number(handle.value);
      c = Kf * h + d;
      cursor.attr('x', 200.00 + c);
    }
  });

  start_button.onclick = function () {
    disturbance = lib.make_disturbance(3, 200);
    signals.reset();
    plot.update(signals);
    running = true;
    start_button.disabled = true;
    lib.request_anim_frame(animate);
  }

  function animate() {
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
      lib.request_anim_frame(animate);

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
  p.attr("cursor", "crosshair");

  var signals = lib.make_signals();
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

  var start_button = lib.$("K-start");
  var handle = lib.$('K-handle-slider');
  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 0.1);

  var dist1, dist2;

  var running = false;

  var d1, d2;
  var c, h, d, t;

  var counter = 0;


  p.mousemove(function (ev, x, y) {
    handle.value = -200 + x - p.node.getBoundingClientRect().left;
    if (!running) {
      h = Number(handle.value);
      free_string.attr('x2', 200 + h);
      end_string.attr('x1', 200 + h);
      cursor.attr('x', 200.00 + h);
    }
  });



  start_button.onclick = function () {
    dist1 = lib.make_disturbance(3, 150);
    dist2 = lib.make_disturbance(3, 150);
    signals.reset();

    plot.update(signals);
    running = true;
    start_button.disabled = true;
    animate();
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
      lib.request_anim_frame(animate);
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


  var p = Snap("#L-screen");
  p.attr("cursor", "none");

  var signals = lib.make_signals();
  signals.add('c', 'cursor', 'black');
  signals.add('h', 'handle', 'green');
  signals.add('d', 'disturbance', 'red');

  var plot = lib.Plot("#L-plot", signals);

  var cursor = p.rect(200, 20, 1, 30);
  p.polygon(197, 70, 200, 55, 203, 70);
  p.polygon(197, 0, 200, 15, 203, 0);

  var handle = lib.$('L-handle-slider');
  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 0.1);

  var selected_ff = lib.$("L-radio-ff");
  var selected_fb = lib.$("L-radio-fb");

  var start_btn = lib.$("L-start");
  var corr_ch_ff = lib.$("L-corr-cursor-handle-ff");
  var corr_hd_ff = lib.$("L-corr-handle-disturbance-ff");

  var corr_ch_fb = lib.$("L-corr-cursor-handle-fb");
  var corr_hd_fb = lib.$("L-corr-handle-disturbance-fb");

  var disturbance = lib.make_disturbance(3, 400);
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
    return (Math.sqrt(sum));
  }

  var ff = {
    instructions: 'The "cursor" is now really the disturbance. Move the handle as much as necessary, and in the right direction, to counteract the effect of the disturbance on the invisible cursor position.',
    draw: function (c, h, d) {
      cursor.attr('x', 200.00 + d);
    },
    calc: function () {
      lib.$("L-rms-ff").innerHTML = rms(signals.c.data).toFixed(2);
      corr_ch_ff.innerHTML = stat.pearson(signals.c.data, signals.h.data).toFixed(2);
      corr_hd_ff.innerHTML = stat.pearson(signals.h.data, signals.d.data).toFixed(2);
    }
  }

  var fb = {
    instructions: 'The cursor is now the real cursor. This is just like the previous compensatory tracking experiment. Keep the cursor between the stationary target lines. This step is giving you information you use in the feedforward experimental runs.',
    draw: function (c, h, d) {
      cursor.attr('x', 200.00 + c);
    },
    calc: function () {
      lib.$("L-rms-fb").innerHTML = rms(signals.c.data).toFixed(2);
      corr_ch_fb.innerHTML = stat.pearson(signals.c.data, signals.h.data).toFixed(2);
      corr_hd_fb.innerHTML = stat.pearson(signals.h.data, signals.d.data).toFixed(2);
    }
  }

  var selected = fb;
  lib.$("L-instructions").innerHTML = fb.instructions;

  selected_ff.onclick = function () {
    selected = ff;
    lib.$("L-instructions").innerHTML = ff.instructions;
  }

  selected_fb.onclick = function () {
    selected = fb;
    lib.$("L-instructions").innerHTML = fb.instructions;
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

  p.mousemove(function (ev, x, y) {
    handle.value = -200 + x - p.node.getBoundingClientRect().left;
    h = Number(handle.value);
    if (!running) {
      c = h + d;
      selected.draw(c, h, d);
    }
  });


  var animate = function () {
    if (running && counter < 2100) {
      d = disturbance.next();
      c = h + d;
      selected.draw(c, h, d);

      if (counter > 300) {
        signals.c.data.push(c);
        signals.h.data.push(h);
        signals.d.data.push(d);
      }

      counter++;
      lib.request_anim_frame(animate);
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
