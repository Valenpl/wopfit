# WopFit · MVP completo (React + Spring Boot + MySQL)

Hábitos que se adaptan a tu vida real. Incluye:

- cuenta
- perfil y preferencias
- plan de entrenamiento y de comidas
- registro diario
- metas y progreso
- "no pude", con alternativas
- ajustes automáticos del plan
- lista del súper, ofertas y lugares cercanos en un mapa
- Premium de demostración (sin cobros): Wopi, profesionales y más
- comunidad con publicaciones y fotos
- se instala como app en el celu

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
| Redux Toolkit + axios | Estado global y pedidos al backend | Un solo store con un slice por recurso; es lo que vimos en Aplicaciones Interactivas |
| Vercel | Publicar el frontend | Gratis, con HTTPS y deploy automático desde GitHub |
| Java + Spring Boot | El backend: reglas de negocio y API | Lo conoce el equipo, es muy usado y trae web, seguridad y base de datos resueltos |
| API REST (JSON) | Comunicación entre front y back | Simple y conocida: cada acción es una URL + GET, POST, PUT o DELETE |
| 3 capas: controller → service → repository | Ordenar el backend | Cada capa tiene una tarea: recibir el pedido, aplicar las reglas, hablar con la base |
| MySQL 8 | Guardar todos los datos | Los datos están relacionados entre sí y necesitan consistencia; el equipo ya domina MySQL |
| JPA / Hibernate | Usar la base desde Java | Cada tabla es una clase; viene integrado con Spring |
| Spring Security + JWT | Login y permisos | Estándar de Spring; el backend verifica en cada pedido quién sos con un token firmado |
| BCrypt | Guardar contraseñas | Se guarda un hash que no se puede revertir, nunca la contraseña |
| Leaflet + OpenStreetMap | El mapa de "Cerca tuyo" | Gratis y abierto, sin claves; la ubicación se usa solo en el celu |
| Playwright | Tests de punta a punta | Maneja un navegador real contra el front y el backend |

Un solo backend (monolito) en 3 capas, en lugar de microservicios: para un equipo chico y una demo, varios servicios sólo suman servidores, costos y fallas entre ellos.

**Planeado (en desarrollo):** migraciones con Flyway, sesión con token corto + token de renovación en cookie, planes versionados detrás de `PlanGenerationService` (hoy un generador simulado, mañana el modelo propio de Wopfit), emails reales para el código de verificación y un modelo de IA para Wopi. Lo simulado (Premium sin cobros, comercios, cupones, profesionales y personas de ejemplo) siempre se muestra como demo.

## Reglas del código

Las reglas completas están en [REGLAS.md](REGLAS.md). Leelas antes de abrir un pull request. Lo principal:

**Backend**
- 3 capas: controller → service → repository. El controller no usa repositories y el service no conoce HTTP.
- Paquetes: `controllers` (con `auth/` y `config/`), `entity` (con `dto/`), `exceptions`, `repository` y `service`.
- Cada service es una interfaz `XService` más su `XServiceImpl`, con inyección por constructor.
- Nunca se devuelve una entidad: entra un `XRequest` validado y sale un `XResponse`, un DTO por archivo.
- Los errores son excepciones propias que `GlobalExceptionHandler` convierte en `{ "error": "..." }` con el status correcto. No hay `try/catch` en los controllers.
- El usuario sale del JWT, nunca de un id que manda el front. Los secretos van en variables de entorno.
- POST y PUT devuelven el objeto completo.

**Frontend**
- React arma las pantallas y Redux guarda los datos compartidos. Lo de un solo componente queda en `useState`.
- Carpetas: `redux/` (store y slices), `api/`, `routes/`, `views/`, `components/`, `hooks/` y `utils/`.
- **No se toca el DOM**: nada de `document.*`, `querySelector`, `classList` ni `window.confirm`. Todo cambia por estado.
- Los pedidos al backend se hacen solo en thunks (`createAsyncThunk`) con la instancia de axios.
- **Sin doble fetch**: cada thunk de lectura usa `condition` con `loaded`/`loading`. Después de un POST, PUT o DELETE no se vuelve a pedir la lista: el store se actualiza con la respuesta.
- No se usa `.unwrap()` en componentes. El resultado se lee del store.
- Formularios controlados con `e.preventDefault()`. `StrictMode` se queda.

**Git:** rama por tarea y pull request. Nada directo a `main` y ninguna credencial en el repo.

- Las pantallas leen con `useFetch` y mandan cambios con `useRequest` (ver [REGLAS.md §3.7 y §3.8](REGLAS.md#37-sin-doble-fetch)).

## Cómo correrlo

Necesitás **Java 17+**, **Maven 3.9+**, **Node 18+** y **Docker** (Docker solo para MySQL).

### 0. Secretos
Copiá `.env.example` como `.env` en la raíz y completá `WOPFIT_JWT_SECRET` (mínimo 32 caracteres) y `DB_PASSWORD`. El `.env` no se sube a Git; lo leen el backend y Docker. También podés usar variables de entorno.

### 1. Base de datos
```bash
docker compose up -d          # MySQL en localhost:3306 (base wopfit, usuario wopfit, contraseña DB_PASSWORD)
```
En desarrollo, las tablas se crean solas al arrancar el backend (`ddl-auto=update`). Para la entrega se usa `backend/db/schema.sql` (ver "Esquema de la base").

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

### Esquema de la base (entrega)
`backend/db/schema.sql` tiene todas las tablas, con las claves foráneas (`fk_goal_user`, …) y los únicos (`uk_user_email`, …) con nombre. Lo genera Hibernate a partir de las entidades, así que no se edita a mano.

Para la entrega se crea la base con ese archivo y el backend corre con el perfil `prod`, que usa `ddl-auto=validate` (solo revisa que la base coincida con las entidades) y no muestra el código de verificación:
```bash
mysql -u wopfit -p wopfit < backend/db/schema.sql
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=mysql,prod
```
Si cambia una entidad, se vuelve a generar contra una base vacía (`wopfit_gen`) y se copia a `backend/db/schema.sql`, dejando el encabezado:
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=0 --spring.datasource.url=jdbc:mysql://localhost:3306/wopfit_gen?createDatabaseIfNotExist=true --spring.datasource.username=root --spring.datasource.password= --spring.jpa.hibernate.ddl-auto=none --spring.jpa.properties.jakarta.persistence.schema-generation.scripts.action=create --spring.jpa.properties.jakarta.persistence.schema-generation.scripts.create-target=schema-gen.sql --spring.jpa.properties.hibernate.hbm2ddl.delimiter=; --spring.jpa.properties.hibernate.format_sql=true"
```
El backend se corta después de escribir `schema-gen.sql` (no hay tablas para los datos de demo): es lo esperado.

## Datos de demostración

Los lugares, cupones y profesionales salen de `backend/src/main/resources/demo/*.tsv`. Se cargan solos al arrancar si las tablas `places`, `offers` y `professionals` están vacías (y la comunidad, si no hay personas de ejemplo).

- **Lugares:** 8 cadenas ficticias (Súper Del Barrio, Mercado Verde, Gimnasio Impulso, Fit Club 24, etc.) con sucursales en direcciones reales de CABA y Vicente López, más 10 parques reales. Las coordenadas se sacaron de OpenStreetMap (Nominatim).
- **Comunidad:** `people.tsv`, `posts.tsv` y `comments.tsv`. Las personas de ejemplo son perfiles de la comunidad, no usuarios: no se puede entrar con ellas.
- **Profesionales:** `professionals.tsv`, con nombres y matrículas ficticios.
- **Cupones:** 10 de aliados ficticios. Cada uno se renueva solo cada cierta cantidad de días, así la demo nunca queda con cupones vencidos.
- **Tu ubicación:** si la compartís, el front ordena por distancia con ella; si no, se centra en UADE (Lima 775). La ubicación nunca se manda al servidor.
- Para cambiar los datos, editá los `.tsv` y vaciá las tablas (con H2 alcanza con reiniciar).

## Configuración (variables de entorno)

Se pueden poner en el `.env` de la raíz (ver `.env.example`) o como variables de entorno.

| Variable | Default | Para qué |
|---|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/wopfit?...` | Conexión MySQL |
| `DB_USER` | `wopfit` | Usuario MySQL |
| `DB_PASSWORD` | sin default, va en `.env` | Contraseña MySQL |
| `WOPFIT_JWT_SECRET` | sin default, va en `.env` | Clave para firmar los JWT (mínimo 32 caracteres) |
| `WOPFIT_CORS_ORIGINS` | `http://localhost:5173` | Dominios del front, separados por coma |
| `WOPFIT_DEV_CODES` | `true` | Mostrar el código de verificación (poné `false` en producción) |
| `VITE_API_URL` (front) | `/api/v1` | URL de la API, si el front se publica en otro dominio |

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
| Comunidad | Personas como vos (por objetivos en común) para seguir, publicaciones de recetas, actividades y preguntas con foto, me gusta, guardados y comentarios. En la comunidad se ve el nombre y la inicial del apellido. Trae 6 personas y 5 publicaciones de ejemplo |
| App instalable | `manifest.webmanifest` e íconos para agregarla a la pantalla de inicio, y un service worker (solo en la versión publicada) que guarda la app y las imágenes, nunca la API. Pantalla "Instalá WopFit" con el botón del navegador o los pasos para iPhone y Android |
| Lista del súper | Ingredientes del menú de la semana, de los más usados a los menos, sin las comidas marcadas como "no pude". Lo que tildás queda guardado por semana |
| "No pude" | El motivo define una versión alternativa: exprés, liviana, suave, sin equipamiento o caminata. La rutina completa pasa al próximo día libre. Las comidas proponen una alternativa según el motivo |
| Metas | Meta concreta (qué, cuántas veces por semana, cuántas semanas) que suma al objetivo |
| Progreso | Semana actual, racha de semanas completas, % por objetivo, historial de entrenos, hábitos y dificultades |
| Ajustes | Con 2 o más sesiones complicadas en 7 días, propone alivianar el plan. Con una semana completa, propone subir de nivel. Si cambiás preferencias, el cambio queda pendiente hasta "Actualizar mi plan", que muestra qué cambió |

## API (todo bajo `/api/v1`, JSON)

Rutas públicas:

- `POST` `auth/register`, `auth/verify`, `auth/authenticate`, `auth/resend`
- `GET` `health`, `catalog`

El resto requiere `Authorization: Bearer <token>`. Criterio de las rutas (REGLAS 2.9): cada una empieza con un recurso en plural; lo que la persona logueada tiene una sola vez cuelga de `users/me`; las acciones sobre un recurso que no son alta, edición ni baja (marcar como hecho, saltear, reservar...) van como `POST` a una sub-ruta.

| Método | Ruta | Qué hace |
|---|---|---|
| GET · PUT | `users/me` | Usuario, preferencias y plan · datos básicos |
| PUT | `users/me/preferences` | Preferencias |
| PUT | `users/me/password` | Cambiar la contraseña (pide la actual) |
| POST · DELETE | `users/me/subscription` | Activar Premium de demostración (`{ "period": "mensual" \| "semestral" \| "anual" }`, sin cobro) · volver al Gratuito |
| POST · GET | `users/me/plan` | Crear o actualizar el plan · ver el plan |
| POST | `users/me/plan/lighten`, `users/me/plan/grow`, `users/me/plan/dismiss` | Ajustes del plan |
| GET | `users/me/progress`, `users/me/history` | Progreso e historial |
| GET | `workouts/today`, `workouts/week?start=AAAA-MM-DD`, `workouts/{id}` | Entrenamientos |
| POST | `workouts/{id}/report` · `accept-alternative` · `rest` · `reschedule` · `done` | "No pude", alternativa, mover, completar |
| GET | `meals/{fecha}` | Comidas del día y costo semanal |
| POST | `meals/{fecha}/{0-2}/eaten` · `report` · `accept` · `skip` · `swap` | Registrar, alternativa, cambiar |
| GET · PUT | `shopping-lists/{fecha}` | Lista del súper de la semana de esa fecha · tildar o destildar un ingrediente |
| GET | `places` | Lugares cercanos (solo Premium; si no, 403): coordenadas, si está abierto ahora y si tiene descuento |
| GET | `offers` | Cupones de aliados con sus sucursales y si sirven para tu lista del súper; `alerts` = Premium |
| GET | `professionals`, `professionals/{id}` | Profesionales, cupo del mes y tus próximas consultas · perfil con la agenda de los próximos 4 días |
| POST · DELETE | `professionals/{id}/consultations`, `consultations/{id}` | Reservar (`{ date, time, mode }`, solo Premium, 2 por mes; devuelve la consulta y el cupo) · cancelar una que no pasó (devuelve `{ id, message, left }`) |
| GET · POST | `wopi/messages` | Conversación con Wopi y consultas que quedan · preguntar (`{ text }`, 3 por mes gratis, 20 con Premium) |
| GET | `people` | Personas como vos (las 5 que más objetivos comparten) y tu perfil de la comunidad |
| PUT | `people/{id}/follow` | Seguir o dejar de seguir (`{ on }`) |
| GET | `posts?filter=para\|recetas\|act\|preg&page=0&size=10` | Feed paginado: `{ content, page, size, totalElements, last }` |
| POST · GET · DELETE | `posts`, `posts/{id}` | Publicar (`{ type, title, body, photo }`, foto como data URL) · ver con comentarios · borrar la propia (devuelve `{ id, message }`) |
| POST · PUT | `posts/{id}/comments` · `posts/{id}/like` · `posts/{id}/save` | Comentar · me gusta · guardar |
| GET | `photos/{id}` | Foto de una publicación (pública: el id es un UUID) |
| GET · PUT | `habits/{fecha}` | Agua, caminar, dormir |
| GET · POST · DELETE | `goals`, `goals/{id}/check`, `goals/{id}` | Metas (borrar devuelve `{ id, message }`) |

Los errores vuelven como `{ "error": "mensaje para mostrar" }`. En los errores de validación se suma `fields`.

> WopFit no reemplaza a un profesional de la salud.
