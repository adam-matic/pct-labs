function signalGenerator(p, x, y) {
  return p.rect(x, y, 100, 50, 5, 5);
}



var o;

window.onload = function () {
  var p = Snap("#container");

  var inputBox = p.rect(180, 120, 40, 40, 10, 10);
  var delayBox = p.rect(210, 100, 50, 10, 10, 10);
  var comparator = p.polygon(300, 60, 300, 110, 340, 85);
  var outMult = p.circle(420, 100, 15);
  var outSlow = p.rect(400, 120, 40, 40, 10, 10);
  var feedMult = p.circle(320, 180, 15);
  var refGen = signalGenerator(p, 30, 30);
  var distGen = signalGenerator(p, 30, 180);

  inputBox.drag();
  delayBox.drag();
  comparator.drag();
  outMult.drag();
  outSlow.drag();
  feedMult.drag();
  refGen.drag();
  distGen.drag();

  inputBox.mouseover(function () {
    inputBox.attr({
      'fill': "#f00"
    });
  })
  inputBox.mouseout(function () {
    inputBox.attr({
      fill: "#000"
    })
  })

  var t1 = p.text(250, 200, "10.00");
  t1.attr({
    'cursor': 'e-resize'
  });

  function move(dx, dy, posx, posy) {
    var t = this.strt;
    //console.log(this);
    //console.log(t, dx);
    this.attr({
      'text': (Number(t) + 0.01 * dx).toFixed(2)
    });
  }

  t1.drag(move,
    function () {
      t1.strt = t1.node.innerHTML;
    }
  );

  var plot = lib.svg_plot("plot", [[10, 20, -10, -20, 100, 30, 100, 40, 100, 50, 0, 0, 0, 0]]);

  //plot.new_plot([[-10, 0, 0, 0, 100, 40, 100, 50]]);



}
