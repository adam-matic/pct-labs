// stat.js groups some statistics functions used in LCSIII
//
//

var stat = (function () {

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
