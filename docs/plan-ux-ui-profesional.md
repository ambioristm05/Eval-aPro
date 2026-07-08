# Plan UX/UI profesional para EvalúaPro

Este documento propone una dirección de experiencia de usuario e interfaz visual para convertir EvalúaPro en una aplicación académica profesional, clara y amigable. El objetivo es que evaluadores, estudiantes y administradores entiendan qué hacer, dónde mirar y cómo avanzar sin fricción.

## Objetivo de diseño

EvalúaPro debe sentirse como una herramienta de gestión académica moderna: confiable, ordenada, rápida de escanear y suficientemente cálida para acompañar procesos de evaluación y mejora.

La interfaz debe priorizar:

- Claridad sobre decoración.
- Acciones visibles y consistentes.
- Información académica fácil de comparar.
- Estados de carga, vacío y error bien resueltos.
- Experiencia móvil utilizable, no solo adaptable.
- Accesibilidad visual y textual.

## Usuarios principales

### Estudiante

Necesita:

- Ver tareas asignadas.
- Entender qué está pendiente, completado o evaluado.
- Consultar resultados publicados.
- Leer sugerencias de mejora.
- Imprimir reportes cuando estén habilitados.
- Gestionar su perfil sin confusión.

Diseño recomendado:

- Panel personal simple, con métricas grandes y pocas acciones.
- Lenguaje directo: `Mis tareas`, `Mis resultados`, `Sugerencias`.
- Estados vacíos que expliquen que la información depende del evaluador.
- Énfasis visual en nota acumulada, tareas activas y retroalimentación.

### Evaluador

Necesita:

- Gestionar grupos, estudiantes, tareas e instrumentos.
- Aplicar evaluaciones con rapidez.
- Publicar resultados.
- Generar e imprimir reportes.
- Controlar permisos de reportes para estudiantes.

Diseño recomendado:

- Panel operativo con accesos frecuentes.
- Tablas/listados densos pero legibles.
- Formularios divididos en secciones.
- Acciones primarias claramente diferenciadas.
- Historial de evaluaciones con estados visibles.

### Administrador

Necesita:

- Supervisar actividad general.
- Administrar evaluadores.
- Crear invitaciones.
- Revisar estadísticas y configuración.

Diseño recomendado:

- Panel sobrio y ejecutivo.
- Métricas de alto nivel.
- Navegación administrativa separada de acciones académicas.
- Confirmaciones visibles para acciones sensibles.

## Arquitectura de información

Mantener tres áreas por rol:

- `Público`: inicio, login y registros.
- `Estudiante`: avance personal, tareas, evaluaciones, resultados, sugerencias y perfil.
- `Evaluador`: gestión académica, grupos, estudiantes, tareas, instrumentos, evaluaciones, reportes y perfil.
- `Administrador`: panel, evaluadores, invitaciones, estadísticas y configuración.

La navegación lateral debe ser estable y predecible. El usuario no debe perder el contexto al entrar en formularios o vistas de detalle.

Orden recomendado del menú del estudiante:

1. Panel
2. Tareas
3. Evaluaciones
4. Resultados
5. Sugerencias
6. Perfil

Orden recomendado del menú del evaluador:

1. Panel
2. Grupos
3. Estudiantes
4. Tareas
5. Instrumentos
6. Evaluaciones
7. Reportes
8. Perfil

Orden recomendado del menú administrador:

1. Panel
2. Evaluadores
3. Invitaciones
4. Estadísticas
5. Configuración

## Sistema visual

### Personalidad visual

La aplicación debe verse:

- Profesional
- Académica
- Limpia
- Serena
- Confiable
- Amigable

Evitar:

- Interfaces demasiado decorativas.
- Tarjetas gigantes sin densidad útil.
- Fondos con degradados dominantes.
- Paletas de un solo color.
- Textos de marketing dentro de herramientas de gestión.
- Botones ambiguos o sin jerarquía.

### Paleta recomendada

Usar una paleta sobria con contraste suficiente:

- Color primario: azul académico o verde institucional.
- Color secundario: cian, teal o índigo moderado.
- Éxito: verde.
- Advertencia: ámbar.
- Error: rojo.
- Neutros: grises cálidos o fríos equilibrados.
- Fondo general: gris muy claro o blanco suave.

Regla: ningún rol debe depender solo del color para comunicar estado. Acompañar con texto e iconos.

### Tipografía

Usar una fuente sans serif clara y moderna. Recomendaciones:

- Inter
- Source Sans 3
- Nunito Sans
- System UI si se quiere evitar dependencia externa

Jerarquía recomendada:

- H1 de página: 28-36 px en escritorio, 24-30 px en móvil.
- H2 de panel: 18-22 px.
- Texto base: 14-16 px.
- Etiquetas y metadatos: 12-14 px.

No escalar tipografía con `vw`. Mantener tamaños estables y legibles.

### Espaciado

Usar una escala consistente:

- 4 px: microespacios.
- 8 px: separación interna pequeña.
- 12 px: separación entre controles.
- 16 px: padding estándar.
- 24 px: separación entre bloques.
- 32 px: separación mayor de secciones.

Los paneles de gestión deben favorecer lectura rápida, no exceso de aire vacío.

### Bordes y sombras

- Radio de tarjetas: máximo 8 px.
- Bordes sutiles para separar áreas.
- Sombras suaves solo cuando ayuden a distinguir capas.
- Evitar tarjetas dentro de tarjetas.

## Layout por tipo de página

### Páginas públicas

Inicio:

- Primer viewport con nombre del producto y promesa clara.
- Mostrar una acción principal: iniciar sesión.
- Mostrar una acción secundaria: registro de estudiante.
- Incluir bloques concretos sobre evaluación, seguimiento y reportes.

Login y registros:

- Formulario centrado con ancho controlado.
- Texto breve arriba.
- Errores cerca del campo o encima del formulario.
- Botón principal de ancho completo en móvil.

### Paneles principales

Estructura:

1. Encabezado con eyebrow, H1 y descripción.
2. Métricas principales.
3. Acciones principales.
4. Panel de resumen o actividad reciente.

Regla: el panel inicial debe responder `qué está pasando` y `qué puedo hacer ahora`.

### Páginas de gestión

Estructura:

1. Encabezado de página.
2. Mensaje de error o éxito si existe.
3. Métricas si aportan contexto.
4. Formulario o controles.
5. Listado principal.

Los formularios largos deben separarse en bloques:

- Datos generales.
- Asignación o relación.
- Configuración.
- Confirmación o acción final.

### Reportes

Estructura:

1. Selector de tipo de reporte.
2. Filtros o entidad objetivo.
3. Vista previa.
4. Acciones de impresión o permiso.

El reporte debe verse como documento:

- Fondo blanco.
- Márgenes claros.
- Títulos legibles.
- Tablas limpias.
- Sección de retroalimentación diferenciada.

## Componentes clave

### Métricas

Usar tarjetas compactas con:

- Icono.
- Valor.
- Etiqueta.
- Opcional: variación o estado.

No usar métricas sin contexto. Si el valor puede ser cero, el texto debe explicar si es ausencia real o falta de datos publicados.

### Listados

Cada ítem debe incluir:

- Título principal.
- Estado visible.
- Metadatos relevantes.
- Acción primaria.
- Acciones secundarias agrupadas.

En móvil:

- Pasar de tabla a tarjetas.
- Mantener estado y acción principal visibles.
- Evitar columnas apretadas.

### Formularios

Buenas prácticas:

- Etiquetas visibles, no solo placeholder.
- Placeholders como ayuda breve, no como única instrucción.
- Campos requeridos marcados de forma clara.
- Validación cerca del campo.
- Confirmación antes de acciones sensibles.

Acciones:

- Botón primario alineado al final del formulario.
- Botón secundario para cancelar o limpiar.
- Desactivar botón mientras se guarda.

### Estados

Cada página debe tener:

- Estado de carga.
- Estado vacío.
- Estado de error.
- Estado de éxito.

Estados vacíos deben incluir:

- Título claro.
- Explicación breve.
- Acción cuando aplique.

Ejemplo:

`No hay tareas registradas. Crea una tarea para comenzar a evaluar el avance académico.`

### Badges

Estados recomendados:

- `Activo`
- `Inactivo`
- `Eliminado`
- `Pendiente`
- `En progreso`
- `Completada`
- `Cancelada`
- `Publicada`
- `Borrador`

Cada badge debe tener contraste suficiente y texto visible.

## Accesibilidad

Requisitos mínimos:

- Contraste AA en texto principal.
- Estados no comunicados solo por color.
- Botones con texto o `aria-label` cuando sean solo icono.
- Foco visible en inputs, botones y enlaces.
- Formularios con labels reales.
- Mensajes de error comprensibles.
- Navegación usable con teclado.

Revisar:

- Tabulación lógica.
- Tamaño mínimo de clic: 40 x 40 px.
- Texto que no se recorte en móvil.
- Iconos decorativos con `aria-hidden="true"`.

## Responsive

### Escritorio

- Sidebar fija o persistente.
- Contenido principal con ancho cómodo.
- Grids de 2 a 4 columnas para métricas.
- Formularios y listados en layout de dos columnas cuando aporte claridad.

### Tablet

- Reducir columnas.
- Mantener filtros y acciones en filas flexibles.
- Evitar tablas demasiado anchas.

### Móvil

- Navegación compacta.
- Métricas en una o dos columnas.
- Formularios a una columna.
- Listados como tarjetas.
- Botones principales de ancho completo cuando estén dentro de formularios.

## Diseño por rol

### Estudiante

Prioridades visuales:

- Avance personal.
- Tareas activas.
- Resultados publicados.
- Sugerencias.

Mejoras recomendadas:

- Resaltar nota acumulada con una tarjeta principal.
- Usar línea de tiempo para resultados.
- Mostrar estado de reporte imprimible de forma clara.
- Separar fortalezas y mejoras con iconos y colores sobrios.

### Evaluador

Prioridades visuales:

- Gestión rápida.
- Formularios eficientes.
- Historial claro.
- Control de publicación.

Mejoras recomendadas:

- Añadir filtros persistentes en listados grandes.
- Unificar diseño de formularios de crear/editar.
- Mostrar estado de publicación en evaluaciones y reportes.
- Añadir resumen de actividad reciente en el dashboard.

### Administrador

Prioridades visuales:

- Control del sistema.
- Invitaciones.
- Actividad general.
- Configuración.

Mejoras recomendadas:

- Convertir páginas basadas en `ModulePage` en vistas con datos reales.
- Añadir métricas administrativas.
- Mostrar estados de invitaciones con badges.
- Separar configuración por categorías.

## Plan de implementación recomendado

### Fase 1: Limpieza editorial

- Aplicar la guía de textos por página.
- Eliminar textos de maqueta.
- Corregir acentos y consistencia de términos.
- Unificar nombres de botones y estados.

Criterio de aceptación:

- No hay textos visibles como `MVP`, `placeholder`, `datos reales`, `próximos pasos` o `funciones previstas`.
- Todos los textos principales están en español correcto.

### Fase 2: Consistencia de componentes

- Revisar `DashboardShell`, `ModulePage`, `EmptyState`, formularios, badges y tarjetas.
- Crear variantes visuales para éxito, advertencia, error e información.
- Unificar estilos de paneles y listados.

Criterio de aceptación:

- Las páginas se sienten parte del mismo sistema.
- Los estados de carga, vacío y error son consistentes.

### Fase 3: Mejoras por flujo

- Estudiante: optimizar tareas, resultados, sugerencias y reporte imprimible.
- Evaluador: optimizar creación de tareas, aplicación de evaluaciones y reportes.
- Administrador: reemplazar vistas genéricas por datos útiles.

Criterio de aceptación:

- Cada rol puede completar sus tareas principales sin volver atrás innecesariamente.

### Fase 4: Responsive y accesibilidad

- Revisar móvil en todas las rutas.
- Probar navegación con teclado.
- Validar contraste.
- Ajustar tablas/listados a tarjetas móviles.

Criterio de aceptación:

- La app es usable en escritorio, tablet y móvil.
- No hay textos cortados ni elementos superpuestos.

### Fase 5: Pulido visual

- Ajustar espaciados.
- Refinar iconografía.
- Revisar jerarquía tipográfica.
- Mejorar impresión de reportes.

Criterio de aceptación:

- La interfaz se ve profesional y lista para presentación.
- Los reportes imprimibles parecen documentos académicos formales.

## Checklist UX/UI antes de cerrar una página

- El H1 explica claramente la vista.
- La descripción responde para qué sirve la página.
- La acción principal se identifica en menos de 3 segundos.
- Hay estado vacío y error.
- Los botones usan verbos claros.
- Las métricas no son ambiguas.
- Los formularios tienen labels visibles.
- La página funciona en móvil.
- No hay superposición de textos.
- El diseño mantiene la misma personalidad visual del resto del proyecto.

## Recomendación final

Trabajar EvalúaPro como una herramienta de operación académica, no como una landing page. La interfaz debe ser sobria, clara y eficiente, con suficiente calidez en los textos para que estudiantes y evaluadores sientan acompañamiento sin perder precisión profesional.
