import prisma from '../config/prisma.js';

export const getMetrics = async (req, res, next) => {
  try {
    const [
      totalOrdenes,
      ordenesPendientes,
      ordenesEnProceso,
      ordenesCompletadas,
      totalClientes,
      totalTecnicos,
      tecnicosDisponibles,
      totalEquipos,
      ordenesRecientes,
      ordenesPorEstado,
      ordenesPorMes,
    ] = await Promise.all([
      prisma.orden.count(),
      prisma.orden.count({ where: { estado: 'PENDIENTE' } }),
      prisma.orden.count({ where: { estado: 'EN_PROCESO' } }),
      prisma.orden.count({ where: { estado: 'COMPLETADO' } }),
      prisma.cliente.count(),
      prisma.tecnico.count(),
      prisma.tecnico.count({ where: { disponible: true } }),
      prisma.equipo.count(),
      prisma.orden.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { cliente: true, tecnico: true, equipo: true }
      }),
      prisma.orden.groupBy({
        by: ['estado'],
        _count: { estado: true }
      }),
      // Órdenes últimos 6 meses
      prisma.$queryRaw`
        SELECT 
          DATE_FORMAT(createdAt, '%Y-%m') as mes,
          COUNT(*) as total
        FROM ordenes
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY mes
        ORDER BY mes ASC
      `,
    ]);

    // $queryRaw returns COUNT(*) as BigInt — convert to Number for JSON serialization
    const ordenesPorMesSerialized = ordenesPorMes.map((row) => ({
      mes: row.mes,
      total: Number(row.total),
    }));

    res.json({
      metricas: {
        totalOrdenes,
        ordenesPendientes,
        ordenesEnProceso,
        ordenesCompletadas,
        totalClientes,
        totalTecnicos,
        tecnicosDisponibles,
        totalEquipos,
      },
      ordenesRecientes,
      ordenesPorEstado,
      ordenesPorMes: ordenesPorMesSerialized,
    });
  } catch (error) { next(error); }
};

export const getTecnicoDashboard = async (req, res, next) => {
  try {
    const tecnico = await prisma.tecnico.findUnique({ where: { usuarioId: req.user.id } });
    if (!tecnico) return res.status(404).json({ message: 'Perfil no encontrado' });

    const [pendientes, enProceso, completadas, recientes] = await Promise.all([
      prisma.orden.count({ where: { tecnicoId: tecnico.id, estado: 'PENDIENTE' } }),
      prisma.orden.count({ where: { tecnicoId: tecnico.id, estado: 'EN_PROCESO' } }),
      prisma.orden.count({ where: { tecnicoId: tecnico.id, estado: 'COMPLETADO' } }),
      prisma.orden.findMany({
        where: { tecnicoId: tecnico.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { cliente: true, equipo: true }
      }),
    ]);

    res.json({ tecnico, pendientes, enProceso, completadas, recientes });
  } catch (error) { next(error); }
};

export const getClienteDashboard = async (req, res, next) => {
  try {
    const cliente = await prisma.cliente.findUnique({ where: { usuarioId: req.user.id } });
    if (!cliente) return res.status(404).json({ message: 'Perfil no encontrado' });

    const [totalOrdenes, activas, completadas, cotizaciones, equipos] = await Promise.all([
      prisma.orden.count({ where: { clienteId: cliente.id } }),
      prisma.orden.count({ where: { clienteId: cliente.id, estado: { in: ['PENDIENTE', 'EN_PROCESO'] } } }),
      prisma.orden.count({ where: { clienteId: cliente.id, estado: 'COMPLETADO' } }),
      prisma.cotizacion.count({ where: { clienteId: cliente.id } }),
      prisma.equipo.count({ where: { clienteId: cliente.id } }),
    ]);

    res.json({ cliente, totalOrdenes, activas, completadas, cotizaciones, equipos });
  } catch (error) { next(error); }
};