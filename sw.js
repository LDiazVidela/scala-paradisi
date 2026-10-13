const V="scala-v60";
const BASE=["./","index.html","manifest.webmanifest","icono-192.png","icono-512.png","icono-180.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(BASE)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET"||e.request.headers.get("range")) return;
  e.respondWith(fetch(e.request).then(r=>{
    if(r&&(r.ok||r.type==="opaque")){const c=r.clone();caches.open(V).then(k=>k.put(e.request,c));}
    return r;
  }).catch(()=>caches.match(e.request).then(r=>r||caches.match("index.html"))));
});
