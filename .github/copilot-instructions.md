# Instrucciones para Agentes de IA en MonitorAula

Este documento proporciona pautas específicas para ayudar a los agentes de IA a ser productivos en el proyecto MonitorAula.

## Arquitectura del Proyecto

MonitorAula es una aplicación web para gestionar y monitorear las visitas al WC de los alumnos. La arquitectura del proyecto sigue una estructura modular y organizada:

- **Componentes Reutilizables**: `src/components/` contiene componentes como `AlumnoCard`, `Header` y `TabsNav`.
- **Servicios**: `src/services/` incluye lógica para interactuar con Firebase y manejar datos (e.g., `auth.js`, `database.js`).
- **Vistas**: `src/views/` contiene las vistas principales como `CargaAlumnosView`, `ClaseView` e `InformeView`.
- **Configuración**: `src/config/` gestiona la configuración de Firebase.
- **Estilos**: `src/styles/` contiene los estilos CSS.
- **Utilidades**: `src/utils/` incluye funciones auxiliares como manejo de fechas y generación de archivos Excel.

## Flujo de Datos

1. **Firebase como Backend**: La aplicación utiliza Firebase Realtime Database para almacenar y recuperar datos en tiempo real.
2. **Cálculo de Estadísticas**: Los datos de visitas se procesan en `database.js` para calcular métricas como promedios y días lectivos.
3. **Renderizado de Vistas**: Las vistas consumen servicios para mostrar datos procesados en componentes reutilizables.

## Convenciones del Proyecto

- **Variables de Entorno**: Configura las credenciales de Firebase en un archivo `.env` basado en `.env.example`. Nunca subas este archivo al repositorio.
- **Estilo de Código**: Sigue las prácticas de JavaScript moderno (ES6+). Usa `const` y `let` en lugar de `var`.
- **Componentes Reutilizables**: Diseña componentes en `src/components/` para ser independientes y reutilizables.
- **Reglas de Seguridad**: Configura reglas estrictas en Firebase Realtime Database para proteger los datos.

## Comandos Clave

- **Instalación de Dependencias**:
  ```bash
  npm install
  ```
- **Servidor de Desarrollo**:
  ```bash
  npm run dev
  ```
- **Construcción para Producción**:
  ```bash
  npm run build
  ```
- **Inicialización de la Base de Datos**:
  ```bash
  node scripts/init-db.js
  ```

## Puntos de Integración

- **Firebase**: Configurado en `src/config/firebase.js`. Asegúrate de usar las credenciales correctas.
- **Carga de Alumnos**: Implementado en `CargaAlumnosView.js` y soporta archivos Excel con formato específico.
- **Estadísticas**: Calculadas en `database.js` y renderizadas en `InformeView.js`.

## Ejemplo de Patrón

### Cálculo de Promedios

El cálculo de promedios considera todos los días lectivos:

```javascript
calcularMediaSalidasAlumno(clase, alumnoId) {
  const diasLectivos = this.getUltimosNDiasLectivos();
  if (diasLectivos.length === 0) return 0;

  const registrosAlumno = cache.registros[clase]?.[alumnoId] || {};
  const totalSalidas = diasLectivos.reduce((total, fecha) => {
    return total + (registrosAlumno[fecha]?.salidas?.length || 0);
  }, 0);

  return totalSalidas / diasLectivos.length;
}
```

## Seguridad

- **Reglas de Firebase**: Configura reglas de seguridad adecuadas en `database.rules.json`.
- **Credenciales**: Nunca subas credenciales al repositorio. Usa variables de entorno.

## Recursos Adicionales

- [Documentación de Firebase](https://firebase.google.com/docs)
- [Guía de Vite](https://vitejs.dev/guide/)
