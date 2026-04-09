import prisma from '../config/prisma.js';

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
        orden: true
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
    await prisma.orden.update({
      where: { id: Number(ordenId) },
      data: { estado: 'COMPLETADO' }
    });
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
