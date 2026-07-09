# Plan de resolucion de errores y mejoras - EvaluaPro

## 1. Sesion y pantalla principal

- Si el usuario ya inicio sesion, no debe ver la pantalla principal publica con los botones de entrar y crear cuenta.
- Al cerrar el navegador, debe cerrarse la sesion.
- Al hacer clic en el logo de la app, debe cerrarse la sesion si hay un usuario activo.

## 2. Navegacion dentro de cursos

- Crear un submenu dentro de Cursos en el menu lateral.
- El submenu debe quedar en este orden:
  1. Modulos
  2. Clases
  3. Grupos
  4. Tareas
- Grupos debe salir del nivel principal y pasar a estar dentro del submenu de Cursos.
- Mantener la navegacion facil entre cursos, modulos, clases, grupos y tareas.

## 3. Constructor de grupo

- Corregir el buscador de Vincular estudiante.
- Alinear correctamente el icono del buscador.
- Evitar que el campo cambie de tamano o se vea mas grande al seleccionarlo para escribir.
- Mantener el estilo compacto y consistente con el resto de los buscadores.

## 4. Estudiantes y activacion por correo

- Permitir crear estudiantes sin necesidad de vincularlos a grupos creados.
- Cuando el evaluador agregue un estudiante, enviar un correo de activacion.
- Cuando un estudiante se registre por si mismo, enviar tambien un correo de activacion.
- El mensaje o enlace de activacion debe tener fecha de caducidad.
- Ajustar el estado de cuenta si hace falta para diferenciar cuentas pendientes de activar y cuentas activas.

## 5. Constructor de curso

- Cambiar la etiqueta Descripcion por Lugar y fecha del curso.
- Cambiar el boton o accion Archivar por Cerrar.
- Mantener la logica interna existente si no es necesario migrar datos.

## 6. Constructor de modulo

- Cambiar la etiqueta Descripcion por Fecha de inicio y fin.
- Cambiar la opcion Orden por Cantidad de estudiantes.
- Ajustar el listado para mostrar la nueva etiqueta en lugar de Orden.

## 7. Constructor de clase

- Cambiar la etiqueta Descripcion por Fecha.
- Eliminar la opcion Orden del formulario.
- Eliminar la visualizacion de Orden en el listado de clases.
- Permitir eliminar clases desde el constructor de clase.
- Las clases eliminadas no deben desaparecer definitivamente.
- Crear una nueva pagina o seccion donde se puedan ver las clases archivadas y eliminadas.

## 8. Constructor de tarea

- Cambiar Descripcion por Objetivo.
- Permitir crear una tarea para varios grupos.
- En Asignacion, al seleccionar un grupo, crear un selector para seleccionar o deseleccionar todos los estudiantes del grupo seleccionado.
- En Fechas y ponderacion, dejar una sola fecha.
- Quitar Fecha inicio y Entrega.
- Cambiar Peso por Nota.
- Quitar el simbolo %.

## 9. Constructor de instrumentos

- La rubrica y la lista de cotejo no deben crearse ni guardarse directamente desde sus constructores.
- En los constructores solo se debe modificar la estructura.
- El guardado definitivo debe ocurrir cuando se cree o guarde el instrumento.
- Corregir la eliminacion de instrumentos, ya que actualmente no se esta eliminando como se espera.

## 10. Instrumentos archivados, cerrados y eliminados

- Crear una nueva pagina para instrumentos archivados, cerrados y eliminados.
- Al eliminar, archivar o cerrar un instrumento, debe guardarse en esa pagina.
- Desde esa pagina se deben poder ver los instrumentos archivados, cerrados y eliminados.
- Desde esa pagina se debe permitir la eliminacion definitiva.
- Evaluar si tambien conviene permitir restaurar instrumentos.

## 11. Archivo de clases

- Crear una nueva pagina o seccion para clases archivadas y eliminadas.
- Las clases archivadas y eliminadas deben poder consultarse desde esa pagina.
- Evaluar si la pagina debe estar dentro del submenu de Cursos o accesible desde el detalle del modulo.
- Evaluar si se permitira restaurar clases o eliminarlas definitivamente.

## 12. Evaluaciones e impresion

- En Evaluaciones, permitir imprimir el instrumento tal como se muestra despues de ser corregido o evaluado.
- La impresion debe respetar el formato visual del instrumento corregido.
- Evitar imprimir solo datos planos si el usuario esta viendo una version formateada del instrumento.

## Orden recomendado de implementacion

1. Sesion, pantalla principal y logo.
2. Menu lateral y submenu de Cursos.
3. Correccion visual del buscador en Grupos.
4. Cambios simples de Curso, Modulo y Clase.
5. Estudiantes sin grupo y activacion por correo.
6. Constructor de Tarea.
7. Instrumentos: flujo de guardado, eliminar, archivar y cerrar.
8. Nueva pagina de instrumentos archivados, cerrados y eliminados.
9. Archivo de clases archivadas y eliminadas.
10. Impresion de instrumentos evaluados.
