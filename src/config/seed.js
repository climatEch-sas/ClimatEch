import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Limpiar datos previos (en orden de dependencias)
  await prisma.itemCotizacion.deleteMany();
  await prisma.cotizacion.deleteMany();
  await prisma.detalleRepuesto.deleteMany();
  await prisma.mantenimiento.deleteMany();
  await prisma.orden.deleteMany();
  await prisma.equipo.deleteMany();
  await prisma.repuesto.deleteMany();
  await prisma.tecnico.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.usuario.deleteMany();

  const hashPassword = (pw) => bcrypt.hashSync(pw, 10);

  // Admin
  const adminUser = await prisma.usuario.create({
    data: {
      nombre: 'Administrador',
      email: 'admin@climatech.com',
      password: hashPassword('admin123'),
      rol: 'ADMIN',
    }
  });

  // Técnicos
  const tecUser1 = await prisma.usuario.create({
    data: {
      nombre: 'Carlos Mendoza',
      email: 'carlos@climatech.com',
      password: hashPassword('tecnico123'),
      rol: 'TECNICO',
    }
  });
  const tecUser2 = await prisma.usuario.create({
    data: {
      nombre: 'Ana Rodríguez',
      email: 'ana@climatech.com',
      password: hashPassword('tecnico123'),
      rol: 'TECNICO',
    }
  });

  const tec1 = await prisma.tecnico.create({
    data: { nombre: 'Carlos Mendoza', especialidad: 'Aire Acondicionado Split', usuarioId: tecUser1.id }
  });
  const tec2 = await prisma.tecnico.create({
    data: { nombre: 'Ana Rodríguez', especialidad: 'Sistemas Centralizados', usuarioId: tecUser2.id }
  });

  // Clientes
  const cliUser1 = await prisma.usuario.create({
    data: {
      nombre: 'Empresa ABC',
      email: 'empresa@abc.com',
      password: hashPassword('cliente123'),
      rol: 'CLIENTE',
    }
  });
  const cliUser2 = await prisma.usuario.create({
    data: {
      nombre: 'Juan Pérez',
      email: 'juan@mail.com',
      password: hashPassword('cliente123'),
      rol: 'CLIENTE',
    }
  });

  const cli1 = await prisma.cliente.create({
    data: { nombre: 'Empresa ABC S.A.S', telefono: '3001234567', direccion: 'Calle 10 #23-45, Bogotá', usuarioId: cliUser1.id }
  });
  const cli2 = await prisma.cliente.create({
    data: { nombre: 'Juan Pérez', telefono: '3109876543', direccion: 'Carrera 5 #12-34, Medellín', usuarioId: cliUser2.id }
  });

  // Equipos
  const eq1 = await prisma.equipo.create({
    data: { tipo: 'Split', marca: 'LG', modelo: 'Dual Cool 18000 BTU', serial: 'LG-2023-001', clienteId: cli1.id }
  });
  const eq2 = await prisma.equipo.create({
    data: { tipo: 'Cassette', marca: 'Samsung', modelo: 'Wind-Free 24000 BTU', serial: 'SS-2022-045', clienteId: cli1.id }
  });
  const eq3 = await prisma.equipo.create({
    data: { tipo: 'Split', marca: 'Carrier', modelo: 'Optimax 12000 BTU', serial: 'CAR-2021-112', clienteId: cli2.id }
  });

  // Repuestos
  const rep1 = await prisma.repuesto.create({
    data: { nombre: 'Filtro de aire', costo: 35000, stock: 20, unidad: 'unidad' }
  });
  const rep2 = await prisma.repuesto.create({
    data: { nombre: 'Gas refrigerante R410A', costo: 120000, stock: 10, unidad: 'lb' }
  });
  const rep3 = await prisma.repuesto.create({
    data: { nombre: 'Condensador', costo: 450000, stock: 5, unidad: 'unidad' }
  });
  await prisma.repuesto.create({
    data: { nombre: 'Control remoto universal', costo: 45000, stock: 15, unidad: 'unidad' }
  });

  // Órdenes
  const orden1 = await prisma.orden.create({
    data: {
      estado: 'COMPLETADO',
      descripcion: 'Mantenimiento preventivo trimestral',
      prioridad: 'NORMAL',
      clienteId: cli1.id,
      tecnicoId: tec1.id,
      equipoId: eq1.id,
    }
  });
  const orden2 = await prisma.orden.create({
    data: {
      estado: 'EN_PROCESO',
      descripcion: 'Equipo no enfría correctamente',
      prioridad: 'ALTA',
      clienteId: cli1.id,
      tecnicoId: tec2.id,
      equipoId: eq2.id,
    }
  });
  await prisma.orden.create({
    data: {
      estado: 'PENDIENTE',
      descripcion: 'Solicitud de mantenimiento preventivo anual',
      prioridad: 'NORMAL',
      clienteId: cli2.id,
      equipoId: eq3.id,
    }
  });
  await prisma.orden.create({
    data: {
      estado: 'PENDIENTE',
      descripcion: 'Ruido extraño en compresor',
      prioridad: 'URGENTE',
      clienteId: cli2.id,
      equipoId: eq3.id,
    }
  });

  // Mantenimiento para orden completada
  const mant1 = await prisma.mantenimiento.create({
    data: {
      tipo: 'PREVENTIVO',
      descripcion: 'Se realizó limpieza general de filtros, revisión de niveles de gas refrigerante y limpieza de condensador.',
      fechaRealizado: new Date(),
      ordenId: orden1.id,
    }
  });

  await prisma.detalleRepuesto.create({
    data: { cantidad: 2, costoUnitario: 35000, mantenimientoId: mant1.id, repuestoId: rep1.id }
  });

  await prisma.mantenimiento.create({
    data: {
      tipo: 'CORRECTIVO',
      descripcion: 'Diagnóstico: fuga de gas refrigerante en tubería de cobre. Pendiente recargar gas.',
      ordenId: orden2.id,
    }
  });

  // Cotización
  const cot1 = await prisma.cotizacion.create({
    data: {
      total: 820000,
      estado: 'PENDIENTE',
      notas: 'Incluye mano de obra y repuestos necesarios',
      clienteId: cli1.id,
    }
  });

  await prisma.itemCotizacion.createMany({
    data: [
      { descripcion: 'Mantenimiento preventivo Split LG', cantidad: 1, precioUnit: 200000, subtotal: 200000, cotizacionId: cot1.id },
      { descripcion: 'Gas refrigerante R410A (2 lb)', cantidad: 2, precioUnit: 120000, subtotal: 240000, cotizacionId: cot1.id },
      { descripcion: 'Filtros de aire', cantidad: 4, precioUnit: 35000, subtotal: 140000, cotizacionId: cot1.id },
      { descripcion: 'Mano de obra técnica', cantidad: 3, precioUnit: 80000, subtotal: 240000, cotizacionId: cot1.id },
    ]
  });

  console.log('✅ Seed completado con éxito!\n');
  console.log('👤 Credenciales de acceso:');
  console.log('   Admin:   admin@climatech.com / admin123');
  console.log('   Técnico: carlos@climatech.com / tecnico123');
  console.log('   Cliente: empresa@abc.com / cliente123\n');
}

main()
  .catch((e) => { console.error('❌ Error en seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
