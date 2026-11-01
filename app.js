// Mapa El Niño Perú
// Color = qué pasó (tipo de fenómeno). Forma = qué tan segura es la fuente. Tamaño = gravedad.
const LIMA = [[-12.52,-77.20],[-11.70,-76.62]];
const PERU = [[-18.4,-81.4],[0.1,-68.6]];

// Categorías de fenómeno: color y tipos que agrupan
const CATS = {
  agua:     {nombre:"Agua: inundación, aniego, desborde, desagüe", color:"#1e6fd9", tipos:["inundacion","desague","rio"]},
  huaico:   {nombre:"Huaico o deslizamiento", color:"#8b5a2b", tipos:["huaico","deslizamiento"]},
  incendio: {nombre:"Incendio", color:"#d62828", tipos:["incendio"]},
  sismo:    {nombre:"Sismo", color:"#7b2cbf", tipos:["sismo"]},
  volcan:   {nombre:"Volcán, tormenta u otro fenómeno", color:"#e07a00", tipos:["volcan","tormenta","otro"]},
  colapso:  {nombre:"Colapso de vivienda o edificio", color:"#222222", tipos:["colapso"]},
  via:      {nombre:"Vía cortada", color:"#6c757d", tipos:["via"]},
};
const TYPES = {inundacion:"Inundación o aniego", huaico:"Huaico", deslizamiento:"Deslizamiento", desague:"Desagüe que rebalsa",
  colapso:"Edificio o vivienda dañada", via:"Vía cortada", rio:"Desborde de río", incendio:"Incendio",
  sismo:"Sismo", volcan:"Volcán", tormenta:"Tormenta", otro:"Otro"};
const FIAB = {
  oficial: {texto:"Confirmado por una entidad oficial o un sensor."},
  prensa:  {texto:"Publicado por un medio de prensa serio, aún sin confirmación oficial."},
  vecinos: {texto:"Reporte de vecinos o redes, aún sin confirmar."},
  riesgo:  {texto:"Zona con riesgo conocido. No significa que haya un problema ahora."},
};
const catOf = tipo => Object.keys(CATS).find(c => CATS[c].tipos.includes(tipo)) || "volcan";

const map = L.map("map").fitBounds(LIMA);
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

const catLayers = {}; Object.keys(CATS).forEach(c => catLayers[c] = L.layerGroup().addTo(map));
const riskLayer = L.layerGroup().addTo(map);
const districts = L.layerGroup(); // apagado por defecto: los límites son aproximados
const labels = L.layerGroup().addTo(map);
L.control.layers(bases, {"Zonas de riesgo": riskLayer, "Límites de distritos": districts, "Nombres de distritos": labels},
  {collapsed: window.innerWidth < 820, position:"topright"}).addTo(map);
L.control.scale({imperial:false}).addTo(map);

const counts = {}; Object.keys(CATS).forEach(c => counts[c] = 0);
let riskCount = 0;
function esc(s){ return String(s ?? "").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function fmtDate(v){
  if(!v) return "";
  const withTime = typeof v === "number" || /T/.test(v);
  const d = typeof v === "number" ? new Date(v) : new Date(withTime ? v : v+"T12:00:00");
  const opts = {day:"numeric", month:"long", year:"numeric"};
  if(withTime) Object.assign(opts, {hour:"2-digit", minute:"2-digit"});
  return d.toLocaleString("es-PE", opts);
}

function showDetail(p){
  const cat = catOf(p.tipo), f = FIAB[p.fiabilidad] || FIAB.prensa;
  let h = `<h2>Detalle</h2><div class="card">`;
  if(p.imagen) h += `<figure class="photo"><a href="${esc(p.url||p.imagen)}" target="_blank" rel="noopener"><img src="${esc(p.imagen)}" alt="${esc(p.titulo)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('figure').remove()"></a>${p.credito_imagen?`<figcaption>Foto: ${esc(p.credito_imagen)}</figcaption>`:""}</figure>`;
  h += `<div class="title"><span class="sym" style="--c:${CATS[cat].color}" data-f="${esc(p.fiabilidad)}"></span><b>${esc(p.titulo)}</b></div>`;
  h += `<p class="k">Qué pasó</p><div>${esc(TYPES[p.tipo] || p.tipo)}${p.magnitud?` · magnitud ${esc(p.magnitud)}`:""}</div>`;
  h += `<p class="k">Qué tan seguro</p><div>${esc(f.texto)}</div>`;
  if(p.fecha) h += `<p class="k">Fecha</p><div>${esc(fmtDate(p.fecha))}</div>`;
  if(p.descripcion) h += `<p class="k">Descripción</p><div>${esc(p.descripcion)}</div>`;
  h += `<p class="k">Fuente</p><div>${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.fuente)}</a>` : esc(p.fuente)}</div>`;
  if(!p.exacta) h += `<p class="k">Ubicación aproximada.</p>`;
  h += `</div>`;
  const box = document.getElementById("detail"); box.innerHTML = h;
  if(window.innerWidth < 820) box.scrollIntoView({behavior:"smooth"});
}

function addPoint(p){
  if(!isFinite(p.lat) || !isFinite(p.lon)) return;
  const cat = catOf(p.tipo), color = CATS[cat].color;
  if(p.fiabilidad === "riesgo"){
    // Zona de riesgo: mancha sombreada, no un punto
    L.circle([p.lat, p.lon], {radius: p.radio || 700, color, weight:1.5, dashArray:"4 4", fillColor:color, fillOpacity:.18})
      .bindTooltip("Zona de riesgo: " + esc(p.titulo)).on("click", ()=>showDetail(p)).addTo(riskLayer);
    riskCount++; return;
  }
  const r = p.magnitud ? Math.max(6, (p.magnitud - 2) * 4) : 9;
  const style = {
    oficial: {color:"#fff", weight:2, fillColor:color, fillOpacity:.95},
    prensa:  {color, weight:2.5, dashArray:"3 3", fillColor:color, fillOpacity:.75},
    vecinos: {color, weight:3, fillColor:"#fff", fillOpacity:.6},
  }[p.fiabilidad] || {color, weight:2, fillColor:color, fillOpacity:.75};
  L.circleMarker([p.lat, p.lon], {radius:r, ...style})
    .bindTooltip(esc(p.titulo)).on("click", ()=>showDetail(p)).addTo(catLayers[cat]);
  counts[cat]++;
}

function renderLegend(){
  document.getElementById("cats").innerHTML = Object.entries(CATS).map(([c,v]) =>
    `<label><input type="checkbox" data-c="${c}" ${map.hasLayer(catLayers[c])?"checked":""}><span class="sym" style="--c:${v.color}" data-f="oficial"></span><span>${v.nombre} <span class="n">${counts[c]}</span></span></label>`).join("");
  document.getElementById("risknum").textContent = riskCount;
  document.querySelectorAll("#cats input").forEach(cb => cb.addEventListener("change", ()=>{
    const l = catLayers[cb.dataset.c]; cb.checked ? l.addTo(map) : map.removeLayer(l);
  }));
}

// ---------- Nombres de distritos ----------
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
  const minArea = z >= 13 ? 0 : z >= 12 ? 0.0004 : z >= 11 ? 0.002 : 0.01;
  distData.forEach(d=>{
    if(d.c.area < minArea || !b.contains(d.c.latlng)) return;
    L.tooltip({permanent:true, direction:"center", className:"dist-label", interactive:false})
      .setLatLng(d.c.latlng).setContent(esc(d.n)).addTo(labels);
  });
}

// ---------- Fuentes automáticas (se leen al abrir el mapa) ----------
const feedStatus = {};
function setFeed(name, text){ feedStatus[name] = text; document.getElementById("feeds").innerHTML = Object.values(feedStatus).map(t=>`<div>${t}</div>`).join(""); }
const inPeru = (lon, lat) => lon > -82 && lon < -68 && lat > -19 && lat < 1;

// Sismos de los últimos 7 días, magnitud 2,5 o más (USGS)
async function loadSismos(){
  setFeed("usgs", "Sismos (USGS): cargando…");
  try{
    const j = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson").then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); });
    const list = j.features.filter(f=>inPeru(f.geometry.coordinates[0], f.geometry.coordinates[1]));
    list.forEach(f=>{
      const [lon,lat,depth] = f.geometry.coordinates, p = f.properties;
      addPoint({titulo:`Sismo M${p.mag.toFixed(1)}: ${p.place}`, tipo:"sismo", magnitud:+p.mag.toFixed(1), lat, lon, exacta:true,
        fecha:p.time, descripcion:`Profundidad: ${Math.round(depth)} km.`, fuente:"Servicio Geológico de EE. UU. (USGS)", url:p.url, fiabilidad:"oficial"});
    });
    setFeed("usgs", `Sismos de los últimos 7 días (USGS): ${list.length}`);
    renderLegend();
  }catch(e){ setFeed("usgs", "Sismos (USGS): no se pudo cargar"); }
}

// Incendios, volcanes, tormentas y otros eventos abiertos (NASA EONET)
const EONET_CAT = {wildfires:"incendio", volcanoes:"volcan", floods:"inundacion", landslides:"deslizamiento", severeStorms:"tormenta"};
async function loadEonet(){
  setFeed("eonet", "Incendios y otros eventos (NASA): cargando…");
  try{
    const url = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=60&bbox=-82,1,-68,-19";
    const j = await fetch(url).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); });
    let n = 0;
    (j.events||[]).forEach(ev=>{
      const g = ev.geometry[ev.geometry.length-1]; if(!g) return;
      let c = g.coordinates; while(Array.isArray(c[0])) c = c[0];
      const [lon, lat] = c; if(!inPeru(lon, lat)) return;
      const cat = (ev.categories[0]||{}).id;
      addPoint({titulo:ev.title, tipo:EONET_CAT[cat]||"otro", lat, lon, fecha:g.date, fuente:"NASA EONET",
        url:(ev.sources[0]||{}).url || ev.link, fiabilidad:"oficial", descripcion:(ev.categories[0]||{}).title});
      n++;
    });
    setFeed("eonet", `Incendios y otros eventos de los últimos 60 días (NASA): ${n}`);
    renderLegend();
  }catch(e){ setFeed("eonet", "Incendios y otros eventos (NASA): no se pudo cargar"); }
}

async function load(){
  const [riesgo, incidentes, distritos] = await Promise.all([
    fetch("data/zonas-riesgo.json").then(r=>r.json()),
    fetch("data/incidentes.json").then(r=>r.json()),
    fetch("data/distritos.json").then(r=>r.json()),
  ]);
  [...riesgo, ...incidentes].forEach(addPoint);
  renderLegend();
  L.geoJSON(distritos, {style:{color:"#555", weight:1, opacity:.5, fill:false}, interactive:false}).addTo(districts);
  distData = distritos.features.filter(f=>f.geometry).map(f=>({n:f.properties.n, c:centroid(f.geometry)})).filter(d=>d.c.latlng);
  updateLabels();
  loadSismos(); loadEonet();
}
map.on("moveend zoomend", updateLabels);
map.on("overlayadd", e=>{ if(e.layer === labels) updateLabels(); });
document.getElementById("limaBtn").onclick = ()=>map.flyToBounds(LIMA, {duration:.8});
document.getElementById("peruBtn").onclick = ()=>map.flyToBounds(PERU, {duration:.8});

load().catch(err=>{ document.getElementById("detail").innerHTML = `<p class="empty">No se pudieron cargar los datos: ${esc(err.message)}</p>`; });
