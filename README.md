# Actas abiertas ERM 2026

Buscador independiente, en español, de las actas de proclamación de las Elecciones Regionales y Municipales 2026. Lo publica Planitec Perú (Mg. Fiorela Aguilar Merma). No es un sitio del Jurado Nacional de Elecciones ni usa su identidad.

Cada fila del listado público es un evento de un jurado electoral especial, no una municipalidad. El departamento, la provincia y el distrito se leen del PDF. Por eso Challabamba (Paucartambo, Cusco) puede aparecer bajo el JEE Quispicanchi.

## Qué muestra

- Búsqueda libre que ignora tildes, y filtros departamento, provincia y distrito.
- Enlace al PDF en el portal de origen. Este sitio no realoja las actas.
- Alcalde electo solo cuando el acta lo proclama, sin número de DNI.
- De los ámbitos esperados, cuántos tienen acta ubicada. El porcentaje nacional solo aparece cuando la lectura del listado y de los PDF está cerrada y el padrón cuadra. Si no, dice que el total está pendiente de verificar.
- Una fila con fecha futura y sin PDF no se presenta como proclamación.
- Las actas regionales descentralizadas no se cuentan como proclamación del gobernador.
- El distrito capital de provincia no se trata como municipalidad distrital.
- Si una lectura falla, se conserva el último índice válido. No se muestran ceros falsos.

## Fuentes

- Listado público: página [Proclamación de resultados ERM 2026](https://portal.jne.gob.pe/portal/Pagina/ProclamacionResultadoERM) y su POST declarado `Lista_ProclamacionResultadosERM`.
- PDF: `https://portal.jne.gob.pe/portal_documentos/files/{ruta}`.
- Denominador 2026, coincidente en tres fuentes oficiales: 25 gobiernos regionales, 196 municipalidades provinciales y 1 696 distritales.
  - JNE, INFOgob Serie ERM 2026, Reporte N.° 1.
  - ONPE, nota del 4 de octubre de 2026.
  - INEI, Directorio nacional de municipalidades 2026 (solo el conteo; las autoridades de ese PDF son las vigentes al 13 de marzo de 2026).
- Territorio: archivo INEI de ubigeos 2022, 1 891 distritos, en la Plataforma Nacional de Datos Abiertos. Santa Rosa de Loreto (Ley N.° 32403) se agrega sin código porque ese archivo no lo trae. Alto Trujillo sí está (130112).

No se usa el buscador de autoridades proclamadas ni ninguna API no documentada.

## Cómo correrlo

Hace falta Node.js 22.

```bash
npm install
npm test
npm run serve
```

`npm run serve` levanta el indexador y el sitio en [http://127.0.0.1:43123](http://127.0.0.1:43123). También puede correr `npm run index` en una terminal y `npm run dev` en otra.

La revisión vuelve a leer el listado cada 30 minutos (`INDEX_INTERVAL_MINUTES`) y espera unos 900 ms entre PDF (`INDEX_DELAY_MS`). Eso ocurre en el proceso del indexador: no depende de tener el navegador abierto. Si la fuente responde con un bloqueo o un desafío, esa pasada se detiene y se conserva lo ya leído. En producción, `npm run build` y luego `npm run serve:prod`.

La primera pasada nacional de PDF puede durar más que esos 30 minutos. Recién las siguientes se limitan a filas nuevas.

## Datos en disco

- `data/ubigeo.json`: ubigeos del archivo INEI.
- `data/raw/listing-observed-2026-11-05.json`: listado observado el 5 de noviembre de 2026.
- `data/snapshot.json`, `data/state.json` y `data/manifest.json`: índice vivo. No guardan el texto del PDF ni DNI.

## Despliegue

Este repositorio no contrata hosting ni crea cuentas. Para dejarlo encendido hace falta una máquina con Node 22 que no se suspenda, disco persistente para `data/` y:

```bash
npm install
npm run build
npm start
```

Si el proceso se apaga, la actualización se detiene. Un vistazo estático del código no sigue leyendo al JNE.
