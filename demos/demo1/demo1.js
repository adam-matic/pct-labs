// Demo1 from LCSIII, Choose Control
// Original Delphi code by W.T. Powers and B.B. Abbott (2008)

// JavaScript version by A. Matic (2016)
// Licence: MIT


function $(x) {
  return document.getElementById(x);
}


(function Demo1() {

  var camera, scene, renderer, container;
  var dist1 = lib.make_disturbance(5, 200);
  var dist2 = lib.make_disturbance(5, 200);
  var dist3 = lib.make_disturbance(5, 200);

  var handle = $("slider1");
  handle.setAttribute('min', -200);
  handle.setAttribute('max', 200);
  handle.setAttribute('step', 1);

  var container = $("container");

  function make_signal(name, color, data) {
    if (data === undefined) data = [];
    return {
      name: name,
      color: color,
      data: data
    }
  }
  var hs = make_signal('handle', 'green');
  var ds1 = make_signal('disturbance 1', 'red');
  var ds2 = make_signal('disturbance 2', 'red');
  var ds3 = make_signal('disturbance 3', 'red');
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
  var dots = $("dots");
  var start_button = $("start-button");

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


  function init() {
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

    shape = new THREE.Mesh(new THREE.SphereGeometry(40, 10, 7), shinyMat);
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
      pl1.update({
        ds: ds1,
        hs: hs,
        cv_pos: cv_pos
      });
      pl3.update({
        ds: ds3,
        hs: hs,
        cv_orient: cv_orient
      });
      pl2.update({
        ds: ds2,
        hs: hs,
        cv_shape: cv_shape
      });

      analyze();

    } else if (running) {
      dots.innerHTML = get_counter_text(counter);
      counter++;
    }

    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  init();
  animate();

}())


function analyze() {
  var m = stat.pearson(dist_p, slider_pos);
  var n = stat.pearson(dist_s, slider_size);
  var k = stat.pearson(dist_a, slider_angle);

  var sol = (m < n) && (m < k) && (m < -0.5) ? "position" : ((n < m) && (n < k) && (n < -0.5)) ? "size" : (k < -0.5) ? 'angle' : "*undetermined*";


  console.log(m, n, k);
  console.log("You were controlling " + sol + '.');
  var response_text = "You were controlling " + sol + "."
  var html_response = document.getElementById("Analysis");
  html_response.innerHTML = response_text;


  var h = stat.pearson(pos_rec, size_rec);
  var j = stat.pearson(size_rec, angle_rec);
  var k = stat.pearson(angle_rec, pos_rec);
  console.log("dist_p", stat.min(dist_p), stat.max(dist_p));
  console.log("dist_s", stat.min(dist_s), stat.max(dist_s));
  console.log("dist_a", stat.min(dist_a), stat.max(dist_a));
  //console.log(h, j, k);

  plot({
    canvas: 'c1',
    data: [dist_p, pos_rec, slider_pos],
    yScale: 0.15
  });
  plot({
    canvas: 'c2',
    data: [dist_s, size_rec, slider_size],
    yScale: 0.6
  });
  plot({
    canvas: 'c3',
    data: [dist_a, angle_rec, slider_angle],
    yScale: 13
  });
  //  plot({canvas: 'c4', data: r_slider, yScale: 0.01});
  mode = 'animate';
}
