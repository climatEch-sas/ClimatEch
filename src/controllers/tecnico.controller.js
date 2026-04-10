import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';

export const getAll = async (req, res, next) => {
  try {
    const tecnicos = await prisma.tecnico.findMany({
      where: {
        usuario: { activo: true },  // FIX: excluir usuarios desactivados
      },
      include: {
        usuario: { select: { email: true, activo: true } },
        _count: { select: { ordenes: true } }
      },
      orderBy: { nombre: 'asc' }
    });
    res.json(tecnicos);
  } catch (error) { next(error); }
};

export const getOne = async (req, res, next) => {
  try {
    const tecnico = await prisma.tecnico.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        usuario: { select: { email: true, activo: true } },
        ordenes: {
          include: { cliente: true, equipo: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!tecnico) return res.status(404).json({ message: 'Técnico no encontrado' });
    res.json(tecnico);
  } catch (error) { next(error); }
};

export const create = async (req, res, next) => {
  try {
    const { nombre, email, password, especialidad } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
    }

    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email ya registrado' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.usuario.create({
      data: { nombre, email, password: hashed, rol: 'TECNICO' }
    });

    const tecnico = await prisma.tecnico.create({
      data: { nombre, especialidad: especialidad || 'General', usuarioId: user.id },
      include: { usuario: { select: { email: true } } }
    });

    res.status(201).json(tecnico);
  } catch (error) { next(error); }
};

export const update = async (req, res, next) => {
  try {
    const { nombre, especialidad, disponible } = req.body;
    const tecnico = await prisma.tecnico.update({
      where: { id: Number(req.params.id) },
      data: { nombre, especialidad, disponible },
    });
    res.json(tecnico);
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    const tecnico = await prisma.tecnico.findUnique({ where: { id: Number(req.params.id) } });
    if (!tecnico) return res.status(404).json({ message: 'Técnico no encontrado' });
    // Desactiva el usuario: bloquea login y lo excluye del listado (filtro activo:true en getAll)
    await prisma.usuario.update({ where: { id: tecnico.usuarioId }, data: { activo: false } });
    res.json({ message: 'Técnico desactivado exitosamente' });
  } catch (error) { next(error); }
};

export const getMisOrdenes = async (req, res, next) => {
  try {
    const tecnico = await prisma.tecnico.findUnique({ where: { usuarioId: req.user.id } });
    if (!tecnico) return res.status(404).json({ message: 'Perfil de técnico no encontrado' });

    const ordenes = await prisma.orden.findMany({
      where: { tecnicoId: tecnico.id },
      include: {
        cliente: true,
        equipo: true,
        mantenimientos: { include: { detalleRepuestos: { include: { repuesto: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(ordenes);
  } catch (error) { next(error); }
};