// Demo1 from LCSIII, Choose Control
// Original Delphi code by W.T. Powers and B.B. Abbott (2008)

// JavaScript version by A. Matic (2016)
// Licence: MIT



// a draggable number with some differences from the 'parameter' element (positioning of numbers)
// todo: move to lib
function eq_parameter(snap_scr, opts) {
  var p = {};
  p.color = opts.color || 'black';
  p.name = opts.name || 'NN';
  p.value = opts.value || 0;
  p.prev_value = p.value;
  p.min = opts.min || 0;
  p.max = opts.max || 10;
  p.step = opts.step || 0.1;
  p.x = opts.x || 10;
  p.y = opts.y || 10;
  p.onchange = opts.onchange || function () {};

  var o = {
    'fill': p.color,
    'stroke': p.color,
    'stroke-width': 0.4,
    'text-anchor': 'middle',
  }
  snap_scr.text(p.x, p.y, p.name).attr(o);
  o.cursor = 'col-resize';
  o["text-anchor"] = "end"

  p.number = snap_scr.text(p.x + 20, p.y + 20, p.value.toFixed(2)).attr(o);

  function lim(num) {
    return num > p.max ? p.max :
      (num < p.min) ? p.min : num;
  }

  function sq(x, y) {
    //var ee = Math.pow(2, Math.sqrt(Math.abs(y)) * Math.sign(y));
    //console.log(y, ee);
    var ee = p.step * 0.1 * x;
    return ee;

  }

  function move(dx, dy) {
    p.number.attr('text', lim((Number(p.prev_value) + sq(dx, dy))).toFixed(2));
    p.value = Number(p.number.attr('text'));
    p.onchange();
  }

  function start_move() {
    p.prev_value = p.value;
  }

  p.reset = function (x) {
    p.value = x || opts.value;
    p.number.attr('text', p.value.toFixed(2));
    p.onchange();
  }

  p.number.drag(move, start_move);

  return p;
}




(function Demo1() {

  var camera, scene, renderer, container;
  var dist1 = lib.make_disturbance(5, 200);
  var dist2 = lib.make_disturbance(5, 200);
  var dist3 = lib.make_disturbance(5, 200);

  var handle = lib.$("slider1");
  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 1);

  var container = lib.$("container");

  function make_signal(name, color, data) {
    data = data || [];
    return {
      name: name,
      color: color,
      data: data
    }
  }
  var hs = make_signal('mouse', 'green');
  var ds1 = make_signal('disturbance1', 'red');
  var ds2 = make_signal('disturbance2', 'red');
  var ds3 = make_signal('disturbance3', 'red');
  var cv_shape = make_signal('shape', 'blue');
  var cv_pos = make_signal('position', 'orange');
  var cv_orient = make_signal('orientation', 'purple');

  var pl1 = lib.Plot("#Plot1", {
    ds: ds1,
    hs: hs,
    cv_pos: cv_pos
  });

  var pl2 = lib.Plot("#Plot2", {
    ds: ds2,
    hs: hs,
    cv_shape: cv_shape
  });
  var pl3 = lib.Plot("#Plot3", {
    ds: ds3,
    hs: hs,
    cv_orient: cv_orient
  });

  var shape;
  var running = false;
  var counter = 0;
  var dots = lib.$("dots");
  var start_button = lib.$("start-button");

  var selected = "";


  start_button.onclick = function () {
    if (running) {
      dots.innerHTML = "";
      running = false;
      start_button.value = "Start 1 minute run"
    } else {
      counter = 0;
      ds1.data = [];
      ds2.data = [];
      ds3.data = [];
      hs.data = [];
      cv_shape.data = [];
      cv_orient.data = [];
      cv_pos.data = [];
      running = true;
    }
  }

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


  function init3D() {
    if (Detector.webgl) {
      renderer = new THREE.WebGLRenderer({
        antialias: true
      });
    } else {
      renderer = new THREE.CanvasRenderer();
    }

    renderer.setClearColor("#000", 1);
    var w = Number(container.clientWidth);
    var h = Number(container.clientHeight);

    renderer.setSize(w, h);

    container.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    var f = 2;
    camera = new THREE.OrthographicCamera(-w / f, w / f, h / f, -h / f, 0, 200);
    camera.position.set(0, 0, 80);
    scene.add(camera);

    var shinyMat = new THREE.MeshPhongMaterial({
      color: new THREE.Color("rgb(130,0,0)"),
      emissive: new THREE.Color("rgb(130,0,0)"),
      shading: THREE.FlatShading
    });

    shape = new THREE.Mesh(new THREE.SphereGeometry(45, 8, 8), shinyMat);
    scene.add(shape);

    var L1 = new THREE.PointLight(0xffffff, 1);
    L1.position.set(1500, -100, 500);
    scene.add(L1);
  }


  function animate() {
    var h = Number(handle.value);

    var d1 = dist1.next();
    var d2 = dist2.next();
    var d3 = dist3.next();

    var c1 = d1 + h;
    var c2 = d2 + h;
    var c3 = d3 + h;

    shape.position.x = c1;

    shape.scale.x = 1 + 0.0025 * c2;
    shape.scale.y = 1 - 0.0025 * c2;
    shape.scale.z = 1 - 0.0025 * c2;

    shape.rotation.x = Math.PI / 2 + Math.PI * 0.002 * c3;

    if (counter === 300) {
      start_button.value = "Abort";
      // set color green
      shape.material.color.setHex(0x008200);
      shape.material.emissive.setHex(0x008200);
    } else if (counter >= 300) { // recording
      ds1.data.push(d1);
      ds2.data.push(d2);
      ds3.data.push(d3);
      hs.data.push(h);
      cv_shape.data.push(c2);
      cv_orient.data.push(c3);
      cv_pos.data.push(c1);
    }

    if (counter >= 3900) { // end 1 minute run
      dots.innerHTML = "";
      running = false;
      start_button.value = "Start 1 minute run";
      counter = 0;
      // set color red
      shape.material.color.setHex(0x820000);
      shape.material.emissive.setHex(0x820000);

      analyze();

    } else if (running) {
      dots.innerHTML = get_counter_text(counter);
      counter++;
    }

    lib.request_anim_frame(animate);
    renderer.render(scene, camera);
  }

  function analyze() {
    pl1.update({
      ds: ds1,
      hs: hs,
      cv_pos: cv_pos
    });
    pl2.update({
      ds: ds2,
      hs: hs,
      cv_shape: cv_shape
    });
    pl3.update({
      ds: ds3,
      hs: hs,
      cv_orient: cv_orient
    });

    var posds1 = stat.pearson(ds1.data, cv_pos.data);
    var shapeds2 = stat.pearson(ds2.data, cv_shape.data);
    var orientds3 = stat.pearson(ds3.data, cv_orient.data);
    lib.$("r-pos-ds1").innerHTML = posds1.toFixed(2);
    lib.$("r-shape-ds2").innerHTML = shapeds2.toFixed(2);
    lib.$("r-orient-ds3").innerHTML = orientds3.toFixed(2);

    var hds1 = stat.pearson(hs.data, ds1.data);
    var hds2 = stat.pearson(hs.data, ds2.data);
    var hds3 = stat.pearson(hs.data, ds3.data);
    lib.$("r-mouse-ds1").innerHTML = hds1.toFixed(2);
    lib.$("r-mouse-ds2").innerHTML = hds2.toFixed(2);
    lib.$("r-mouse-ds3").innerHTML = hds3.toFixed(2);

    var hpos = stat.pearson(hs.data, cv_pos.data);
    var hshape = stat.pearson(hs.data, cv_shape.data);
    var horient = stat.pearson(hs.data, cv_orient.data);
    lib.$("r-mouse-pos").innerHTML = hpos.toFixed(2);
    lib.$("r-mouse-shape").innerHTML = hshape.toFixed(2);
    lib.$("r-mouse-orient").innerHTML = horient.toFixed(2);

    // mouse(handle) and disturbance opposite, r is close to -1 for the
    // controlled variable
    var min = hds1;
    if (hds2 < min) min = hds2;
    if (hds3 < min) min = hds3;

    if (min === hds1) selected = "position";
    if (min === hds2) selected = "shape";
    if (min === hds3) selected = "orientation";

    lib.$("controlled-var").innerHTML = selected;

    if (selected === 'position') lib.$("fit-position").checked = true;
    else if (selected === 'shape') lib.$("fit-shape").checked = true;
    else if (selected === 'orientation') lib.$("fit-orient").checked = true;

    run_model();
  }

  var dif = make_signal("difference", 'gray');
  var model_mouse = make_signal("model mouse", "brown");

  var model_adjust = Snap("#model-adjust");

  pKo = eq_parameter(model_adjust, {
    x: 70,
    y: 20,
    value: 200,
    name: "Ko",
    min: 1,
    max: 1000,
    step: 2,
    onchange: run_model
  });
  pr = eq_parameter(model_adjust, {
    x: 150,
    y: 20,
    value: 0,
    name: "r",
    min: -200,
    max: +200,
    step: 1,
    onchange: run_model
  });

  var mplot = lib.Plot("#model-plot", {
    hs: hs,
    model: model_mouse,
    dif: dif
  });

  function rms(s) {
    var sum = 0,
      i = 0;
    len = s.length;
    for (i = 0; i < len; i++) {
      sum += ((s[i] * s[i]) / 3600);
    }
    return (Math.sqrt(sum));
  }



  lib.$("fit-position").onclick = function () {
    selected = 'position';
    run_model();
  }
  lib.$("fit-shape").onclick = function () {
    selected = 'shape';
    run_model();
  }
  lib.$("fit-orient").onclick = function () {
    selected = 'orientation';
    run_model();
  }


  function run_model() {
    var dist, i, S, r, Ko, mh, cv, e;

    if (selected === 'position') dist = ds1.data;
    else if (selected === 'shape') dist = ds2.data;
    else if (selected === 'orientation') dist = ds3.data;

    dif.data = [];
    model_mouse.data = [];
    mh = hs.data[0];
    r = pr.value;
    Ko = pKo.value;
    S = 1000;

    for (i = 0; i < dist.length; i++) {
      model_mouse.data.push(mh);
      dif.data.push(mh - hs.data[i]);

      cv = dist[i] + mh;
      e = r - cv;
      mh = mh + (Ko * e - mh) / S;
    }

    mplot.update({
      hs: hs,
      model: model_mouse,
      dif: dif
    });

    lib.$("model-rms-difference").innerHTML = rms(dif.data).toFixed(3);

  }

  init3D();
  animate();

}())
