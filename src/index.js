import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import clienteRoutes from './routes/cliente.routes.js';
import tecnicoRoutes from './routes/tecnico.routes.js';
import equipoRoutes from './routes/equipo.routes.js';
import ordenRoutes from './routes/orden.routes.js';
import mantenimientoRoutes from './routes/mantenimiento.routes.js';
import repuestoRoutes from './routes/repuesto.routes.js';
import cotizacionRoutes from './routes/cotizacion.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import notificacionRoutes from './routes/notificacion.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? true
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files para uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/tecnicos', tecnicoRoutes);
app.use('/api/equipos', equipoRoutes);
app.use('/api/ordenes', ordenRoutes);
app.use('/api/mantenimientos', mantenimientoRoutes);
app.use('/api/repuestos', repuestoRoutes);
app.use('/api/cotizaciones', cotizacionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notificaciones', notificacionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Servir el frontend en producción
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../public/dist');
  app.use(express.static(clientPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// Error handler global
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🌬️  ClimatEch API corriendo en http://localhost:${PORT}`);
  console.log(`📊  Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;