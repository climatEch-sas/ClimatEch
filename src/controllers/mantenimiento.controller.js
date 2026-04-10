import prisma from '../config/prisma.js';

// ─── Helper: crear notificación sin romper el flujo principal ───────────────
async function notify({ usuarioId, titulo, mensaje, tipo = 'INFO' }) {
  try {
    await prisma.notificacion.create({ data: { usuarioId, titulo, mensaje, tipo } });
  } catch (err) {
    console.error('[notify] Error al crear notificación:', err.message);
  }
}

export const create = async (req, res, next) => {
  try {
    const { tipo, descripcion, evidenciaUrl, ordenId, repuestos } = req.body;

    if (!tipo || !descripcion || !ordenId) {
      return res.status(400).json({ message: 'Tipo, descripción y orden son requeridos' });
    }

    const mant = await prisma.mantenimiento.create({
      data: {
        tipo,
        descripcion,
        evidenciaUrl: evidenciaUrl || null,
        fechaRealizado: new Date(),
        ordenId: Number(ordenId),
        detalleRepuestos: repuestos?.length
          ? {
              create: repuestos.map(r => ({
                cantidad: Number(r.cantidad),
                costoUnitario: Number(r.costoUnitario),
                repuestoId: Number(r.repuestoId),
              }))
            }
          : undefined
      },
      include: {
        detalleRepuestos: { include: { repuesto: true } },
        orden: { include: { equipo: true, cliente: { include: { usuario: { select: { id: true } } } } } }
      }
    });

    // Actualizar estado de la orden a EN_PROCESO si estaba PENDIENTE
    await prisma.orden.update({
      where: { id: Number(ordenId) },
      data: { estado: 'EN_PROCESO' }
    });

    res.status(201).json(mant);
  } catch (error) { next(error); }
};

export const getByOrden = async (req, res, next) => {
  try {
    const mantenimientos = await prisma.mantenimiento.findMany({
      where: { ordenId: Number(req.params.ordenId) },
      include: { detalleRepuestos: { include: { repuesto: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(mantenimientos);
  } catch (error) { next(error); }
};

export const completar = async (req, res, next) => {
  try {
    const { ordenId } = req.body;

    // Obtener la orden con datos del cliente y equipo antes de actualizar
    const orden = await prisma.orden.findUnique({
      where: { id: Number(ordenId) },
      include: {
        equipo: true,
        cliente: { include: { usuario: { select: { id: true } } } }
      }
    });

    await prisma.orden.update({
      where: { id: Number(ordenId) },
      data: { estado: 'COMPLETADO' }
    });

    // ── NOTIFICACIÓN: orden completada → cliente ─────────────────────────────
    if (orden?.cliente?.usuario?.id) {
      const equipoInfo = orden.equipo
        ? `${orden.equipo.marca} ${orden.equipo.modelo}`
        : 'equipo';
      await notify({
        usuarioId: orden.cliente.usuario.id,
        titulo: 'Servicio completado',
        mensaje: `Tu orden de servicio #${orden.id} para ${equipoInfo} fue completada exitosamente.`,
        tipo: 'EXITO',
      });
    }

    res.json({ message: 'Servicio confirmado y orden completada' });
  } catch (error) { next(error); }
};

export const update = async (req, res, next) => {
  try {
    const { tipo, descripcion, evidenciaUrl } = req.body;
    const mant = await prisma.mantenimiento.update({
      where: { id: Number(req.params.id) },
      data: { tipo, descripcion, evidenciaUrl }
    });
    res.json(mant);
  } catch (error) { next(error); }
};