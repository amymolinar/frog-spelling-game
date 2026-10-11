/* Frog quick-start files. Bump VERSION when publishing a new game build. */
const VERSION='frog-offline-version-2-2026-10-11-v1';
const ROOT=new URL('./',self.location.href);
const FILES=['index-Version-2.html','teacher-Version-2.html'].map(path=>new URL(path,ROOT).href);
const CACHE=VERSION+':'+ROOT.pathname;

self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(url=>new Request(url,{cache:'reload'})))));
});

self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('frog-offline-version-2-')&&key.endsWith(':'+ROOT.pathname)&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});

self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 // Never intercept Google Script, report submissions, or unrelated websites.
 if(event.request.method!=='GET'||url.origin!==ROOT.origin)return;
 const path=url.pathname===new URL('index-Version-2.html',ROOT).pathname?'index-Version-2.html':url.pathname===new URL('teacher-Version-2.html',ROOT).pathname?'teacher-Version-2.html':null;
 if(!path)return;
 const canonical=new URL(path,ROOT).href;
 const fresh=(async()=>{
  const response=await fetch(event.request);
  if(response.ok){
   const cache=await caches.open(CACHE);
   await cache.put(canonical,response.clone());
  }
  return response;
 })();
 event.waitUntil(fresh.then(()=>{},()=>{}));
 event.respondWith((async()=>{
  const saved=await caches.match(canonical,{cacheName:CACHE});
  if(saved)return saved;
  return fresh;
 })());
});
