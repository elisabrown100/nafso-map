// NAFSO Map JS – Load Data from Google Sheets, Add Color-Coded Markers, Sidebar, and Home Button
window.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById('sidebar');
  const map = document.getElementById('map');

  const mapHeight = map.offsetHeight;
  const topOffset = 190; // to sit below the "Sites" button
  const padding = 20;

  sidebar.style.top = `${topOffset}px`;
  sidebar.style.maxHeight = `${mapHeight - topOffset - padding}px`;
});



const map = L.map("map").setView([7.8731, 80.7718], 7); // Sri Lanka center
const defaultCenter = [7.8731, 80.7718];
const defaultZoom = 7;

// Base tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Marker group
const markerLayer = L.layerGroup().addTo(map);

// Google Sheets CSV export URL
const sheetURL = 'https://docs.google.com/spreadsheets/d/1QnM5FKyaFKYsLUxz2FO-k4dfBUvghDBJ1IIb-0FMgf4/gviz/tq?tqx=out:csv';

// Create sidebar + toggle
// Reference the existing sidebar in HTML
const sidebar = document.getElementById("sidebar");

// Create close button
const closeBtn = document.createElement("button");
closeBtn.id = "closeSidebar";
closeBtn.innerHTML = "×";
sidebar.appendChild(closeBtn);

closeBtn.addEventListener("click", () => {
  sidebar.classList.remove("open");
});

const toggleBtn = document.createElement("button");
toggleBtn.id = "toggleSidebar";
toggleBtn.innerText = "☰ Sites";
document.getElementById("map").appendChild(toggleBtn);

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("open");
  document.body.classList.toggle("sidebar-open");
});

// Add home button
const homeBtn = L.control({ position: 'topleft' });
homeBtn.onAdd = function (map) {
  const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-home');
  div.innerHTML = '⌂';
  div.title = 'Reset View';
  div.onclick = function () {
    map.setView(defaultCenter, defaultZoom);
  };
  return div;
};
homeBtn.addTo(map);

// Fetch and plot data
fetch(sheetURL)
  .then(response => response.text())
  .then(csvText => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transform: value => value.trim(), // Clean stray whitespace
      complete: function(results) {
        // Add legend to sidebar
        const legend = document.createElement("div");
        legend.id = "legend";
        legend.innerHTML = `
          <strong>Legend</strong><br>
          <span style="color: var(--sand-mining-color)">●</span> Sand Mining<br>
          <span style="color: var(--land-military-fill)">●</span> Land Grabbing (Military)<br>
          <span style="color: var(--land-tourism-fill)">●</span> Land Grabbing (Tourism)
        `;
        sidebar.appendChild(legend);

        results.data.forEach(row => {
          const lat = parseFloat(row.latitude);
          const lng = parseFloat(row.longitude);

          if (!isNaN(lat) && !isNaN(lng)) {
            const markerOptions = getMarkerStyle(row.category, row.type);

            const marker = L.circleMarker([lat, lng], markerOptions)
              .addTo(markerLayer)
              .bindPopup(
                `<strong>${row.name}</strong><br>
                 <em>${row.category}${row.type ? ' – ' + row.type : ''}</em><br>
                 <strong>Location:</strong> ${row.location}<br>
                 <strong>Actors:</strong> ${row.actors}<br>
                 <strong>Status:</strong> ${row.status}`
              );

            // Add to sidebar
            const entry = document.createElement("div");
            entry.className = "site-entry";
            entry.innerHTML = `<strong>${row.name}</strong><br>${row.type}<br><small>${row.category}</small>`;
            entry.addEventListener("click", () => {
              map.setView([lat, lng], 12);
              marker.openPopup();
              sidebar.classList.remove("open");
            });
            sidebar.appendChild(entry);
          } else {
            console.warn("Invalid coordinates for row:", row);
          }
        });
      }
    });
  });

// Color logic
function getMarkerStyle(category, type) {
  if (category.toLowerCase() === "sand mining") {
    return {
      radius: 8,
      fillColor: "var(--sand-mining-color)",
      color: "#222",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    };
  }

  if (category.toLowerCase() === "land grabbing") {
    let fill = "var(--land-tourism-fill)";
    if (type.toLowerCase().includes("military")) {
      fill = "var(--land-military-fill)";
    }
    return {
      radius: 8,
      fillColor: fill,
      color: "var(--land-outline)",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    };
  }

  // Default marker style
  return {
    radius: 6,
    fillColor: "gray",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.6
  };




}
