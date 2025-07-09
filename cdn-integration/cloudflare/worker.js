addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
  });
  
  async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;
  
    // Xử lý HLS stream
    if (path.endsWith('.m3u8') || path.endsWith('.ts')) {
      return handleHLSRequest(request);
    }
  
    // Xử lý request khác
    return new Response('Not found', { status: 404 });
  }
  
  async function handleHLSRequest(request) {
    const originUrl = `${HLS_ORIGIN_URL}${new URL(request.url).pathname}`;
    
    // Cache HLS segments nhưng không cache manifest
    const cache = caches.default;
    if (!request.url.endsWith('.m3u8')) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
  
    const response = await fetch(originUrl, {
      cf: {
        cacheEverything: true,
        cacheTtl: 3600 // Cache segments for 1 hour
      }
    });
  
    if (response.ok) {
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      newResponse.headers.set('Cache-Control', 'public, max-age=3600');
      
      if (!request.url.endsWith('.m3u8')) {
        event.waitUntil(cache.put(request, newResponse.clone()));
      }
      
      return newResponse;
    }
  
    return new Response('Not found', { status: 404 });
  }