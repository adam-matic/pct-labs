window.onload = function () {
  init();
}


var i, c, o;

function init() {
  var mb = document.getElementById("main_box");
  var gr = 1.62; // golden ratio
  var size = 25,
    origin = {
      x: 150,
      y: 150
    };

  var it = {
    x: origin.x,
    y: origin.y + size * 1.3,
    w: size * gr,
    h: size,
    text: "I"
  };
  var ic = {
    x: origin.x + size * gr * 1.2,
    y: origin.y,
    w: size * gr,
    h: size,
    text: "C"
  };
  var io = {
    x: origin.x + size * gr * 2 * 1.2,
    y: origin.y + size * 1.3,
    w: size * gr,
    h: size,
    text: "O"
  };
  i = make_box().init(it);
  c = make_box().init(ic);
  o = make_box().init(io);

  [i, c, o].map(function (x) {
    mb.appendChild(x.box)
  });



  var ref = make_box().init({
    x: origin.x,
    y: origin.y,
    w: size * gr,
    h: size,
    text: "0.00"
  });
  ref.box.style.cursor = "pointer";

  ref.box.ondragstart = function (e) {
    console.log("aa");
    alert("dragggg");
  }


  ref.box.addEventListener('drag', function (e) {
    alert('over');
  });

  mb.appendChild(ref.box);



}

function make_box() {
  var t = {};
  t.box = document.createElement("div");
  t.init = function (opts) {
    t.opts = opts;
    var attrs = {
      'position': 'absolute',
      'width': (opts.w || 50) + 'px',
      'height': (opts.h || 50) + 'px',
      'left': (opts.x || 0) + 'px',
      'top': (opts.y || 0) + 'px',
      'border': 'solid 1px',
      'textAlign': 'center',
      'fontSize': 0.7 * opts.h + 'px',
      'lineHeight': (opts.h || 50) + 'px'
    }
    var key;
    for (key in attrs) {
      t.box.style[key] = attrs[key];
    }
    t.box.innerHTML = opts.text || "";
    return t;
  }

  return t;
  /*{
    box : box,
    set_style: set_style*/
}
