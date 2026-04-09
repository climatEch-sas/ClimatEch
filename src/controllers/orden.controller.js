import prisma from '../config/prisma.js';

const include = {
  cliente: true,
  tecnico: true,
  equipo: true,
  mantenimientos: {
    include: {
      detalleRepuestos: { include: { repuesto: true } }
    }
  }
};

export const getAll = async (req, res, next) => {
  try {
    const { estado, tecnicoId, clienteId } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (tecnicoId) where.tecnicoId = Number(tecnicoId);
    if (clienteId) where.clienteId = Number(clienteId);

    // Filtro por rol: técnico solo ve sus órdenes, cliente solo ve las suyas
    if (req.user.rol === 'TECNICO') {
      const tec = await prisma.tecnico.findUnique({ where: { usuarioId: req.user.id } });
      if (tec) where.tecnicoId = tec.id;
    } else if (req.user.rol === 'CLIENTE') {
      const cli = await prisma.cliente.findUnique({ where: { usuarioId: req.user.id } });
      if (cli) where.clienteId = cli.id;
    }

    const ordenes = await prisma.orden.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' }
    });
    res.json(ordenes);
  } catch (error) { next(error); }
};

export const getOne = async (req, res, next) => {
  try {
    const orden = await prisma.orden.findUnique({
      where: { id: Number(req.params.id) },
      include
    });
    if (!orden) return res.status(404).json({ message: 'Orden no encontrada' });
    res.json(orden);
  } catch (error) { next(error); }
};

export const create = async (req, res, next) => {
  try {
    const { descripcion, prioridad, clienteId, equipoId, tecnicoId } = req.body;

    let resolvedClienteId = clienteId;
    if (req.user.rol === 'CLIENTE') {
      const cli = await prisma.cliente.findUnique({ where: { usuarioId: req.user.id } });
      if (!cli) return res.status(404).json({ message: 'Perfil cliente no encontrado' });
      resolvedClienteId = cli.id;
    }

    if (!resolvedClienteId || !equipoId) {
      return res.status(400).json({ message: 'Cliente y equipo son requeridos' });
    }

    const orden = await prisma.orden.create({
      data: {
        descripcion,
        prioridad: prioridad || 'NORMAL',
        clienteId: Number(resolvedClienteId),
        equipoId: Number(equipoId),
        tecnicoId: tecnicoId ? Number(tecnicoId) : null,
      },
      include
    });
    res.status(201).json(orden);
  } catch (error) { next(error); }
};

export const update = async (req, res, next) => {
  try {
    const { estado, tecnicoId, descripcion, prioridad } = req.body;
    const orden = await prisma.orden.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(estado && { estado }),
        ...(tecnicoId !== undefined && { tecnicoId: tecnicoId ? Number(tecnicoId) : null }),
        ...(descripcion && { descripcion }),
        ...(prioridad && { prioridad }),
      },
      include
    });
    res.json(orden);
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    await prisma.orden.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Orden eliminada' });
  } catch (error) { next(error); }
};
