var params = {
  dt: 0.016667, // seconds
  duration: 16, // seconds
  S: 10,
  delay: 0,
  Kf: 1,
  Ki: 1,
  Ko: 10,
  dist: {
    f: 0.1,
    amp: 10
  },
  ref: {
    f: 0.1,
    amp: 10
  }
};

// min, max, step
var mms = {
  S: [1, 100, 0.5],
  delay: [0, 10, 1],
  Kf: [-10, 10, 0.1],
  Ki: [-10, 10, 0.1],
  Ko: [-300, 300, 1],
  f: [0, 10, 0.001],
  amp: [0, 20, 0.3]
};

var show_on_plot = {
  p: true,
  e: false,
  qo: false,
  qi: false,
  qf: false,
  r: false,
  d: false
};


function signalGenerator(p, x, y, name) {

  var offset = 25.0;
  var freq = params[name].f;
  var amp = params[name].amp;

  var minf = mms.f[0];
  var maxf = mms.f[1];
  var stepf = mms.f[2];

  var mina = mms.amp[0];
  var maxa = mms.amp[1];
  var stepa = mms.amp[2];


  function limf(num) {
    return num > maxf ? maxf :
      (num < minf) ? minf : num;
  }

  function lima(num) {
    return num > maxa ? maxa :
      (num < mina) ? mina : num;
  }


  function toline(x, y, o, f, a) {
    var ls = "M";
    for (var i = 0; i < 149; i++) {
      ls += (" " + (x + i) + ',' + (y + o + a * Math.sign(Math.sin(f * i))));
    }
    ls += (" " + (x + 150) + ',' + (y + o));
    return ls;
  }

  function move(dx, dy, posx, posy) {
    this.nf = limf(this.freq - dx * stepf);
    this.na = lima(this.amp - dy * stepa);
    np.attr('d', toline(x, y, offset, this.nf, this.na));
    params[name].f = this.nf;
    params[name].amp = this.na;
    run_model(params);
  }

  p.rect(x, y, 150, 2 * offset, 3, 3);

  var np = p.path(toline(x, y, offset, freq, amp)).attr({
    'stroke': '#a00',
    fill: '#f00'
  });

  var drg = p.rect(x, y, 150, 2 * offset, 3, 3).attr({
    'fill-opacity': 0,
    stroke: '#bbb'
  });

  drg.freq = freq;
  drg.amp = amp;

  drg.drag(move,
    function () {},

    function () {
      this.freq = this.nf;
      this.amp = this.na;
    }
  );
}



function dnum(p, x, y, name) {

  var t1 = p.text(x, y, params[name].toFixed(2));
  t1.attr({
    'cursor': 'col-resize',
    'font-size': 12
  })


  var min = mms[name][0];
  var max = mms[name][1];
  var step = mms[name][2];

  function lim(num) {
    return num > max ? max :
      (num < min) ? min : num;
  }

  function sq(x) {
    return Math.floor(0.1 * x) * step;
  }

  function move(dx, dy, posx, posy) {
    var t = this.strt;
    this.attr({
      'text': lim((Number(t) + sq(dx))).toFixed(2)
    });
    params[name] = Number(this.attr('text'));
    run_model(params);
  }

  t1.drag(move,
    function () {
      t1.strt = t1.node.innerHTML;
    }
  );

  return t1;
}


function signals() {
  return {
    p: [],
    r: [],
    e: [],
    qo: [],
    qf: [],
    d: [],
    qi: []
  };
}

function run_model(p) {
  var s = signals();
  //console.log(s);

  function delfun(tau) {
    var t = Math.floor(tau);
    return t > 0 ? t : 0;
  }

  function lim(x) {
    return x > 1000 ? 1000 :
      (x < -1000) ? -1000 : x;
  }
  s.qo[0] = 0;

  for (var i = 0; i < (p.duration / p.dt); i += 1) {
    s.d[i] = p.dist.amp * Math.sign(Math.sin(p.dist.f * i));
    s.qf[i] = p.Kf * s.qo[i];
    s.qi[i] = s.qf[i] + s.d[i];
    s.p[i] = p.Ki * s.qi[delfun(i - p.delay)];
    s.r[i] = p.ref.amp * Math.sign(Math.sin(p.ref.f * i));
    s.e[i] = s.r[i] - s.p[i];
    s.qo[i + 1] = lim(s.qo[i] + (s.e[i] * p.Ko - s.qo[i]) / p.S);
  }

  //console.log(s);
  plot.new_plot(s);

};


var plot;

function svg_plot(plot_area, data, clrs) {
  var c, i, k, elem = [];

  c = document.getElementById(plot_area);
  c.style.border = 'solid 1px';
  //c.style.width = '600px';
  clrs = clrs || ['blue', 'red', 'green', 'purple', 'black', 'yellow', 'magenta'];

  i = 0;
  for (k in data) {
    elem[k] = document.createElementNS("http://www.w3.org/2000/svg", 'polyline');
    elem[k].style.stroke = clrs[i += 1];
    elem[k].style.fill = "none";
    c.appendChild(elem[k]);
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
      if (show_on_plot[k]) {
        elem[k].setAttribute("points", to_line(data[k], -1, 50));
      } else {
        elem[k].setAttribute("points", "");
      }

    }

  }

  new_plot(data);
  return {
    new_plot: new_plot
  }

}


window.onload = function () {
  var p = Snap("#container");
  var s = signals();
  plot = svg_plot("plot", s);
  run_model(params);


  var dfqi = p.polygon(180, 200, 180, 240, 150, 220);
  var delayBox = p.rect(80, 140, 20, 38, 3, 3);
  var comparator = p.polygon(220, 100, 220, 140, 250, 120);
  var outMult = p.circle(350, 160, 12);
  var outSlow = p.rect(335, 172, 30, 30, 3, 3);
  var feedMult = p.circle(240, 220, 12);
  var ingain = p.circle(90, 190, 12);
  var refGen = signalGenerator(p, 140, 30, 'ref');
  var distGen = signalGenerator(p, 140, 280, 'dist');


  var rname = p.text(220, 95, "r");
  var ename = p.text(290, 115, "e");
  var qoname = p.text(300, 233, "qo");
  var dname = p.text(215, 265, "d");
  var fname = p.text(200, 212, "f");
  var qiname = p.text(100, 233, "qi");
  var pname = p.text(130, 115, "p");

  [rname, ename, qoname, dname, fname, qiname, pname].forEach(function (name) {
    name.attr({
      'font-size': 15,
      'font-family': 'serif',
      'font-weight': 'bold'
    })
  });

  p.text(171, 218, '+').attr({
    'font-size': 9,
    stroke: "#fff"
  })
  p.text(171, 230, '+').attr({
    'font-size': 9,
    stroke: "#fff"
  })

  p.text(223, 114, '+').attr({
    'font-size': 8,
    stroke: "#fff"
  })
  p.text(223, 126, '-').attr({
    'font-size': 9,
    stroke: "#fff"
  })


  p.text(366, 164, "Ko:").attr("font-size", 12);
  p.text(370, 192, "S:").attr("font-size", 12);
  p.text(220, 200, "Kf:").attr("font-size", 12);
  p.text(105, 195, "Ki:").attr("font-size", 12);
  p.text(105, 165, "td:").attr("font-size", 12);

  dnum(p, 386, 164, "Ko");
  dnum(p, 385, 192, "S");
  dnum(p, 240, 200, "Kf");
  dnum(p, 125, 195, "Ki");
  dnum(p, 125, 165, "delay");


  var sig_r = p.path("M210,80 Q210,120 220,115");
  var sig_e = p.path("M220,122 Q350,110 350,149");
  var sig_qo = p.path("M350,200 Q350,220 250,220");
  var sig4 = p.path("M235,220 180,220");
  var sig5 = p.path("M155,220 Q90,220 90,202");
  var sig_p = p.path("M90,140 Q90,120 220,120");
  var sig_d = p.path("M210,280 Q210,230 180,225");

  [sig_r, sig_e, sig_qo, sig4, sig5, sig_p, sig_d].forEach(function (sig) {
    sig.attr({
      fill: 'none',
      stroke: "#000",
      'stroke-width': 3
    })
  });


}
