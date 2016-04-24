// remove this, get a permanent object that stores data and canvas references
  // also try with svg!!
  // also try shifting the bitmap


function plot_mult(prop) {
  'use strict';
  var canvas, ctx, width, zero, xScale, yScale, h, clr, t;
  yScale = prop.yScale || 1;
  canvas = document.getElementById(prop.canvas);
  ctx = canvas.getContext('2d');
  width = canvas.width;
  height = canvas.height;
  zero = height / 2;
  clr = ["#ff0000", "#6a6a6a", "#0afa0a", "#000000", "#023423", "#123456", "#123321"];
  ctx.clearRect(0, 0, width, height);

  //data = prop.scaleToFit ? scaleToRange(prop.data, -h, h) : prop.data;

  function draw_single(d, color) {
    var k;
    xScale = (d.length) / width;
    ctx.strokeStyle = color;
    //ctx.lineWidth = 2;
    ctx.moveTo(0, d[0]);
    ctx.beginPath();
    //ctx.translate(0.5, 0.5);
    for (k = 0; k < width; k += 1) {
      //ctx.strokeRect(k, zero, 1, yScale * data[Math.floor(k * xScale)]);
      ctx.lineTo(k, zero - Math.floor(yScale * d[Math.floor(k * xScale)]));
    }
    ctx.stroke();
  }

  for (t = 0; t < prop.data.length; t += 1) {
    draw_single(prop.data[t], clr[t]);
  }

  function update (data) {


  }
  return {
    update : update
  }
}
