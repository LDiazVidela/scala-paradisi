/* Servidor de Scala · paso 1: tu progreso en la nube (para usar la app en varios dispositivos)
   El progreso llega cifrado desde el teléfono: el servidor guarda algo que no puede leer.
   Corre gratis en Cloudflare Workers con una base de datos D1. Instrucciones en LEEME-SERVIDOR.md */
const VERSION = 2;
const MAX_BYTES = 900 * 1024;   // un respaldo cifrado no puede pesar más que esto

function cors(origen) {
  return {
    "Access-Control-Allow-Origin": origen || "*",
    "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}
function json(obj, estado, origen) {
  return new Response(JSON.stringify(obj), { status: estado || 200, headers: { "Content-Type": "application/json; charset=utf-8", ...cors(origen) } });
}
const idValido = id => /^[0-9a-f]{40}$/.test(id || "");
async function tabla(db) {
  await db.prepare("CREATE TABLE IF NOT EXISTS respaldos (id TEXT PRIMARY KEY, datos TEXT NOT NULL, t INTEGER NOT NULL, dispositivo TEXT, creado INTEGER NOT NULL)").run();
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), origen = req.headers.get("Origin") || "*";
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origen) });
    if (!env.DB) return json({ ok: false, error: "Falta conectar la base de datos (DB) al Worker." }, 500, origen);
    try {
      await tabla(env.DB);
      const partes = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
      if (partes[0] === "salud") return json({ ok: true, version: VERSION, app: "scala" }, 200, origen);
      if (partes[0] !== "respaldo") return json({ ok: false, error: "No existe" }, 404, origen);
      const id = (partes[1] || "").toLowerCase();
      if (!idValido(id)) return json({ ok: false, error: "Código inválido" }, 400, origen);

      if (req.method === "GET") {
        const fila = await env.DB.prepare("SELECT datos,t,dispositivo FROM respaldos WHERE id=?").bind(id).first();
        if (!fila) return json({ ok: false, error: "No hay nada guardado con ese código" }, 404, origen);
        return json({ ok: true, t: fila.t, dispositivo: fila.dispositivo, c: fila.datos }, 200, origen);
      }
      if (req.method === "PUT") {
        const texto = await req.text();
        if (texto.length > MAX_BYTES) return json({ ok: false, error: "El respaldo es demasiado grande" }, 413, origen);
        let b; try { b = JSON.parse(texto); } catch (e) { return json({ ok: false, error: "No es un respaldo válido" }, 400, origen); }
        if (!b || typeof b.c !== "string" || b.c.length < 20) return json({ ok: false, error: "Falta el progreso" }, 400, origen);
        const ahora = Date.now(), t = Math.min(ahora + 60000, Number(b.t) || ahora), disp = String(b.dispositivo || "").slice(0, 40);
        const existe = await env.DB.prepare("SELECT t FROM respaldos WHERE id=?").bind(id).first();
        if (!existe) {
          await env.DB.prepare("INSERT INTO respaldos (id,datos,t,dispositivo,creado) VALUES (?,?,?,?,?)").bind(id, b.c, t, disp, ahora).run();
          return json({ ok: true, t: t, nuevo: true }, 200, origen);
        }
        if (b.base !== undefined && existe.t > Number(b.base) && !b.forzar)
          return json({ ok: false, conflicto: true, t: existe.t, error: "Hay una versión más nueva en otro dispositivo" }, 409, origen);
        await env.DB.prepare("UPDATE respaldos SET datos=?, t=?, dispositivo=? WHERE id=?").bind(b.c, t, disp, id).run();
        return json({ ok: true, t: t }, 200, origen);
      }
      return json({ ok: false, error: "Método no permitido" }, 405, origen);
    } catch (e) {
      return json({ ok: false, error: "Error del servidor" }, 500, origen);
    }
  },
};
