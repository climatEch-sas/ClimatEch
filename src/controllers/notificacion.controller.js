import prisma from '../config/prisma.js';

// GET /api/notificaciones — las del usuario autenticado
export const getMias = async (req, res, next) => {
  try {
    const notificaciones = await prisma.notificacion.findMany({
      where: { usuarioId: req.user.id },
      orderBy: { creadaEn: 'desc' },
      take: 30,
    });
    const noLeidas = notificaciones.filter((n) => !n.leida).length;
    res.json({ notificaciones, noLeidas });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notificaciones/:id/leer — marcar una como leída
export const marcarLeida = async (req, res, next) => {
  try {
    const notif = await prisma.notificacion.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!notif) return res.status(404).json({ message: 'Notificación no encontrada' });
    if (notif.usuarioId !== req.user.id) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    const actualizada = await prisma.notificacion.update({
      where: { id: notif.id },
      data: { leida: true },
    });
    res.json(actualizada);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notificaciones/leer-todas — marcar todas como leídas
export const marcarTodasLeidas = async (req, res, next) => {
  try {
    await prisma.notificacion.updateMany({
      where: { usuarioId: req.user.id, leida: false },
      data: { leida: true },
    });
    res.json({ message: 'Todas marcadas como leídas' });
  } catch (error) {
    next(error);
  }
};

// POST /api/notificaciones — crear (solo ADMIN o uso interno)
export const crear = async (req, res, next) => {
  try {
    const { usuarioId, titulo, mensaje, tipo } = req.body;
    if (!usuarioId || !titulo || !mensaje) {
      return res.status(400).json({ message: 'usuarioId, titulo y mensaje son requeridos' });
    }
    const notif = await prisma.notificacion.create({
      data: {
        usuarioId: Number(usuarioId),
        titulo,
        mensaje,
        tipo: tipo || 'INFO',
      },
    });
    res.status(201).json(notif);
  } catch (error) {
    next(error);
  }
};