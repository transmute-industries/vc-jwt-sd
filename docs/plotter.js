
let makeFmt = suffix => (u, v, sidx, didx) => {
  if (didx == null) {
    let d = u.data[sidx];
    v = d[d.length - 1];
  }
  return v == null ? null : v.toFixed(1) + suffix;
};

function makeChart(data, container) {
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
    scales: {
      x: {
        time: false
      }
    },
    series: [
      {
        label: "Length",
        scale: 'x',
        value: (u, v, sidx, didx) => {
          return v == null ? null : v;
        }
      },
      {
        label: "Data Integrity Proof",
        scale: "y",
        value: makeFmt(' ms'),
        stroke: "red",
      },
      {
        label: "SD-JWT",
        scale: "y",
        value: makeFmt(' ms'),
        stroke: "green",
      },
    ],
    axes: [
      {
        scale: 'x',
        values: (u, vals, space) => vals.map(v => v),
      },
      {
        scale: 'y',
        values: (u, vals, space) => vals.map(v => v),
      },
    ]
  };

  function sliceData(start, end) {
    let d = [];
    for (let i = 0; i < data.length; i++)
      d.push(data[i].slice(start, end));
    return d;
  }

  let interval = 0.5 * 1000;
  let len1 = 100;
  let start1 = 0;
  let step =  5
  let data1 = sliceData(start1, start1 + len1);
  let uplot1 = new uPlot(opts, data1, document.getElementById(container));
  let handle = setInterval(function() {
    start1 += step;
    let data1 = sliceData(start1, start1 + len1);
    if (data1[0].length % step !== 0){
      clearInterval(handle)
    } else {
      uplot1.setData(data1);
    }
  }, interval);
}

fetch("datasets/issuance.json").then(r => r.json()).then(data => {
  setTimeout(() => makeChart(data, 'issuance-benchmark'), 0);
});

fetch("datasets/presentation.json").then(r => r.json()).then(data => {
  setTimeout(() => makeChart(data, 'presentation-benchmark'), 0);
});

fetch("datasets/verification.json").then(r => r.json()).then(data => {
  setTimeout(() => makeChart(data, 'verification-benchmark'), 0);
});