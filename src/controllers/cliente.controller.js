import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';

export const getAll = async (req, res, next) => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        usuario: { select: { id: true, email: true, activo: true } },
        _count: { select: { equipos: true, ordenes: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(clientes);
  } catch (error) { next(error); }
};

export const getOne = async (req, res, next) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        usuario: { select: { id: true, email: true, activo: true } },
        equipos: true,
        ordenes: { include: { equipo: true, tecnico: true }, orderBy: { createdAt: 'desc' } },
        cotizaciones: { orderBy: { createdAt: 'desc' } }
      }
    });
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (error) { next(error); }
};

export const create = async (req, res, next) => {
  try {
    const { nombre, email, password, telefono, direccion } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
    }

    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email ya registrado' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.usuario.create({
      data: { nombre, email, password: hashed, rol: 'CLIENTE' }
    });

    const cliente = await prisma.cliente.create({
      data: { nombre, telefono: telefono || '', direccion: direccion || '', usuarioId: user.id },
      include: { usuario: { select: { email: true } } }
    });

    res.status(201).json(cliente);
  } catch (error) { next(error); }
};

export const update = async (req, res, next) => {
  try {
    const { nombre, telefono, direccion } = req.body;
    const cliente = await prisma.cliente.update({
      where: { id: Number(req.params.id) },
      data: { nombre, telefono, direccion },
      include: { usuario: { select: { email: true } } }
    });
    res.json(cliente);
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    const cliente = await prisma.cliente.findUnique({ where: { id: Number(req.params.id) } });
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });
    // Desactivar usuario asociado
    await prisma.usuario.update({ where: { id: cliente.usuarioId }, data: { activo: false } });
    res.json({ message: 'Cliente desactivado exitosamente' });
  } catch (error) { next(error); }
};
