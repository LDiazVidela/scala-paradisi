/* Servidor de Scala · paso 1: tu progreso en la nube (para usar la app en varios dispositivos)
   Paso 2 (v10.2): el gremio. Un gremio tiene un código de 6 letras; cada miembro manda su aporte TOTAL del mes contra el jefe
   (no sumas sueltas: mandar dos veces no cuenta doble) y el servidor devuelve el de todos. Hay un tope por día para que nadie haga trampa.
   El progreso llega cifrado desde el teléfono: el servidor guarda algo que no puede leer.
   Corre gratis en Cloudflare Workers con una base de datos D1. Instrucciones en LEEME-SERVIDOR.md */
const VERSION = 3;
const GR_MAX = 12;                 // miembros por gremio
const GR_TOPE_DIA = 0.12;         // nadie aporta más que el 12 % de la vida del jefe por cada día del mes que pasó
const GR_LET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_BYTES = 900 * 1024;   // un respaldo cifrado no puede pesar más que esto

function cors(origen) {
  return {
    "Access-Control-Allow-Origin": origen || "*",
    "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS",
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
  await db.prepare("CREATE TABLE IF NOT EXISTS gremios (id TEXT PRIMARY KEY, nombre TEXT NOT NULL, creado INTEGER NOT NULL)").run();
  await db.prepare("CREATE TABLE IF NOT EXISTS gmiembros (gremio TEXT NOT NULL, jugador TEXT NOT NULL, nombre TEXT, mes TEXT, jefe TEXT, d INTEGER NOT NULL DEFAULT 0, t INTEGER NOT NULL, PRIMARY KEY (gremio, jugador))").run();
}
const jugadorValido = j => /^[0-9a-f]{20}$/.test(j || "");
const codigoValido = c => /^[A-Z0-9]{6}$/.test(c || "");
const limpio = (t, n) => String(t || "").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, n);
function codigoNuevo() { const b = new Uint8Array(6); crypto.getRandomValues(b); return [...b].map(x => GR_LET[x % 32]).join(""); }
async function gremioEstado(db, id, jugador, mes, jefe) {
  const g = await db.prepare("SELECT id,nombre FROM gremios WHERE id=?").bind(id).first();
  if (!g) return null;
  const { results } = await db.prepare("SELECT jugador,nombre,mes,jefe,d,t FROM gmiembros WHERE gremio=? ORDER BY d DESC").bind(id).all();
  let tot = 0;
  const miembros = (results || []).map(r => { const vale = r.mes === mes && r.jefe === jefe, d = vale ? (r.d || 0) : 0; tot += d; return { n: r.nombre || "", d: d, yo: r.jugador === jugador }; });
  miembros.sort((a, b) => b.d - a.d);
  return { ok: true, id: g.id, nombre: g.nombre, miembros, tot };
}
async function gremio(req, env, partes, url, origen) {
  const db = env.DB;
  let b = {};
  if (req.method !== "GET") { try { b = JSON.parse(await req.text() || "{}"); } catch (e) { return json({ ok: false, error: "Pedido inválido" }, 400, origen); } }
  const jugador = String(b.jugador || url.searchParams.get("jugador") || "").toLowerCase();
  if (!jugadorValido(jugador)) return json({ ok: false, error: "Jugador inválido" }, 400, origen);
  /* crear: POST /gremio */
  if (partes.length === 1 && req.method === "POST") {
    const nombre = limpio(b.nombre, 24); if (nombre.length < 3) return json({ ok: false, error: "El nombre es muy corto" }, 400, origen);
    let id = codigoNuevo();
    for (let i = 0; i < 5 && await db.prepare("SELECT id FROM gremios WHERE id=?").bind(id).first(); i++) id = codigoNuevo();
    const ahora = Date.now();
    await db.prepare("INSERT INTO gremios (id,nombre,creado) VALUES (?,?,?)").bind(id, nombre, ahora).run();
    await db.prepare("INSERT OR REPLACE INTO gmiembros (gremio,jugador,nombre,mes,jefe,d,t) VALUES (?,?,?,?,?,?,?)").bind(id, jugador, limpio(b.jnombre, 24), "", "", 0, ahora).run();
    return json(await gremioEstado(db, id, jugador, "", ""), 200, origen);
  }
  const id = String(partes[1] || "").toUpperCase();
  if (!codigoValido(id)) return json({ ok: false, error: "Código inválido" }, 400, origen);
  const existe = await db.prepare("SELECT id FROM gremios WHERE id=?").bind(id).first();
  if (!existe) return json({ ok: false, error: "No encontramos un gremio con ese código." }, 404, origen);
  const accion = partes[2] || "";
  const yo = await db.prepare("SELECT jugador,d,mes,jefe FROM gmiembros WHERE gremio=? AND jugador=?").bind(id, jugador).first();
  if (accion === "unirse" && req.method === "POST") {
    if (!yo) {
      const n = await db.prepare("SELECT COUNT(*) AS n FROM gmiembros WHERE gremio=?").bind(id).first();
      if ((n && n.n) >= GR_MAX) return json({ ok: false, error: "Ese gremio ya tiene " + GR_MAX + " miembros." }, 409, origen);
      await db.prepare("INSERT INTO gmiembros (gremio,jugador,nombre,mes,jefe,d,t) VALUES (?,?,?,?,?,?,?)").bind(id, jugador, limpio(b.jnombre, 24), "", "", 0, Date.now()).run();
    }
    return json(await gremioEstado(db, id, jugador, "", ""), 200, origen);
  }
  if (!yo) return json({ ok: false, error: "No sos parte de ese gremio." }, 403, origen);
  if (accion === "salir" && req.method === "POST") {
    await db.prepare("DELETE FROM gmiembros WHERE gremio=? AND jugador=?").bind(id, jugador).run();
    const n = await db.prepare("SELECT COUNT(*) AS n FROM gmiembros WHERE gremio=?").bind(id).first();
    if (!n || !n.n) await db.prepare("DELETE FROM gremios WHERE id=?").bind(id).run();
    return json({ ok: true }, 200, origen);
  }
  if (accion === "aporte" && req.method === "PUT") {
    const mes = limpio(b.mes, 7), jefe = limpio(b.jefe, 24), max = Math.max(0, Math.min(1e7, Number(b.max) || 0));
    const hoy = new Date(), mesHoy = hoy.getUTCFullYear() + "-" + String(hoy.getUTCMonth() + 1).padStart(2, "0");
    const ayer = new Date(Date.now() - 36 * 3600e3), mesAyer = ayer.getUTCFullYear() + "-" + String(ayer.getUTCMonth() + 1).padStart(2, "0");
    if (!/^\d{4}-\d{2}$/.test(mes) || (mes !== mesHoy && mes !== mesAyer)) return json({ ok: false, error: "Mes inválido" }, 400, origen);
    const dia = mes === mesHoy ? hoy.getUTCDate() : 31, tope = Math.round(max * GR_TOPE_DIA * dia);
    const antes = yo.mes === mes && yo.jefe === jefe ? (yo.d || 0) : 0;
    const d = Math.max(antes, Math.min(Math.round(Number(b.d) || 0), tope));
    await db.prepare("UPDATE gmiembros SET nombre=?, mes=?, jefe=?, d=?, t=? WHERE gremio=? AND jugador=?").bind(limpio(b.jnombre, 24), mes, jefe, d, Date.now(), id, jugador).run();
    return json(await gremioEstado(db, id, jugador, mes, jefe), 200, origen);
  }
  if (req.method === "GET") return json(await gremioEstado(db, id, jugador, limpio(url.searchParams.get("mes"), 7), limpio(url.searchParams.get("jefe"), 24)), 200, origen);
  return json({ ok: false, error: "Método no permitido" }, 405, origen);
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
      if (partes[0] === "gremio") return await gremio(req, env, partes, url, origen);
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
