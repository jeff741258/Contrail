// Contrail service worker: makes the installed app open and work offline.
// Contrail's own files are fetched fresh from the network whenever there's a connection, so uploads to
// GitHub reach the installed app right away; the saved copy is only used when offline (or the network
// is slow). Sign-in, Gmail, Drive and OneDrive requests are never cached.
const CACHE = "contrail-v3";
const APP_FILES = [
  "./", "index.html", "styles.css", "airports.js", "land.js", "app.js", "config.js", "common.js", "msauth.js",
  "google.js", "microsoft.js", "apple.js", "sync.js", "mail.js", "photos.js", "privacy.js", "space.js",
  "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png"
];
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);

  // Fonts: use the saved copy, refresh it in the background.
  if(FONT_HOSTS.includes(url.hostname)){
    event.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if(r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }

  // Only Contrail's own files; everything else (Google, Microsoft, Apple) goes straight to the network.
  if(url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const c = await caches.open(CACHE);
    try{
      const net = await Promise.race([
        fetch(req),
        new Promise((_, reject) => setTimeout(() => reject(new Error("slow")), 4000))
      ]);
      if(net.ok) c.put(req, net.clone());
      return net;
    }catch(_){
      const hit = await c.match(req, { ignoreSearch: true }) ||
                  (req.mode === "navigate" ? await c.match("index.html") : null);
      if(hit) return hit;
      return fetch(req); // one last try; fails normally if truly offline
    }
  })());
});
