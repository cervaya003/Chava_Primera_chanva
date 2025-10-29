const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generar JWT
const generarToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'fallback_secret', 
    { expiresIn: '24h' }
  );
};

// Registrar nuevo usuario
exports.registro = async (req, res) => {
  try {
    const { nombre, email, telefono, fechaNacimiento } = req.body;

    // Validar campos obligatorios
    if (!nombre || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y email son obligatorios'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del email no es válido'
      });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await User.findOne({ email: email.toLowerCase() });
    
    if (usuarioExistente) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un usuario con este email'
      });
    }

    // Crear nuevo usuario
    const nuevoUsuario = new User({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      telefono: telefono || '',
      fechaNacimiento: fechaNacimiento || null
    });

    // Guardar usuario en la base de datos
    const usuarioGuardado = await nuevoUsuario.save();

    // Generar JWT
    const token = generarToken(usuarioGuardado._id);

    // Responder con token y datos del usuario
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: usuarioGuardado._id,
        nombre: usuarioGuardado.nombre,
        email: usuarioGuardado.email,
        telefono: usuarioGuardado.telefono,
        fechaNacimiento: usuarioGuardado.fechaNacimiento,
        fechaCreacion: usuarioGuardado.fechaCreacion
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors
      });
    }

    // Manejar errores de duplicados (email único)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al registrar usuario'
    });
  }
};