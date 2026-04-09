import prisma from '../config/prisma.js';
import PDFDocument from 'pdfkit';

export const getAll = async (req, res, next) => {
  try {
    const where = {};
    if (req.user.rol === 'CLIENTE') {
      const cli = await prisma.cliente.findUnique({ where: { usuarioId: req.user.id } });
      if (cli) where.clienteId = cli.id;
    }
    const cotizaciones = await prisma.cotizacion.findMany({
      where,
      include: { cliente: true, items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(cotizaciones);
  } catch (error) { next(error); }
};

export const getOne = async (req, res, next) => {
  try {
    const cot = await prisma.cotizacion.findUnique({
      where: { id: Number(req.params.id) },
      include: { cliente: true, items: true }
    });
    if (!cot) return res.status(404).json({ message: 'Cotización no encontrada' });
    res.json(cot);
  } catch (error) { next(error); }
};

export const create = async (req, res, next) => {
  try {
    const { clienteId, notas, items } = req.body;
    if (!clienteId || !items?.length) {
      return res.status(400).json({ message: 'Cliente e items son requeridos' });
    }

    const total = items.reduce((sum, item) => sum + (item.cantidad * item.precioUnit), 0);

    const cot = await prisma.cotizacion.create({
      data: {
        total,
        notas,
        clienteId: Number(clienteId),
        items: {
          create: items.map(i => ({
            descripcion: i.descripcion,
            cantidad: Number(i.cantidad),
            precioUnit: Number(i.precioUnit),
            subtotal: Number(i.cantidad) * Number(i.precioUnit),
          }))
        }
      },
      include: { cliente: true, items: true }
    });
    res.status(201).json(cot);
  } catch (error) { next(error); }
};

export const updateEstado = async (req, res, next) => {
  try {
    const { estado } = req.body;
    const cot = await prisma.cotizacion.update({
      where: { id: Number(req.params.id) },
      data: { estado }
    });
    res.json(cot);
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    await prisma.cotizacion.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Cotización eliminada' });
  } catch (error) { next(error); }
};

export const generatePDF = async (req, res, next) => {
  try {
    const cot = await prisma.cotizacion.findUnique({
      where: { id: Number(req.params.id) },
      include: { cliente: true, items: true }
    });
    if (!cot) return res.status(404).json({ message: 'Cotización no encontrada' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=cotizacion-${cot.id}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#0F172A').text('ClimatEch', 50, 50);
    doc.fontSize(10).font('Helvetica').fillColor('#64748B').text('Sistema de Climatización Profesional', 50, 80);
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#2563EB').text(`COTIZACIÓN #${cot.id}`, 350, 50);
    doc.fontSize(10).font('Helvetica').fillColor('#64748B').text(`Fecha: ${new Date(cot.fecha).toLocaleDateString('es-CO')}`, 350, 78);
    doc.text(`Estado: ${cot.estado}`, 350, 92);

    doc.moveTo(50, 115).lineTo(550, 115).strokeColor('#E2E8F0').stroke();

    // Cliente
    doc.moveDown(2);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#0F172A').text('CLIENTE:');
    doc.fontSize(10).font('Helvetica').fillColor('#475569').text(cot.cliente.nombre);
    doc.text(`Tel: ${cot.cliente.telefono}`);
    doc.text(`Dir: ${cot.cliente.direccion}`);

    doc.moveDown();
    // Tabla de items
    const tableTop = doc.y + 10;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF');
    doc.rect(50, tableTop, 500, 20).fill('#2563EB');
    doc.fillColor('#FFFFFF').text('Descripción', 55, tableTop + 5);
    doc.text('Cant.', 330, tableTop + 5);
    doc.text('Precio Unit.', 380, tableTop + 5);
    doc.text('Subtotal', 465, tableTop + 5);

    let y = tableTop + 25;
    cot.items.forEach((item, i) => {
      if (i % 2 === 0) doc.rect(50, y - 3, 500, 18).fill('#F8FAFC');
      doc.fillColor('#334155').font('Helvetica').fontSize(9);
      doc.text(item.descripcion, 55, y);
      doc.text(String(item.cantidad), 330, y);
      doc.text(`$${Number(item.precioUnit).toLocaleString('es-CO')}`, 375, y);
      doc.text(`$${Number(item.subtotal).toLocaleString('es-CO')}`, 460, y);
      y += 18;
    });

    doc.moveTo(50, y + 5).lineTo(550, y + 5).strokeColor('#CBD5E1').stroke();
    y += 15;
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#0F172A')
      .text(`TOTAL: $${Number(cot.total).toLocaleString('es-CO')} COP`, 380, y);

    if (cot.notas) {
      doc.moveDown(3);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0F172A').text('Notas:');
      doc.font('Helvetica').fillColor('#475569').text(cot.notas);
    }

    doc.end();
  } catch (error) { next(error); }
};
