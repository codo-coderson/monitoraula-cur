# MonitorAula

Aplicación web para gestionar y monitorear las visitas al WC de los alumnos.

## Características

- Gestión de clases y alumnos
- Registro de visitas al WC por horas
- Carga masiva de alumnos desde Excel
- Estadísticas de uso
- Interfaz responsive y moderna
- Actualización en tiempo real

## Requisitos

- Node.js 18 o superior
- npm 7 o superior
- Cuenta de Firebase con Realtime Database habilitada

## Configuración de Seguridad

1. Crea un archivo `.env` en la raíz del proyecto:
   ```bash
   cp .env.example .env
   ```

2. Configura las variables de entorno en el archivo `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
   VITE_FIREBASE_PROJECT_ID=your_project_id_here
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
   VITE_FIREBASE_APP_ID=your_app_id_here
   ```

3. **IMPORTANTE**: Nunca subas el archivo `.env` al repositorio. Está incluido en `.gitignore` por seguridad.

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/monitoraula.git
   cd monitoraula
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno como se describe arriba.

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. (Opcional) Inicializa la base de datos con datos de ejemplo:
   ```bash
   npm run init-db
   ```
   Este script crea algunas clases y alumnos de prueba y registra tres
   usuarios iniciales bajo el nodo `usuarios` de Firebase. Las claves de estos
   usuarios usan la dirección de correo sanitizada (reemplazando los puntos por
   guiones bajos) y cada entrada contiene `email` y `role`:

   ```json
   {
     "codocoderson_gmail_com": { "email": "codocoderson@gmail.com", "role": "admin" },
     "salvador_fernandez_gmail_com": { "email": "salvador.fernandez@gmail.com", "role": "admin" },
     "silvia_martinez_salesianas_org": { "email": "silvia.martinez@salesianas.org", "role": "profesor" }
   }
   ```

## Estructura del Proyecto

```
monitoraula/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── config/         # Configuración (Firebase, etc.)
│   ├── services/       # Servicios (Database, etc.)
│   ├── styles/         # Estilos CSS
│   ├── utils/          # Utilidades
│   ├── views/          # Vistas principales
│   └── main.js         # Punto de entrada
├── public/             # Archivos estáticos
└── index.html          # HTML principal
```

## Formato del Excel para Carga de Alumnos

El archivo Excel debe tener las siguientes columnas:

- `Alumno`: Nombre completo del alumno
- `Curso`: Identificador del curso

Ejemplo:
| Alumno | Curso |
|--------|-------|
| Juan Pérez | 1A |
| Ana García | 1A |
| Pedro López | 2B |

## Despliegue

La aplicación está diseñada para ser desplegada en cualquier hosting que soporte páginas web estáticas. Algunos ejemplos:

- Firebase Hosting
- GitHub Pages
- Netlify
- Vercel

Para construir la versión de producción:

```bash
npm run build
```

Los archivos generados estarán en la carpeta `dist/`.

## Seguridad

- Las credenciales de Firebase se manejan a través de variables de entorno
- Nunca comitear archivos `.env` o credenciales al repositorio
- Configurar reglas de seguridad adecuadas en Firebase Realtime Database
- Usar `.env.example` como plantilla para la configuración

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles. 