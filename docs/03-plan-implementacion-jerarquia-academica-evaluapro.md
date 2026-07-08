# Plan de implementación: jerarquía académica (Cursos → Módulos → Clases → Tareas) — EvalúaPro

**Rol afectado:** Evaluador (exclusivamente)
**Rol NO afectado:** Administrador, Estudiante
**Autor del plan:** Claude (evidencia basada en revisión del código actual)
**Estado:** Propuesta para validación antes de iniciar desarrollo

---

## 1. Contexto y objetivo

Actualmente el rol evaluador gestiona **Grupos**, **Estudiantes**, **Tareas** e **Instrumentos** como listados independientes y planos, accesibles todos desde la navegación superior (`/evaluator/groups`, `/evaluator/students`, `/evaluator/tasks`, `/evaluator/instruments`, etc.).

Se solicita introducir una **jerarquía de cuatro niveles** que organice el trabajo del evaluador:

```
Curso
 └─ Módulo
     └─ Clase
         └─ Tarea
             └─ Grupos y Estudiantes vinculados a esa tarea
```

Reglas de la jerarquía, según lo indicado:

1. Un curso contiene módulos.
2. Un módulo contiene clases.
3. Una clase contiene tareas.
4. Una tarea contiene los grupos y estudiantes vinculados a ella.
5. Un evaluador puede tener varios cursos, y cada curso replica la misma estructura interna.
6. Un módulo puede tener varias clases; una clase puede tener varias tareas.
7. Esta jerarquía **solo aplica al rol evaluador**. Administrador y estudiante no se ven afectados en su modelo de datos ni en su navegación.

---

## 2. Alcance y supuestos (a validar con Ambioris antes de programar)

Esto es lo más importante del documento: la decisión que se tome aquí determina el tamaño real del trabajo.

### Supuesto adoptado en este plan

Basado en el modelo de datos actual (`Task` ya tiene referencias a `group`, `students` e `instrument`), este plan asume la interpretación de **menor impacto y más consistente con lo ya construido**:

- **Grupos** y **Estudiantes** siguen siendo entidades globales del evaluador (igual que hoy), porque son cuentas reales (login, suspensión, eliminación lógica) y una misma cuenta de estudiante o un mismo grupo puede participar en varias tareas a lo largo del tiempo.
- Lo que cambia es que la **tarea** deja de ser un listado plano y pasa a **vivir dentro de una Clase**, que vive dentro de un Módulo, que vive dentro de un Curso.
- "Dentro de tareas estarán los grupos y estudiantes" se interpreta como: **al entrar al detalle de una tarea**, el evaluador ve y gestiona el grupo y los estudiantes asignados a *esa* tarea específica (esto ya existe parcialmente en el modelo `Task.group` / `Task.students`; lo que falta es presentarlo dentro de la navegación jerárquica en vez de como pestañas sueltas).
- Los listados globales "Mis grupos" y "Estudiantes" (altas de cuenta, suspensión, eliminación) **se mantienen** como pantallas de administración de cuentas, separadas de la jerarquía de contenido académico.

### Interpretación alternativa (no adoptada, pero posible)

Si en realidad lo que se busca es que un **grupo o un estudiante solo pueda existir dentro de una tarea concreta** (sin reutilización entre tareas), el impacto es mucho mayor: implicaría rediseñar `Group` y el flujo de alta de estudiantes, y probablemente duplicar inscripciones por tarea. Esto está fuera del alcance de este plan, pero se deja anotado en la sección 13 como pregunta abierta.

**Recomendación:** confirmar con Ambioris cuál de las dos lecturas es la correcta antes de tocar el modelo `Group`/`Student`. El resto del plan (Curso, Módulo, Clase, Tarea) es válido en ambos escenarios.

---

## 3. Impacto en el modelo de datos (backend)

### 3.1 Modelos nuevos

**`Course` (Curso)**

```js
{
  name: String,          // requerido
  description: String,
  status: 'active' | 'archived',
  evaluator: ObjectId,   // ref: 'User', requerido — dueño del curso
  createdAt, updatedAt
}
```

**`Module` (Módulo)**

```js
{
  name: String,          // requerido
  description: String,
  status: 'active' | 'archived',
  course: ObjectId,      // ref: 'Course', requerido
  evaluator: ObjectId,   // ref: 'User', requerido (denormalizado para scoping rápido)
  order: Number,         // posición dentro del curso, para ordenar en UI
  createdAt, updatedAt
}
```

**`Class` (Clase)**

```js
{
  name: String,          // requerido
  description: String,
  status: 'active' | 'archived',
  module: ObjectId,      // ref: 'Module', requerido
  course: ObjectId,      // ref: 'Course', denormalizado
  evaluator: ObjectId,   // ref: 'User', denormalizado
  order: Number,
  createdAt, updatedAt
}
```

> Se denormaliza `course` y `evaluator` en `Module` y `Class` (igual que ya hace el proyecto en otros modelos, ej. `Task.evaluator`) para evitar populates encadenados de 3-4 niveles en cada consulta y para que el middleware de scoping por evaluador (`evaluatorScope(req)`) siga funcionando igual que hoy en todos los niveles.

### 3.2 Modificación del modelo `Task` existente

Se agrega una referencia obligatoria a `Class`:

```js
class: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Class',
  required: true   // ver estrategia de migración en sección 6 antes de poner "required"
},
```

Todo lo demás de `Task` (`group`, `students`, `instrument`, `status`, `weight`, `dueDate`, etc.) **se mantiene sin cambios**. Esto es intencional: minimiza el riesgo sobre `Evaluation`, `Instrument` y `report.service.js`, que ya dependen de `Task` tal como está hoy.

### 3.3 Modelos sin cambios estructurales

`Group`, `User` (estudiante), `Instrument`, `Evaluation` no requieren cambios de esquema en este plan. Solo se ajustan controladores/consultas para poder filtrar tareas por curso/módulo/clase cuando sea útil (reportes, breadcrumbs).

---

## 4. Backend: API y controladores

### 4.1 Rutas nuevas

```txt
# Cursos
POST   /api/courses
GET    /api/courses
GET    /api/courses/:id
PATCH  /api/courses/:id
DELETE /api/courses/:id

# Módulos (anidados a un curso)
POST   /api/courses/:courseId/modules
GET    /api/courses/:courseId/modules
GET    /api/modules/:id
PATCH  /api/modules/:id
DELETE /api/modules/:id

# Clases (anidadas a un módulo)
POST   /api/modules/:moduleId/classes
GET    /api/modules/:moduleId/classes
GET    /api/classes/:id
PATCH  /api/classes/:id
DELETE /api/classes/:id

# Tareas (se mantienen, se agrega variante anidada)
GET    /api/classes/:classId/tasks     # nuevo — listado de tareas de una clase
POST   /api/classes/:classId/tasks     # nuevo — crear tarea dentro de una clase
# Las rutas existentes /api/tasks, /api/tasks/:id se mantienen para compatibilidad
```

Se sigue el mismo patrón de anidación ya usado en `groups/:id/students`.

### 4.2 Controladores nuevos

- `course.controller.js`
- `module.controller.js`
- `class.controller.js`

Cada uno replica el patrón ya existente en `group.controller.js` / `task.controller.js`:

- Scoping obligatorio por `evaluator` (`evaluatorScope(req)`), igual que en `statistics.controller.js`.
- Validación de pertenencia jerárquica en cada creación/edición: por ejemplo, al crear un módulo se verifica que el `courseId` recibido pertenezca al evaluador autenticado; al crear una clase, que el `moduleId` pertenezca a un curso del evaluador; al crear una tarea dentro de una clase, que la clase pertenezca al evaluador.
- Reutilizar `AppError` y `asyncHandler` como el resto del backend.

### 4.3 Reglas de eliminación en cascada

Este es el punto de mayor riesgo si no se define bien, y conecta directamente con la **regla de negocio #9** ya documentada ("agregar confirmaciones en acciones destructivas") y con el hallazgo crítico ya identificado (falta de confirmación en el frontend).

Reglas propuestas:

- **No permitir eliminación física** de Curso/Módulo/Clase si tienen hijos activos (módulos, clases o tareas respectivamente). En su lugar, ofrecer **archivar** (mismo patrón que ya existe en `Group.status: 'archived'`).
- Si el evaluador insiste en eliminar un nivel con contenido, el backend debe exigir un parámetro explícito `cascade=true` y, en ese caso, archivar (no borrar físicamente) todos los descendientes, dejando trazabilidad para no romper reportes/evaluaciones ya publicadas (mismo principio que ya aplica el proyecto a `Evaluation`).
- Eliminar un Curso nunca debe eliminar físicamente `Group`, `User` (estudiante) ni `Evaluation`: esas colecciones son independientes de la jerarquía y solo pierden su vínculo con la tarea archivada.

---

## 5. Migración de datos existentes

Hoy ya existen tareas creadas sin curso/módulo/clase (campo `group` directo en `Task`). No se puede activar `class: { required: true }` de un día para otro sin romper esos registros.

### Estrategia recomendada (2 pasos)

**Paso 1 — Campo opcional + script de respaldo:**

1. Agregar `class` a `Task` como **opcional** (`required: false`) en un primer deploy.
2. Ejecutar un script de migración único por evaluador:
   - Crear un `Course` llamado **"Curso general"** (o el nombre que decida Ambioris) por cada evaluador que tenga tareas existentes.
   - Crear un `Module` "Módulo general" dentro de ese curso.
   - Crear una `Class` "Clase general" dentro de ese módulo.
   - Actualizar todas las tareas huérfanas del evaluador para que apunten a esa clase.
3. Confirmar en producción que el 100% de las tareas tienen `class` asignado.

**Paso 2 — Endurecer la regla:**

4. Cambiar `class` a `required: true` en un segundo deploy, ya con los datos migrados.
5. Actualizar el formulario de creación de tareas para que `class` sea obligatorio en el frontend a partir de este punto.

Este enfoque evita downtime y evita que el evaluador "pierda" tareas ya creadas.

---

## 6. Frontend: rutas y navegación

### 6.1 Rutas nuevas (anidadas, solo dentro de `RoleRoute allowedRoles={['evaluator']}`)

```txt
/evaluator/courses                                    → listado de cursos
/evaluator/courses/:courseId                           → detalle de curso (lista de módulos)
/evaluator/courses/:courseId/modules/:moduleId         → detalle de módulo (lista de clases)
/evaluator/courses/:courseId/modules/:moduleId/classes/:classId
                                                        → detalle de clase (lista de tareas)
/evaluator/courses/:courseId/modules/:moduleId/classes/:classId/tasks/:taskId
                                                        → detalle de tarea (grupo, estudiantes,
                                                          instrumento asignado, evaluaciones)
```

Las rutas actuales `/evaluator/tasks`, `/evaluator/groups`, `/evaluator/students`, `/evaluator/instruments`, `/evaluator/evaluations`, `/evaluator/reports` **se mantienen** para no romper accesos directos ni reportes ya enlazados, pero su rol cambia (ver 6.3).

### 6.2 Breadcrumb jerárquico (componente nuevo)

Se necesita un componente `HierarchyBreadcrumb.jsx` que muestre `Curso > Módulo > Clase > Tarea` con enlaces navegables hacia atrás, visible en las cuatro pantallas de detalle. Esto es indispensable para que la profundidad de 4 niveles no desoriente al usuario.

### 6.3 Actualización de `roleNavigation` (`utils/navigation.jsx`)

Este cambio conecta directamente con la recomendación pendiente ya identificada en la revisión de diseño (demasiados enlaces horizontales en el nav del evaluador). Agregar un quinto/sexto nivel de profundidad hace que el nav plano actual sea claramente insuficiente, así que se recomienda **resolver ambas cosas en el mismo esfuerzo**:

- Reemplazar el enlace plano **"Tareas"** por **"Cursos"** como punto de entrada a la jerarquía académica.
- Mantener **"Grupos"** y **"Estudiantes"** como secciones independientes de administración de cuentas (ver supuesto de la sección 2).
- Migrar el nav horizontal (`RoleNav.jsx` + clase `.role-nav`) a **navegación lateral fija en escritorio** y **barra inferior de pestañas en móvil**, tal como ya estaba recomendado en el plan de diseño UX/UI. La navegación lateral tiene espacio natural para mostrar el árbol Curso→Módulo→Clase expandible, cosa que una barra horizontal no puede hacer bien.

Propuesta de navegación lateral para evaluador:

```txt
Panel
Cursos            ← nuevo punto de entrada (con árbol expandible)
Grupos
Estudiantes
Instrumentos
Evaluaciones
Reportes
Perfil
```

---

## 7. Frontend: páginas y componentes nuevos

| Página/componente | Ruta | Responsabilidad |
|---|---|---|
| `EvaluatorCoursesPage.jsx` | `/evaluator/courses` | Listar, crear, archivar cursos |
| `CourseDetailPage.jsx` | `/evaluator/courses/:courseId` | Listar, crear, archivar módulos del curso |
| `ModuleDetailPage.jsx` | `.../modules/:moduleId` | Listar, crear, archivar clases del módulo |
| `ClassDetailPage.jsx` | `.../classes/:classId` | Listar, crear, archivar tareas de la clase |
| `EvaluatorTaskDetailPage.jsx` | `.../tasks/:taskId` | Ver/editar tarea; gestionar grupo e instrumento asignado; ver estudiantes vinculados |
| `HierarchyBreadcrumb.jsx` | (componente compartido) | Breadcrumb Curso > Módulo > Clase > Tarea |
| `ConfirmDialog.jsx` | (componente compartido) | Extraído del patrón ya existente en `ProfilePage.jsx`, reutilizable en los 4 niveles nuevos y en las acciones destructivas ya pendientes de corregir (grupos, estudiantes, tareas, instrumentos) |

> Nota: `ConfirmDialog.jsx` aparece aquí porque este proyecto ya tiene pendiente, como hallazgo crítico previo, extraer el patrón de confirmación de `ProfilePage.jsx` a un componente reutilizable. Dado que la nueva jerarquía introduce cuatro niveles adicionales con eliminación/archivado, **es el momento correcto de resolver ambos pendientes juntos** en vez de duplicar el patrón cuatro veces más.

### 7.1 Servicios frontend nuevos

- `courseService.js`, `moduleService.js`, `classService.js` (mismo patrón que `taskService`/`groupService` ya existentes, usando `listResource`, `createResource`, `updateResource`, `deleteResource` genéricos si ya existen como helpers compartidos).
- Ajuste a `taskService.js` para aceptar `classId` al crear/listar tareas.

---

## 8. Confirmaciones de acciones destructivas (cascada)

Extiende directamente el hallazgo crítico ya registrado (destructivos sin confirmación). Con la jerarquía, el riesgo se multiplica: archivar un curso puede afectar decenas de tareas y evaluaciones.

Mensajes de confirmación sugeridos (copy en español, tono EvalúaPro, a integrar con el glosario del documento 01):

- **Curso:** "Este curso tiene {n} módulos y {m} tareas asociadas. Archivarlo ocultará todo su contenido para ti, pero no afectará las evaluaciones ya publicadas a los estudiantes. ¿Deseas continuar?"
- **Módulo:** mensaje equivalente a nivel de clases/tareas contenidas.
- **Clase:** mensaje equivalente a nivel de tareas contenidas.
- **Tarea:** se mantiene el mensaje ya definido en el documento 01 de copy, sin cambios.

Regla dura: **nunca ofrecer eliminación física** de Curso/Módulo/Clase si tienen contenido activo; solo archivar. Eliminación física solo se permite si el nivel está vacío (0 hijos activos).

---

## 9. Reglas de negocio a agregar a `planning.md`

Para mantener el documento de reglas de negocio actualizado (ya tiene 16 reglas numeradas), se proponen estas adiciones:

17. Un evaluador solo puede ver y gestionar sus propios cursos, módulos, clases y tareas.
18. Una tarea debe pertenecer siempre a una clase; una clase a un módulo; un módulo a un curso.
19. No se puede archivar ni eliminar un curso, módulo o clase con contenido activo sin confirmación explícita de cascada.
20. Archivar un nivel superior de la jerarquía no elimina ni afecta evaluaciones ya publicadas a estudiantes.

---

## 10. Fases de implementación

### Fase A — Backend: modelos y migración
- [ ] Crear modelos `Course`, `Module`, `Class`.
- [ ] Agregar campo `class` opcional a `Task`.
- [ ] Escribir y probar script de migración (Curso/Módulo/Clase "general" por evaluador).
- [ ] Ejecutar migración en entorno de pruebas.

### Fase B — Backend: API
- [ ] Controladores `course.controller.js`, `module.controller.js`, `class.controller.js`.
- [ ] Rutas anidadas y validación de pertenencia jerárquica.
- [ ] Reglas de archivado/cascada.
- [ ] Endurecer `class` a `required: true` una vez migrado.

### Fase C — Frontend: navegación
- [ ] Migrar `RoleNav` a navegación lateral (escritorio) + barra inferior (móvil) — resuelve también el hallazgo de sobrecarga de nav ya identificado.
- [ ] Componente `HierarchyBreadcrumb.jsx`.
- [ ] Actualizar `roleNavigation` en `utils/navigation.jsx`.

### Fase D — Frontend: páginas jerárquicas
- [ ] `EvaluatorCoursesPage.jsx`
- [ ] `CourseDetailPage.jsx`
- [ ] `ModuleDetailPage.jsx`
- [ ] `ClassDetailPage.jsx`
- [ ] Adaptar `EvaluatorTaskDetailPage.jsx` (o crear si no existe una vista de detalle de tarea individual) para mostrar grupo/estudiantes/instrumento dentro del contexto jerárquico.

### Fase E — Confirmaciones destructivas (unifica pendiente crítico + nuevo alcance)
- [ ] Extraer `ConfirmDialog.jsx` reutilizable a partir del patrón de `ProfilePage.jsx`.
- [ ] Aplicarlo a: suspender/eliminar estudiante, eliminar tarea, eliminar instrumento (pendiente ya identificado).
- [ ] Aplicarlo a: archivar/eliminar curso, módulo, clase (nuevo).

### Fase F — Limpieza de huérfanos relacionada
- [ ] Aprovechar el trabajo en `EvaluatorModulePages.jsx` para resolver los exports placeholder huérfanos detectados previamente, ya que esta fase toca directamente esa zona del código.

### Fase G — QA y reportes
- [ ] Probar la migración con datos reales de evaluadores existentes.
- [ ] Verificar que `report.service.js` sigue generando reportes correctos con tareas que ahora tienen `class`.
- [ ] Probar cascadas de archivado en los 4 niveles.
- [ ] Probar navegación lateral / bottom tab en móvil y escritorio.

---

## 11. Riesgos y consideraciones

- **Riesgo principal:** si la interpretación de la sección 2 no es la correcta (es decir, si Grupos/Estudiantes deben vivir *dentro* de cada tarea sin reutilización), buena parte de las Fases A y B cambia de alcance. Confirmar antes de programar.
- **Riesgo de migración:** ejecutar el script de migración en un entorno de pruebas con copia de datos reales antes de producción.
- **Riesgo de UX:** cuatro niveles de profundidad puede sentirse pesado si no se acompaña de un buen breadcrumb y de accesos directos (por ejemplo, un buscador global de tareas que salte directo al nivel de tarea sin obligar a navegar los 4 niveles cada vez).
- **No hay impacto en Administrador ni Estudiante**, ya que las rutas nuevas están exclusivamente bajo `RoleRoute allowedRoles={['evaluator']}`.

---

## 12. Preguntas abiertas para Ambioris

1. ¿Grupos y Estudiantes deben seguir siendo entidades globales reutilizables entre tareas (supuesto de este plan), o cada tarea debe tener su propio grupo/lista de estudiantes exclusiva, sin reutilización? respuesta: deben seguir siendo entidades globales reutilizables entre tareas.
2. ¿El nombre "Curso general / Módulo general / Clase general" es aceptable para las tareas migradas, o prefieres otro nombre por defecto? respuesta: si es aceptable.
3. ¿Se requiere que Reportes (`/evaluator/reports`) permita filtrar por Curso/Módulo/Clase desde el inicio, o puede quedar para una fase posterior? respuesta: si se requiere.
4. ¿Confirmas que la navegación lateral/bottom-tab se implementa junto con este trabajo, o prefieres mantener el nav actual por ahora y resolver eso en una fase separada? respuesta: si confirmo.
