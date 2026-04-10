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

// ─── Helper: crear notificación sin romper el flujo principal ───────────────
async function notify({ usuarioId, titulo, mensaje, tipo = 'INFO' }) {
  try {
    await prisma.notificacion.create({ data: { usuarioId, titulo, mensaje, tipo } });
  } catch (err) {
    console.error('[notify] Error al crear notificación:', err.message);
  }
}

// ─── Helper: obtener usuarioId de todos los admins activos ──────────────────
async function getAdminUserIds() {
  const admins = await prisma.usuario.findMany({
    where: { rol: 'ADMIN', activo: true },
    select: { id: true }
  });
  return admins.map((a) => a.id);
}

export const getAll = async (req, res, next) => {
  try {
    const { estado, tecnicoId, clienteId } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (tecnicoId) where.tecnicoId = Number(tecnicoId);
    if (clienteId) where.clienteId = Number(clienteId);

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

    // ── NOTIFICACIÓN: nueva orden pendiente → todos los admins ──────────────
    const adminIds = await getAdminUserIds();
    const clienteNombre = orden.cliente?.nombre || 'Un cliente';
    const equipoInfo = orden.equipo ? `${orden.equipo.marca} ${orden.equipo.modelo}` : 'equipo';
    for (const adminId of adminIds) {
      await notify({
        usuarioId: adminId,
        titulo: 'Nueva solicitud de servicio',
        mensaje: `${clienteNombre} solicitó servicio para ${equipoInfo}. Pendiente de asignar técnico.`,
        tipo: 'ADVERTENCIA',
      });
    }

    // ── NOTIFICACIÓN: si ya viene con técnico asignado desde creación ───────
    if (orden.tecnicoId && orden.tecnico?.usuarioId) {
      await notify({
        usuarioId: orden.tecnico.usuarioId,
        titulo: 'Nueva orden asignada',
        mensaje: `Se te asignó una nueva orden de servicio para ${equipoInfo} (${orden.prioridad}).`,
        tipo: 'INFO',
      });
    }

    res.status(201).json(orden);
  } catch (error) { next(error); }
};

export const update = async (req, res, next) => {
  try {
    const { estado, tecnicoId, descripcion, prioridad } = req.body;
    const ordenAntes = await prisma.orden.findUnique({ where: { id: Number(req.params.id) }, include });

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

    const equipoInfo = orden.equipo ? `${orden.equipo.marca} ${orden.equipo.modelo}` : 'equipo';

    // ── NOTIFICACIÓN: se asignó (o cambió) el técnico ───────────────────────
    const tecnicoAnteriorId = ordenAntes?.tecnicoId ?? null;
    const tecnicoNuevoId    = orden.tecnicoId ?? null;
    const tecnicoCambio = tecnicoNuevoId && tecnicoNuevoId !== tecnicoAnteriorId;

    if (tecnicoCambio && orden.tecnico?.usuarioId) {
      await notify({
        usuarioId: orden.tecnico.usuarioId,
        titulo: 'Nueva orden asignada',
        mensaje: `Se te asignó la orden #${orden.id} para atender ${equipoInfo} (cliente: ${orden.cliente?.nombre || ''}).`,
        tipo: 'INFO',
      });
    }

    // ── NOTIFICACIÓN: orden completada → cliente ─────────────────────────────
    const estadoAntes = ordenAntes?.estado;
    if (estado === 'COMPLETADO' && estadoAntes !== 'COMPLETADO') {
      // Obtener usuarioId del cliente
      const clienteRecord = await prisma.cliente.findUnique({
        where: { id: orden.clienteId },
        include: { usuario: { select: { id: true } } }
      });
      if (clienteRecord?.usuario?.id) {
        await notify({
          usuarioId: clienteRecord.usuario.id,
          titulo: 'Servicio completado',
          mensaje: `Tu orden de servicio #${orden.id} para ${equipoInfo} fue completada exitosamente.`,
          tipo: 'EXITO',
        });
      }
    }

    res.json(orden);
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    await prisma.orden.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Orden eliminada' });
  } catch (error) { next(error); }
};