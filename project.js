let destinations = JSON.parse(localStorage.getItem("destinations")) || [];
let markers = [];
let routingControl = null;

/* MAP INITIALIZATION */
const map = L.map("map").setView([20.5937, 78.9629], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

/* LOAD EXISTING DATA */
renderDestinations();
renderMapMarkers();
drawRoute();

/* ADD DESTINATION */
async function addDestination() {
  const input = document.getElementById("destinationInput");
  const place = input.value.trim();
  if (!place) return;

  const coords = await getCoordinates(place);
  if (!coords) {
    alert("Location not found");
    return;
  }

  destinations.push({
    id: Date.now(),
    name: place,
    lat: coords.lat,
    lon: coords.lon
  });

  input.value = "";
  saveAndRender();
}

/* GEOCODING */
async function getCoordinates(place) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${place}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.length === 0) return null;
  return { lat: data[0].lat, lon: data[0].lon };
}

/* RENDER LIST */
function renderDestinations() {
  const list = document.getElementById("destinationList");
  list.innerHTML = "";

  destinations.forEach((d, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${i + 1}. ${d.name}
      <button onclick="moveUp(${i})">⬆</button>
      <button onclick="moveDown(${i})">⬇</button>
    `;
    list.appendChild(li);
  });
}

/* MOVE UP */
function moveUp(index) {
  if (index === 0) return;
  [destinations[index - 1], destinations[index]] =
  [destinations[index], destinations[index - 1]];
  saveAndRender();
}

/* MOVE DOWN */
function moveDown(index) {
  if (index === destinations.length - 1) return;
  [destinations[index + 1], destinations[index]] =
  [destinations[index], destinations[index + 1]];
  saveAndRender();
}

/* MARKERS */
function renderMapMarkers() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  destinations.forEach(d => {
    const marker = L.marker([d.lat, d.lon])
      .addTo(map)
      .bindPopup(d.name);
    markers.push(marker);
  });
}

/* ROUTE */
function drawRoute() {
  if (routingControl) map.removeControl(routingControl);
  if (destinations.length < 2) return;

  routingControl = L.Routing.control({
    waypoints: destinations.map(d => L.latLng(d.lat, d.lon)),
    addWaypoints: false,
    draggableWaypoints: false,
    show: false
  }).addTo(map);

  routingControl.on("routesfound", e => {
    const route = e.routes[0];
    updateSummary(route);
  });
}

/* SUMMARY */
function updateSummary(route) {
  const distanceKm = route.summary.totalDistance / 1000;
  const timeMin = route.summary.totalTime / 60;
  const fuel = (distanceKm / 15).toFixed(2);

  document.getElementById("totalDistance").innerHTML =
    `🛣 Distance: <b>${distanceKm.toFixed(2)} km</b>`;

  document.getElementById("totalTime").innerHTML =
    `⏱ Time: <b>${timeMin.toFixed(0)} minutes</b>`;

  document.getElementById("fuelNeeded").innerHTML =
    `⛽ Fuel: <b>${fuel} litres</b>`;
}

/* SAVE */
function saveAndRender() {
  localStorage.setItem("destinations", JSON.stringify(destinations));
  renderDestinations();
  renderMapMarkers();
  drawRoute();
}
