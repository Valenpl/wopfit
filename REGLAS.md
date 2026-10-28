# Wopfit · Reglas del juego

Cómo se escribe el código de Wopfit. Sale de lo que vimos en **Aplicaciones Interactivas** (clases 1 a 11 del Notion) y de cómo armamos el e-commerce del grupo 4. Donde el e-commerce se apartó de la clase, manda la clase.

Si algo del código actual no cumple estas reglas, se cambia. El código se está migrando de a un paso por pull request, así que algunas partes todavía no están así.

---

## 1. Stack

| Parte | Qué usamos |
|---|---|
| Frontend | React 18 + Vite, React Router, **Redux Toolkit** (`createSlice`, `createAsyncThunk`), **axios** |
| Backend | Java 17, Spring Boot 3, Spring Web, Spring Data JPA (Hibernate), Spring Security + **JWT** (jjwt), Lombok, Validation |
| Base | **MySQL 8** |

No se suman librerías nuevas sin hablarlo antes en el grupo.

---

## 2. Backend

### 2.1 Arquitectura en 3 capas

```
Request → Controller → Service → Repository → MySQL
```

| Capa | Hace | No hace |
|---|---|---|
| **Controller** | Recibe el pedido HTTP, valida el DTO (`@Valid`), llama al service y devuelve `ResponseEntity` | No tiene lógica de negocio ni usa repositories |
| **Service** | Aplica las reglas de negocio, decide qué guardar y arma el DTO de respuesta | No conoce HTTP (ni `ResponseEntity` ni `HttpServletRequest`) |
| **Repository** | Habla con la base (`JpaRepository`, métodos derivados, `@Query`) | No tiene lógica |

Las capas se llaman siempre en ese orden. Un controller nunca salta al repository.

> Pendiente de decisión: un backend con 3 capas (como el e-commerce) o microservicios. Si se eligen microservicios, cada servicio repite esta misma estructura adentro.

### 2.2 Carpetas

Igual que en el e-commerce (`com.uade.tpo.demo`), con el paquete `com.wopfit`:

```
backend/src/main/java/com/wopfit/
├── WopfitApplication.java
├── controllers/
│   ├── PlanController.java, MealController.java, GoalController.java, ...
│   ├── GlobalExceptionHandler.java
│   ├── auth/            AuthenticationController + sus Request/Response
│   └── config/          SecurityConfig, JwtAuthenticationFilter, JwtService,
│                        ApplicationConfig, CorsConfig
├── entity/
│   ├── User.java, Plan.java, Goal.java, ...    (@Entity)
│   └── dto/             XRequest.java, XResponse.java (uno por archivo)
├── exceptions/          XNotFoundException, XDuplicateException, ...
├── repository/          XRepository.java
└── service/             XService.java (interfaz) + XServiceImpl.java
```

### 2.3 Entidades

- `@Entity` y Lombok (`@Data` o `@Getter/@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder` si hace falta).
- `@Id @GeneratedValue(strategy = GenerationType.IDENTITY)`.
- Relaciones con `@ManyToOne`, `@OneToMany(mappedBy = ...)`, `@JoinColumn`. En `@OneToMany` usamos `@JsonIgnore` o directamente no exponemos la entidad (ver DTOs).
- Los roles van en un `enum` (`USER`, `ADMIN`).

### 2.4 DTOs

- **Nunca se devuelve una entidad** desde un controller. Se devuelve un `XResponse`. (En el e-commerce devolvíamos `Page<Category>`: eso no se repite.)
- Lo que entra es un `XRequest` con validaciones (`@NotBlank`, `@Email`, `@Min`, ...) y `@Valid` en el controller.
- Un DTO por archivo en `entity/dto`. No hay un `Dtos.java` con todo junto.
- La conversión entidad ↔ DTO la hace el service (un método `toResponse(...)` o una clase `XMapper`).

### 2.5 Services

- Interfaz `XService` + clase `XServiceImpl` con `@Service` (clase 3).
- Inyección por constructor: `@RequiredArgsConstructor` + campos `private final`. Elegimos una sola forma en todo el proyecto (en el e-commerce mezclábamos `@Autowired` en campos y constructor).
- `@Transactional` en los métodos que escriben varias tablas.
- El usuario logueado sale del token (`Authentication` / `SecurityContextHolder`), **nunca** de un id que manda el front.

### 2.6 Repositories

```java
@Repository
public interface PlanRepository extends JpaRepository<Plan, Long> {
    Optional<Plan> findByUserId(Long userId);
}
```

### 2.7 Errores: el backend siempre responde

- Una excepción propia por caso, en `exceptions/` (`PlanNotFoundException`, `EmailAlreadyUsedException`, ...).
- El service tira la excepción y no devuelve `null`.
- `GlobalExceptionHandler` (`@RestControllerAdvice`) la convierte en una respuesta con el status correcto:

| Caso | Status |
|---|---|
| Validación de DTO | 400 |
| Sin token o token inválido | 401 |
| Sin permiso (otro rol o dato ajeno) | 403 |
| No existe | 404 |
| Duplicado | 409 |
| Error inesperado | 500, con mensaje genérico |

- El cuerpo es siempre el mismo formato: `{ "error": "mensaje para mostrar", "fields": { ... } }`.
- **No hay `try/catch` en los controllers** que devuelvan un string (en el e-commerce lo hacíamos y quedaban respuestas distintas para el mismo error).

### 2.8 Seguridad con JWT

Mismo armado que en el e-commerce:

1. `AuthenticationController` en `/api/v1/auth/**` (`register`, `authenticate`) es público.
2. `AuthenticationService` valida con `AuthenticationManager`, firma el JWT con `JwtService` y devuelve `AuthenticationResponse { token }`. El token lleva `sub` (email), `role` y `userId`.
3. `JwtAuthenticationFilter` (`OncePerRequestFilter`) lee `Authorization: Bearer <token>`, lo valida y carga el usuario en el `SecurityContextHolder`.
4. `SecurityConfig`: CSRF desactivado, sesión `STATELESS`, `permitAll()` para auth, `requestMatchers(...).hasAuthority("ADMIN")` para lo de admin y `anyRequest().authenticated()` para el resto.
5. `ApplicationConfig`: `UserDetailsService`, `DaoAuthenticationProvider`, `BCryptPasswordEncoder`, `AuthenticationManager`.
6. `CorsConfig`: orígenes desde una variable de entorno.

Secretos:
- La clave del JWT y la contraseña de MySQL van en variables de entorno (`WOPFIT_JWT_SECRET`, `DB_PASSWORD`). En `application.properties` solo queda `${WOPFIT_JWT_SECRET}`.
- Ningún secreto en Git ni en el front.

### 2.9 REST

- Rutas en plural y por recurso: `GET /api/v1/goals`, `POST /api/v1/goals`, `PUT /api/v1/goals/{id}`, `DELETE /api/v1/goals/{id}`.
- `POST` responde **201** con el objeto creado, `PUT` responde **200** con el objeto actualizado y `DELETE` responde **204** (o 200 con el id).
- **Todo POST/PUT devuelve el objeto completo**, así el front actualiza el store sin volver a pedirlo (ver 3.6).
- Las listas largas son paginadas (`Pageable`).

---

## 3. Frontend

### 3.1 Carpetas

Como el e-commerce, pero con `redux/` adentro de `src/`:

```
frontend/src/
├── main.jsx              createRoot + StrictMode + Provider + BrowserRouter
├── App.jsx               solo <Routes>
├── api/
│   └── axios.js          instancia de axios (baseURL y token)
├── redux/
│   ├── store.js          configureStore + combineReducers
│   └── slices/           authSlice, planSlice, mealSlice, goalSlice, uiSlice, ...
├── views/                una carpeta por ruta (home/, plan/, food/, profile/, auth/, ...)
├── components/           por tema (layout/, plan/, food/, shared/, ...)
├── hooks/                useAuth, useToast, ... (leen y despachan; no hacen pedidos)
├── utils/                funciones puras (formatos, fechas)
└── styles/ o el .css al lado de su componente
```

### 3.2 Componentes

- **Vistas** (`views/`): una por ruta. Leen del store con `useSelector`, despachan el thunk de carga y pasan datos por props.
- **Componentes tontos** (`components/`): reciben props y muestran. No llaman al back ni despachan thunks; avisan al padre con callbacks (`onSave`, `onDelete`).
- Listas con `.map()` y `key` estable (el id, nunca el índice).
- Datos de arriba hacia abajo por props; eventos de abajo hacia arriba por funciones.
- Un componente por archivo y nombre en PascalCase.

### 3.3 No se toca el DOM

React maneja el DOM a través del Virtual DOM. Nosotros cambiamos el **estado** y React dibuja.

No va:
- `document.getElementById`, `querySelector`, `classList`, `innerHTML`, `createElement`, `.focus()` o `.scrollIntoView()` sobre elementos buscados a mano.
- `window.confirm` / `alert` → se usa un modal propio controlado por estado.

Sí va:
- Clases y estilos que dependen del estado (`className={open ? 'menu open' : 'menu'}`).
- Mostrar u ocultar con renderizado condicional (`{open && <Modal/>}`).
- La única llamada al DOM es `document.getElementById('root')` en `main.jsx`.

Si alguna vez hace falta foco o scroll, se usa un `ref` de React y se comenta por qué.

### 3.4 Formularios controlados

- Cada input tiene `value` + `onChange` atados a `useState`.
- `onSubmit` con `e.preventDefault()` y después `dispatch(thunk(datos))`.
- Las validaciones simples se muestran con estado, no con `alert`.

### 3.5 Redux

- Un solo store. Un slice por recurso del back (`plan`, `meals`, `goals`, `habits`, ...), más `auth` y `ui`.
- Estado de cada slice:
  ```js
  { items: [], loaded: false, loading: false, error: null }
  ```
- Lo **síncrono** va en `reducers` (`logout`, `addToast`). Lo **asíncrono** va en `createAsyncThunk` + `extraReducers` con `builder.addCase(pending | fulfilled | rejected)` (clase 11).
- Reducers puros: no llaman al back, no usan `Date.now()` ni `Math.random()`, no tocan el DOM.
- Los componentes usan solo `useSelector` y `useDispatch`. No hay Context para estado global.
- Solo `auth` se guarda entre recargas (`redux-persist` con `whitelist: ['auth']`).

### 3.6 Llamadas al backend

- **Solo dentro de los thunks**, con axios. Ningún componente usa `fetch` ni axios directo.
- Una instancia `api/axios.js` con `baseURL` tomada de `import.meta.env.VITE_API_URL`. Nada de `'http://localhost:4002/...'` escrito en cada slice.
- El token se toma del store en el thunk (`getState().auth.token`) o con un interceptor de axios, sin pasarlo como argumento desde cada componente.
- Promesas con `.then/.catch` como en clase, o `async/await` adentro del thunk.
- Un `401` despacha `logout()` y manda a la pantalla de login.

### 3.7 Sin doble fetch

Cada dato se le pide al backend **una sola vez**.

1. **Carga inicial**: `useEffect(() => { dispatch(fetchGoals()) }, [dispatch])`.
2. **El thunk se protege solo** con `condition`, igual que en el e-commerce:
   ```js
   export const fetchGoals = createAsyncThunk('goals/fetch', async (_, { getState }) => {
     const { data } = await api.get('/goals');
     return data;
   }, {
     condition: (_, { getState }) => {
       const { loaded, loading } = getState().goals;
       return !loaded && !loading;   // si ya está o ya se está pidiendo, no sale otro pedido
     },
   });
   ```
   Así no se repite con `StrictMode`, al volver a una pantalla, ni cuando dos componentes piden lo mismo.
3. **No se hace GET después de un POST/PUT/DELETE** (clase 11). El store se actualiza con la respuesta:
   - crear: `state.items.push(action.payload)`
   - editar: `findIndex` y reemplazar
   - borrar: `filter`
4. `useEffect` lleva su array de dependencias y su limpieza (`return () => ...`) cuando corresponde.
5. `StrictMode` **se queda**, porque es lo que deja ver si algo se pide dos veces.

### 3.8 Resultado de una acción: nada de `.unwrap()` en componentes

En el e-commerce encadenábamos `dispatch(x).unwrap().then(...)` en los componentes y en `useAuth` para limpiar formularios, navegar o mostrar errores. Eso no se repite.

El resultado se lee del **estado del slice**:

```jsx
const { saving, error, lastSavedId } = useSelector(s => s.goals);

const onSubmit = e => { e.preventDefault(); dispatch(createGoal(form)); };

useEffect(() => {
  if (lastSavedId) { setForm(VACIO); navigate('/metas'); }
}, [lastSavedId]);

{error && <p className="error">{error}</p>}
```

- Los toasts los dispara el propio slice desde el thunk (`dispatch(addToast(...))`) o un componente que lee `error` del store.
- Si una acción necesita varias llamadas seguidas (crear un plan y después sus sesiones), se hace **un solo thunk** que las encadena, no una cadena de promesas en el componente.

---

## 4. Base de datos

- MySQL 8, base `wopfit`, con Docker para desarrollo.
- Tablas en plural y `snake_case`; columnas en `snake_case`. Ids `BIGINT AUTO_INCREMENT`; claves foráneas con nombre (`fk_goal_user`).
- Normalizado: cada dato está en un solo lugar.
- `ddl-auto=update` solo para desarrollo. Para la entrega, el esquema queda en un `schema.sql` (o Flyway si el grupo lo aprueba) y `ddl-auto=validate`.

---

## 5. Git

- Nadie pushea directo a `main`: rama por tarea (`feat/redux-goals`, `fix/login-401`) y pull request.
- Commits chicos y en castellano, del estilo "Agrega goalSlice con condition".
- `.env`, `application-local.properties` y credenciales van en `.gitignore`.
