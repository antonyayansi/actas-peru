# Despliegue

Este proyecto es Next.js. cPanel solo puede servir un sitio estático y no ejecuta el servidor ni el indexador. El despliegue previsto es un VPS con Node.js 22.

No subas el proyecto por FTP a cPanel salvo que la titular lo pida de nuevo. Las claves de ese FTP, si existen, están solo en `.env`. Ese archivo no se commitea, no entra en `dist` y no se copia al servidor dentro del código. La plantilla sin secretos es `.env.example`.

## VPS

En el servidor, con el código y la carpeta `data/`:

```bash
npm install
npm test
npm run build
npm run serve:prod
```

`serve:prod` deja el sitio en el puerto 43123 y el indexador leyendo el listado público cada 30 minutos. Hace falta un proceso que no se suspenda y disco persistente para `data/`. Si el proceso se apaga, la lectura se detiene y el sitio conserva el último índice que haya en disco.

## Copia estática, solo si se pide

`node scripts/build-dist.mjs` genera `dist/` con la consulta ya armada en `datos/indice.json`. Esa copia no sigue leyendo actas nuevas. `node scripts/publicar.mjs` la comprime como `Archive.zip` y la envía por FTPS al cPanel usando `.env`. No lo hagas en cada cambio.
