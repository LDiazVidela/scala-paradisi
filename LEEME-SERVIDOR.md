# El servidor de Scala · paso 1: tu progreso en la nube

Este primer paso del servidor sirve para una sola cosa: **guardar el progreso en la nube**.
Así cada chico puede seguir jugando y rezando desde otro teléfono o desde la compu, sin perder nada.

- No pide mail ni contraseña: cada uno recibe un **código** (por ejemplo `K7QM-3XRA-PL9D`).
  Con ese código recupera todo en otro dispositivo.
- Corre **gratis** en Cloudflare (alcanza para miles de usuarios).
- Mientras no lo prendas, la app funciona igual que ahora: guarda todo en el teléfono.

Los pasos que siguen (ranking entre amigos, peregrinos que se ven en el mapa, avisos) se van a sumar
a este mismo servidor más adelante.

## Prenderlo (una sola vez, unos 15 minutos)

1. **Crear la cuenta.** Entrá a [dash.cloudflare.com](https://dash.cloudflare.com) y creá una cuenta gratis.
2. **Crear la base de datos.** En el menú: **Storage & Databases → D1 SQL Database → Create**.
   Ponele de nombre `scala` y creala.
3. **Crear el servidor.** En el menú: **Compute (Workers) → Workers & Pages → Create → Create Worker**.
   Ponele de nombre `scala-servidor` y tocá **Deploy**.
4. **Pegar el código.** Tocá **Edit code**. Borrá todo lo que aparece, pegá el contenido del archivo
   `servidor/worker.js` de esta carpeta y tocá **Deploy**.
5. **Conectar la base de datos.** Volvé al Worker → pestaña **Settings → Bindings → Add → D1 database**.
   En *Variable name* escribí exactamente `DB` y elegí la base `scala`. Guardá (**Deploy**).
6. **Probarlo.** Arriba aparece la dirección del Worker, algo como
   `https://scala-servidor.tu-usuario.workers.dev`. Abrí esa dirección agregándole `/salud` al final.
   Si ves `{"ok":true,...}`, el servidor anda.
7. **Avisarle a la app.** En tu repositorio de GitHub abrí el archivo `servidor.json`, tocá el lápiz
   para editarlo y poné la dirección (sin `/salud`):

   ```json
   {"url":"https://scala-servidor.tu-usuario.workers.dev"}
   ```

   Guardá con **Commit changes**. En un par de minutos la app ya lo usa.

## Cómo lo usan los chicos

En la app: **Alma → Ajustes → Tu progreso en la nube → Activar**. Les aparece su código: conviene
que lo anoten. En otro dispositivo, en el mismo lugar, escriben el código y tocan **Usar**.

Desde ahí, cada cambio se sube solo a los veinte segundos (o al salir de la app). Si usaron dos
dispositivos a la vez sin conexión, la app les pregunta con cuál progreso seguir y guarda el otro como copia.

## Sobre los datos

El progreso sale **cifrado** del teléfono con el código de cada chico (AES-256). El servidor guarda
algo que no puede leer: ni vos, ni Cloudflare, ni nadie que entre a la base de datos puede ver nombres,
diarios ni oraciones. Solo quien tiene el código puede abrir ese progreso.

Por eso mismo, **si alguien pierde su código, no hay forma de recuperarlo**: conviene que lo anoten
en un lugar seguro (y que no lo compartan).
