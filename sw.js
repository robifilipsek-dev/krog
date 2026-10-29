// Cache only the public shell. Firestore/auth requests are never intercepted.
const CACHE='krog-shell-v2';
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));
 // Existing clients finish their session before the new worker takes over.
});
self.addEventListener('activate',event=>event.waitUntil(
 caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('krog')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/__/'))return;
 const allowed=SHELL.map(p=>new URL(p,self.registration.scope).pathname);
 if(!allowed.includes(url.pathname)&&req.mode!=='navigate')return;
 event.respondWith(fetch(req).then(response=>{
  if(response.ok&&allowed.includes(url.pathname)){const clone=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(req,clone)))}
  return response;
 }).catch(async()=>{
  const cached=await caches.match(req);if(cached)return cached;
  if(req.mode==='navigate')return (await caches.match('./index.html'))||new Response('Krog — offline',{status:503});
  return new Response('',{status:503});
 }));
});
