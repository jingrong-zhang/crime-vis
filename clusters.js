d3.csv("/data/yearly_hulls.csv", function (d) {
  return {
    lat: parseFloat(d["lat"]),
    lon: parseFloat(d["lon"]),
    dn: d["dn"],
    cluster: parseInt(d["cluster"]),
  };
}).then(function (data) {
  // console.log(data)

  for (i = 0; i < 10; i++) {
    L.polygon(
      data.filter(function (d) {
        return d.dn == "D" && d.cluster == i;
      }),
      {
        color: "white",
        weight: 2,
        fill: false,
        opacity: 0.3,
        dashArray: "5, 5",
      }
    ).addTo(dayMap);
  }

  for (i = 0; i < 10; i++) {
    L.polygon(
      data.filter(function (d) {
        return d.dn == "N" && d.cluster == i;
      }),
      {
        color: "white",
        weight: 2,
        fill: false,
        opacity: 0.3,
        dashArray: "5, 5",
      }
    ).addTo(nightMap);
  }
});
