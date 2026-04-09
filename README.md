# 🌬️ ClimatEch — Sistema de Gestión de Climatización

Plataforma web profesional para la gestión de mantenimiento de equipos de climatización.
**Un solo `npm install`** — backend y frontend comparten el mismo `package.json` en la raíz.

---

## 🧩 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + TailwindCSS + Framer Motion |
| Backend | Node.js + Express (ESModules) |
| Base de datos | MySQL + Prisma ORM |
| Autenticación | JWT + bcrypt |
| PDF | PDFKit |

---

## 🏗️ Estructura del proyecto

```
climatech/
├── src/                      # Backend Express
│   ├── index.js              # Servidor principal
│   ├── config/
│   │   ├── prisma.js
│   │   └── seed.js           # Datos de prueba
│   ├── controllers/          # Lógica de negocio (10 archivos)
│   ├── routes/               # Endpoints REST (10 archivos)
│   └── middlewares/          # JWT auth + error handler
├── frontend/                 # React (Vite root)
│   ├── index.html
│   ├── main.jsx
│   ├── index.css
│   ├── App.jsx
│   ├── pages/
│   │   ├── auth/             # Login, Registro
│   │   ├── admin/            # Dashboard, Clientes, Técnicos, Equipos, Órdenes, Repuestos, Cotizaciones
│   │   ├── tecnico/          # Dashboard, Órdenes, Detalle+mantenimiento
│   │   └── cliente/          # Dashboard, Solicitar, Órdenes, Cotizaciones
│   ├── components/
│   │   ├── ui/               # Modal, StatCard, Badge, Spinner, etc.
│   │   └── layout/           # DashboardLayout con sidebar colapsable
│   ├── context/              # AuthContext (JWT)
│   └── utils/                # Axios instance con interceptores
├── prisma/
│   └── schema.prisma         # 11 modelos de datos
├── public/
│   └── dist/                 # Build del frontend (generado)
├── package.json              # UN SOLO package.json para todo
├── vite.config.js            # Vite apunta a /frontend como root
├── tailwind.config.js
├── postcss.config.js
└── .env.example
```

---

## 👥 Roles del sistema

| Rol | Funcionalidades |
|-----|----------------|
| **ADMIN** | Dashboard con gráficos, CRUD completo de clientes/técnicos/equipos, gestión de órdenes, repuestos, cotizaciones con PDF |
| **TECNICO** | Ver órdenes asignadas, registrar mantenimientos (preventivo/correctivo), agregar repuestos usados, subir evidencia fotográfica |
| **CLIENTE** | Solicitar servicio, ver estado de órdenes, ver/aprobar cotizaciones, descargar PDF |

---

## ⚙️ Instalación local

### Requisitos
- Node.js 18+
- MySQL 8+

### Pasos

```bash
# 1. Clonar / descomprimir
cd climatech

# 2. Un solo install — instala TODO (backend + frontend)
npm install

# 3. Configurar base de datos
cp .env.example .env
# Edita .env con tu DATABASE_URL:
# DATABASE_URL="mysql://root:password@localhost:3306/climatech"

# 4. Crear tablas
npm run db:push

# 5. Generar cliente Prisma
npm run db:generate

# 6. Cargar datos demo
npm run db:seed

# 7. Iniciar en desarrollo (backend + frontend simultáneo)
npm run dev
```

Esto levanta:
- **Backend API** → `http://localhost:3000/api`
- **Frontend Vite** → `http://localhost:5173` (con proxy automático a la API)

---

## 🔑 Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | admin@climatech.com | admin123 |
| Técnico | carlos@climatech.com | tecnico123 |
| Cliente | empresa@abc.com | cliente123 |

---

## 🚀 Despliegue en Railway

### 1. Build del frontend
```bash
npm run build
# Genera public/dist/ que Express sirve en producción
```

### 2. Variables de entorno en Railway

```env
DATABASE_URL=   ← copia desde el plugin MySQL de Railway
JWT_SECRET=un_secreto_muy_largo_y_seguro
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3000
```

### 3. Comandos en Railway (Settings → Deploy)

| Campo | Valor |
|-------|-------|
| **Build Command** | `npm install && npm run build && npm run db:generate && npm run db:push` |
| **Start Command** | `npm start` |

En producción, Express sirve el frontend compilado desde `public/dist/` — un solo proceso, un solo puerto.

---

## 🔌 API REST principal

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me

GET    /api/clientes          (ADMIN)
POST   /api/clientes          (ADMIN)
PUT    /api/clientes/:id      (ADMIN)
DELETE /api/clientes/:id      (ADMIN)

GET    /api/tecnicos
POST   /api/tecnicos          (ADMIN)
GET    /api/tecnicos/mis-ordenes  (TECNICO)

GET    /api/equipos
POST   /api/equipos           (ADMIN)

GET    /api/ordenes           (filtrado por rol automáticamente)
POST   /api/ordenes           (ADMIN, CLIENTE)
PUT    /api/ordenes/:id       (ADMIN, TECNICO)

POST   /api/mantenimientos    (TECNICO)
POST   /api/mantenimientos/completar

GET    /api/repuestos
POST   /api/repuestos         (ADMIN)

GET    /api/cotizaciones
POST   /api/cotizaciones      (ADMIN)
GET    /api/cotizaciones/:id/pdf

GET    /api/dashboard/admin
GET    /api/dashboard/tecnico
GET    /api/dashboard/cliente

POST   /api/upload/image
```

---

## 🔐 Seguridad

- Contraseñas hasheadas con **bcrypt** (10 rounds)
- Tokens **JWT** con expiración configurable
- Autorización por **rol** en cada endpoint
- CORS configurado según `NODE_ENV`

---

## 🐛 Problemas frecuentes

**`prisma generate` falla al instalar:**
Ejecuta `npm run db:generate` manualmente después de `npm install`.

**Error de conexión MySQL:**
Verifica que MySQL esté corriendo y que `DATABASE_URL` sea correcta.

**Frontend no carga en producción:**
Corre `npm run build` antes de `npm start`.

**Puerto en uso:**
Cambia `PORT=3001` en `.env`. El proxy de Vite se ajusta automáticamente.
