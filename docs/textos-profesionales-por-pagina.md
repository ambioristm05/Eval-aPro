# Guía editorial y textos profesionales por página

Este documento define la voz, los títulos, las descripciones, las etiquetas y los mensajes recomendados para las páginas de EvalúaPro. Úsalo como referencia antes de modificar textos estáticos en `client/src/pages`, `client/src/components` y `client/src/utils/navigation.jsx`.

## Voz del producto

EvalúaPro debe sentirse claro, académico, confiable y humano. El texto debe ayudar a evaluadores, estudiantes y administradores a tomar acción sin sonar técnico ni improvisado.

Principios de redacción:

- Usar español con acentos y signos completos: `evaluación`, `rúbrica`, `gestión`, `contraseña`, `sesión`, `descripción`.
- Preferir frases breves, concretas y orientadas a la acción.
- Evitar lenguaje de maqueta como `placeholder`, `próximamente`, `MVP`, `datos reales`, `funciones previstas`.
- No prometer acciones que la página no permite.
- Usar segunda persona cuando la vista es personal: `Consulta tus resultados`, `Revisa tus tareas`.
- Usar tono operativo cuando la vista es de gestión: `Administra grupos`, `Publica resultados`, `Genera reportes`.
- Mantener consistencia entre botones, estados vacíos y mensajes de error.

## Nombres principales del producto

- Nombre del producto: `EvalúaPro`
- Categoría corta: `Gestión académica digital`
- Descripción corta: `Plataforma para organizar tareas, aplicar evaluaciones, publicar resultados y generar reportes académicos.`
- Promesa de valor: `Centraliza el seguimiento académico con instrumentos claros, resultados trazables y reportes listos para compartir.`

## Navegación recomendada

Etiquetas principales:

- Inicio público: `Inicio`
- Login: `Iniciar sesión`
- Registro estudiante: `Registro de estudiante`
- Registro evaluador: `Registro de evaluador`
- Panel administrador: `Panel`
- Evaluadores: `Evaluadores`
- Invitaciones: `Invitaciones`
- Estadísticas: `Estadísticas`
- Configuración: `Configuración`
- Panel evaluador: `Panel`
- Grupos: `Grupos`
- Estudiantes: `Estudiantes`
- Tareas: `Tareas`
- Instrumentos: `Instrumentos`
- Evaluaciones: `Evaluaciones`
- Reportes: `Reportes`
- Panel estudiante: `Panel`
- Mis tareas: `Tareas`
- Mis evaluaciones: `Evaluaciones`
- Resultados: `Resultados`
- Sugerencias: `Sugerencias`
- Perfil: `Perfil`

## Botones y acciones comunes

Usar estas etiquetas de forma consistente:

- Crear: `Crear`
- Guardar cambios: `Guardar cambios`
- Actualizar: `Actualizar`
- Cancelar: `Cancelar`
- Editar: `Editar`
- Eliminar: `Eliminar`
- Desactivar: `Desactivar`
- Reactivar: `Reactivar`
- Publicar: `Publicar`
- Ver detalle: `Ver detalle`
- Generar reporte: `Generar reporte`
- Imprimir reporte: `Imprimir reporte`
- Descargar reporte: `Descargar reporte`
- Reintentar carga: `Reintentar`
- Volver: `Volver`
- Ingresar: `Iniciar sesión`
- Cerrar sesión: `Cerrar sesión`

## Estados comunes

Carga:

- `Cargando información...`
- `Preparando datos...`
- `Generando reporte...`
- `Guardando cambios...`

Estados vacíos:

- `No hay registros todavía.`
- `Cuando haya información disponible, aparecerá aquí.`
- `Ajusta los filtros o intenta con otra búsqueda.`
- `Aún no se han publicado resultados para esta sección.`

Errores:

- `No se pudo cargar la información. Intenta nuevamente.`
- `No se pudo guardar el cambio. Revisa los datos e intenta otra vez.`
- `No se pudo conectar con la API. Verifica que el servidor esté activo.`

Confirmaciones:

- `Cambios guardados correctamente.`
- `Registro creado correctamente.`
- `Estado actualizado correctamente.`
- `Reporte generado correctamente.`

## Páginas públicas

### Inicio público `/`

Eyebrow:

`Gestión académica digital`

Título:

`EvalúaPro`

Descripción:

`Organiza grupos, tareas, instrumentos de evaluación, resultados y reportes en una plataforma clara para evaluadores y estudiantes.`

Acciones:

- Botón principal: `Iniciar sesión`
- Botón secundario: `Crear cuenta de estudiante`

Bloques recomendados:

- `Evaluaciones trazables`: `Aplica rúbricas y listas de cotejo con criterios claros y resultados consistentes.`
- `Seguimiento académico`: `Consulta tareas, avances, resultados publicados y sugerencias de mejora desde un solo panel.`
- `Reportes imprimibles`: `Genera reportes listos para revisar, compartir o entregar cuando corresponda.`

### Login `/login`

Eyebrow:

`Acceso seguro`

Título:

`Iniciar sesión`

Descripción:

`Entra a tu panel para continuar con la gestión académica, revisar resultados o administrar evaluaciones.`

Campos:

- `Correo electrónico`
- `Contraseña`

Botón:

`Iniciar sesión`

Mensajes:

- Éxito: `Sesión iniciada correctamente.`
- Error: `No pudimos iniciar sesión con esos datos. Verifica tu correo y contraseña.`

### Registro de estudiante `/register/student`

Eyebrow:

`Registro público`

Título:

`Crear cuenta de estudiante`

Descripción:

`Regístrate para consultar tus tareas, evaluaciones publicadas, sugerencias de mejora y reportes autorizados.`

Campos:

- `Nombre completo`
- `Correo electrónico`
- `Contraseña`
- `Confirmar contraseña`

Botón:

`Crear cuenta`

Mensaje de éxito:

`Cuenta creada correctamente. Ya puedes iniciar sesión.`

### Registro de evaluador `/register/evaluator`

Eyebrow:

`Registro protegido`

Título:

`Crear cuenta de evaluador`

Descripción:

`Usa tu invitación para crear una cuenta y comenzar a gestionar grupos, estudiantes, tareas e instrumentos de evaluación.`

Campos:

- `Nombre completo`
- `Correo electrónico`
- `Código de invitación`
- `Contraseña`
- `Confirmar contraseña`

Botón:

`Crear cuenta de evaluador`

Mensaje de éxito:

`Cuenta de evaluador creada correctamente. Ya puedes iniciar sesión.`

## Panel del estudiante

### Panel principal `/student`

Eyebrow:

`Panel del estudiante`

Título:

`Mi avance`

Descripción:

`Consulta tus tareas asignadas, resultados publicados, sugerencias de mejora y la nota acumulada cuando estén disponibles.`

Métricas:

- `Tareas asignadas`
- `Evaluaciones`
- `Nota final`

Acciones principales:

- `Ver mis tareas`: `Consulta actividades asignadas, fechas, estado e instrumento asociado.`
- `Revisar resultados`: `Revisa notas publicadas, criterios evaluados y porcentaje obtenido.`
- `Leer sugerencias`: `Consulta retroalimentación personalizada para mejorar tu desempeño.`
- `Imprimir reporte`: `Accede al reporte imprimible cuando el evaluador lo habilite.`

Panel lateral:

- Título: `Resumen personal`
- Descripción: `Datos actualizados desde tus tareas y resultados publicados.`
- Etiquetas: `Nota acumulada`, `Cuenta`, `Resultados publicados`, `Sugerencias recibidas`

### Mis tareas `/student/tasks`

Eyebrow:

`Estudiante`

Título:

`Mis tareas`

Descripción:

`Consulta las actividades asignadas por tu evaluador, junto con fechas, estado, grupo e instrumento asociado.`

Métricas:

- `Activas`
- `Completadas`
- `Ponderación`

Listado:

- Título de sección: `Listado de tareas`
- Descripción: `Busca por tarea, grupo o instrumento y filtra por estado.`
- Buscador: `Buscar tarea`
- Filtros: `Todas`, `Pendientes`, `En progreso`, `Completadas`, `Canceladas`

Estado vacío:

`No hay tareas asignadas. Cuando tu evaluador publique una actividad, aparecerá en este listado.`

### Mis evaluaciones `/student/evaluations`

Eyebrow:

`Estudiante`

Título:

`Mis evaluaciones`

Descripción:

`Consulta cada evaluación publicada y revisa el detalle por criterio, indicador y puntuación obtenida.`

Estado vacío:

`No hay evaluaciones publicadas. Cuando tu evaluador publique resultados, aparecerán aquí.`

Tarjetas:

- Título: nombre de la tarea.
- Subtítulo: nombre del instrumento.
- Puntuación destacada: porcentaje obtenido.
- Detalle: criterio, puntuación máxima, puntuación obtenida y observación.

### Resultados `/student/results`

Eyebrow:

`Estudiante`

Título:

`Resultados`

Descripción:

`Revisa tus notas publicadas, el progreso acumulado y la retroalimentación general de cada evaluación.`

Métricas:

- `Nota acumulada`
- `Resultados`
- `Sugerencias`

Reporte imprimible:

- Título: `Reporte imprimible`
- Habilitado: `El evaluador habilitó la impresión de tu reporte.`
- No habilitado: `Disponible cuando el evaluador habilite la impresión.`
- Botón: `Imprimir reporte`

Estado vacío:

`No hay resultados publicados. Tus calificaciones aparecerán después de que el evaluador las publique.`

### Sugerencias `/student/suggestions`

Eyebrow:

`Estudiante`

Título:

`Sugerencias de mejora`

Descripción:

`Consulta retroalimentación accionable para reforzar tu avance académico.`

Secciones:

- `Puntos fuertes`: `Aspectos destacados por el evaluador.`
- `Por mejorar`: `Acciones sugeridas para próximas entregas.`

Estados vacíos:

- `Sin puntos fuertes publicados. Aún no hay criterios destacados en tus resultados.`
- `Sin sugerencias publicadas. Cuando haya retroalimentación de mejora, se mostrará aquí.`

## Perfil de usuario

### Perfil `/student/profile` y `/evaluator/profile`

Eyebrow:

`Estudiante` o `Evaluador`

Título:

`Perfil`

Descripción:

`Consulta los datos asociados a tu cuenta. Para hacer cambios, usa la vista de modificación de perfil.`

Secciones:

- `Datos personales`: `Información principal de tu cuenta.`
- `Seguridad`: `Opciones disponibles para proteger el acceso.`

Botones:

- `Modificar perfil`
- `Cambiar contraseña`
- `Eliminar cuenta`

### Modificar perfil `/student/profile/edit` y `/evaluator/profile/edit`

Eyebrow:

`Estudiante` o `Evaluador`

Título:

`Modificar perfil`

Descripción:

`Actualiza tus datos personales y cambia tu contraseña cuando sea necesario.`

Secciones:

- `Modificar perfil`: `El correo de la cuenta no se puede modificar.`
- `Cambiar contraseña`: `Confirma la nueva contraseña antes de actualizar.`

Campos:

- `Nombre completo`
- `Correo electrónico`
- `Contraseña actual`
- `Nueva contraseña`
- `Confirmar nueva contraseña`

Botones:

- `Guardar cambios`
- `Actualizar contraseña`

### Eliminar cuenta `/student/profile/delete`

Eyebrow:

`Estudiante`

Título:

`Eliminar cuenta`

Descripción:

`Esta acción desactiva tu cuenta y limita el acceso a tu información. Revísala con cuidado antes de continuar.`

Sección:

`Confirmar eliminación`

Texto de apoyo:

`Para confirmar, escribe ELIMINAR y proporciona tu contraseña actual.`

Campos:

- `Escribe ELIMINAR`
- `Contraseña actual`
- `Motivo opcional`

Botón:

`Eliminar mi cuenta`

## Panel del evaluador

### Panel principal `/evaluator`

Eyebrow:

`Panel del evaluador`

Título:

`Gestión académica`

Descripción:

`Administra grupos, estudiantes, tareas, instrumentos, evaluaciones y reportes desde un panel centralizado.`

Métricas:

- `Grupos`
- `Estudiantes`
- `Tareas`
- `Evaluaciones`

Acciones:

- `Gestionar grupos`: `Organiza secciones, participantes y vínculos académicos.`
- `Crear tareas`: `Define actividades con fecha, ponderación e instrumento asociado.`
- `Aplicar evaluaciones`: `Registra puntuaciones, observaciones y retroalimentación.`
- `Generar reportes`: `Consulta resultados e imprime reportes académicos cuando corresponda.`

### Grupos `/evaluator/groups`

Eyebrow:

`Evaluador`

Título:

`Mis grupos`

Descripción:

`Crea grupos, actualiza su información y vincula estudiantes para organizar el seguimiento académico.`

Secciones:

- `Crear grupo` o `Editar grupo`: `Define el nombre y la descripción del grupo.`
- `Vincular estudiante`: `Agrega estudiantes registrados a uno de tus grupos.`
- `Listado de grupos`: `Consulta, edita o elimina grupos existentes.`

Estados vacíos:

`No hay grupos registrados. Crea un grupo para comenzar a organizar tus estudiantes.`

### Estudiantes `/evaluator/students`

Eyebrow:

`Evaluador`

Título:

`Estudiantes`

Descripción:

`Administra estudiantes vinculados a tus grupos, revisa su estado y reactiva cuentas cuando sea necesario.`

Secciones:

- `Agregar estudiante`: `Registra o vincula un estudiante para incluirlo en la gestión académica.`
- `Listado de estudiantes`: `Busca estudiantes por nombre, correo, grupo o estado.`

Estados:

- `Activo`
- `Inactivo`
- `Eliminado`

Acciones:

- `Reactivar`
- `Desactivar`
- `Eliminar`

### Tareas `/evaluator/tasks`

Eyebrow:

`Evaluador`

Título:

`Tareas`

Descripción:

`Crea y administra tareas con grupo, estudiantes, fecha límite, ponderación e instrumento de evaluación.`

Secciones:

- `Crear tarea` o `Editar tarea`: `Completa los datos de la actividad y selecciona el instrumento que se usará para evaluarla.`
- `Listado de tareas`: `Consulta actividades, estados, grupo asignado y ponderación.`

Estados vacíos:

`No hay tareas registradas. Crea una tarea para comenzar a evaluar el avance académico.`

### Instrumentos `/evaluator/instruments`

Eyebrow:

`Evaluador`

Título:

`Instrumentos`

Descripción:

`Crea rúbricas y listas de cotejo para evaluar tareas con criterios claros y puntuaciones consistentes.`

Secciones:

- `Crear instrumento` o `Editar instrumento`: `Define el tipo, título y descripción del instrumento.`
- `Listado de instrumentos`: `Consulta instrumentos disponibles y edita su estructura cuando sea necesario.`

### Constructor de rúbricas `/evaluator/instruments/rubric-builder`

Eyebrow:

`Instrumentos`

Título:

`Constructor de rúbricas`

Descripción:

`Diseña rúbricas con niveles de desempeño, criterios y descripciones para evaluar con mayor precisión.`

Secciones:

- `Ficha de la rúbrica`: `Define el título, la descripción y el contexto de uso.`
- `Niveles de desempeño`: `Configura las escalas que describen el logro esperado.`
- `Criterios y descripciones`: `Agrega los aspectos que serán evaluados y sus descriptores.`

### Constructor de listas `/evaluator/instruments/checklist-builder`

Eyebrow:

`Instrumentos`

Título:

`Constructor de listas`

Descripción:

`Crea listas de cotejo con indicadores observables y opciones de respuesta claras.`

Secciones:

- `Ficha de la lista`: `Define el título, la descripción y el propósito de la lista.`
- `Opciones de respuesta`: `Configura las respuestas disponibles para cada indicador.`
- `Indicadores`: `Agrega los elementos que se verificarán durante la evaluación.`

### Evaluaciones `/evaluator/evaluations`

Eyebrow:

`Evaluador`

Título:

`Evaluaciones`

Descripción:

`Aplica instrumentos a tareas asignadas, registra puntuaciones y publica resultados para estudiantes.`

Secciones:

- `Aplicar evaluación`: `Selecciona una tarea y un estudiante para registrar sus resultados.`
- `Historial`: `Consulta evaluaciones aplicadas, calificaciones y estado de publicación.`

Estados:

- `Borrador`
- `Publicada`

Acciones:

- `Guardar evaluación`
- `Publicar resultado`
- `Actualizar evaluación`

### Reportes `/evaluator/reports`

Eyebrow:

`Evaluador`

Título:

`Reportes`

Descripción:

`Genera reportes académicos por estudiante, grupo o tarea, y controla cuándo un estudiante puede imprimir su reporte.`

Tipos:

- `Reporte por estudiante`
- `Reporte por grupo`
- `Reporte por tarea`

Secciones:

- `Vista previa`: `Revisa el contenido antes de imprimir o compartir.`
- `Retroalimentación`: `Consulta fortalezas, mejoras y observaciones generales.`

Acciones:

- `Generar reporte`
- `Imprimir reporte`
- `Permitir impresión al estudiante`
- `Bloquear impresión al estudiante`

## Panel administrativo

### Panel principal `/admin`

Eyebrow:

`Panel administrativo`

Título:

`Administración general`

Descripción:

`Supervisa la actividad de la plataforma, gestiona evaluadores, invitaciones, estadísticas y configuración.`

Sección:

`Vista general`

Texto:

`Resumen de usuarios, actividad académica y configuración principal del sistema.`

### Evaluadores `/admin/evaluators`

Eyebrow:

`Administración`

Título:

`Evaluadores`

Descripción:

`Consulta y administra las cuentas de evaluadores que participan en la gestión académica.`

Secciones:

- `Listado de evaluadores`
- `Estado de cuentas`
- `Acciones administrativas`

### Invitaciones `/admin/invitations`

Eyebrow:

`Administración`

Título:

`Invitaciones`

Descripción:

`Crea y administra invitaciones para registrar nuevos evaluadores de forma controlada.`

Secciones:

- `Crear invitación de evaluador`: `Genera un código de acceso para una nueva cuenta de evaluador.`
- `Estado`: `Consulta invitaciones disponibles, usadas o vencidas.`

### Estadísticas `/admin/statistics`

Eyebrow:

`Administración`

Título:

`Estadísticas`

Descripción:

`Revisa indicadores generales sobre usuarios, tareas, evaluaciones y actividad académica.`

### Configuración `/admin/settings`

Eyebrow:

`Administración`

Título:

`Configuración`

Descripción:

`Ajusta parámetros generales de la plataforma y opciones administrativas del sistema.`

## Componentes compartidos

### DashboardShell

Título de bloque:

`Acciones principales`

Descripción:

`Accesos disponibles para consultar y continuar tu trabajo.`

### ModulePage

Panel principal:

- Título: `Funciones disponibles`
- Descripción: `Información y acciones principales de esta sección.`

Panel lateral:

- Título: `Estado`
- Descripción: `Resumen operativo de esta sección.`

### EmptyState

Usar:

- `No hay información disponible`
- `Cuando se registren datos, aparecerán en esta sección.`
- Botón opcional: `Actualizar`

## Reglas para modificar textos en el código

1. Buscar el texto exacto con `rg "texto a cambiar" client/src`.
2. Modificar solo el archivo que renderiza esa vista.
3. Mantener acentos y signos de apertura: `¿`, `¡`.
4. Revisar que la nueva frase no rompa el diseño en móvil.
5. Ejecutar `eslint` después de cambios en React.
6. Ejecutar `vite build` si el cambio afecta varias páginas o componentes compartidos.

## Lista de revisión editorial

- Cada página tiene eyebrow, título y descripción claros.
- Los botones usan verbos de acción.
- Los estados vacíos explican qué pasará y cuándo.
- Los errores indican una acción posible.
- No quedan textos de prueba, maqueta o desarrollo.
- Todo el texto visible usa español correcto con acentos.
- El tono se mantiene profesional, académico y cercano.
