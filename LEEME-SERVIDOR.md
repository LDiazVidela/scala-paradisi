# El servidor de Scaeli · paso 1: tu progreso en la nube · paso 2: el gremio

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

## Paso 2: el gremio (versión 10.2)

Desde la 10.2 el jefe del mes tiene **cinco veces más vida** y solo se le gana **con el gremio**: un grupo
de hasta 12 amigos que suman el daño que cada uno le hace. El que lo arma recibe un **código de 6 letras**
(por ejemplo `8XRRFU`) y se lo pasa a sus amigos; ellos lo escriben en **Jugar → Jefe → Unirme**.
Cuando entre todos le sacan toda la vida, cada uno se lleva el premio y un **arma exclusiva** de ese jefe
(un trofeo que no se forja ni se compra).

El gremio usa **el mismo servidor** del paso 1. Si ya lo prendiste, alcanza con actualizar el código:

1. En Cloudflare abrí el Worker `scala-servidor` → **Edit code**.
2. Borrá todo, pegá el contenido nuevo de `servidor/worker.js` (dice `VERSION = 3` arriba) y tocá **Deploy**.
3. Probalo: la dirección del Worker con `/salud` al final tiene que decir `"version":3`.

No hace falta tocar la base de datos ni el `servidor.json`: las tablas nuevas se crean solas, con la
misma conexión `DB`. Si todavía no prendiste el servidor, hacé el paso 1 con este `worker.js` y listo.

Mientras el servidor no esté prendido, la app avisa en la tarjeta del gremio que todavía no se puede
armar uno (y el jefe no se puede vencer solo). En la versión de prueba que abrís desde Claude (el
Artifact), el gremio anda sin este servidor: se guarda en la página misma y lo pueden usar quienes
tengan acceso a esa página.

**Qué guarda del gremio:** el nombre del gremio, un número al azar que identifica a cada jugador
(no es su código de la nube), el nombre que puso en la app y cuánto daño le hizo al jefe este mes.
Eso lo ven los demás del mismo gremio. Nada más: ni diarios, ni oraciones, ni progreso.
El servidor no deja anotar más daño del que se puede hacer en un día, y el último que sale de un
gremio lo borra.

