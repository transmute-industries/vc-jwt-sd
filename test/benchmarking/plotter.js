function round2(val) {
  return Math.round(val * 100) / 100;
}

function round3(val) {
  return Math.round(val * 1000) / 1000;
}

function prepData(packed) {
  const numFields = packed[0];
  packed = packed.slice(numFields + 1);
  // 55,550 data points x 3 series = 166,650
  let data = [
    Array(packed.length/numFields),
    Array(packed.length/numFields),
    Array(packed.length/numFields),
    Array(packed.length/numFields),
  ];
  for (let i = 0, j = 0; i < packed.length; i += numFields, j++) {
    data[0][j] = packed[i] * 60;
    data[1][j] = round3(100 - packed[i+1]);
    data[2][j] = round2(100 * packed[i+5] / (packed[i+5] + packed[i+6]));
  }
  return data;
}

function makeChart(data) {
  function sliceData(start, end) {
    let d = [];
    for (let i = 0; i < data.length; i++)
      d.push(data[i].slice(start, end));
    return d;
  }

  let interval = 100;
  let makeFmt = suffix => (u, v, sidx, didx) => {
    if (didx == null) {
      let d = u.data[sidx];
      v = d[d.length - 1];
    }
    return v == null ? null : v.toFixed(1) + suffix;
  };

  const opts = {
    width: 800,
    height: 600,
    cursor: {
      drag: {
        setScale: false,
      }
    },
    select: {
      show: false,
    },
    series: [
      {
        value: (u, v, sidx, didx) => {
          if (didx == null) {
            let d = u.data[sidx];
            v = d[d.length - 1];
          }
          return v;
        }
      },
      {
        label: "CPU",
        scale: "%",
        value: makeFmt('%'),
        stroke: "red",
      },
      {
        label: "RAM",
        scale: "%",
        value: makeFmt('%'),
        stroke: "blue",
      },
    ],
    axes: [
      {},
      {
        scale: '%',
        values: (u, vals, space) => vals.map(v => +v.toFixed(1) + "%"),
      },
      {
        side: 1,
        scale: 'mb',
        values: (u, vals, space) => vals.map(v => +v.toFixed(2) + " MB"),
        grid: {show: false},
      },
    ]
  };

  let start1 = 0;
  let len1 = 3000;
  let data1 = sliceData(start1, start1 + len1);
  let uplot1 = new uPlot(opts, data1, document.body);
  setInterval(function() {
    start1 += 10;
    let data1 = sliceData(start1, start1 + len1);
    uplot1.setData(data1);
  }, interval);
}


fetch("data.json").then(r => r.json()).then(packed => {
  let data = prepData(packed);
  setTimeout(() => makeChart(data), 0);
});