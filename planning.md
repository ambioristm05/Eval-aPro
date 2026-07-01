# Planning.md — Sistema de Gestión de Tareas e Instrumentos de Evaluación

## 1. Nombre del proyecto

**EvalúaPro — Sistema de Gestión de Tareas e Instrumentos de Evaluación**

Aplicación web para crear, gestionar y aplicar instrumentos de evaluación como rúbricas, listas de cotejo y otros formularios evaluativos, permitiendo evaluar participantes, mostrar resultados, sugerencias de mejora, acumular calificaciones y generar reportes imprimibles.

---

## 2. Problema que resuelve

Actualmente muchos profesores o evaluadores imprimen rúbricas, listas de cotejo y formularios para evaluar a sus estudiantes o participantes. Esto genera:

- Consumo innecesario de papel.
- Dificultad para organizar resultados.
- Pérdida de documentos físicos.
- Mucho trabajo manual para calcular notas finales.
- Dificultad para entregar retroalimentación personalizada.
- Falta de historial centralizado de evaluaciones.

La aplicación busca digitalizar este proceso para que el evaluador pueda crear instrumentos, evaluar participantes, guardar resultados, enviar notas, mostrar sugerencias y permitir impresión solo cuando sea necesario.

---

## 3. Objetivo general

Crear una aplicación web con React, Node.js, Express, MongoDB y JWT que permita a evaluadores gestionar tareas, instrumentos de evaluación, participantes, calificaciones, resultados, sugerencias, reportes e impresión de información académica o formativa.

---

## 4. Objetivos específicos

- Permitir el registro e inicio de sesión de estudiantes o participantes.
- Proteger el registro de evaluadores/profesores para que no esté visible públicamente.
- Permitir a los evaluadores crear, editar, eliminar y aplicar instrumentos de evaluación.
- Permitir crear rúbricas, listas de cotejo y otros tipos de instrumentos.
- Permitir evaluar participantes mediante criterios, niveles, indicadores y puntuaciones.
- Permitir a los participantes ver sus resultados, notas, sugerencias y mejoras.
- Permitir que los participantes eliminen su cuenta desde su perfil.
- Permitir que el profesor elimine o suspenda perfiles de estudiantes que abandonen la clase.
- Bloquear el inicio de sesión de estudiantes suspendidos o eliminados lógicamente.
- Acumular las notas de cada evaluación para calcular una nota final.
- Generar reportes imprimibles de instrumentos, resultados, notas y participantes.
- Reducir el uso de papel al digitalizar rúbricas y listas de cotejo.

---

## 5. Tecnologías principales

### Frontend

- React
- React Router DOM
- Axios
- Context API o Zustand para estado global
- React Hook Form
- Zod o Yup para validaciones
- Tailwind CSS o Bootstrap
- Recharts para estadísticas
- React Toastify o Sonner para notificaciones

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT para autenticación
- Bcrypt para encriptar contraseñas
- Express Validator o Zod para validaciones
- CORS
- Dotenv
- Morgan
- Helmet

### Reportes e impresión

- CSS print media
- React-to-print
- PDFKit, Puppeteer o jsPDF para exportar PDF
- Exportación a CSV o Excel usando SheetJS

### Herramientas de desarrollo

- Git y GitHub
- Postman o Insomnia
- MongoDB Compass
- Vite
- ESLint y Prettier
- Render, Railway, Vercel o Netlify para despliegue

---

## 6. Roles del sistema

### 6.1. Administrador

Rol opcional recomendado para controlar la creación de evaluadores.

Permisos:

- Crear cuentas de evaluadores.
- Aprobar solicitudes de evaluadores.
- Suspender evaluadores.
- Ver estadísticas generales.
- Gestionar configuración del sistema.

### 6.2. Evaluador / Profesor

Permisos:

- Iniciar sesión.
- Gestionar su perfil.
- Crear grupos o clases.
- Registrar, invitar o vincular estudiantes.
- Suspender estudiantes.
- Eliminar perfiles de estudiantes de forma lógica.
- Crear tareas.
- Crear instrumentos de evaluación.
- Aplicar evaluaciones.
- Ver resultados de sus estudiantes.
- Agregar sugerencias y mejoras.
- Calcular notas finales.
- Imprimir instrumentos y reportes.

### 6.3. Estudiante / Participante

Permisos:

- Registrarse desde la vista pública.
- Iniciar sesión.
- Ver su perfil.
- Editar datos básicos de su cuenta.
- Eliminar su cuenta desde su perfil.
- Ver tareas asignadas.
- Ver resultados de evaluaciones.
- Ver sugerencias y mejoras.
- Descargar o imprimir sus resultados si está permitido.

---

## 7. Seguridad del registro de evaluadores

La página de registro del evaluador/profesor **no debe estar visible en la vista pública**.

### Opciones recomendadas

#### Opción 1: Registro por invitación

El administrador genera un enlace o código de invitación para crear una cuenta de evaluador.

Ejemplo:

```txt
/register/evaluator?token=INVITATION_TOKEN
```

El token debe:

- Tener fecha de expiración.
- Ser de un solo uso.
- Estar asociado a un correo autorizado.
- Invalidarse después del registro.

#### Opción 2: Creación manual por administrador

El administrador crea directamente la cuenta del evaluador desde un panel privado.

#### Opción 3: Solicitud de acceso

El usuario solicita acceso como evaluador, pero no obtiene la cuenta automáticamente. Un administrador debe aprobar la solicitud.

### Decisión recomendada para el MVP

Usar **creación manual por administrador** o **registro por invitación**. No mostrar botón público de “Registrarse como profesor”.

---

## 8. Funcionalidades principales

## 8.1. Autenticación y autorización

- Registro público solo para estudiantes.
- Registro de evaluadores protegido por invitación o administrador.
- Inicio de sesión con email y contraseña.
- Contraseñas encriptadas con Bcrypt.
- Autenticación con JWT.
- Protección de rutas privadas.
- Roles: admin, evaluator, student.
- Middleware para permisos por rol.
- Bloqueo de acceso para usuarios suspendidos o eliminados.

Estados de usuario recomendados:

```js
active
suspended
deleted
pending
```

---

## 8.2. Gestión de estudiantes

El profesor podrá gestionar los estudiantes vinculados a sus clases o grupos.

Funcionalidades:

- Ver listado de estudiantes.
- Buscar estudiantes.
- Filtrar por estado: activo, suspendido, eliminado.
- Ver perfil académico del estudiante.
- Suspender estudiante.
- Reactivar estudiante suspendido.
- Eliminar estudiante de forma lógica.
- Impedir inicio de sesión a estudiantes suspendidos o eliminados.
- Mantener historial de evaluaciones aunque el estudiante sea eliminado lógicamente.

### Suspender estudiante

Se usa cuando el estudiante abandona temporalmente la clase o no debe acceder al sistema.

Efectos:

- El estudiante no puede iniciar sesión.
- Sus datos no se borran.
- Sus evaluaciones se conservan.
- El profesor puede reactivarlo después.

### Eliminar estudiante

Se recomienda usar eliminación lógica, no eliminación física.

Efectos:

- El estado del usuario cambia a `deleted`.
- El estudiante no puede iniciar sesión.
- No aparece en listados normales.
- Sus evaluaciones se conservan para reportes históricos.
- El sistema guarda fecha y responsable de la eliminación.

Campos sugeridos:

```js
status: 'active' | 'suspended' | 'deleted'
deletedAt: Date
suspendedAt: Date
statusReason: String
actionBy: ObjectId
```

---

## 8.3. Eliminación de cuenta por el estudiante

El estudiante debe poder eliminar su cuenta directamente desde su perfil.

### Reglas recomendadas

- La eliminación debe ser lógica, no física.
- Antes de eliminar, mostrar confirmación.
- Solicitar contraseña para confirmar.
- Cerrar sesión automáticamente después de eliminar la cuenta.
- Cambiar el estado del usuario a `deleted`.
- Impedir futuros inicios de sesión.
- Mantener resultados históricos anonimizados o asociados internamente para reportes del profesor.

### Mensaje sugerido

“Al eliminar tu cuenta, no podrás volver a iniciar sesión. Tus resultados anteriores podrán conservarse de forma interna para fines académicos y reportes del evaluador.”

---

## 8.4. Gestión de tareas

El evaluador podrá crear tareas o actividades evaluables.

Campos sugeridos:

- Título
- Descripción
- Fecha de inicio
- Fecha de entrega
- Estado
- Grupo o clase
- Instrumento asociado
- Participantes asignados

Estados:

```txt
Pendiente
En progreso
Completada
Cancelada
```

Funcionalidades:

- Crear tarea.
- Editar tarea.
- Eliminar tarea.
- Asignar tarea a grupo o estudiantes específicos.
- Cambiar estado.
- Buscar y filtrar tareas.
- Ver tareas por estudiante.

---

## 8.5. Instrumentos de evaluación

La aplicación debe permitir crear diferentes tipos de instrumentos.

Tipos iniciales:

- Rúbrica analítica.
- Rúbrica holística.
- Lista de cotejo.
- Escala de valoración.
- Guía de observación.
- Cuestionario evaluativo simple.

### Campos generales del instrumento

- Título
- Descripción
- Tipo de instrumento
- Criterios
- Indicadores
- Puntuación máxima
- Niveles de desempeño
- Estado: borrador, activo, archivado
- Creador
- Fecha de creación

### Rúbrica

Una rúbrica debe tener:

- Criterios.
- Niveles de desempeño.
- Descripción por nivel.
- Puntuación por nivel.

Ejemplo de niveles:

```txt
Excelente: 5 puntos
Bueno: 4 puntos
Aceptable: 3 puntos
Debe mejorar: 2 puntos
Insuficiente: 1 punto
```

### Lista de cotejo

Una lista de cotejo debe tener:

- Indicadores.
- Opciones: Sí / No / Parcial.
- Puntuación configurable.
- Observaciones.

---

## 8.6. Evaluaciones

El evaluador podrá aplicar un instrumento a uno o varios estudiantes.

Campos:

- Estudiante evaluado
- Evaluador
- Tarea
- Instrumento usado
- Respuestas o puntuaciones
- Nota obtenida
- Nota máxima
- Porcentaje
- Observaciones
- Sugerencias de mejora
- Fecha de evaluación

Funcionalidades:

- Evaluar estudiante.
- Guardar evaluación como borrador.
- Finalizar evaluación.
- Editar evaluación si está permitido.
- Generar retroalimentación.
- Enviar resultado al estudiante.
- Imprimir evaluación individual.

---

## 8.7. Resultados, sugerencias y mejoras

El estudiante podrá ver:

- Nota obtenida.
- Porcentaje.
- Criterios evaluados.
- Puntos fuertes.
- Aspectos por mejorar.
- Sugerencias del profesor.
- Historial de evaluaciones.
- Nota final acumulada.

El evaluador podrá agregar sugerencias personalizadas como:

- “Debe mejorar la organización de las ideas.”
- “Buen dominio del tema.”
- “Necesita reforzar la presentación oral.”
- “Debe entregar a tiempo las próximas actividades.”

---

## 8.8. Acumulación de notas y resultado final

La aplicación debe acumular las notas de cada evaluación para generar un resultado final.

Opciones de cálculo:

### Promedio simple

```txt
Nota final = suma de notas / cantidad de evaluaciones
```

### Promedio ponderado

Cada tarea o evaluación puede tener un porcentaje.

Ejemplo:

```txt
Tarea 1: 20%
Tarea 2: 30%
Proyecto final: 50%
```

### Recomendación

Usar promedio ponderado como opción principal, pero permitir promedio simple para casos básicos.

---

## 8.9. Reportes e impresión

El sistema debe permitir imprimir o exportar:

- Instrumentos de evaluación.
- Rúbricas.
- Listas de cotejo.
- Resultados individuales.
- Resultados por grupo.
- Historial de estudiante.
- Reporte final de notas.
- Reporte de tareas completadas.
- Reporte de estudiantes activos, suspendidos o eliminados.

Formatos:

- Vista imprimible desde navegador.
- PDF.
- Excel o CSV.

Recomendación:

- Crear componentes especiales de impresión.
- Usar estilos CSS para `@media print`.
- Permitir ocultar botones, menús y elementos visuales innecesarios al imprimir.

---

## 8.10. Filtros y búsqueda

Filtros recomendados:

- Por estudiante.
- Por grupo.
- Por tarea.
- Por instrumento.
- Por fecha.
- Por estado.
- Por calificación.
- Por evaluador.

Búsqueda:

- Buscar estudiantes por nombre o correo.
- Buscar tareas por título.
- Buscar instrumentos por nombre.
- Buscar evaluaciones por estudiante o actividad.

---

## 8.11. Perfil de usuario

### Perfil del evaluador

- Nombre
- Email
- Foto opcional
- Especialidad
- Cambiar contraseña
- Ver grupos creados
- Ver instrumentos creados

### Perfil del estudiante

- Nombre
- Email
- Foto opcional
- Grupo o clase
- Historial de evaluaciones
- Nota acumulada
- Cambiar contraseña
- Eliminar cuenta

---

## 9. Modelos de datos sugeridos

## 9.1. User

```js
{
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ['admin', 'evaluator', 'student']
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted', 'pending'],
    default: 'active'
  },
  groups: [ObjectId],
  createdBy: ObjectId,
  deletedAt: Date,
  suspendedAt: Date,
  statusReason: String,
  actionBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

## 9.2. Group

```js
{
  name: String,
  description: String,
  evaluator: ObjectId,
  students: [ObjectId],
  status: String,
  createdAt: Date
}
```

## 9.3. Task

```js
{
  title: String,
  description: String,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled']
  },
  evaluator: ObjectId,
  group: ObjectId,
  students: [ObjectId],
  instrument: ObjectId,
  startDate: Date,
  dueDate: Date,
  weight: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## 9.4. Instrument

```js
{
  title: String,
  description: String,
  type: {
    type: String,
    enum: ['rubric', 'checklist', 'rating_scale', 'observation_guide', 'questionnaire']
  },
  criteria: [
    {
      name: String,
      description: String,
      maxScore: Number,
      levels: [
        {
          name: String,
          description: String,
          score: Number
        }
      ]
    }
  ],
  indicators: [
    {
      text: String,
      score: Number
    }
  ],
  evaluator: ObjectId,
  status: {
    type: String,
    enum: ['draft', 'active', 'archived']
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 9.5. Evaluation

```js
{
  student: ObjectId,
  evaluator: ObjectId,
  task: ObjectId,
  instrument: ObjectId,
  answers: Array,
  score: Number,
  maxScore: Number,
  percentage: Number,
  feedback: String,
  suggestions: [String],
  status: {
    type: String,
    enum: ['draft', 'completed', 'published']
  },
  evaluatedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 9.6. Invitation

```js
{
  email: String,
  role: String,
  token: String,
  used: Boolean,
  expiresAt: Date,
  createdBy: ObjectId,
  createdAt: Date
}
```

---

## 10. Rutas API sugeridas

## 10.1. Auth

```txt
POST /api/auth/register/student
POST /api/auth/register/evaluator/invitation
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

## 10.2. Invitaciones

```txt
POST /api/invitations/evaluator
GET  /api/invitations/validate/:token
```

## 10.3. Usuarios

```txt
GET    /api/users
GET    /api/users/:id
PATCH  /api/users/:id
PATCH  /api/users/:id/suspend
PATCH  /api/users/:id/reactivate
DELETE /api/users/:id
DELETE /api/users/me
```

## 10.4. Grupos

```txt
POST   /api/groups
GET    /api/groups
GET    /api/groups/:id
PATCH  /api/groups/:id
DELETE /api/groups/:id
POST   /api/groups/:id/students
DELETE /api/groups/:id/students/:studentId
```

## 10.5. Tareas

```txt
POST   /api/tasks
GET    /api/tasks
GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
```

## 10.6. Instrumentos

```txt
POST   /api/instruments
GET    /api/instruments
GET    /api/instruments/:id
PATCH  /api/instruments/:id
DELETE /api/instruments/:id
```

## 10.7. Evaluaciones

```txt
POST   /api/evaluations
GET    /api/evaluations
GET    /api/evaluations/:id
GET    /api/evaluations/student/:studentId
PATCH  /api/evaluations/:id
DELETE /api/evaluations/:id
PATCH  /api/evaluations/:id/publish
```

## 10.8. Reportes

```txt
GET /api/reports/student/:studentId
GET /api/reports/group/:groupId
GET /api/reports/task/:taskId
GET /api/reports/final-grades/:groupId
GET /api/reports/instruments/:instrumentId
```

---

## 11. Pantallas principales

## 11.1. Públicas

- Inicio
- Login
- Registro de estudiante
- Solicitud de acceso como evaluador, opcional
- Recuperar contraseña

Importante:

- No mostrar registro público de profesor.
- No mostrar enlace directo a `/register/evaluator`.

## 11.2. Administrador

- Dashboard admin
- Crear evaluador
- Gestionar evaluadores
- Generar invitaciones
- Ver estadísticas generales

## 11.3. Evaluador

- Dashboard
- Mis grupos
- Estudiantes
- Tareas
- Instrumentos
- Crear rúbrica
- Crear lista de cotejo
- Evaluaciones
- Resultados
- Reportes
- Perfil

## 11.4. Estudiante

- Dashboard estudiante
- Mis tareas
- Mis evaluaciones
- Resultados
- Sugerencias de mejora
- Nota final
- Perfil
- Eliminar cuenta

---

## 12. Flujo principal del sistema

1. El administrador crea o invita al evaluador.
2. El evaluador inicia sesión.
3. El evaluador crea un grupo o clase.
4. Los estudiantes se registran o son agregados al grupo.
5. El evaluador crea una tarea.
6. El evaluador crea o selecciona un instrumento.
7. El evaluador aplica la evaluación.
8. El sistema calcula la nota.
9. El evaluador publica los resultados.
10. El estudiante ve sus notas, comentarios y sugerencias.
11. El sistema acumula las calificaciones.
12. El evaluador genera reportes o imprime información si lo necesita.

---

## 13. Reglas de negocio importantes

- Un estudiante suspendido no puede iniciar sesión.
- Un estudiante eliminado lógicamente no puede iniciar sesión.
- El registro de evaluador no debe ser público.
- Solo un admin puede crear o invitar evaluadores.
- Un evaluador solo puede ver sus propios grupos, estudiantes, tareas e instrumentos.
- Un estudiante solo puede ver sus propias evaluaciones.
- Las evaluaciones completadas no deben eliminarse físicamente si afectan reportes finales.
- Las notas finales deben recalcularse cuando se edite una evaluación publicada.
- La impresión debe estar disponible solo para usuarios autorizados.
- La eliminación de cuenta por parte del estudiante debe cerrar la sesión automáticamente.

---

## 14. Estructura recomendada del frontend

```txt
src/
  components/
    common/
    forms/
    layout/
    print/
  pages/
    public/
    admin/
    evaluator/
    student/
  routes/
    AppRoutes.jsx
    ProtectedRoute.jsx
    RoleRoute.jsx
  services/
    api.js
    authService.js
    taskService.js
    instrumentService.js
    evaluationService.js
  context/
    AuthContext.jsx
  hooks/
  utils/
  styles/
```

---

## 15. Estructura recomendada del backend

```txt
src/
  config/
    db.js
  controllers/
    auth.controller.js
    user.controller.js
    group.controller.js
    task.controller.js
    instrument.controller.js
    evaluation.controller.js
    report.controller.js
  middlewares/
    auth.middleware.js
    role.middleware.js
    status.middleware.js
    error.middleware.js
  models/
    User.js
    Group.js
    Task.js
    Instrument.js
    Evaluation.js
    Invitation.js
  routes/
    auth.routes.js
    user.routes.js
    group.routes.js
    task.routes.js
    instrument.routes.js
    evaluation.routes.js
    report.routes.js
  utils/
    generateToken.js
    calculateGrades.js
    generatePDF.js
  app.js
  server.js
```

---

## 16. Middlewares importantes

### Verificar autenticación

```js
protect
```

### Verificar rol

```js
authorize('admin')
authorize('evaluator')
authorize('student')
```

### Verificar estado del usuario

```js
checkUserStatus
```

Este middleware debe impedir el acceso si el usuario está suspendido o eliminado.

---

## 17. MVP recomendado

Para iniciar, construir primero estas funciones:

### Fase 1: Base del sistema

- Configurar backend con Express y MongoDB.
- Configurar frontend con React.
- Crear autenticación con JWT.
- Crear roles.
- Registro público de estudiantes.
- Registro protegido de evaluadores.
- Login.
- Dashboard por rol.

### Fase 2: Gestión académica

- CRUD de grupos.
- CRUD de estudiantes por evaluador.
- Suspender estudiantes.
- Eliminar estudiantes lógicamente.
- Perfil del estudiante.
- Eliminación de cuenta del estudiante.

### Fase 3: Tareas e instrumentos

- CRUD de tareas.
- CRUD de instrumentos.
- Crear rúbricas.
- Crear listas de cotejo.
- Asignar instrumento a tarea.

### Fase 4: Evaluaciones y resultados

- Aplicar evaluación.
- Calcular nota.
- Publicar resultado.
- Mostrar resultados al estudiante.
- Agregar sugerencias y mejoras.
- Calcular nota acumulada.

### Fase 5: Reportes

- Reporte individual.
- Reporte por grupo.
- Reporte final.
- Vista imprimible.
- Exportar PDF.

---

## 18. Recomendaciones técnicas

1. **Usar eliminación lógica** para estudiantes y evaluaciones importantes. No borres físicamente datos que afecten reportes.

2. **Proteger el registro de evaluadores** desde el inicio. No dejes rutas públicas que permitan crear cuentas de profesor sin autorización.

3. **Separar roles claramente** usando middleware en backend y rutas protegidas en frontend.

4. **Diseñar bien los modelos de datos** antes de programar. Especialmente `Instrument`, `Evaluation` y `User`.

5. **Empezar con rúbricas y listas de cotejo** como instrumentos principales. Luego puedes agregar otros tipos.

6. **Crear un sistema flexible de criterios e indicadores** para que el evaluador pueda diseñar diferentes instrumentos.

7. **Usar promedio ponderado** para notas finales, porque se adapta mejor a tareas con diferentes valores.

8. **Cuidar la privacidad de los estudiantes**. Un estudiante solo debe ver sus propios resultados.

9. **Agregar confirmaciones en acciones destructivas**, como eliminar cuenta, suspender estudiante o eliminar instrumento.

10. **Crear componentes de impresión separados** para que los reportes salgan limpios y profesionales.

11. **Validar todos los formularios** tanto en frontend como en backend.

12. **Usar variables de entorno** para JWT secret, conexión MongoDB y configuración del servidor.

13. **Crear documentación de API** usando Swagger o una colección de Postman.

14. **Aplicar paginación** en listados de estudiantes, tareas, instrumentos y evaluaciones.

15. **Guardar auditoría básica** de acciones importantes: quién suspendió, eliminó o modificó información.

---

## 19. Variables de entorno sugeridas

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/evaluapro
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## 20. Prioridad de desarrollo

Orden recomendado:

1. Backend base.
2. Autenticación.
3. Roles y permisos.
4. Registro de estudiante.
5. Registro protegido de evaluador.
6. Gestión de grupos.
7. Gestión de estudiantes.
8. Suspensión/eliminación de estudiantes.
9. Tareas.
10. Instrumentos.
11. Evaluaciones.
12. Resultados.
13. Cálculo de nota final.
14. Reportes.
15. Impresión y PDF.
16. Mejoras visuales.
17. Estadísticas.

---

## 21. Nombre de módulos recomendados

- Auth Module
- Users Module
- Roles Module
- Groups Module
- Students Module
- Tasks Module
- Instruments Module
- Evaluations Module
- Results Module
- Reports Module
- Print Module
- Dashboard Module
- Settings Module

---

## 22. Mejoras futuras

- Notificaciones por email.
- Comentarios entre profesor y estudiante.
- Firma digital del evaluador.
- Plantillas prediseñadas de rúbricas.
- Banco de instrumentos reutilizables.
- Estadísticas avanzadas.
- Exportación a Excel.
- Envío automático de resultados.
- Integración con Google Classroom.
- Modo oscuro.
- Aplicación móvil.
- IA para sugerencias automáticas de mejora.

---

## 23. Conclusión

Este sistema permitirá digitalizar el proceso de evaluación, reducir el uso de papel, organizar tareas e instrumentos, centralizar resultados, entregar retroalimentación a los participantes y calcular notas finales de forma automática.

La prioridad debe ser construir un MVP seguro, con roles bien definidos, registro protegido para evaluadores, gestión correcta de estudiantes, evaluación mediante rúbricas/listas de cotejo y reportes imprimibles.
