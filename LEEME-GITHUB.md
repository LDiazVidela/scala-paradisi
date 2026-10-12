# Publicar Scala en GitHub (con el Evangelio del día)

Esta carpeta es la app completa. Si la subís a GitHub, queda publicada gratis en un link propio
(por ejemplo `https://tu-usuario.github.io/scala/`). Además, una tarea automática de GitHub va a bajar
todos los días las lecturas de la Misa, y la app las va a mostrar con su propio diseño, sin depender de Claude.

## Una sola vez

1. **Crear el repositorio.** Entrá a github.com con tu cuenta y tocá **New repository**.
   Ponele de nombre `scala`, dejalo **Public** y creálo vacío.
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
   Cuando termine (tilde verde), vas a ver una carpeta `evangelio` con un archivo por día: `2026-10-12.json`, etc.
   Desde ahí se corre sola todos los días a la madrugada y deja listas las lecturas de las próximas cuatro semanas.

## En el celular

Abrí el link en Safari (iPhone) o Chrome (Android) y elegí **Agregar a pantalla de inicio**.
Queda como una app más, funciona sin conexión y el Evangelio del día aparece solo en el Oratorio.

## Para actualizar la app

Cuando te pase una versión nueva, subí de nuevo los archivos que cambiaron (sobre todo `index.html`)
con **Add file → Upload files**. La carpeta `evangelio` no hace falta tocarla.

## Sobre los textos

Las lecturas vienen de [Evangelizo.org](https://evangelizo.org), que usa *El Libro del Pueblo de Dios*.
Antes de difundir la app en forma pública, conviene escribirles para contarles el proyecto y pedir autorización
para mostrar los textos.
