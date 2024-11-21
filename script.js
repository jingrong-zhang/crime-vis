// Load the CSV data
async function loadData() {
  const response = await fetch("data/data_pivot.csv");
  const text = await response.text();

  // Parse CSV data
  const rows = text.split("\n").slice(1); // Skip header row
  const data = rows.map((row) => {
    const [
      cluster,
      centroid_lat,
      centroid_lon,
      DN,
      all,
      drug,
      financial,
      low_level_property,
      low_level_violent,
      non_criminal,
      public_order,
      severe_property,
      severe_violent,
      sexual_offenses,
      weapon,
    ] = row.split(",");

    return {
      cluster: parseInt(cluster),
      centroid_lat: parseFloat(centroid_lat),
      centroid_lon: parseFloat(centroid_lon),
      DN,
      all: parseInt(all),
      drug: parseInt(drug),
      financial: parseInt(financial),
      low_level_property: parseInt(low_level_property),
      low_level_violent: parseInt(low_level_violent),
      non_criminal: parseInt(non_criminal),
      public_order: parseInt(public_order),
      severe_property: parseInt(severe_property),
      severe_violent: parseInt(severe_violent),
      sexual_offenses: parseInt(sexual_offenses),
      weapon: parseInt(weapon),
    };
  });

  return data;
  console.log(data);
}

// Initialize maps
const dayMap = L.map("day-map").setView([41.8, -87.7], 11);
const nightMap = L.map("night-map").setView([41.8, -87.7], 11);

L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
  subdomains: "abcd",
  maxZoom: 13,
}).addTo(dayMap);

L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
  subdomains: "abcd",
  maxZoom: 13,
}).addTo(nightMap);

// Function to synchronize views
function syncMaps(sourceMap, targetMap) {
  sourceMap.on("move", () => {
    const center = sourceMap.getCenter();
    const zoom = sourceMap.getZoom();
    targetMap.setView(center, zoom, { animate: false });
  });
}

// Function to draw a flower
function createFlowerSVG(values) {
  const {
    drug,
    financial,
    low_level_property,
    low_level_violent,
    non_criminal,
    public_order,
    severe_property,
    severe_violent,
    sexual_offenses,
    weapon,
  } = values;

  const svgNS = "http://www.w3.org/2000/svg";

  const flower = document.createElementNS(svgNS, "svg");
  flower.setAttribute("width", 100);
  flower.setAttribute("height", 100);

  const center = document.createElementNS(svgNS, "circle");
  center.setAttribute("cx", 50);
  center.setAttribute("cy", 50);
  center.setAttribute("r", 10);
  center.setAttribute("class", "flower-center");
  flower.appendChild(center);

  const petalData = [
    { key: "drug", value: drug, className: "petal-drug" },
    { key: "financial", value: financial, className: "petal-financial" },
    {
      key: "low_level_property",
      value: low_level_property,
      className: "petal-low_level_property",
    },
    {
      key: "low_level_violent",
      value: low_level_violent,
      className: "petal-low_level_violent",
    },
    {
      key: "non_criminal",
      value: non_criminal,
      className: "petal-non_criminal",
    },
    {
      key: "public_order",
      value: public_order,
      className: "petal-public_order",
    },
    {
      key: "severe_property",
      value: severe_property,
      className: "petal-severe_property",
    },
    {
      key: "severe_violent",
      value: severe_violent,
      className: "petal-severe_violent",
    },
    {
      key: "sexual_offenses",
      value: sexual_offenses,
      className: "petal-sexual_offenses",
    },
    { key: "weapon", value: weapon, className: "petal-weapon" },
  ];

  const angleStep = (2 * Math.PI) / petalData.length;

  const allValues = petalData.map((petal) => petal.value);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  petalData.forEach((petal, index) => {
    const angle = index * angleStep;

    const minLength = 10;
    const maxLength = 40;

    const length =
      minLength +
      ((petal.value - minValue) * (maxLength - minLength)) /
        (maxValue - minValue);

    const x2 = 50 + Math.cos(angle) * length;
    const y2 = 50 + Math.sin(angle) * length;

    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", 50);
    line.setAttribute("y1", 50);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("class", `petal ${petal.className}`);

    // console.log(`Line ${index} - x2: ${x2}, y2: ${y2}, value: ${petal.value}`);

    const minWidth = 2;
    const maxWidth = 5;

    const strokeWidth =
      minWidth +
      ((petal.value - minValue) * (maxWidth - minWidth)) /
        (maxValue - minValue);
    line.setAttribute("stroke-width", strokeWidth);

    flower.appendChild(line);
  });

  return flower;
}

// Add flowers to maps
function addFlowersToMap(map, data, filter) {
  data.filter(filter).forEach((row) => {
    const flowerSVG = createFlowerSVG(row);
    const icon = L.divIcon({
      html: flowerSVG.outerHTML,
      className: "flower-icon",
      iconSize: [100, 100],
    });

    L.marker([row.centroid_lat, row.centroid_lon], { icon }).addTo(map);
  });
}

// Synchronize dayMap and nightMap
syncMaps(dayMap, nightMap);
syncMaps(nightMap, dayMap);

loadData().then((data) => {
  addFlowersToMap(dayMap, data, (row) => row.DN === "D");
  addFlowersToMap(nightMap, data, (row) => row.DN === "N");
});
