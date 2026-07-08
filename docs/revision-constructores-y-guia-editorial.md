# Revisión de constructores de instrumentos y guía editorial

Rama revisada: `mejoras-ux-ui-local`  
Fecha de revisión: 2026-07-04  
Alcance: UX de `RubricBuilderPage.jsx` y `ChecklistBuilderPage.jsx`; comparación entre `docs/textos-profesionales-por-pagina.md` y los textos visibles actuales en el código.

## Resumen ejecutivo

Los constructores de rúbricas y listas ya tienen una base funcional clara: permiten crear estructuras, agregan niveles/criterios/indicadores y guardan instrumentos en la API. Sin embargo, todavía hay inconsistencias importantes entre lo que la UI promete, lo que el usuario puede configurar y lo que realmente se persiste.

El hallazgo más importante está en el constructor de listas: la UI permite configurar `opciones`, `obligatorio` y `observación`, pero el modelo, el validador y el payload solo guardan `text` y `score` por indicador. Esto puede generar pérdida de confianza porque el usuario cree que configuró una lista más completa de lo que realmente se almacena.

La guía editorial funciona como dirección profesional, pero no está aplicada de forma literal en el código. En un cruce automático de frases entre backticks, se encontraron 341 recomendaciones textuales, 207 presentes en `client/src` y 134 no presentes de forma exacta. No todas las diferencias son errores: varias son recomendaciones aspiracionales o textos de referencia. Aun así, los constructores sí tienen discrepancias visibles y palabras sin acento que conviene corregir.

## 1. Revisión UX de `RubricBuilderPage.jsx`

### Hallazgos principales

| Prioridad | Línea | Hallazgo | Impacto | Recomendación |
| --- | ---: | --- | --- | --- |
| Alta | `client/src/pages/evaluator/RubricBuilderPage.jsx:279` | El botón dice `Guardar borrador`, aunque el selector permite guardar como `Activo` o `Archivado`. | La acción no refleja el estado real que se enviará. | Cambiar el texto dinámicamente: `Guardar rúbrica`, `Guardar como borrador` o `Guardar instrumento` según el flujo deseado. |
| Media | `client/src/pages/evaluator/RubricBuilderPage.jsx:240` | Texto visible sin acento: `Puntos maximos`. | Rompe la consistencia editorial del proyecto. | Usar `Puntos máximos`. |
| Media | `client/src/pages/evaluator/RubricBuilderPage.jsx:357` | Campo `Maximo` es ambiguo y no tiene acento. | El usuario puede no entender si es puntaje máximo del criterio o límite de la escala. | Usar `Puntuación máxima` o `Puntaje máximo del criterio`. |
| Media | `client/src/pages/evaluator/RubricBuilderPage.jsx:26` | Texto inicial sin acento: `mayoria`. | Se ve menos profesional en una plantilla visible al usuario. | Usar `mayoría`. |
| Media | `client/src/pages/evaluator/RubricBuilderPage.jsx:209` | La descripción del código no coincide con la guía editorial. | La guía pierde valor como fuente de verdad. | Aplicar la descripción recomendada o actualizar la guía si esta versión es preferida. |
| Media | `client/src/pages/evaluator/RubricBuilderPage.jsx:337` | La sección `Criterios y descripciones` usa un texto más operativo que la guía. | No es grave, pero hay inconsistencia editorial. | Decidir un texto único: guía o código. |
| Baja | `client/src/pages/evaluator/RubricBuilderPage.jsx:190` | Mensaje de éxito: `Rúbrica guardada en la base de datos.` | Suena técnico para usuario final. | Usar `Rúbrica guardada correctamente.` |

### Observaciones de experiencia

- La estructura de la página es entendible: encabezado, métricas, ficha, niveles y matriz.
- La matriz por tarjetas es más flexible que una tabla tradicional en responsive, pero puede volverse difícil de comparar si hay muchos criterios y niveles.
- Falta una acción posterior al guardado: volver a instrumentos, crear otra rúbrica o ver el instrumento guardado.
- No hay validación preventiva visible antes de guardar. El servidor puede rechazar datos, pero el usuario debería recibir ayuda antes de enviar.
- La relación entre `Puntos`, `Puntuación máxima` y niveles puede ser confusa. Si cada nivel tiene puntaje y cada criterio tiene máximo, la UI debe explicar cómo se usa cada valor.

### Comparación guía editorial vs código

| Guía editorial | Línea guía | Código actual | Línea código | Estado |
| --- | ---: | --- | ---: | --- |
| `Instrumentos` | 586 | `Instrumentos` | 206 | Coincide |
| `Constructor de rúbricas` | 590 | `Constructor de rúbricas` | 207 | Coincide |
| `Diseña rúbricas con niveles de desempeño, criterios y descripciones para evaluar con mayor precisión.` | 594 | `Define criterios, niveles de desempeño, puntajes y descripciones para una rúbrica analítica reutilizable.` | 209 | No coincide |
| `Ficha de la rúbrica` | 598 | `Ficha de la rúbrica` | 248 | Coincide |
| `Define el título, la descripción y el contexto de uso.` | 598 | `Datos generales del instrumento.` | 249 | No coincide |
| `Niveles de desempeño` | 599 | `Niveles de desempeño` | 289 | Coincide |
| `Configura las escalas que describen el logro esperado.` | 599 | `Define nombres y puntajes disponibles para cada criterio.` | 290 | No coincide |
| `Criterios y descripciones` | 600 | `Criterios y descripciones` | 336 | Coincide |
| `Agrega los aspectos que serán evaluados y sus descriptores.` | 600 | `Completa la matriz de evaluación por nivel de desempeño.` | 337 | No coincide |

## 2. Revisión UX de `ChecklistBuilderPage.jsx`

### Hallazgos principales

| Prioridad | Línea | Hallazgo | Impacto | Recomendación |
| --- | ---: | --- | --- | --- |
| Alta | `client/src/pages/evaluator/ChecklistBuilderPage.jsx:53` | La UI maneja `options`, pero estas opciones no se envían al backend al guardar. | El usuario configura opciones que se pierden. | Extender modelo/validador/API para guardar opciones o retirar esa configuración si no será parte del instrumento. |
| Alta | `client/src/pages/evaluator/ChecklistBuilderPage.jsx:155` | El payload solo envía `text` y `score` por indicador. No envía `required` ni `observation`. | Se pierde información configurada en la UI. | Persistir `required` y `observation`, o dejar claro que son solo ayuda local antes de guardar. |
| Alta | `server/src/models/Instrument.js:49` | El esquema de `indicator` solo soporta `text` y `score`. | La API no puede conservar todo lo que la pantalla permite editar. | Agregar campos al modelo o alinear la UI al modelo actual. |
| Alta | `server/src/validators/instrument.validator.js:21` | El validador de indicadores tampoco acepta opciones, requerido u observación. | Aunque se enviaran desde el cliente, serían descartados o rechazados. | Actualizar `indicatorSchema` y el controlador si se decide guardar esos datos. |
| Media | `client/src/pages/evaluator/ChecklistBuilderPage.jsx:211` | Texto visible sin acento: `Puntos maximos`. | Inconsistencia editorial. | Usar `Puntos máximos`. |
| Media | `client/src/pages/evaluator/ChecklistBuilderPage.jsx:19` | Texto inicial sin acento: `proposito`. | Plantilla inicial menos profesional. | Usar `propósito`. |
| Media | `client/src/pages/evaluator/ChecklistBuilderPage.jsx:38` y `350` | Texto visible sin acento: `Si`. | Debe llevar tilde cuando afirma. | Usar `Sí`. |
| Media | `client/src/pages/evaluator/ChecklistBuilderPage.jsx:250` | Botón `Guardar borrador` no refleja estado activo/archivado. | Puede confundir al usuario. | Usar texto neutral: `Guardar lista` o `Guardar instrumento`. |
| Baja | `client/src/pages/evaluator/ChecklistBuilderPage.jsx:161` | Mensaje `guardada en la base de datos` es técnico. | Menos humano que el resto del producto. | Usar `Lista de cotejo guardada correctamente.` |

### Observaciones de experiencia

- La página comunica bien el concepto de lista de cotejo, pero mezcla configuración avanzada no persistida.
- La vista previa de opciones es útil, pero si las opciones no se guardan, la evaluación posterior no podrá replicar esa lógica.
- El contador de indicadores obligatorios es bueno, pero pierde valor si `required` no llega al instrumento guardado.
- El campo `Observación` se presenta como parte del indicador, pero actualmente no tiene efecto persistente.
- Conviene decidir si EvalúaPro quiere listas de cotejo simples o listas con opciones configurables. La UI actual apunta a la segunda opción; el backend actual soporta la primera.

### Comparación guía editorial vs código

| Guía editorial | Línea guía | Código actual | Línea código | Estado |
| --- | ---: | --- | ---: | --- |
| `Instrumentos` | 606 | `Instrumentos` | 177 | Coincide |
| `Constructor de listas` | 610 | `Constructor de listas` | 178 | Coincide |
| `Crea listas de cotejo con indicadores observables y opciones de respuesta claras.` | 614 | `Define indicadores observables, opciones de respuesta y puntajes para una lista de cotejo reutilizable.` | 180 | No coincide |
| `Ficha de la lista` | 618 | `Ficha de la lista` | 219 | Coincide |
| `Define el título, la descripción y el propósito de la lista.` | 618 | `Datos generales del instrumento.` | 220 | No coincide |
| `Opciones de respuesta` | 619 | `Opciones de respuesta` | 260 | Coincide |
| `Configura las respuestas disponibles para cada indicador.` | 619 | `Configura etiquetas y factor de puntaje por opción.` | 261 | No coincide |
| `Indicadores` | 620 | `Indicadores` | 309 | Coincide |
| `Agrega los elementos que se verificarán durante la evaluación.` | 620 | `{requiredCount} indicadores obligatorios marcados para esta lista.` | 310 | No coincide, aunque el texto actual aporta estado dinámico |

## 3. Comparación general entre guía editorial y código

### Resultado del cruce automático

Se extrajeron frases entre backticks de `docs/textos-profesionales-por-pagina.md` y se buscaron coincidencias exactas en `client/src`.

| Métrica | Resultado |
| --- | ---: |
| Recomendaciones/frases evaluadas | 341 |
| Coincidencias exactas encontradas | 207 |
| No encontradas de forma exacta | 134 |

Interpretación:

- Una frase no encontrada no siempre es error. Muchas líneas de la guía son instrucciones, ejemplos o textos recomendados para cambios futuros.
- Las diferencias sí importan cuando la guía define el texto final de una página y el código mantiene otra versión.
- El cruce exacto también puede marcar falsos positivos cuando una palabra aparece en otra página distinta.

### Discrepancias editoriales relevantes

| Área | Guía editorial | Código actual | Evaluación |
| --- | --- | --- | --- |
| Página pública | La guía propone bloques `Evaluaciones trazables`, `Seguimiento académico`, `Reportes imprimibles`. | La página pública usa textos propios en `PublicHomePage.jsx`. | Requiere decisión: aplicar guía o actualizarla con los textos reales. |
| Panel estudiante | La guía propone descripciones más pulidas para acciones y estados vacíos. | Varias frases coinciden parcialmente, pero no de forma literal. | Conviene alinear antes del rediseño visual. |
| Instrumentos | La guía recomienda `Crea rúbricas y listas de cotejo...`. | `EvaluatorInstrumentsPage.jsx` usa `Organiza rúbricas, listas de cotejo, escalas y guias...`. | Falta acento en `guías` y hay diferencia editorial. |
| Constructores | La guía tiene textos más orientados al propósito. | El código usa textos más operativos. | Elegir una sola fuente de verdad. |
| Admin | La guía usa `evaluador`. | Algunas vistas mantienen `profesor`, por ejemplo `Registro público profesor`. | Unificar término: usar `evaluador` en todo el producto. |
| Estados comunes | La guía define mensajes comunes de carga, error, vacío y éxito. | El código usa mensajes variados por página. | Crear catálogo de mensajes compartidos o constantes. |

### Textos sin acento detectados en el alcance cercano

| Archivo | Línea | Texto actual | Texto recomendado |
| --- | ---: | --- | --- |
| `RubricBuilderPage.jsx` | 26 | `mayoria` | `mayoría` |
| `RubricBuilderPage.jsx` | 240 | `Puntos maximos` | `Puntos máximos` |
| `RubricBuilderPage.jsx` | 357 | `Maximo` | `Máximo` o `Puntuación máxima` |
| `ChecklistBuilderPage.jsx` | 19 | `proposito` | `propósito` |
| `ChecklistBuilderPage.jsx` | 38 | `Si` | `Sí` |
| `ChecklistBuilderPage.jsx` | 211 | `Puntos maximos` | `Puntos máximos` |
| `ChecklistBuilderPage.jsx` | 350 | `Si` | `Sí` |
| `EvaluatorInstrumentsPage.jsx` | 249 | `guias` | `guías` |
| `EvaluatorInstrumentsPage.jsx` | 291 | `especifico` | `específico` |
| `EvaluatorInstrumentsPage.jsx` | 425 | `Guias` | `Guías` |

## 4. Recomendaciones priorizadas

### Prioridad 1: alinear datos guardados con lo que la UI permite editar

Decidir una de estas rutas:

1. Mantener listas simples: retirar `opciones`, `obligatorio` y `observación` del constructor de listas.
2. Mantener listas avanzadas: extender `Instrument.indicators`, `instrument.validator.js`, controladores y evaluación para guardar y usar `options`, `required` y `observation`.

Recomendación profesional: mantener listas avanzadas, porque la UI actual ya está cerca de una experiencia más completa y útil.

### Prioridad 2: corregir acentos y microcopy de constructores

Aplicar cambios simples:

- `Puntos maximos` -> `Puntos máximos`
- `Maximo` -> `Puntuación máxima`
- `Si` -> `Sí`
- `mayoria` -> `mayoría`
- `proposito` -> `propósito`
- `Guardar borrador` -> `Guardar instrumento` o texto dinámico según estado
- `guardada en la base de datos` -> `guardada correctamente`

### Prioridad 3: elegir fuente de verdad editorial

La guía editorial debe ser una de estas dos cosas:

- Guía aspiracional: entonces debe decir claramente que sus textos son recomendados, no necesariamente implementados.
- Fuente de verdad: entonces hay que aplicar sus textos exactos en el código.

Para avanzar en diseño UX/UI, conviene convertirla en fuente de verdad y aplicar los textos por página en una fase editorial.

### Prioridad 4: mejorar flujo posterior al guardado

Después de guardar una rúbrica o lista, ofrecer acciones claras:

- `Ver instrumentos`
- `Crear otra`
- `Editar este instrumento`

Esto reduce incertidumbre y hace que el constructor se sienta terminado.

### Prioridad 5: reforzar validaciones en cliente

Antes de enviar a la API:

- Bloquear título vacío.
- Bloquear criterios/indicadores sin texto.
- Evitar puntuaciones negativas o inconsistentes.
- Mostrar advertencia si un criterio no tiene descripciones.
- En listas, validar que los factores estén entre 0 y 1.

## 5. Plan de corrección sugerido

### Fase A: correcciones rápidas

- Corregir acentos en constructores e instrumentos.
- Cambiar mensajes técnicos por mensajes orientados a usuario.
- Alinear títulos/descripciones de constructores con la guía editorial.

### Fase B: decisión funcional de listas

- Definir si `options`, `required` y `observation` serán parte persistente del instrumento.
- Si sí, actualizar modelo, validador, formularios, evaluación y reportes.
- Si no, simplificar la UI para evitar pérdida de datos percibida.

### Fase C: aplicación editorial global

- Recorrer cada sección de `docs/textos-profesionales-por-pagina.md`.
- Aplicar textos exactos en cada archivo de página.
- Volver a correr el cruce automático para medir avance.

### Fase D: revisión visual

- Ver constructores en escritorio y móvil.
- Confirmar que la matriz de rúbrica y la lista de cotejo no generan scroll incómodo.
- Ajustar densidad, ayudas breves y acciones de guardado.

## 6. Criterio de aceptación para cerrar esta revisión

- No hay textos sin acento en constructores.
- El botón de guardado no contradice el estado elegido.
- La guía editorial y los textos de constructores coinciden o la guía documenta explícitamente la diferencia.
- El constructor de listas no permite configurar datos que luego se pierden.
- Guardar un instrumento ofrece una acción clara posterior.
- Las validaciones ayudan antes de enviar datos inválidos a la API.
