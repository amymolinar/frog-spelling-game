/* Only game code is cached here. Classroom assignments and reports never enter this cache. */
const BUILD="2026-10-15-worlds-2";
const ROOT=new URL('./',self.location.href);
const GAME=new URL('index-Version-2.html',ROOT).href;
const PREFIX='frog-game-shell-v3:'+ROOT.pathname+':';
const CACHE=PREFIX+BUILD;
const marker='name="frog-game-build" content="'+BUILD+'"';
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const response=await fetch(GAME+'?installBuild='+encodeURIComponent(BUILD),{cache:'no-store'});
  if(!response.ok||!(await response.clone().text()).includes(marker))throw Error('Matching game build is not published yet.');
  await (await caches.open(CACHE)).put(GAME,response);
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);
  await self.clients.claim();
  for(const client of await self.clients.matchAll({type:'window'}))client.postMessage({type:'FROG_GAME_CODE_READY',build:BUILD});
 })());
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==ROOT.origin||url.pathname!==new URL(GAME).pathname)return;
 event.respondWith((async()=>{
  try{
   const response=await fetch(new Request(event.request,{cache:'no-store'}));
   if(!response.ok)throw Error('Game server unavailable');
   // A newer game may be live just before its worker is ready. Serve it, but do not overwrite this build's fallback.
   if((await response.clone().text()).includes(marker))await (await caches.open(CACHE)).put(GAME,response.clone());
   return response;
  }catch(error){
   const saved=await (await caches.open(CACHE)).match(GAME);
   if(saved)return saved;throw error;
  }
 })());
});
