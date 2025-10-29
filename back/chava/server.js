require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// ✅ CONFIGURACIÓN CORS CORREGIDA
app.use(cors({
  origin: ['http://localhost:8101', 'http://localhost:8100', 'http://localhost:3000'],
  credentials: true
}));

// Middleware para headers CORS (alternativa)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8101');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Verificar variables de entorno
if (!process.env.MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI no está definida en .env');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET no definido, usando valor por defecto');
}

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('✅ Conectado a MongoDB Atlas');
})
.catch((error) => {
  console.error('❌ Error conectando a MongoDB:', error);
});







// Routes
app.use('/users', require('./routes/authRoutes'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    environment: process.env.NODE_ENV 
  });
});


// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});








// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error global:', error);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🟢 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📁 Entorno: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS habilitado para localhost:8101`);
});

// Manejar cierre graceful
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔴 Conexión a MongoDB cerrada');
  process.exit(0);
});