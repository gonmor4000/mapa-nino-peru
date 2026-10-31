# Mapa El Niño Perú

Mapa web de inundaciones, huaicos, desagües y daños durante el Fenómeno El Niño, empezando por Lima. Cada punto tiene un color según la fiabilidad de su fuente:

| Color | Significa |
| --- | --- |
| Verde | Confirmado por una entidad oficial o un sensor |
| Amarillo | Medio de prensa serio, o 3 o más vecinos |
| Naranja | Un solo reporte, aún sin confirmar |
| Gris | Zona de riesgo conocida, no un evento en curso |

Mapas base: calles (OpenStreetMap), relieve (OpenTopoMap), satélite (Esri) y noche (CARTO).

## Datos

- `data/incidentes.json`: eventos ocurridos, con fuente y fecha.
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
