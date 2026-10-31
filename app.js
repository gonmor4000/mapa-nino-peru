// Mapa El Niño Perú: mapa base de OpenStreetMap y capas de puntos por fiabilidad.
const COLORS = {verde:"#1f9d55", amarillo:"#e0a800", naranja:"#e8590c", gris:"#8a8a8a"};
const TYPES = {inundacion:"Inundación o aniego", huaico:"Huaico", desague:"Desagüe que rebalsa",
  colapso:"Edificio o vivienda dañada", via:"Vía cortada", rio:"Desborde de río", incendio:"Incendio", otro:"Otro"};
const LIMA = [[-12.52,-77.20],[-11.70,-76.62]];
const PERU = [[-18.4,-81.4],[0.1,-68.6]];

const map = L.map("map", {zoomControl:true}).fitBounds(LIMA);

const bases = {
  "Calles (OpenStreetMap)": L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}),
  "Relieve (OpenTopoMap)": L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {maxZoom:17,
    attribution:'&copy; OpenStreetMap, SRTM | <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'}),
  "Satélite (Esri)": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {maxZoom:19,
    attribution:"Imágenes &copy; Esri, Maxar, Earthstar Geographics"}),
  "Noche (CARTO)": L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {maxZoom:19,
    attribution:'&copy; OpenStreetMap &copy; <a href="https://carto.com/attributions">CARTO</a>'}),
};
bases["Calles (OpenStreetMap)"].addTo(map);

const layers = {verde:L.layerGroup(), amarillo:L.layerGroup(), naranja:L.layerGroup(), gris:L.layerGroup()};
Object.values(layers).forEach(l=>l.addTo(map));
const districts = L.layerGroup(); // apagado por defecto: los límites son aproximados y no calzan exacto con las calles
const labels = L.layerGroup().addTo(map);
L.control.layers(bases, {"Límites de distritos": districts, "Nombres de distritos": labels}, {collapsed:false, position:"topright"}).addTo(map);
L.control.scale({imperial:false}).addTo(map);

const counts = {verde:0, amarillo:0, naranja:0, gris:0};
function esc(s){ return String(s ?? "").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function fmtDate(iso){ if(!iso) return ""; const d = new Date(iso+"T12:00:00"); return d.toLocaleDateString("es-PE",{day:"numeric",month:"long",year:"numeric"}); }

function showDetail(p){
  let h = `<h2>Detalle</h2><div class="card"><div style="display:flex;gap:8px;align-items:center"><span class="dot ${p.color}"></span><b>${esc(p.titulo)}</b></div>`;
  h += `<p class="k">Tipo</p><div>${esc(TYPES[p.tipo] || p.tipo)}</div>`;
  if(p.color === "gris") h += `<p class="k">Qué es</p><div>Zona con riesgo conocido. No significa que haya un problema ahora.</div>`;
  if(p.fecha) h += `<p class="k">Fecha del evento</p><div>${fmtDate(p.fecha)}</div>`;
  if(p.descripcion) h += `<p class="k">Descripción</p><div>${esc(p.descripcion)}</div>`;
  h += `<p class="k">Fuente</p><div>${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.fuente)}</a>` : esc(p.fuente)}</div>`;
  h += `<p class="k">Ubicación aproximada.</p></div>`;
  document.getElementById("detail").innerHTML = h;
}
function addPoint(p){
  if(!layers[p.color] || !isFinite(p.lat) || !isFinite(p.lon)) return;
  const risk = p.color === "gris";
  L.circleMarker([p.lat, p.lon], {radius: risk?7:9, color:"#fff", weight:2, dashArray: risk?"3 3":null,
    fillColor: COLORS[p.color], fillOpacity: risk?0.55:0.95})
    .bindTooltip(esc(p.titulo)).on("click", ()=>showDetail(p)).addTo(layers[p.color]);
  counts[p.color]++;
}
function renderCounts(){
  document.getElementById("counts").innerHTML = Object.keys(counts)
    .map(c=>`<span><span class="dot ${c}" style="width:9px;height:9px"></span> ${counts[c]} ${c}</span>`).join("");
}

// Centro aproximado de un polígono (anillo exterior del polígono más grande)
function centroid(geom){
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  let best = null, bestA = 0;
  for(const poly of polys){
    const r = poly[0]; let a = 0, cx = 0, cy = 0;
    for(let i=0, j=r.length-1; i<r.length; j=i++){ const f = r[j][0]*r[i][1] - r[i][0]*r[j][1]; a += f; cx += (r[j][0]+r[i][0])*f; cy += (r[j][1]+r[i][1])*f; }
    if(Math.abs(a) > bestA){ bestA = Math.abs(a); best = [cy/(3*a), cx/(3*a)]; }
  }
  return {latlng: best, area: bestA/2};
}
let distData = [];
function updateLabels(){
  labels.clearLayers();
  const z = map.getZoom(); if(z < 10) return;
  const b = map.getBounds().pad(0.1);
  const minArea = z >= 13 ? 0 : z >= 12 ? 0.0004 : z >= 11 ? 0.002 : 0.01; // grados²
  distData.forEach(d=>{
    if(d.c.area < minArea || !b.contains(d.c.latlng)) return;
    L.tooltip({permanent:true, direction:"center", className:"dist-label", interactive:false})
      .setLatLng(d.c.latlng).setContent(esc(d.n)).addTo(labels);
  });
}

async function load(){
  const [riesgo, incidentes, distritos] = await Promise.all([
    fetch("data/zonas-riesgo.json").then(r=>r.json()),
    fetch("data/incidentes.json").then(r=>r.json()),
    fetch("data/distritos.json").then(r=>r.json()),
  ]);
  [...riesgo, ...incidentes].forEach(addPoint);
  renderCounts();
  L.geoJSON(distritos, {style:{color:"#555", weight:1, opacity:.5, fill:false}, interactive:false}).addTo(districts);
  distData = distritos.features.filter(f=>f.geometry).map(f=>({n:f.properties.n, c:centroid(f.geometry)})).filter(d=>d.c.latlng);
  updateLabels();
}
map.on("moveend zoomend", updateLabels);
map.on("overlayadd", e=>{ if(e.layer === labels) updateLabels(); });

document.querySelectorAll(".legend input").forEach(cb=>cb.addEventListener("change", ()=>{
  const l = layers[cb.dataset.c]; cb.checked ? l.addTo(map) : map.removeLayer(l);
}));
document.getElementById("limaBtn").onclick = ()=>map.flyToBounds(LIMA, {duration:.8});
document.getElementById("peruBtn").onclick = ()=>map.flyToBounds(PERU, {duration:.8});

load().catch(err=>{ document.getElementById("detail").innerHTML = `<p class="empty">No se pudieron cargar los datos: ${esc(err.message)}</p>`; });
