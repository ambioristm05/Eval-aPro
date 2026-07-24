# Deployment.md — Despliegue de EvaluaPro

## 1. Alcance del despliegue

EvaluaPro se despliega como una aplicacion web separada en tres piezas principales:

- **Frontend:** aplicacion React con Vite ubicada en `client/`.
- **Backend:** API REST con Node.js, Express, MongoDB, JWT y servicios de reportes ubicada en `server/`.
- **Base de datos:** MongoDB, preferiblemente MongoDB Atlas para produccion.

La estrategia recomendada para el MVP es:

- **Frontend:** Vercel o Netlify.
- **Backend:** Render o Railway.
- **Base de datos:** MongoDB Atlas.

Esta separacion facilita escalar, configurar variables de entorno por servicio y proteger la API sin exponer configuraciones sensibles en el cliente.

---

## 2. Arquitectura recomendada

```txt
Usuario
  |
  v
Frontend React/Vite
Vercel (dominio propio: evaluapro.app)
  |
  | VITE_API_URL=https://evaluapro-api.onrender.com/api
  v
Backend Express
Render (subdominio por defecto, sin dominio propio)
  |
  | MONGO_URI=mongodb+srv://...
  v
MongoDB Atlas
```

Estado real del despliegue (actualizado):

- El **frontend** ya usa un dominio propio: `evaluapro.app` (comprado en Hostinger, DNS apuntando a Vercel).
- El **backend** sigue en el subdominio por defecto de Render (`evaluapro-api.onrender.com`); nunca se configuró `api.evaluapro.app`. Es opcional hacerlo mas adelante si se quiere.
- **Envio de correo:** no se usa SMTP tradicional. Render bloquea conexiones SMTP salientes (confirmado en produccion con error `ETIMEDOUT`), asi que el envio de correos (invitaciones, recuperacion de contrasena) se hace via la **API HTTP de Resend** (`https://api.resend.com/emails`), que viaja por HTTPS y no se bloquea. Ver seccion 4.1.
- **Almacenamiento externo:** pendiente, solo seria necesario si se agregan fotos de perfil o adjuntos.

---

## 3. Requisitos previos

Antes de desplegar:

1. Crear una cuenta en GitHub y subir el repositorio.
2. Crear una base de datos en MongoDB Atlas.
3. Crear servicios de hosting para frontend y backend.
4. Definir secretos seguros para JWT y credenciales SMTP.
5. Confirmar que el registro publico de evaluadores no este disponible.
6. Confirmar que las rutas privadas usen middleware de autenticacion, roles y estado de usuario.
7. Ejecutar lint y build localmente.

Comandos locales recomendados:

```bash
npm install
npm run lint
npm run build
```

Para desarrollo local:

```bash
npm run dev
```

---

## 4. Variables de entorno

### 4.1. Backend

Configurar estas variables en Render, Railway u otro proveedor:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/evaluapro
JWT_SECRET=usar_un_secreto_largo_y_seguro
JWT_EXPIRES_IN=7d
CLIENT_URL=https://evaluapro.app,https://www.evaluapro.app
ADMIN_NAME=Administrador
ADMIN_EMAIL=admin@evaluapro.app
ADMIN_PASSWORD=usar_una_contrasena_segura
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_tu_api_key_de_resend
SMTP_FROM=EvaluaPro <no-reply@evaluapro.app>
```

Notas:

- `CLIENT_URL` puede llevar **varios origenes separados por coma** (por ejemplo con y sin `www`); el backend los separa para armar la lista blanca de CORS (`server/src/app.js`). Para construir enlaces individuales (registro, reset de contrasena, imagenes de correo) el codigo usa `env.primaryClientUrl`, que toma solo el primer origen de la lista — importante si se agrega o reordena un origen.
- `JWT_SECRET` no debe usarse con el valor de desarrollo.
- `ADMIN_PASSWORD` debe rotarse despues del primer inicio de sesion si se usa para crear un administrador inicial.
- **Las variables `SMTP_*` ya no configuran una conexion SMTP real** (Render bloquea SMTP saliente). El backend usa la **API HTTP de Resend**, reutilizando `SMTP_PASS` como el API key de Resend (el usuario SMTP de Resend siempre es literalmente `resend`, por eso `SMTP_USER=resend`). `SMTP_HOST`/`SMTP_PORT` quedan sin uso real, se conservan solo por compatibilidad de nombres. Sin estas variables, el sistema hace fallback a `console.log` (no falla, pero no envia correos).

### 4.2. Frontend

Configurar esta variable en Vercel o Netlify:

```env
VITE_API_URL=https://evaluapro-api.onrender.com/api
```

Notas:

- La variable debe incluir `/api` al final porque el cliente consume rutas como `/auth/login`, `/users`, `/tasks`, etc.
- Si se usa la URL temporal del backend, reemplazarla luego por el dominio definitivo.

---

## 5. Despliegue de la base de datos

### MongoDB Atlas

1. Crear un proyecto en MongoDB Atlas.
2. Crear un cluster gratuito o dedicado.
3. Crear un usuario de base de datos con permisos de lectura y escritura.
4. Permitir acceso desde el proveedor del backend.
   - Para MVP se puede usar `0.0.0.0/0`.
   - Para produccion mas estricta, limitar por IP si el proveedor lo permite.
5. Copiar el connection string.
6. Definir `MONGO_URI` en el backend.

Ejemplo:

```env
MONGO_URI=mongodb+srv://evaluapro_user:password@cluster0.xxxxx.mongodb.net/evaluapro
```

Recomendaciones:

- Activar backups si el plan lo permite.
- Separar bases de datos por entorno: `evaluapro_dev`, `evaluapro_staging`, `evaluapro_prod`.
- No borrar fisicamente estudiantes ni evaluaciones importantes; el sistema debe usar eliminacion logica segun `planning.md`.

---

## 6. Despliegue del backend

### Opcion recomendada: Render

Crear un **Web Service** conectado al repositorio.

Configuracion sugerida:

```txt
Root Directory: server
Environment: Node
Build Command: npm install
Start Command: npm start
```

Variables requeridas:

- `NODE_ENV`
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_URL`
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- Variables `SMTP_*` (en realidad usadas para la API de Resend, ver seccion 4.1) si se usaran invitaciones o correos.

Ruta de salud:

```txt
GET /
```

Respuesta esperada:

```json
{
  "name": "EvaluaPro API",
  "status": "ok"
}
```

### Opcion alternativa: Railway

Crear un servicio desde GitHub y seleccionar la carpeta `server/`.

Configuracion sugerida:

```txt
Build Command: npm install
Start Command: npm start
```

Railway suele asignar `PORT` automaticamente. Si el proveedor define `PORT`, la API lo usara.

### Consideraciones por Puppeteer/PDF

El backend incluye `puppeteer` para reportes PDF. En algunos proveedores puede requerir configuracion adicional de dependencias del sistema o una imagen compatible.

Para el MVP:

- Verificar que la generacion PDF funcione despues del despliegue.
- Si falla en hosting serverless, mantener el backend en un servicio Node persistente como Render/Railway.
- Considerar generar PDF desde HTML imprimible si el proveedor limita Chromium.

---

## 7. Despliegue del frontend

### Opcion recomendada: Vercel

Crear un proyecto conectado al repositorio.

Configuracion sugerida:

```txt
Framework Preset: Vite
Root Directory: client
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Variable requerida:

```env
VITE_API_URL=https://URL_DEL_BACKEND/api
```

### Opcion alternativa: Netlify

Configuracion sugerida:

```txt
Base directory: client
Build command: npm run build
Publish directory: client/dist
```

Variable requerida:

```env
VITE_API_URL=https://URL_DEL_BACKEND/api
```

### Rutas de React Router

Como el frontend usa React Router, el hosting debe redirigir todas las rutas al `index.html`.

En Netlify se puede agregar:

```txt
/* /index.html 200
```

En Vercel, Vite normalmente funciona sin configuracion adicional, pero si hay errores al recargar rutas internas, agregar una regla de rewrites hacia `/index.html`.

---

## 8. Orden recomendado de despliegue

1. Crear la base de datos en MongoDB Atlas.
2. Desplegar el backend con `MONGO_URI`, `JWT_SECRET` y `CLIENT_URL` temporal.
3. Probar `GET /` en la API.
4. Desplegar el frontend con `VITE_API_URL` apuntando al backend.
5. Actualizar `CLIENT_URL` del backend con la URL final del frontend.
6. Probar login, registro de estudiante y rutas protegidas.
7. Crear o invitar el primer evaluador desde flujo administrador.
8. Probar creacion de grupos, tareas, instrumentos y evaluaciones.
9. Probar reportes imprimibles y PDF.

---

## 9. Checklist de seguridad

Antes de abrir el sistema a usuarios reales:

- [ ] `NODE_ENV=production` configurado en backend.
- [ ] `JWT_SECRET` fuerte y privado.
- [ ] `MONGO_URI` no expuesto en frontend.
- [ ] `CLIENT_URL` apunta solo al dominio permitido.
- [ ] Registro publico solo para estudiantes.
- [ ] Registro de evaluadores protegido por administrador o invitacion.
- [ ] Middleware de rol activo para admin, evaluador y estudiante.
- [ ] Middleware de estado bloquea usuarios `suspended` y `deleted`.
- [ ] Eliminacion de estudiantes y evaluaciones importantes es logica, no fisica.
- [ ] Acciones destructivas requieren confirmacion.
- [ ] Reportes e impresion disponibles solo para usuarios autorizados.
- [ ] API key de Resend (`SMTP_PASS`) guardada como variable de entorno, nunca en el codigo.
- [ ] Backups de MongoDB activados o planificados.

---

## 10. Checklist funcional posterior al despliegue

Probar como administrador:

- [ ] Inicio de sesion.
- [ ] Creacion o invitacion de evaluador.
- [ ] Suspension de evaluador si aplica.

Probar como evaluador:

- [ ] Inicio de sesion.
- [ ] Creacion de grupo.
- [ ] Gestion de estudiantes.
- [ ] Suspension y reactivacion de estudiante.
- [ ] Creacion de tarea.
- [ ] Creacion de rubrica o lista de cotejo.
- [ ] Aplicacion de evaluacion.
- [ ] Publicacion de resultados.
- [ ] Generacion de reporte.
- [ ] Impresion o exportacion PDF.

Probar como estudiante:

- [ ] Registro publico.
- [ ] Inicio de sesion.
- [ ] Visualizacion de tareas.
- [ ] Visualizacion de resultados y sugerencias.
- [ ] Eliminacion de cuenta desde perfil.
- [ ] Bloqueo de acceso despues de eliminar la cuenta.

---

## 11. Ambientes recomendados

### Desarrollo

```txt
Frontend: http://localhost:5173
Backend: http://localhost:5000
MongoDB: mongodb://localhost:27017/evaluapro
```

### Staging

```txt
Frontend: https://staging-app.evaluapro.app
Backend: https://staging-api.evaluapro.app
MongoDB: evaluapro_staging
```

### Produccion (real)

```txt
Frontend: https://evaluapro.app  (Vercel, dominio propio)
Backend: https://evaluapro-api.onrender.com  (Render, subdominio por defecto)
MongoDB: evaluapro_prod (Atlas)
```

Mantener variables y bases de datos separadas evita mezclar pruebas con datos reales de estudiantes.

---

## 12. Pendientes antes de produccion

- ~~Crear o revisar el script `server/src/scripts/seedAdmin.js`~~ — ya existe (`server/src/scripts/seedAdmin.js`).
- ~~Confirmar el flujo final para crear evaluadores~~ — resuelto: invitacion por administrador, con envio automatico de correo via Resend.
- ~~Definir dominio final~~ — resuelto para el frontend (`evaluapro.app`, DNS en Hostinger apuntando a Vercel, certificado HTTPS automatico). El backend sigue en el subdominio por defecto de Render; configurar `api.evaluapro.app` es opcional.
- ~~Documentar una coleccion de Postman o Swagger para validar la API~~ — resuelto: `server/postman/EvaluaPro.postman_collection.json` documenta los 115 endpoints (16 carpetas por recurso), con autenticacion automatica via el request "Login" (guarda el token en la variable de coleccion `authToken`).
- ~~Exportacion de reportes a CSV/Excel~~ — resuelto: cada reporte (individual, grupo, tarea, notas finales, instrumento) tiene botones de exportar a CSV y Excel (`.xlsx`, via `exceljs`) junto al de PDF.
- Probar generacion PDF en el proveedor seleccionado (Puppeteer en Render).
- Agregar politicas de backup y restauracion de MongoDB Atlas.
- Revisar limites de subida, tamano de JSON y rendimiento en reportes grandes.

---

## 13. Comandos utiles

Instalar dependencias:

```bash
npm install
```

Ejecutar frontend y backend en desarrollo:

```bash
npm run dev
```

Ejecutar solo backend:

```bash
npm run dev:server
```

Ejecutar solo frontend:

```bash
npm run dev:client
```

Construir frontend:

```bash
npm run build
```

Iniciar backend en produccion:

```bash
npm start
```

Ejecutar lint:

```bash
npm run lint
```

---

## 14. Resumen de decision

Para el MVP de EvaluaPro, la opcion mas simple y segura es desplegar:

- **MongoDB Atlas** para la base de datos.
- **Render o Railway** para el backend Express.
- **Vercel o Netlify** para el frontend React/Vite.

El backend debe concentrar la seguridad: autenticacion JWT, roles, estado de usuarios, proteccion del registro de evaluadores, eliminacion logica y autorizacion de reportes. El frontend debe consumir la API mediante `VITE_API_URL` y mostrar solo las rutas correspondientes al rol del usuario.
