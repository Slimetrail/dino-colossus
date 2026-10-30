const VER="20",CACHE="dinocol-v"+VER;
const SHELL=["./","index.html","sprites.js?v=20","vis.js?v=20","game.js?v=20","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","sounds/stomp.mp3","sounds/land.mp3","sounds/roar.mp3","sounds/chime.mp3","sounds/cheer.mp3","sounds/sparkle.mp3","sounds/dino-main-loop.ogg","sounds/dino-boss-loop.ogg","sounds/intro-elise-dino-variation.ogg","sounds/boss-beaten-fanfare.ogg","sounds/silly-toot.ogg","sounds/silly-boing.ogg","sounds/silly-whoosh.ogg","sounds/silly-pop.ogg","sounds/silly-warn.ogg"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("dinocol-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET"||new URL(r.url).origin!==location.origin)return;
 e.respondWith(fetch(r,{cache:"no-cache"}).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res})
 .catch(()=>caches.match(r,{ignoreSearch:r.mode==="navigate"}).then(m=>m||(r.mode==="navigate"?caches.match("index.html"):Response.error()))))});
