self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Puedes agregar aquí lógica de caché para assets y rutas si lo deseas
