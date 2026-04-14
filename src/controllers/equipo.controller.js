import prisma from '../config/prisma.js';

export const getAll = async (req, res, next) => {
  try {
    const { clienteId } = req.query;
    let where = clienteId ? { clienteId: Number(clienteId) } : {};

    // Si es CLIENTE, solo ve sus propios equipos
    if (req.user.rol === 'CLIENTE') {
      const cli = await prisma.cliente.findUnique({ where: { usuarioId: req.user.id } });
      if (cli) where = { clienteId: cli.id };
    }

    const equipos = await prisma.equipo.findMany({
      where,
      include: {
        cliente: { select: { nombre: true } },
        _count: { select: { ordenes: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(equipos);
  } catch (error) { next(error); }
};

export const getOne = async (req, res, next) => {
  try {
    const equipo = await prisma.equipo.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        cliente: true,
        ordenes: {
          include: {
            tecnico: true,
            mantenimientos: {
              include: {
                detalleRepuestos: {
                  include: { repuesto: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!equipo) return res.status(404).json({ message: 'Equipo no encontrado' });
    res.json(equipo);
  } catch (error) { next(error); }
};

export const create = async (req, res, next) => {
  try {
    const { tipo, marca, modelo, serial, clienteId } = req.body;
    if (!tipo || !marca || !modelo) {
      return res.status(400).json({ message: 'Tipo, marca y modelo son requeridos' });
    }

    // Si es CLIENTE, usa su propio clienteId
    let resolvedClienteId = clienteId;
    if (req.user.rol === 'CLIENTE') {
      const cli = await prisma.cliente.findUnique({ where: { usuarioId: req.user.id } });
      if (!cli) return res.status(404).json({ message: 'Perfil de cliente no encontrado' });
      resolvedClienteId = cli.id;
    }

    if (!resolvedClienteId) {
      return res.status(400).json({ message: 'Cliente es requerido' });
    }

    const equipo = await prisma.equipo.create({
      data: { tipo, marca, modelo, serial, clienteId: Number(resolvedClienteId) },
      include: { cliente: { select: { nombre: true } } }
    });
    res.status(201).json(equipo);
  } catch (error) { next(error); }
};

export const update = async (req, res, next) => {
  try {
    const { tipo, marca, modelo, serial } = req.body;
    const equipo = await prisma.equipo.update({
      where: { id: Number(req.params.id) },
      data: { tipo, marca, modelo, serial }
    });
    res.json(equipo);
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    await prisma.equipo.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Equipo eliminado' });
  } catch (error) { next(error); }
};
