# Domux

Domux es una aplicación web para administrar el hogar en equipo: permite organizar hogares compartidos, tareas, despensa, gastos y presupuestos desde un frontend React conectado a Supabase como backend/BaaS.

Este repositorio contiene solo el frontend. La autenticación, persistencia de datos y modelo de hogar se resuelven contra Supabase.

## Estado Actual

Funcionalidades verificadas en el código:

| Área | Implementación actual |
| --- | --- |
| Autenticación | Registro e inicio de sesión con email/contraseña y Google OAuth mediante Supabase Auth. |
| Hogares | Crear hogares, unirse con código de invitación, cambiar hogar activo y eliminar hogares. |
| Miembros | Listado de miembros, roles `admin`/`member` y remoción de miembros por administradores. |
| Tareas | Crear, asignar, filtrar por hoy/semana, marcar como completadas y eliminar tareas. |
| Despensa | Lista de compras, marcado de productos comprados y registro opcional del gasto asociado. |
| Gastos | Registro, filtrado por periodo, categorías de servicios/renta/otros y eliminación. |
| Presupuesto | Presupuesto semanal, quincenal o mensual con comparación contra gastos del periodo. |
| Dashboard | Resumen de tareas pendientes, despensa, gastos del mes, presupuesto y miembros. |
| Tema | Modo claro/oscuro con estado local. |
| PWA | Manifest básico con actualización automática mediante `vite-plugin-pwa`. |

Objetivo del producto: convertirse en un administrador integral del hogar para coordinar responsabilidades, compras y finanzas domésticas entre varias personas.

## Stack

| Tecnología | Uso |
| --- | --- |
| React 19 | UI principal. |
| TypeScript 6 | Tipado estático. |
| Vite 8 | Desarrollo, build y preview. |
| React Router 7 | Rutas públicas, protegidas y navegación interna. |
| Supabase JS 2 | Auth, consultas y mutaciones contra Supabase. |
| Zustand 5 | Estado de autenticación, hogar activo y tema. |
| Tailwind CSS 4 | Estilos utilitarios. |
| Lucide React | Iconografía. |
| vite-plugin-pwa | Manifest y comportamiento PWA básico. |

## Puesta En Marcha

Requisitos:

- Node.js compatible con Vite 8.
- Un proyecto de Supabase configurado con las tablas esperadas por el frontend.
- Variables de entorno locales para conectar con Supabase.

Instalación:

```bash
npm install
```

Configuración local:

```bash
cp .env.example .env
```

Definí las variables de Supabase en `.env`:

| Variable | Descripción |
| --- | --- |
| `VITE_SUPABASE_URL` | URL pública del proyecto Supabase. |
| `VITE_SUPABASE_ANON_KEY` | Clave pública anon del proyecto Supabase. |

Ejecutar en desarrollo:

```bash
npm run dev
```

## Scripts

| Comando | Acción |
| --- | --- |
| `npm run dev` | Inicia Vite en modo desarrollo. |
| `npm run build` | Ejecuta `tsc -b` y genera el build de producción con Vite. |
| `npm run lint` | Corre ESLint sobre el proyecto. |
| `npm run preview` | Sirve localmente el build generado. |

## Estructura

```text
src/
  App.tsx                 Rutas, guards de autenticación y redirecciones.
  main.tsx                Punto de entrada de React.
  lib/supabase.ts         Cliente Supabase del frontend.
  types/database.ts       Tipos usados para tablas y entidades de Supabase.
  stores/
    authStore.ts          Sesión, perfil y métodos de autenticación.
    householdStore.ts     Hogares, hogar activo, invitaciones y membresías.
    themeStore.ts         Preferencia de tema claro/oscuro.
  pages/
    AuthPage.tsx          Login, registro y Google OAuth.
    OnboardingPage.tsx    Crear hogar o unirse por código.
    DashboardPage.tsx     Resumen del hogar activo.
    TasksPage.tsx         Gestión de tareas.
    PantryPage.tsx        Lista de despensa y compras.
    ExpensesPage.tsx      Gastos y presupuesto.
    SettingsPage.tsx      Miembros, invitación y ajustes del hogar.
  components/
    layout/AppLayout.tsx  Layout protegido, navegación y selector de hogar.
    ui/                   Componentes base reutilizables.
public/
  favicon.svg             Icono usado también por el manifest PWA.
```

## Supabase

El frontend espera usar Supabase para:

- Autenticación de usuarios con email/contraseña y OAuth de Google.
- Perfil de usuario en `profiles`.
- Hogares en `households`.
- Membresías en `household_members`.
- Tareas en `tasks`.
- Productos de despensa en `pantry_items`.
- Gastos en `expenses`.
- Presupuestos en `budgets`.

Notas verificadas:

- `src/lib/supabase.ts` crea el cliente con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- `authStore.ts` asume que el perfil se crea automáticamente con un trigger de base de datos llamado `handle_new_user`, leyendo `full_name` desde `raw_user_meta_data`.
- No hay carpeta `supabase/` en este repositorio, así que las migraciones, políticas RLS y triggers no están versionados acá.
- El código usa relaciones entre tablas, por ejemplo `household_members -> households/profiles` y `tasks.assigned_to -> profiles`.

## Rutas Principales

| Ruta | Descripción |
| --- | --- |
| `/auth` | Autenticación. |
| `/onboarding` | Crear un hogar o unirse a uno existente. |
| `/` | Dashboard del hogar activo. |
| `/tasks` | Tareas del hogar. |
| `/pantry` | Despensa/lista de compras. |
| `/expenses` | Gastos y presupuesto. |
| `/settings` | Miembros, invitación y ajustes. |
| `/join/:code` | Redirige al onboarding; el código se usa manualmente en el flujo actual. |

## Despliegue

El proyecto incluye `vercel.json` con una regla de rewrite hacia `index.html`, necesaria para que React Router funcione correctamente en Vercel al recargar rutas internas.

Para desplegar:

- Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` como variables de entorno del proyecto en Vercel.
- Usar `npm run build` como comando de build.
- Publicar el directorio generado por Vite (`dist`).

## Caveats

- Este repositorio no contiene el backend de Supabase ni migraciones de base de datos.
- Las funcionalidades listadas como actuales están verificadas desde el frontend; requieren que Supabase tenga las tablas, relaciones, políticas y triggers esperados.
- TanStack Query está instalado, pero el código inspeccionado usa estado local/Zustand y llamadas directas a Supabase para las pantallas principales.
