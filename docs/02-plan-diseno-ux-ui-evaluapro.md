# Plan de diseño UX/UI — EvalúaPro (v2, actualizado)

> Este documento se ha revisado varias veces contra la estructura real del
> proyecto (`client/src`, `server/src`, hojas de estilo, `AppRoutes.jsx` y el
> patch `limpieza-editorial-fase1` ya aplicado). Mantiene las decisiones de
> sistema visual que siguen siendo válidas y añade, en la sección **0bis**,
> los hallazgos más recientes: el proyecto avanzó más de lo que el hallazgo
> 1.1 original sugería, y apareció un hallazgo crítico verificado sobre
> acciones destructivas sin confirmación.

---

## 0. Qué cambió desde la v1

- ✅ **Resuelto por el patch editorial:** tildes faltantes, "profesor" → "evaluador"
  en textos públicos, descripciones genéricas de placeholder en `AdminDashboard`,
  `AdminModulePages`, `EvaluatorDashboard` y `PublicHomePage`.
- ⏳ **Sigue pendiente:** todo lo visual. La app sigue en Inter, paleta
  navy/teal por defecto (`#256f78`, `#17202a`, `#eef2f6`) y navegación
  horizontal de dos filas (`site-header` + `role-nav`). Ninguna de las
  recomendaciones de paleta/tipografía/layout de la v1 se implementó todavía.
- 🆕 **Hallazgos nuevos** encontrados en esta revisión (sección 1): colisión de
  colores de estado, empty states sin acción, andamiaje que se confunde con
  producto terminado, breakpoint único, y ancho de contenido fijo en `vw`.

---

## 0bis. Cuarta revisión (esta sesión) — el proyecto avanzó más de lo que parece a simple vista

Esta revisión confirmó algo importante contrastando `AppRoutes.jsx` contra los
archivos de páginas: **el sistema es más maduro de lo que sugiere el hallazgo
1.1 de abajo.** Groups, Students, Tasks e Instruments ya no son placeholders —
tienen archivos dedicados y funcionales:

- `EvaluatorGroupsPage.jsx`, `EvaluatorStudentsPage.jsx`,
  `EvaluatorTasksPage.jsx`, `EvaluatorInstrumentsPage.jsx`,
  `RubricBuilderPage.jsx`, `ChecklistBuilderPage.jsx` están **importados y
  enrutados de verdad** en `AppRoutes.jsx`, con listas filtrables
  (`resource-list`), badges de estado (`status-badge status-${status}`),
  acciones por ícono (`icon-button`) y estados vacíos en línea (`inline-empty`).
- Del lado del admin, solo `AdminInvitationsPage` tiene lógica real (crear
  invitación, copiar enlace). `AdminEvaluatorsPage`, `AdminStatisticsPage` y
  `AdminSettingsPage` siguen siendo `ModulePage` genérico sin funcionalidad.

**Hallazgo nuevo — código muerto que confunde el diagnóstico:**
`EvaluatorModulePages.jsx` sigue exportando `EvaluatorGroupsPage`,
`EvaluatorStudentsPage`, `EvaluatorTasksPage` e `EvaluatorInstrumentsPage`
como placeholders con "Pendiente" — **con exactamente los mismos nombres**
que los componentes reales en sus propios archivos. `AppRoutes.jsx` ya no
importa desde `EvaluatorModulePages.jsx` para estos cuatro, así que esas
exportaciones quedaron huérfanas. Esto no es solo limpieza de código: es un
riesgo de UX real, porque cualquier persona (incluido un asistente revisando
el proyecto) puede terminar editando o citando la versión equivocada y asumir
que el módulo no está construido cuando sí lo está.

**Estado:** resuelto. `EvaluatorModulePages.jsx` fue eliminado porque ya no
había ninguna ruta que lo importara; las rutas del evaluador usan páginas
reales dedicadas o `ProfilePage`.

Si se quiere conservar el patrón de placeholder para módulos futuros, seguir
la convención que ya usa el lado de estudiante (`StudentEvaluationsRealPage`
vs. una versión placeholder con nombre distinto), para que nunca compitan dos
componentes con el mismo nombre.

### 0bis.1 Hallazgo crítico verificado: acciones destructivas sin confirmación

En `EvaluatorStudentsPage.jsx`, los botones de ícono para suspender y eliminar
lógicamente a un estudiante ejecutan la acción **directamente en el `onClick`**:

```jsx
<button className="icon-button" onClick={() => updateStudentStatus(getId(student), 'suspended')}>
<button className="icon-button danger" onClick={() => updateStudentStatus(getId(student), 'deleted')}>
```

No hay ningún diálogo de confirmación entre el clic y el cambio de estado.
Esto contradice directamente la regla de negocio #9 de `planning.md`
("Agregar confirmaciones en acciones destructivas, como eliminar cuenta,
suspender estudiante o eliminar instrumento").

Lo interesante es que el patrón correcto **ya existe en el código**:
`ProfilePage.jsx` pide al usuario escribir la palabra `ELIMINAR` antes de
borrar su propia cuenta. Ese mismo patrón (o una versión más ligera con un
`ConfirmDialog` de un solo paso) debe extenderse a:

- Suspender/eliminar estudiante (`EvaluatorStudentsPage.jsx`).
- Eliminar tarea (`EvaluatorTasksPage.jsx`, botón `icon-button danger` con
  `handleDeleteTask`).
- Archivar/eliminar instrumentos, rúbricas y listas de cotejo.

**Esto sube de prioridad sobre cualquier otro hallazgo de este documento**:
no es un riesgo de diseño hipotético, es un botón ya en producción que borra
o suspende sin red de seguridad.

---

## 1. Hallazgos de esta revisión (con evidencia)

### 1.1 El andamiaje ("Pendiente") se presenta como si fuera contenido real — *ver 0bis, parcialmente superado*

> Nota de la cuarta revisión: de la lista original de abajo, **Groups, Tasks e
> Instruments ya tienen implementación real** (ver 0bis). Este hallazgo sigue
> vigente tal cual solo para `AdminEvaluatorsPage`, `AdminStatisticsPage` y
> `AdminSettingsPage`.

Las páginas de admin (`AdminEvaluatorsPage`, `AdminStatisticsPage`,
`AdminSettingsPage`) usan el componente genérico `ModulePage`, que muestra una
lista de `primaryItems` (funcionalidades futuras) y un bloque `statusItems` que
literalmente dice "Pendiente" para CRUD, formularios, filtros y validación.

**Problema:** un usuario que hace clic en "Evaluadores" o "Configuración" desde
el menú de admin entra a una pantalla con textos convincentes pero sin ninguna
acción real disponible. No hay señal visual que distinga esto de una pantalla
terminada como `AdminInvitationsPage`, que sí es funcional.

**Recomendación:**
- Dar a `ModulePage` un modo `status="in-progress"` con una franja o badge
  visible ("Este módulo está en construcción") en vez de mezclar el aviso
  dentro de una lista de estado técnico.
- Priorizar completar el flujo de Evaluadores (crear/suspender cuentas) ya que
  es el único módulo de admin que sigue en placeholder y bloquea el flujo
  completo descrito en `planning.md` §12 ("El administrador crea o invita al
  evaluador").

### 1.2 Los colores de estado se pisan entre sí

En `index.css`, cuatro estados con significados distintos comparten
exactamente el mismo color:

```css
.status-draft      { color: #5b3d16; background: #f6ead9; }
.status-archived    { color: #5b3d16; background: #f6ead9; }
.status-suspended   { color: #5b3d16; background: #f6ead9; }
.status-pending     { color: #5b3d16; background: #f6ead9; }
```

Un instrumento "borrador", un grupo "archivado" y un estudiante "suspendido"
se ven idénticos en cualquier listado. Esto es un problema real de UI: el
color debería reforzar el estado, no depender solo del texto.

**Recomendación:** asignar un color distinto por *familia* de estado:
- Neutral/borrador → gris azulado (no ámbar).
- Archivado → gris más apagado, sin urgencia.
- Suspendido/eliminado → coral/rojo (ya usado en `status-deleted`, reutilizar
  esa lógica pero con una variante menos intensa para "suspendido" vs
  "eliminado", que son severidades distintas).
- Pendiente (de tarea/acción) → ámbar, dejándolo como el único que lo use.

### 1.3 Los estados vacíos no ofrecen ninguna acción — resuelto en módulos de evaluador

```jsx
function EmptyState({ title, description }) {
  return (
    <section className="empty-state">
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}
```

Cuando un evaluador no tiene grupos, tareas o instrumentos, ve el mensaje pero
ningún botón para crear el primero. Tiene que volver al dashboard o al menú
para encontrar la acción.

**Estado:** resuelto en los módulos reales del evaluador. `EmptyState` acepta
una acción opcional y se usa en grupos, tareas, instrumentos, estudiantes y
evaluaciones. Los estados vacíos de estudiantes y evaluaciones ahora enfocan
el formulario correspondiente dentro de la misma pantalla.

### 1.4 Un solo breakpoint (760px), sin punto intermedio para tablet

Todo el responsive vive en un único `@media (max-width: 760px)`. Layouts de
dos columnas como `.builder-layout` (`minmax(280px, 0.75fr) minmax(0, 1.25fr)`)
o `.rubric-criterion-header` pasan directo de escritorio completo a una sola
columna en móvil. En tablets verticales (iPad, ~768–834px) el layout de
escritorio se mantiene forzado, con columnas más angostas de lo ideal para
formularios con inputs de texto largo.

**Recomendación:** añadir un breakpoint intermedio (por ejemplo 1024px) que
al menos reduzca el layout de dos columnas a proporciones más generosas antes
de colapsar del todo en 760px.

### 1.5 Ancho de contenido fijo en `vw`

```css
.main-content {
  width: 80vw;
  margin: 0 auto;
}
```

En monitores anchos (1920px o más, cada vez más comunes) esto produce líneas
de texto muy largas — malas para lectura, especialmente en las descripciones
de `dashboard-description` (`max-width: 68ch`, que sí está bien pensado, pero
convive con un contenedor padre que no tiene techo).

**Recomendación:** usar `width: min(80vw, 1400px)` o similar, para que el
contenido deje de crecer pasado cierto punto en vez de estirarse
indefinidamente.

### 1.6 Lo que ya funciona bien y no debería tocarse

- La hoja de impresión (`@media print`) ya oculta `site-header`, `role-nav` y
  `.no-print`, dejando `print-sheet` limpio. Está alineado con que reportes/PDF
  es un objetivo central del producto — no requiere rediseño, solo mantenerlo
  al extender el sistema visual.
- `RubricBuilderPage` maneja bien el desbordamiento horizontal de tablas
  (`rubric-table-wrap` con `overflow-x: auto`) y usa `min-width: 0` de forma
  correcta para que el grid no rompa el layout con contenido largo.
- Los `icon-button` ya diferencian `:hover`, `:focus-visible` y `:disabled` —
  buena base de accesibilidad de teclado sobre la que construir el resto del
  sistema.

---

## 2. Sistema visual propuesto (retomado de la v1, sigue vigente)

La dirección de diseño de la v1 no se ha implementado aún y sigue siendo la
recomendación: en vez de un dashboard SaaS genérico, anclar la identidad en el
propio dominio del producto — el gesto de un profesor aprobando un trabajo con
un sello.

**Concepto:** *"El sello de aprobado"* — evita los tres defaults típicos de IA
(crema cálido + terracota / fondo oscuro + neón / periódico denso) y en su
lugar usa formas de sello, tipografía de máquina de escribir para datos
tabulares, y una paleta seria de papel y tinta.

### Paleta

| Rol | Nombre | Uso |
|---|---|---|
| Tinta | Navy oscuro | Texto principal, encabezados |
| Papel | Blanco cálido | Fondos de tarjetas y superficies |
| Marcador | Ámbar | Acento secundario, estados "pendiente" únicamente (ver 1.2) |
| Sello | Verde | Estados positivos/aprobados, acción primaria |
| Alerta | Coral | Estados de error, suspensión, eliminación |

*(Los tonos exactos deben verificarse contra ratios de contraste WCAG AA antes
de fijarse en el design system definitivo.)*

### Tipografía

- **Zilla Slab** para títulos y encabezados de sección — refuerza el carácter
  "documento oficial" del producto.
- **IBM Plex Sans** para interfaz y texto de cuerpo.
- **IBM Plex Mono** para datos tabulares (notas, porcentajes, puntuaciones) —
  alinea dígitos y mejora la escaneabilidad de tablas de calificaciones.

### Layout

- Migrar de navegación horizontal (`site-header` + `role-nav`) a navegación
  lateral fija en escritorio, con barra de pestañas inferior en móvil. Esto
  también resuelve parcialmente el hallazgo 1.4, al liberar espacio vertical
  que hoy ocupan dos filas de navegación apiladas.
- Metáfora de "carpeta de evaluación con pestañas" para agrupar
  grupo → tareas → instrumentos → evaluaciones como una progresión, no como
  ítems de menú sueltos.

---

## 3. Prioridad recomendada

| Prioridad | Acción | Por qué |
|---|---|---|
| **Crítica** | Agregar confirmación antes de suspender/eliminar estudiante y antes de eliminar tarea/instrumento (0bis.1) | Verificado en código: hoy un solo clic ejecuta la acción, sin red de seguridad |
| Alta | Eliminar las exportaciones huérfanas de `EvaluatorModulePages.jsx` (0bis) | Resuelto: archivo huérfano eliminado |
| Alta | Separar visualmente páginas placeholder de páginas funcionales — ya acotado solo a admin (1.1) | Evita confundir "está roto" con "no está construido" |
| Alta | Corregir colisión de colores de estado (1.2) | Bug de UI activo, afecta cualquier listado ya hoy |
| Alta | Agregar acción a los estados vacíos (`EmptyState` y los `inline-empty` ad hoc de las páginas reales) (1.3) | Resuelto en módulos reales del evaluador |
| Media | Breakpoint intermedio para tablet (1.4) | Afecta formularios complejos (rúbrica, tareas) |
| Media | Limitar `main-content` con `max-width` (1.5) | Cosmético pero fácil de arreglar ahora |
| Media/Baja | Implementar sistema visual completo (sección 2) | Inversión mayor; ahora que Groups/Tasks/Instruments ya son reales, conviene aplicarlo sobre esos componentes estables en vez de esperar |

---

## 4. Siguientes pasos sugeridos

1. Agregar el `ConfirmDialog` para suspender/eliminar estudiante y eliminar
   tarea/instrumento (0bis.1). Es el único ítem de prioridad "Crítica" y ya
   hay un patrón de confirmación reutilizable en `ProfilePage.jsx` del cual
   partir.
2. Resolver el resto de los ítems de prioridad "Alta" (son cambios de código
   acotados, no requieren decisiones de diseño nuevas).
3. Completar el único módulo de admin que sigue en placeholder
   (`AdminEvaluatorsPage`, gestión de evaluadores) para cerrar el flujo
   completo descrito en `planning.md` §12.
4. Con Groups, Tasks, Instrumentos y Evaluadores ya funcionando de punta a
   punta, aplicar el sistema visual de la sección 2 sobre esos componentes
   estables, en vez de sobre andamiaje que todavía puede cambiar de forma.
