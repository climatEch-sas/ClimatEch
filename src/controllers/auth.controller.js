import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    const user = await prisma.usuario.findUnique({ where: { email } });
    if (!user || !user.activo) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { userId: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Obtener perfil adicional según rol
    let perfil = null;
    if (user.rol === 'CLIENTE') {
      perfil = await prisma.cliente.findUnique({ where: { usuarioId: user.id } });
    } else if (user.rol === 'TECNICO') {
      perfil = await prisma.tecnico.findUnique({ where: { usuarioId: user.id } });
    }

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        perfilId: perfil?.id || null,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const { nombre, email, password, rol = 'CLIENTE', telefono, direccion, especialidad } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
    }

    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.usuario.create({
      data: { nombre, email, password: hashed, rol }
    });

    if (rol === 'CLIENTE') {
      await prisma.cliente.create({
        data: {
          nombre,
          telefono: telefono || '',
          direccion: direccion || '',
          usuarioId: user.id
        }
      });
    } else if (rol === 'TECNICO') {
      await prisma.tecnico.create({
        data: {
          nombre,
          especialidad: especialidad || 'General',
          usuarioId: user.id
        }
      });
    }

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    let perfil = null;
    if (req.user.rol === 'CLIENTE') {
      perfil = await prisma.cliente.findUnique({ where: { usuarioId: req.user.id } });
    } else if (req.user.rol === 'TECNICO') {
      perfil = await prisma.tecnico.findUnique({ where: { usuarioId: req.user.id } });
    }

    res.json({ ...req.user, perfil });
  } catch (error) {
    next(error);
  }
};
