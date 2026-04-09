import prisma from '../config/prisma.js';

export const getAll = async (req, res, next) => {
  try {
    const repuestos = await prisma.repuesto.findMany({ orderBy: { nombre: 'asc' } });
    res.json(repuestos);
  } catch (error) { next(error); }
};

export const create = async (req, res, next) => {
  try {
    const { nombre, costo, stock, unidad } = req.body;
    if (!nombre || !costo) return res.status(400).json({ message: 'Nombre y costo son requeridos' });
    const repuesto = await prisma.repuesto.create({
      data: { nombre, costo: Number(costo), stock: Number(stock) || 0, unidad }
    });
    res.status(201).json(repuesto);
  } catch (error) { next(error); }
};

export const update = async (req, res, next) => {
  try {
    const { nombre, costo, stock, unidad } = req.body;
    const repuesto = await prisma.repuesto.update({
      where: { id: Number(req.params.id) },
      data: { nombre, costo: Number(costo), stock: Number(stock), unidad }
    });
    res.json(repuesto);
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    await prisma.repuesto.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Repuesto eliminado' });
  } catch (error) { next(error); }
};
