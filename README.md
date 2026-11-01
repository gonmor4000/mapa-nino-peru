# Mapa El Niño Perú

Mapa web de inundaciones, huaicos, desagües, incendios, sismos y otros fenómenos durante El Niño, empezando por Lima.

- **Color = qué pasó:** azul agua, marrón huaico o deslizamiento, rojo incendio, morado sismo, naranja volcán u otro fenómeno, negro colapso, gris vía cortada.
- **Forma = qué tan seguro:** punto lleno si es oficial o de un sensor, borde punteado si viene de prensa, hueco si es un reporte sin confirmar. Las zonas de riesgo son manchas sombreadas.
- **Tamaño = gravedad:** en los sismos, la magnitud.

Mapas base: calles (OpenStreetMap), relieve (OpenTopoMap), satélite (Esri) y noche (CARTO).

## Datos

- `data/incidentes.json`: eventos ocurridos, con fuente, fecha, `fiabilidad` (oficial, prensa o vecinos) y, si hay, `imagen` y `credito_imagen`.
- Sismos (USGS) e incendios, volcanes y otros eventos (NASA EONET) se leen automáticamente al abrir el mapa.
- `data/zonas-riesgo.json`: zonas de riesgo conocidas (CENEPRED y prensa).
- `data/distritos.json`: nombres y límites aproximados de los distritos del Perú.

Para agregar un punto, añade un objeto al archivo correspondiente con `titulo`, `lat`, `lon`, `tipo`, `color`, `fuente` y `url`.

## Publicarlo gratis con GitHub Pages

1. En GitHub, abre **Settings → Pages** del repositorio.
2. En **Source**, elige *Deploy from a branch*, rama `main` y carpeta `/ (root)`.
3. Guarda. En uno o dos minutos el mapa queda en `https://<usuario>.github.io/<repositorio>/`.

GitHub Pages es gratis para repositorios públicos.

## Próximos pasos

- Reportes de vecinos compartidos (necesita una base de datos, por ejemplo Supabase en su plan gratuito).
- Actualización automática de incidentes desde fuentes oficiales y prensa.
- Para mucho tráfico, usar un proveedor de mapas con plan gratuito (MapTiler o Stadia), según la política de uso de las teselas de OpenStreetMap.
