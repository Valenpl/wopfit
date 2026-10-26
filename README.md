# WopFit · MVP completo (React + Spring Boot + MySQL)

Hábitos que se adaptan a tu vida real. Incluye:

- cuenta
- perfil y preferencias
- plan de entrenamiento y de comidas
- registro diario
- metas y progreso
- "no pude", con alternativas
- ajustes automáticos del plan

```
wopfit/
├── backend/            API REST · Java 17 · Spring Boot 3.3 · JPA · Spring Security + JWT
├── frontend/           Web app · React 18 · Vite · React Router (celu y compu)
└── docker-compose.yml  MySQL 8 para desarrollo
```

## Cómo correrlo

Necesitás **Java 17+**, **Maven 3.9+**, **Node 18+** y **Docker** (Docker solo para MySQL).

### 1. Base de datos
```bash
docker compose up -d          # MySQL en localhost:3306 (base wopfit, usuario wopfit / wopfit)
```
Las tablas se crean solas al arrancar el backend (`ddl-auto=update`).

### 2. Backend (puerto 8080)
```bash
cd backend
mvn spring-boot:run
```
**Sin Docker ni MySQL:** usá la base en memoria H2, que se borra al cerrar:
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```

### 3. Frontend (puerto 5173)
```bash
cd frontend
npm install
npm run dev
```
Abrí http://localhost:5173. Vite redirige `/api` al backend.

En pantallas de 1000 px o más se ve la versión compu, con barra lateral.

### Código de verificación del email
Todavía no se mandan emails reales. En desarrollo (`WOPFIT_DEV_CODES=true`, que es el valor por defecto), el código de 6 números aparece en dos lugares:

- en la pantalla "Revisá tu email"
- en el log del backend

### Tests
```bash
cd backend && mvn test        # recorre todo el MVP contra la API (H2)
```

## Configuración (variables de entorno)

| Variable | Default | Para qué |
|---|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/wopfit?...` | Conexión MySQL |
| `DB_USER` / `DB_PASSWORD` | `wopfit` / `wopfit` | Credenciales MySQL |
| `WOPFIT_JWT_SECRET` | secreto de desarrollo | **Cambialo en producción** (mínimo 32 caracteres) |
| `WOPFIT_CORS_ORIGINS` | `http://localhost:5173` | Dominios del front, separados por coma |
| `WOPFIT_DEV_CODES` | `true` | Mostrar el código de verificación (poné `false` en producción) |
| `VITE_API_URL` (front) | `/api` | URL de la API, si el front se publica en otro dominio |

## Qué hace (historias de usuario)

| Módulo | Qué incluye |
|---|---|
| Cuenta | Registro con email y contraseña (BCrypt), código de verificación, login con JWT |
| Perfil | Nombre, fecha de nacimiento (13+), altura, peso |
| Preferencias | Objetivos, días y minutos, presupuesto, actividades, alimentos que evita (sin TACC saca también la avena), salud, nivel, equipamiento |
| Plan | Sesiones en los días elegidos. La rutina se arma según nivel, equipamiento y salud (bajo impacto con embarazo o lesión). Menú de 3 comidas filtrado por restricciones y ordenado por presupuesto |
| Registro | Marcar la rutina como hecha y cómo se sintió, comidas, 3 hábitos diarios |
| "No pude" | El motivo define una versión alternativa: exprés, liviana, suave, sin equipamiento o caminata. La rutina completa pasa al próximo día libre. Las comidas proponen una alternativa según el motivo |
| Metas | Meta concreta (qué, cuántas veces por semana, cuántas semanas) que suma al objetivo |
| Progreso | Semana actual, racha de semanas completas, % por objetivo, historial de entrenos, hábitos y dificultades |
| Ajustes | Con 2 o más sesiones complicadas en 7 días, propone alivianar el plan. Con una semana completa, propone subir de nivel. Si cambiás preferencias, el cambio queda pendiente hasta "Actualizar mi plan", que muestra qué cambió |

## API (todo bajo `/api`, JSON)

Rutas públicas:

- `POST` `auth/register`, `auth/verify`, `auth/login`, `auth/resend`
- `GET` `health`, `catalog`

El resto requiere `Authorization: Bearer <token>`:

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `me` | Usuario, preferencias y plan |
| PUT | `me/about`, `me/preferences` | Datos básicos / preferencias |
| POST · GET | `plan` | Crear o actualizar el plan · ver el plan |
| GET | `workouts/today`, `workouts/week?start=AAAA-MM-DD`, `workouts/{id}` | Entrenamientos |
| POST | `workouts/{id}/report` · `accept-alternative` · `rest` · `reschedule` · `done` | "No pude", alternativa, mover, completar |
| GET | `meals/{fecha}` | Comidas del día y costo semanal |
| POST | `meals/{fecha}/{0-2}/eaten` · `report` · `accept` · `skip` · `swap` | Registrar, alternativa, cambiar |
| GET · PUT | `habits/{fecha}` | Agua, caminar, dormir |
| GET · POST · DELETE | `goals`, `goals/{id}/check`, `goals/{id}` | Metas |
| GET | `progress`, `history` | Progreso e historial |
| POST | `adjust/lighten`, `adjust/grow`, `adjust/dismiss` | Ajustes del plan |

Los errores vuelven como `{ "error": "mensaje para mostrar" }`. En los errores de validación se suma `fields`.

> WopFit no reemplaza a un profesional de la salud.
