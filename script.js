// Load the CSV data
async function loadData(source) {
  const response = await fetch(`data/data_pivot_${source}.csv`);
  const text = await response.text();

  // Parse CSV data
  const rows = text.split("\n").slice(1); // Skip header row
  const data = rows.map((row) => {
    const [
      cluster,
      centroid_lat,
      centroid_lon,
      time,
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
      time: parseInt(time),
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
}

const dayMap = L.map("day-map", { zoomControl: false, minZoom: 10 }).setView(
  [41.8, -87.7],
  11
);
const nightMap = L.map("night-map", {
  zoomControl: false,
  minZoom: 10,
}).setView([41.8, -87.7], 11);

// L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
  subdomains: "abcd",
  maxZoom: 13,
}).addTo(dayMap);

L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
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

function createFlowerSVG(values, globalMin, globalMax) {
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

  const minLength = 10;
  const maxLength = 40;

  petalData.forEach((petal, index) => {
    const angle = index * angleStep;

    const length =
      minLength +
      ((petal.value - globalMin) * (maxLength - minLength)) /
        (globalMax - globalMin);

    const x2 = 50 + Math.cos(angle) * length;
    const y2 = 50 + Math.sin(angle) * length;

    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", 50);
    line.setAttribute("y1", 50);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("class", `petal ${petal.className}`);

    const minWidth = 2;
    const maxWidth = 5;

    const strokeWidth =
      minWidth +
      ((petal.value - globalMin) * (maxWidth - minWidth)) /
        (globalMax - globalMin);
    line.setAttribute("stroke-width", strokeWidth);

    flower.appendChild(line);
  });

  const center = document.createElementNS(flower.namespaceURI, "circle");
  center.setAttribute("cx", 50);
  center.setAttribute("cy", 50);
  center.setAttribute("r", 20);
  center.setAttribute("class", "flower-center");
  flower.appendChild(center);

  return flower;
}

function getGlobalMinMax(data, crimeTypes) {
  const allValues = data.flatMap((row) => crimeTypes.map((type) => row[type]));
  return {
    globalMin: Math.min(...allValues),
    globalMax: Math.max(...allValues),
  };
}

// Add flowers to maps
function addFlowersToMap(map, data) {
  const crimeTypes = [
    "drug",
    "financial",
    "low_level_property",
    "low_level_violent",
    "non_criminal",
    "public_order",
    "severe_property",
    "severe_violent",
    "sexual_offenses",
    "weapon",
  ];

  const { globalMin, globalMax } = getGlobalMinMax(data, crimeTypes);

  data.forEach((row) => {
    const flowerSVG = createFlowerSVG(row, globalMin, globalMax);
    const icon = L.divIcon({
      html: flowerSVG.outerHTML,
      className: "flower-icon",
      iconSize: [100, 100],
    });

    L.marker([row.centroid_lat, row.centroid_lon], { icon }).addTo(map);
  });
}

function getGlobalMax(data1, data2, crimeTypes) {
  return d3.max([...data1, ...data2], (d) =>
    Math.max(...crimeTypes.map((type) => d[type]))
  );
}

let activeStartTime = null;
let activeEndTime = null;

function filterDataByTime(data, startTime, endTime) {
  activeStartTime = startTime;
  activeEndTime = endTime;
  return data.filter((d) => d.time >= startTime && d.time <= endTime);
}

function onBrushEnd(start, end) {
  activeStartTime = start;
  activeEndTime = end;

  const filteredDayData = filterDataByTime(dayData, start, end);
  const filteredNightData = filterDataByTime(nightData, start, end);

  // Clear all markers before adding filtered ones
  dayMap.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      dayMap.removeLayer(layer);
    }
  });
  nightMap.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      nightMap.removeLayer(layer);
    }
  });

  // Add new markers for the filtered data
  addFlowersToMap(dayMap, filteredDayData);
  addFlowersToMap(nightMap, filteredNightData);
}

function createLineChart(containerId, data, crimeTypes, globalMax, onBrushEnd) {
  const svgWidth = 600;
  const svgHeight = 190;
  const margin = { top: 30, right: 30, bottom: 50, left: 100 };

  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;

  const svg = d3
    .select(`#${containerId}`)
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const chart = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const timeExtent = d3.extent(data, (d) => d.time);
  const timeScale = d3
    .scaleLinear()
    .domain([Math.floor(timeExtent[0]), Math.ceil(timeExtent[1])]) // Ensure domain is integer
    .range([0, width]);

  const crimeScale = d3.scaleLinear().domain([0, globalMax]).range([height, 0]);

  chart
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3
        .axisBottom(timeScale)
        .tickValues([...new Set(data.map((d) => d.time))])
        .tickFormat(d3.format("d"))
    );

  chart.append("g").call(d3.axisLeft(crimeScale));

  svg
    .append("text")
    .attr("transform", `rotate(-90)`)
    .attr("x", -svgHeight / 2)
    .attr("y", margin.left / 2.5)
    .attr("dy", "1em")
    .attr("text-anchor", "middle")
    .attr("class", "y-axis-label")
    .attr("fill", "white")
    .attr("font-size", "12px")
    .text("Total number of crimes");

  const sortedData = data.sort((a, b) => a.time - b.time);

  crimeTypes.forEach((type) => {
    const line = d3
      .line()
      .x((d) => timeScale(d.time))
      .y((d) => crimeScale(d[type]));

    chart
      .append("path")
      .datum(sortedData)
      .attr("fill", "none")
      .attr("stroke", getColor(type))
      .attr("stroke-width", 2)
      .attr("d", line);

    const dots = chart
      .selectAll(`.dot-${type}`)
      .data(sortedData)
      .enter()
      .append("circle")
      .attr("class", `dot dot-${type}`)
      .attr("cx", (d) => timeScale(d.time))
      .attr("cy", (d) => crimeScale(d[type]))
      .attr("r", 3)
      .attr("fill", getColor(type));

    // Store reference to dots for updating size later
    dots.each(function (d) {
      d.dotElement = this;
    });
  });

  const brush = d3.brushX().extent([
    [0, 0],
    [width, height],
  ]);

  const singleFrameWidth =
    timeScale(timeExtent[0] + 1) - timeScale(timeExtent[0]);

  const initialBrushRange = [
    timeScale(timeExtent[0]),
    timeScale(timeExtent[0]) + singleFrameWidth * 0.99,
  ];

  const brushGroup = chart
    .append("g")
    .attr("class", "brush")
    .call(brush)
    .call(brush.move, initialBrushRange);

  const [start, end] = initialBrushRange.map(timeScale.invert);
  onBrushEnd(start, end);

  chart
    .selectAll(".dot")
    .attr("r", (d) => (d.time >= start && d.time <= end ? 6 : 3));

  brush.on("end", (event) => {
    const selection = event.selection;
    if (selection) {
      const [start, end] = selection.map(timeScale.invert);
      onBrushEnd(start, end);

      chart
        .selectAll(".dot")
        .attr("r", (d) => (d.time >= start && d.time <= end ? 6 : 3));
    }
  });
}

function getColor(type) {
  const colorMap = {
    drug: "red",
    financial: "blue",
    low_level_property: "green",
    low_level_violent: "orange",
    non_criminal: "purple",
    public_order: "cyan",
    severe_property: "brown",
    severe_violent: "pink",
    sexual_offenses: "teal",
    weapon: "gray",
  };
  return colorMap[type] || "black";
}

function aggregateDataByTime(data, crimeTypes) {
  const aggregated = d3.rollups(
    data,
    (group) => {
      const aggregatedRow = { time: group[0].time };
      crimeTypes.forEach((type) => {
        aggregatedRow[type] = d3.sum(group, (d) => d[type]);
      });
      return aggregatedRow;
    },
    (d) => d.time
  );

  return aggregated.map(([, values]) => values);
}

syncMaps(dayMap, nightMap);
syncMaps(nightMap, dayMap);

let dayData = [];
let nightData = [];

async function initializeVisualization(source) {
  const data = await loadData(source);

  dayData = data.filter((d) => d.DN === "D");
  nightData = data.filter((d) => d.DN === "N");

  addFlowersToMap(dayMap, dayData);
  addFlowersToMap(nightMap, nightData);

  const crimeTypes = [
    "drug",
    "financial",
    "low_level_property",
    "low_level_violent",
    "non_criminal",
    "public_order",
    "severe_property",
    "severe_violent",
    "sexual_offenses",
    "weapon",
  ];

  const aggregatedDayData = aggregateDataByTime(dayData, crimeTypes);
  const aggregatedNightData = aggregateDataByTime(nightData, crimeTypes);

  const globalMax = getGlobalMax(
    aggregatedDayData,
    aggregatedNightData,
    crimeTypes
  );

  createLineChart(
    "day-chart",
    aggregatedDayData,
    crimeTypes,
    globalMax,
    (start, end) => onBrushEnd(start, end)
  );
  createLineChart(
    "night-chart",
    aggregatedNightData,
    crimeTypes,
    globalMax,
    (start, end) => onBrushEnd(start, end)
  );
}

function clearMarkers(map) {
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });
}

document.querySelectorAll('input[name="data-switch"]').forEach((input) => {
  input.addEventListener("change", async (event) => {
    const source = event.target.value;

    // Clear all existing markers from both maps
    clearMarkers(dayMap);
    clearMarkers(nightMap);

    // Clear the charts
    d3.select("#day-chart").selectAll("*").remove();
    d3.select("#night-chart").selectAll("*").remove();

    // Reinitialize visualization with the selected source
    await initializeVisualization(source);

    // Reset visibility controls for crime types
    Object.keys(colorMap).forEach((type) => {
      const isVisible = true;
      controlDataDisplay(type, source, isVisible);
    });
  });
});

initializeVisualization("month");

const colorMap = {
  drug: { color: "red", thresholds: { month: 14, quarter: 41, year: 270 } },
  financial: {
    color: "blue",
    thresholds: { month: 55, quarter: 163, year: 856 },
  },
  low_level_property: {
    color: "green",
    thresholds: { month: 150, quarter: 447, year: 1753 },
  },
  low_level_violent: {
    color: "orange",
    thresholds: { month: 2, quarter: 3, year: 12 },
  },
  non_criminal: {
    color: "purple",
    thresholds: { month: 63, quarter: 189, year: 777 },
  },
  public_order: {
    color: "cyan",
    thresholds: { month: 6, quarter: 18, year: 85 },
  },
  severe_property: {
    color: "brown",
    thresholds: { month: 355, quarter: 1059, year: 4790 },
  },
  severe_violent: {
    color: "pink",
    thresholds: { month: 343, quarter: 993, year: 3940 },
  },
  sexual_offenses: {
    color: "teal",
    thresholds: { month: 22, quarter: 65, year: 273 },
  },
  weapon: {
    color: "gray",
    thresholds: { month: 36, quarter: 111, year: 448 },
  },
};

function getThreshold(type, timeframe) {
  if (colorMap[type] && colorMap[type].thresholds[timeframe]) {
    return colorMap[type].thresholds[timeframe];
  }
  console.warn(`Threshold for ${type} and ${timeframe} not defined`);
  return 100;
}

function createDropdownMenu() {
  const menu = document.getElementById("crime-type-menu");

  const typeDict = {
    severe_violent: [
      "homicide",
      "battery",
      "assault",
      "robbery",
      "kidnapping",
      "domestic violence",
      "human trafficking",
    ],
    low_level_violent: ["intimidation"],
    severe_property: ["theft", "burglary", "motor vehicle theft", "arson"],
    low_level_property: ["criminal damage", "criminal trespass"],
    sexual_offenses: [
      "criminal sexual assault",
      "crim sexual assault",
      "sex offense",
      "offense involving children",
      "public indecency",
      "obscenity",
      "prostitution",
      "stalking",
    ],
    financial: ["deceptive practice"],
    drug: ["narcotics", "other narcotic violation"],
    weapon: ["weapons violation", "concealed carry license violation"],
    public_order: [
      "public peace violation",
      "liquor law violation",
      "interference with public officer",
      "gambling",
      "ritualism",
    ],
    non_criminal: [
      "non - criminal",
      "non-criminal",
      "non-criminal (subject specified)",
      "other offense",
    ],
  };

  const descriptions = {
    drug: "Drug rehabilitation center",
    financial: "Community awareness program",
    low_level_property: "Police patrol",
    low_level_violent: "Police patrol",
    non_criminal: "None",
    public_order: "Police patrol",
    severe_property: "Police patrol",
    severe_violent: "Police patrol",
    sexual_offenses: "Victims outreach center",
    weapon: "Police patrol",
  };

  let activeList = null; // Track the currently expanded list

  Object.entries(colorMap).forEach(([type, { color }]) => {
    // Use description for title if available
    const titleText = descriptions[type] || type.replace(/_/g, " ");

    // Create title element
    const title = document.createElement("div");
    title.textContent = `${type.replace(/_/g, " ")} :: ${titleText}`;
    title.style.color = color;
    title.className = "crime-type-title";

    // Create list with detailed breakdown
    const crimeList = document.createElement("ul");
    crimeList.className = "crime-detailed-list";
    crimeList.style.listStyleType = "none";
    crimeList.style.paddingLeft = "0";
    crimeList.style.display = "none";

    // Populate list with detailed breakdown from typeDict
    const crimes = typeDict[type] || [];
    crimes.forEach((crime) => {
      const listItem = document.createElement("li");
      listItem.textContent = crime.toLowerCase();
      listItem.style.textTransform = "lowercase";
      listItem.style.marginBottom = "4px";
      crimeList.appendChild(listItem);
    });

    // Create list item and append title and list
    const listItem = document.createElement("li");
    listItem.appendChild(title);
    listItem.appendChild(crimeList);
    menu.appendChild(listItem);

    // Toggle list visibility on title click
    title.addEventListener("click", () => {
      if (activeList && activeList !== crimeList) {
        activeList.style.display = "none";
      }
      const isVisible = crimeList.style.display === "block";
      crimeList.style.display = isVisible ? "none" : "block";
      activeList = isVisible ? null : crimeList;

      // Control data display
      controlDataDisplay(type, "month", !isVisible);
    });
  });
}

document.addEventListener("DOMContentLoaded", createDropdownMenu);
