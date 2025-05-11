import express from 'express';
import next from 'next';
import { createServer } from 'http';
// Otros imports que puedas tener...

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  
  // Aquí van tus middleware y rutas específicas de Express
  
  // ¡IMPORTANTE! - Asegúrate de que Next.js maneje todas las demás rutas
  // Esta línea es crítica y debe estar DESPUÉS de tus propias rutas
  server.all('*', (req, res) => {
    return handle(req, res);
  });
  
  const httpServer = createServer(server);
  httpServer.listen(process.env.PORT || 3000, () => {
    console.log(`> Server ready on http://localhost:${process.env.PORT || 3000}`);
  });
}).catch(err => {
  console.error('Error preparing Next.js app:', err);
  process.exit(1);
});