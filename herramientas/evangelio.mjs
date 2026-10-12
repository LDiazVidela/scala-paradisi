// Scala · trae las lecturas de la Misa de los próximos días desde Evangelizo.org
// y deja un archivo por día en evangelio/AAAA-MM-DD.json, para que la app las lea sin internet de terceros.
// Lo corre GitHub Actions todos los días (ver .github/workflows/evangelio.yml).
import { mkdir, writeFile, readdir, unlink, access } from "node:fs/promises";

const BASE = process.env.EVANGELIZO_URL || "https://feed.evangelizo.org/v2/reader.php";
const DIAS = Math.min(29, Number(process.env.DIAS || 28)); // Evangelizo da hasta 30 días hacia adelante
const GUARDAR_DIAS_VIEJOS = 7;
const CARPETA = new URL("../evangelio/", import.meta.url);
const pad = n => String(n).padStart(2, "0");
const fechaISO = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const espera = ms => new Promise(r => setTimeout(r, ms));

async function pedir(params) {
  const url = BASE + "?" + new URLSearchParams(params);
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "Scala-app/1.0 (lecturas del dia; contacto en el repositorio)" } });
      if (r.ok) return await r.text();
    } catch (e) { /* reintenta */ }
    await espera(1500 * (i + 1));
  }
  return "";
}

const ENT = { aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú",
  ntilde: "ñ", Ntilde: "Ñ", uuml: "ü", Uuml: "Ü", ccedil: "ç", agrave: "à", egrave: "è", ograve: "ò", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’",
  hellip: "…", mdash: "—", ndash: "–", deg: "°", ordf: "ª", ordm: "º", middot: "·", copy: "©" };
function limpiar(html) {
  return String(html || "")
    .replace(/\r/g, "")
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>\s*<p[^>]*>/gi, "\n\n").replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, "\"").replace(/&#0?39;|&apos;/g, "'")
    .replace(/&laquo;/g, "«").replace(/&raquo;/g, "»").replace(/&iexcl;/g, "¡").replace(/&iquest;/g, "¿")
    .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => ENT[n] !== undefined ? ENT[n] : m).replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ").split("\n").map(x => x.trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// Las últimas líneas con derechos o el nombre de la fuente se guardan aparte.
function separarFuente(t) {
  const ls = t.split("\n"), f = [];
  while (ls.length && /(copyright|©|evangelizo|libro del pueblo|derechos)/i.test(ls[ls.length - 1])) f.unshift(ls.pop());
  return [ls.join("\n").trim(), f.join(" ").trim()];
}

async function lectura(fecha, content) {
  const date = fecha.replace(/-/g, "");
  const texto = await pedir({ date, type: "reading", lang: "SP", content });
  if (!limpiar(texto)) return null;
  const titulo = await pedir({ date, type: "reading_lt", lang: "SP", content });
  const cita = await pedir({ date, type: "reading_st", lang: "SP", content });
  const [t, fuente] = separarFuente(limpiar(texto));
  return { titulo: limpiar(titulo), cita: limpiar(cita) || limpiar(titulo), texto: t, fuente };
}

async function dia(fecha) {
  const date = fecha.replace(/-/g, "");
  const out = { fecha, dia: limpiar(await pedir({ date, type: "liturgic_t", lang: "SP" })) };
  for (const [k, c] of [["primera", "FR"], ["salmo", "PS"], ["segunda", "SR"], ["evangelio", "GSP"]]) {
    const l = await lectura(fecha, c);
    if (l) out[k] = l;
    await espera(250);
  }
  const fuentes = ["primera", "salmo", "segunda", "evangelio"].map(k => out[k] && out[k].fuente).filter(Boolean);
  out.fuente = fuentes[0] || "Evangelizo.org";
  out.creado = new Date().toISOString();
  return out;
}

const existe = async p => { try { await access(p); return true; } catch { return false; } };

await mkdir(CARPETA, { recursive: true });
const hoy = new Date();
let nuevos = 0, fallas = 0;
for (let i = 0; i < DIAS; i++) {
  const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
  const f = fechaISO(d), archivo = new URL(f + ".json", CARPETA);
  if (i > 1 && await existe(archivo) && !process.env.FORZAR) continue; // hoy y mañana se refrescan siempre
  const j = await dia(f);
  if (!j.evangelio) { fallas++; console.log("Sin Evangelio para", f); continue; }
  await writeFile(archivo, JSON.stringify(j, null, 1) + "\n");
  nuevos++; console.log("Listo", f, "·", j.evangelio.cita);
}
// borrar los días viejos
const limite = fechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - GUARDAR_DIAS_VIEJOS));
for (const n of await readdir(CARPETA)) if (/^\d{4}-\d{2}-\d{2}\.json$/.test(n) && n.slice(0, 10) < limite) await unlink(new URL(n, CARPETA));
console.log("Días nuevos o actualizados:", nuevos, "· sin datos:", fallas);
if (nuevos === 0 && fallas > 0) process.exit(1);
