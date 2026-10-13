# Publicar Scala en GitHub (web y celular, con el Evangelio del día)

Esta carpeta es la app completa. Subida a GitHub queda publicada gratis en un link propio
(por ejemplo `https://tu-usuario.github.io/scala/`). Ese mismo link sirve para las dos formas de usarla:

- **En la compu o la tablet** se ve a lo ancho: menú al costado y el juego grande, con teclado.
- **En el celular** se ve vertical y se puede instalar como una app más (funciona sin conexión).

Además, una tarea automática de GitHub baja todos los días las lecturas de la Misa del próximo mes,
y la app las muestra con su propio diseño, sin depender de Claude.

## Una sola vez

1. **Crear el repositorio.** Entrá a github.com con tu cuenta y tocá **New repository**.
   Ponele de nombre `scala`, dejalo **Public** y crealo vacío.
2. **Subir los archivos.** En el repositorio nuevo, tocá **uploading an existing file** y arrastrá
   *todo lo que hay adentro* de esta carpeta (no la carpeta en sí). Confirmá con **Commit changes**.
   - Ojo: la carpeta `.github` empieza con un punto y en Mac queda oculta. Si después no la ves en GitHub,
     creala a mano: **Add file → Create new file**, escribí como nombre `.github/workflows/evangelio.yml`
     y pegá adentro el contenido del archivo `evangelio.yml` de esta carpeta.
3. **Prender la página.** En el repositorio: **Settings → Pages**. En *Source* elegí **Deploy from a branch**,
   rama **main** y carpeta **/(root)**. Guardá. En un par de minutos aparece arriba el link de tu app.
4. **Dar permiso a la tarea del Evangelio.** **Settings → Actions → General**, abajo de todo en
   *Workflow permissions* elegí **Read and write permissions** y guardá.
5. **Correrla la primera vez.** Pestaña **Actions → Evangelio del día → Run workflow**.
   Cuando termine (tilde verde), vas a ver una carpeta `evangelio` con un archivo por día
   (`2026-10-12.json`, etc.) y un `indice.json` que dice hasta qué día hay lecturas.

## Cómo se mantiene actualizado el Evangelio

- La tarea corre sola **dos veces por día** y deja listas las lecturas de **los próximos 30 días**.
  Cada día que pasa se agrega uno nuevo al final, así que siempre hay un mes por delante.
- No se pueden cargar varios meses de una vez: Evangelizo publica las lecturas con un mes de anticipación.
  Por eso la tarea va corriendo la ventana todos los días, sola.
- En la app, en **Oratorio → Lecturas**, abajo dice *«Lecturas listas hasta el …»*. Si ese día está cerca
  de hoy, entrá a **Actions** y mirá si la tarea tiene una cruz roja.
- Si GitHub alguna vez muestra el aviso *«This scheduled workflow is disabled»*, entrá a **Actions →
  Evangelio del día** y tocá **Enable workflow**. Con eso vuelve a correr sola.
- Si algún día no hay archivo (por ejemplo, porque falló la tarea), la app ofrece abrir el Evangelio
  en Vatican News y pegarlo, como antes.

## En el celular

Abrí el link en Safari (iPhone) o Chrome (Android) y elegí **Agregar a pantalla de inicio**.
Queda como una app más, a pantalla completa. La app guarda las lecturas de la semana siguiente
para poder leerlas sin conexión.

## En la compu

Abrí el link en Chrome o Edge. A la derecha de la barra de direcciones aparece el ícono de **Instalar**:
queda como un programa con su propia ventana. Se juega con las flechas o W A S D, la barra espaciadora
hace lo que dice el botón y la M abre el mapa.

## Para actualizar la app

Cuando te pase una versión nueva, subí de nuevo los archivos que cambiaron (sobre todo `index.html`
y `sw.js`) con **Add file → Upload files**. La carpeta `evangelio` no hace falta tocarla.
Al abrirla con internet, la app se actualiza sola.

## Sobre los textos

Las lecturas vienen de [Evangelizo.org](https://evangelizo.org), que usa *El Libro del Pueblo de Dios*.
Antes de difundir la app en forma pública, conviene escribirles para contarles el proyecto y pedir autorización
para mostrar los textos.
