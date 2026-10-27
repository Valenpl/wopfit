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

## Qué usamos y por qué

| Herramienta | Para qué | Por qué |
|---|---|---|
| React + Vite | La interfaz web (celu y compu) | Ya estaba hecha y funcionando; Vite es el estándar actual para React |
| Vercel | Publicar el frontend | Gratis, con HTTPS y deploy automático desde GitHub |
| Java + Spring Boot | El backend: reglas de negocio y API | Lo conoce el equipo, es muy usado y trae web, seguridad y base de datos resueltos |
| API REST (JSON) | Comunicación entre front y back | Simple y conocida: cada acción es una URL + GET, POST, PUT o DELETE |
| 3 capas: controller → service → repository | Ordenar el backend | Cada capa tiene una tarea: recibir el pedido, aplicar las reglas, hablar con la base |
| MySQL 8 | Guardar todos los datos | Los datos están relacionados entre sí y necesitan consistencia; el equipo ya domina MySQL |
| JPA / Hibernate | Usar la base desde Java | Cada tabla es una clase; viene integrado con Spring |
| Spring Security + JWT | Login y permisos | Estándar de Spring; el backend verifica en cada pedido quién sos con un token firmado |
| BCrypt | Guardar contraseñas | Se guarda un hash que no se puede revertir, nunca la contraseña |

Un solo backend (monolito) en 3 capas, en lugar de microservicios: para un equipo chico y una demo, varios servicios sólo suman servidores, costos y fallas entre ellos.

**Planeado (en desarrollo):** migraciones con Flyway, sesión con token corto + token de renovación en cookie, planes versionados detrás de `PlanGenerationService` (hoy un generador simulado, mañana el modelo propio de Wopfit), Premium de demostración sin cobros, lugares cercanos con Leaflet + OpenStreetMap y promociones de demostración. Lo simulado siempre se muestra como demo.

## Reglas del frontend

**Sin doble fetch:** cada vez que una pantalla pide datos al backend, el pedido se hace una sola vez.

- `React.StrictMode` (en `main.jsx`) ejecuta cada `useEffect` dos veces en desarrollo. Se mantiene a propósito porque deja ver los duplicados, así que cada efecto que pide datos tiene que estar preparado para eso.
- `useLoad` cancela el pedido anterior con `AbortController` cuando el efecto se limpia.
- `api.js` comparte el pedido en curso: si dos componentes piden la misma ruta al mismo tiempo, sale un solo `fetch`.
- La carga inicial de `/me` y la renovación de la sesión usan una única promesa compartida.
- Si un efecto escribe al montarse, lleva una protección con `useRef` para ejecutarse una sola vez.
- Un test de Playwright cuenta los pedidos de red y falla si aparece uno repetido.

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
```bash
cd frontend
npx playwright install chromium   # una sola vez
npm run test:e2e                  # sin doble fetch: falla si una pantalla repite un pedido
```
El test de Playwright usa el front en modo desarrollo (con StrictMode) y el backend con H2; si ya están corriendo, los reutiliza. Con `PW_CHANNEL=chrome` usa el Chrome instalado en lugar de bajar Chromium.

## Datos de demostración

Los lugares, cupones y profesionales salen de `backend/src/main/resources/demo/*.tsv`. Se cargan solos al arrancar si las tablas `places`, `offers` y `professionals` están vacías.

- **Lugares:** 9 cadenas ficticias (Súper Del Barrio, Mercado Verde, Gimnasio Impulso, Fit Club 24, etc.) con sucursales en direcciones reales de CABA y Vicente López, más 10 parques reales. Las coordenadas se sacaron de OpenStreetMap (Nominatim).
- **Profesionales:** `professionals.tsv`, con nombres y matrículas ficticios.
- **Cupones:** 10 de aliados ficticios. Cada uno se renueva solo cada cierta cantidad de días, así la demo nunca queda con cupones vencidos.
- **Tu ubicación:** si la compartís, el front ordena por distancia con ella; si no, se centra en UADE (Lima 775). La ubicación nunca se manda al servidor.
- Para cambiar los datos, editá los `.tsv` y vaciá las tablas (con H2 alcanza con reiniciar).

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
| Cuenta | Registro con email y contraseña (BCrypt), código de verificación, login con JWT, cambio de contraseña |
| Perfil | Nombre, fecha de nacimiento (13+), altura, peso |
| Preferencias | Objetivos, días y minutos, presupuesto, actividades, alimentos que evita (sin TACC saca también la avena), salud, nivel, equipamiento |
| Plan | Sesiones en los días elegidos. La rutina se arma según nivel, equipamiento y salud (bajo impacto con embarazo o lesión). Menú de 3 comidas filtrado por restricciones y ordenado por presupuesto |
| Registro | Marcar la rutina como hecha y cómo se sintió, comidas, 3 hábitos diarios |
| Premium | De demostración, sin pagos: se elige el período y se activa al instante, vence solo y se puede volver al Gratuito. Saca los anuncios y los candados. `GET me` trae `subscription` |
| Cerca tuyo y ofertas | Mapa real (Leaflet + OpenStreetMap) con 45 lugares de demostración en AMBA: cadenas ficticias en direcciones reales y parques reales. Cupones que se renuevan solos y marcan qué ingredientes de tu lista tienen oferta |
| Ayuda profesional | 6 nutricionistas y entrenadores de ejemplo con agenda de lunes a sábado (algunos turnos ya vienen ocupados). Con Premium se reservan 2 consultas por mes, por videollamada o chat, y se pueden agregar al calendario (.ics) o cancelar |
| Preguntale a Wopi | Asistente con respuestas armadas por reglas sobre tus datos: rutina de hoy, ideas de comida que respetan lo que no comés y tu presupuesto, lista del súper, ofertas, motivación y descanso. Si algo duele, deriva a un profesional. Los botones de cada respuesta llevan a la app (sumar una comida a hoy, hacer la versión corta, ver la lista). 3 consultas por mes gratis, 20 con Premium |
| Lista del súper | Ingredientes del menú de la semana, de los más usados a los menos, sin las comidas marcadas como "no pude". Lo que tildás queda guardado por semana |
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
| PUT | `me/password` | Cambiar la contraseña (pide la actual) |
| POST · DELETE | `subscription` | Activar Premium de demostración (`{ "period": "mensual" \| "semestral" \| "anual" }`, sin cobro) · volver al Gratuito |
| POST · GET | `plan` | Crear o actualizar el plan · ver el plan |
| GET | `workouts/today`, `workouts/week?start=AAAA-MM-DD`, `workouts/{id}` | Entrenamientos |
| POST | `workouts/{id}/report` · `accept-alternative` · `rest` · `reschedule` · `done` | "No pude", alternativa, mover, completar |
| GET | `meals/{fecha}` | Comidas del día y costo semanal |
| POST | `meals/{fecha}/{0-2}/eaten` · `report` · `accept` · `skip` · `swap` | Registrar, alternativa, cambiar |
| GET · PUT | `shopping/{fecha}` | Lista del súper de la semana de esa fecha · tildar o destildar un ingrediente |
| GET | `places` | Lugares cercanos (solo Premium; si no, 403): coordenadas, si está abierto ahora y si tiene descuento |
| GET | `offers` | Cupones de aliados con sus sucursales y si sirven para tu lista del súper; `alerts` = Premium |
| GET | `pros`, `pros/{id}` | Profesionales, cupo del mes y tus próximas consultas · perfil con la agenda de los próximos 4 días |
| POST · DELETE | `pros/{id}/book`, `consultations/{id}` | Reservar (`{ date, time, mode }`, solo Premium, 2 por mes) · cancelar una que no pasó |
| GET · POST | `wopi` | Conversación con Wopi y consultas que quedan · preguntar (`{ text }`, 3 por mes gratis, 20 con Premium) |
| GET · PUT | `habits/{fecha}` | Agua, caminar, dormir |
| GET · POST · DELETE | `goals`, `goals/{id}/check`, `goals/{id}` | Metas |
| GET | `progress`, `history` | Progreso e historial |
| POST | `adjust/lighten`, `adjust/grow`, `adjust/dismiss` | Ajustes del plan |

Los errores vuelven como `{ "error": "mensaje para mostrar" }`. En los errores de validación se suma `fields`.

> WopFit no reemplaza a un profesional de la salud.
