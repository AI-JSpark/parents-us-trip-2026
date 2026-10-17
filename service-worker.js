const C="parents-trip-v3";
const IDS=["leonia","nyc","philly","phoenix"];
const FILES=["./","./index.html","./styles.css","./app.js","./app-config.js","./manifest.webmanifest","./assets/leonia.svg","./assets/nyc.svg","./assets/philly.svg","./assets/phoenix.svg",...IDS.map(id=>"./city-guides/"+id+".json")];
self.addEventListener("install",event=>event.waitUntil(caches.open(C).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;event.respondWith(caches.open(C).then(cache=>cache.match(event.request)).then(hit=>hit||fetch(event.request).then(response=>{if(response.ok)caches.open(C).then(cache=>cache.put(event.request,response.clone()));return response}).catch(()=>caches.open(C).then(cache=>cache.match("./index.html")))))});
