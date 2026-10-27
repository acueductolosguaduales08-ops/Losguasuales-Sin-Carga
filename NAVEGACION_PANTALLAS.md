# Mapa de Navegación y Documentación de Pantallas
## Sistema de Gestión — Acueducto Los Guaduales

Este documento describe la arquitectura de navegación, pantallas, componentes interactivos, flujos de redirección y ventanas modales de la aplicación **Acueducto Los Guaduales**.

---

## Índice General

1. [Arquitectura Global de Navegación](#1-arquitectura-global-de-navegación)
   - [Header (Barra Superior y Menú Lateral Desplegable)](#11-header-barra-superior-y-menú-lateral)
   - [BottomNav (Barra Inferior Móvil)](#12-bottomnav-barra-inferior-móvil)
   - [Modales y Elementos Flotantes Globales](#13-modales-y-elementos-flotantes-globales)
2. [Pantallas Principales y Operativas](#2-pantallas-principales-y-operativas)
   - [0. Intro / Splash Screen](#pantalla-0-intro--splash-screen)
   - [1. Home / Comunidad (`/` y `/comunidad`)](#pantalla-1-home--comunidad--y-comunidad)
   - [2. Panel Operativo (`/panel` y `/` para Admin/Tesorero)](#pantalla-2-panel-operativo-panel)
   - [3. Directorio de Asociados (`/asociados`)](#pantalla-3-directorio-de-asociados-asociados)
   - [4. Gestión de Medidores (`/medidores`)](#pantalla-4-gestión-de-medidores-medidores)
   - [5. Lecturas y Consumo (`/lecturas`)](#pantalla-5-lecturas-y-consumo-lecturas)
   - [6. Facturación (`/facturacion`)](#pantalla-6-facturación-facturacion)
   - [7. Tesorería y Movimientos de Caja (`/tesoreria`)](#pantalla-7-tesorería-y-movimientos-de-caja-tesoreria)
   - [8. Recibos de Pago (`/recibos`)](#pantalla-8-recibos-de-pago-recibos)
   - [9. Períodos Contables (`/periodos-contables`)](#pantalla-9-períodos-contables-periodos-contables)
   - [10. Detalle de Período Contable (`/periodos-contables/:periodoId`)](#pantalla-10-detalle-de-período-contable-periodos-contablesperiodoid)
   - [11. Notas de Crédito (`/notas-credito`)](#pantalla-11-notas-de-crédito-notas-credito)
   - [12. Deudas y Cartera (`/deudas-cartera`)](#pantalla-12-deudas-y-cartera-deudas-cartera)
   - [13. Conciliación Bancaria (`/conciliacion`)](#pantalla-13-conciliación-bancaria-conciliacion)
   - [14. Informes y Reportes Financieros (`/informes`)](#pantalla-14-informes-y-reportes-financieros-informes)
   - [15. Panel de Control y Estadísticas (`/estadisticas`)](#pantalla-15-panel-de-control-y-estadísticas-estadisticas)
3. [Pantallas de Autoservicio del Asociado](#3-pantallas-de-autoservicio-del-asociado)
   - [16. Mi Consumo (`/mi-consumo`)](#pantalla-16-mi-consumo-mi-consumo)
   - [17. Mis Facturas (`/mis-facturas`)](#pantalla-17-mis-facturas-mis-facturas)
   - [18. Mis Multas (`/mis-multas`)](#pantalla-18-mis-multas-mis-multas)
   - [19. Mi Cuenta y Perfil (`/mi-cuenta`)](#pantalla-19-mi-cuenta-y-perfil-mi-cuenta)
4. [Pantallas Comunitarias y de Interacción](#4-pantallas-comunitarias-y-de-interacción)
   - [20. Encuestas Comunitarias (`/encuestas`)](#pantalla-20-encuestas-comunitarias-encuestas)
   - [21. Escanear Código QR (`/escanear-qr`)](#pantalla-21-escanear-código-qr-escanear-qr)
   - [22. Reportes de la Comunidad / Quejas y Fugas (`/reportes-comunidad`)](#pantalla-22-reportes-de-la-comunidad-reportes-comunidad)
   - [23. Chat Comunitario (`/chat`)](#pantalla-23-chat-comunitario-chat)
   - [24. Compartir Aplicación (`/compartir`)](#pantalla-24-compartir-aplicación-compartir)
   - [25. Centro de Ayuda (`/help`)](#pantalla-25-centro-de-ayuda-help)
5. [Pantallas de Administración y Sistema](#5-pantallas-de-administración-y-sistema)
   - [26. Crear Notificación (`/notificaciones/crear`)](#pantalla-26-crear-notificación-notificacionescrear)
   - [27. Bandeja de Notificaciones (`/notificaciones`)](#pantalla-27-bandeja-de-notificaciones-notificaciones)
   - [28. Configuración del Sistema (`/configuracion`)](#pantalla-28-configuración-del-sistema-configuracion)
   - [29. Auditoría del Sistema (`/auditoria`)](#pantalla-29-auditoría-del-sistema-auditoria)
   - [30. Datos Importantes / Eliminación Definitiva (`/datos-importantes`)](#pantalla-30-datos-importantes-datos-importantes)
6. [Pantallas Públicas y de Utilidad](#6-pantallas-públicas-y-de-utilidad)
   - [31. Documento Público de Factura y Recibo (`/factura/:numero` y `/recibo/:numero`)](#pantalla-31-documento-público-facturanumero-y-recibonumero)
   - [32. Recuperar Contraseña (`/recuperar`)](#pantalla-32-recuperar-contraseña-recuperar)
   - [33. Estado de la Conexión (`/servidor-despertando`)](#pantalla-33-estado-de-la-conexión-servidor-despertando)
   - [34. Pantalla 404 - No Encontrada (`*`)](#pantalla-34-pantalla-404-no-encontrada-)

---

## 1. Arquitectura Global de Navegación

### 1.1 Header (Barra Superior y Menú Lateral)
Presente en todas las vistas principales de la aplicación.
* **Componentes visuales y acciones:**
  * **Botón Hamburguesa (☰):** Alterna la apertura/cierre del menú lateral (Sidebar).
  * **Avatar del Usuario (`UserAvatar`):** Muestra la inicial o foto, color del rol y estado del servicio (Activo, Suspendido, Cortado). Al hacer clic redirige a `/mi-cuenta`.
  * **Título dinámico:** Muestra el nombre de la sección actual según la ruta.
  * **Selector de Modo Oscuro/Claro (☀️/🌙):** Conmuta el tema visual en tiempo real.
  * **Campana de Notificaciones (🔔):** Muestra un badge numérico con las notificaciones no leídas. Al hacer clic despliega el menú flotante `NotificationsBellDropdown`:
    * *Acción dentro del desplegable:* Ver lista previa de avisos y botón "Ver todas las notificaciones" que redirige a `/notificaciones`.
  * **Botón Iniciar Sesión / Salir:** Si no está autenticado, abre el modal global `LoginModal`. Si ya tiene sesión, ejecuta `logout()` y regresa al estado público.
* **Menú Lateral Desplegable (Sidebar):**
  * Agrupado por secciones de acuerdo con el rol del usuario:
    * **Día a día:** Panel operativo (`/panel`), Lecturas (`/lecturas`), Facturación (`/facturacion`), Tesorería (`/tesoreria`).
    * **Principal:** Inicio (`/`), Comunidad (`/comunidad`), Encuestas (`/encuestas`), Reportes de la comunidad (`/reportes-comunidad`), Compartir app (`/compartir`), Centro de ayuda (`/help`).
    * **Mi cuenta:** Mi consumo (`/mi-consumo`), Chat (`/chat`), Recibos (`/recibos`), Mis facturas (`/mis-facturas`), Mis multas (`/mis-multas`), Mi cuenta (`/mi-cuenta`).
    * **Gestión de asociados:** Asociados (`/asociados`), Medidores (`/medidores`).
    * **Facturación y pagos:** Períodos contables (`/periodos-contables`), Notas de crédito (`/notas-credito`), Deudas y cartera (`/deudas-cartera`), Conciliación bancaria (`/conciliacion`).
    * **Informes y reportes:** Informes (`/informes`), Panel de control / Estadísticas (`/estadisticas`), Auditoría (`/auditoria`).
    * **Administración:** Crear notificación (`/notificaciones/crear`), Configuración (`/configuracion`), Datos importantes (`/datos-importantes`).

---

### 1.2 BottomNav (Barra Inferior Móvil)
Barra fija inferior activa exclusivamente en pantallas móviles (`md:hidden`). Sus accesos cambian dinámicamente según el rol:
* **Rol ADMINISTRADOR:**
  * `Panel` (`/panel` - Link directo)
  * `Chat` (`/chat` - Link directo)
  * `Tesorería` (Desplegable flotante: Tesorería, Notas de crédito, Deudas y cartera, Conciliación bancaria, Informes, Recibos)
  * `Admin.` (Desplegable flotante: Lecturas y consumo, Facturación, Períodos contables, Configuración)
  * `Asociados` (Desplegable flotante: Mi cuenta, Asociados, Medidores)
  * `Estadísticas` (`/estadisticas` - Link directo)
  * `Más` (Desplegable flotante: Comunidad, Crear notificación, Auditoría, Datos importantes, Compartir app, Reportes, Encuestas, Centro de ayuda)
* **Rol TESORERO:**
  * Similar a Administrador, ocultando lecturas de consumo, auditoría y datos importantes.
* **Rol ASOCIADO:**
  * `Inicio` (`/`), `Mi consumo` (`/mi-consumo`), `Recibos` (`/recibos`), `Facturas` (`/mis-facturas`), `Multas` (`/mis-multas`), `Encuestas` (`/encuestas`), `Cuenta` (`/mi-cuenta`).
  * `Más` (Desplegable: Chat, Compartir app, Reportes comunidad, Escanear QR, Centro de ayuda).
* **Rol VISITANTE (Público general):**
  * `Inicio` (`/`), `Encuestas` (`/encuestas`).
  * `Más` (Desplegable: Reportes comunidad, Compartir app, Centro de ayuda, Iniciar sesión -> Abre `LoginModal`).

---

### 1.3 Modales y Elementos Flotantes Globales

#### Modal: `LoginModal`
* **Activador:** Botón "Iniciar sesión" del Header, enlaces en el BottomNav o accesos condicionales.
* **Contenido:**
  * **Onboarding ilustrado (`LoginOnboardingSlide`):** Si es la primera vez que el usuario abre el modal, presenta un carrusel táctil explicando beneficios: consultar saldo, ver recibos y reportar fugas. Botones "Siguiente" o deslizar con el dedo.
  * **Formulario de Credenciales:** Campo de Usuario / Cédula y campo de Contraseña.
  * **Botón "Iniciar Sesión":** Valida contra Supabase. Con éxito, actualiza el contexto de autenticación, cierra el modal y redirige al Panel si es Admin/Tesorero.
  * **Enlace "¿Olvidaste tu contraseña?":** Redirige a `/recuperar`.

#### Modal: `PendingDeletesModal`
* **Activador:** Operaciones offline pendientes en la cola que involucran eliminaciones de registros.
* **Función:** Solicita confirmación explícita al usuario antes de reintentar la eliminación física cuando la conexión vuelva.

#### Banner: `InstallBanner`
* **Función:** Detecta si la Progressive Web App (PWA) no está instalada y ofrece el botón directo de instalación en la pantalla de inicio del dispositivo.

#### Indicador: `OfflineBadge`
* **Función:** Etiqueta flotante que alerta visualmente cuando el dispositivo pierde conexión a internet o cuando hay sincronizaciones en cola.

---

## 2. Pantallas Principales y Operativas

---

### Pantalla 0: Intro / Splash Screen
* **Ruta:** Primera visita antes de cargar cualquier pantalla.
* **Acceso:** Todos los visitantes (controlado por `sessionStorage`).
* **Qué tiene la pantalla:**
  * Fondo animado con gradientes y efecto de blur.
  * Logotipo oficial con resplandor del Acueducto Los Guaduales.
  * Efecto mecanográfico dinámico escribiendo *"Acueducto Los Guaduales"*.
* **Qué hace y hacia dónde envía:**
  * Al terminar la animación de escritura (o al detectar reducción de movimiento), guarda la clave en `sessionStorage` y da paso fluido a la pantalla principal correspondiente (`/` o `/panel`).

---

### Pantalla 1: Home / Comunidad (`/` y `/comunidad`)
* **Ruta:** `/` (para Asociados y Visitantes) y `/comunidad` (para personal administrativo).
* **Acceso:** Público / Todos los roles.
* **Qué tiene la pantalla:**
  * **Hero Section:** Mensaje de bienvenida, estado del servicio del acueducto y fotografía de la sede o comunidad.
  * **Tarjetas Rápidas (`QueryCards`):** Acceso rápido a consulta de facturas, estado de cuentas y consejos de ahorro de agua.
  * **Galería Comunitaria (`GallerySection`):** Muro de fotografías de actividades, asambleas y mantenimientos, con visualización de reacciones por emojis.
  * **Sección de Videos (`VideosSection`):** Lista de tutoriales, informes y videos comunitarios (soporta enlaces de YouTube).
  * **Publicaciones y Comunicados (`PublicacionesSection`):** Noticias oficiales, mantenimientos programados y cortes del suministro.
  * **Widget Flotante de Encuestas (`SurveyFloat`):** Notificación visual que informa si hay encuestas activas. Al hacer clic redirige a `/encuestas`.
  * **Botón Flotante de Edición (`EditFab`):** Visible únicamente para usuarios con permisos de edición (Admin/Tesorero).
  * **Pie de Página (`WelcomeFooter`):** Datos de contacto, NIT, horarios de atención y enlaces institucionales.

#### Modales de la pantalla Home:
* **Modal `GalleryModal`:**
  * *Qué hace:* Visor de imágenes en pantalla completa. Permite avanzar o retroceder fotos, hacer zoom táctil, ver descripción y reaccionar con emojis.
* **Modal `PostModal`:**
  * *Qué hace:* Muestra el contenido completo, fecha y comentarios de un comunicado o noticia comunitaria seleccionada.
* **Modal `VideoPlayerModal`:**
  * *Qué hace:* Reproductor de video interactivo para visualizar el contenido audiovisual sin abandonar la página.
* **Modal `VideoEditorModal`:**
  * *Qué hace:* Formulario administrativo para agregar nuevos videos de YouTube o editar los existentes (título, URL, descripción).

---

### Pantalla 2: Panel Operativo (`/panel`)
* **Ruta:** `/panel` (y ruta `/` predeterminada para Administrador y Tesorero).
* **Acceso:** `ADMINISTRADOR` y `TESORERO`.
* **Qué tiene la pantalla:**
  * **Cabecera del Mes Contable:** Nombre del mes actual abierto, año, estado y cantidad de asociados activos. Botón "Actualizar".
  * **Barra de Acciones Rápidas:**
    * Botón "Nueva lectura" (Abre `LecturaFormModal`).
    * Botón "Generar facturas" (Abre `GenerarFacturacionModal` - solo Admin).
    * Botón "Cobrar" (Abre `RegistrarPagoModal`).
    * Botón "Ingreso" (Abre `RegistrarMovimientoModal` tipo ingreso).
    * Botón "Gasto" (Abre `RegistrarMovimientoModal` tipo gasto).
    * Botón "Multa" (Abre `RegistrarMultaModal`).
  * **Stepper del Ciclo Operativo Mensual (5 etapas):**
    1. *Lecturas:* Progreso de medidores leídos vs pendientes. Botón "Registrar" abre modal de lectura.
    2. *Facturas:* Facturas emitidas, pendientes y vencidas. Botón "Generar" o "Ver" redirige a `/facturacion`.
    3. *Recaudo:* Total cobrado vs meta porcentual. Botón "Cobrar" abre modal de pago.
    4. *Informe:* Estado del informe mensual. Botón "Abrir" abre `InformeMesModal`.
    5. *Cierre:* Estado de apertura/cierre del mes. Botón "Período" redirige a `/periodos-contables/:periodoId`.
  * **Caja del Día:** Total recaudado hoy, gastos del día, balance neto y conteo de movimientos.
  * **Actividad Reciente:** Lista de los últimos movimientos de caja con badges de color. Enlace "Ver todo" redirige a `/tesoreria`.
  * **Por Cobrar / Cartera Vencida:** Resumen de facturas vencidas y lista de principales deudores con:
    * Botón directo de **WhatsApp** con mensaje predeterminado de cobro.
    * Botón para registrar cobro directo (abre `RegistrarPagoModal`).
    * Enlace "Ver todo" redirige a `/deudas-cartera`.
  * **Grilla de Accesos Directos:** Botones para navegar a Asociados, Medidores, Lecturas, Facturación, Tesorería, Períodos, Recibos, Deudas, Conciliación, Informes, Panel de control, Notificaciones, Configuración, Auditoría y Comunidad.

#### Modales de la pantalla Panel:
* **Modal `AnioFormModal` / `MesFormModal`:** Para habilitar un nuevo año o mes de facturación si no hay ninguno abierto.
* **Modal `LecturaFormModal`:** Registro inmediato de consumo para un asociado.
* **Modal `GenerarFacturacionModal`:** Proceso de emisión masiva de facturación del mes.
* **Modal `RegistrarPagoModal`:** Registro de cobros a facturas o cuotas.
* **Modal `RegistrarMovimientoModal`:** Registro de ingresos extraordinarios o egresos/compras.
* **Modal `RegistrarMultaModal`:** Imposición de sanción pecuniaria a un asociado.
* **Modal `InformeMesModal`:** Resumen imprimible del estado de cuenta mensual.

---

### Pantalla 3: Directorio de Asociados (`/asociados`)
* **Ruta:** `/asociados`
* **Acceso:** `ADMINISTRADOR` y `TESORERO`.
* **Qué tiene la pantalla:**
  * Buscador en tiempo real por nombre, cédula o teléfono.
  * Filtro por estado: *Todos, Activos, Suspendidos, Inactivos*.
  * Botón **"Nuevo asociado"** (Abre `AsociadoFormModal`).
  * Botón **"Descargar CSV / Excel"** (`DownloadCsvButton`): Exporta todo el censo de usuarios.
  * Grilla de tarjetas de asociados (`AsociadoCard`): Muestra avatar, nombre, cédula, estado de servicio, medidor asignado y botones de acción.
  * Control de paginación (`Pagination`).

#### Modales de la pantalla Asociados:
* **Modal `AsociadoFormModal`:**
  * *Qué hace:* Formulario para registrar un nuevo asociado o editar uno existente (cédula, nombres, apellidos, teléfono, correo, dirección, sector, fecha de ingreso). Permite asignar medidor usando el submodal `SeleccionarMedidorModal`.
* **Modal `AsociadoEstadoModal`:**
  * *Qué hace:* Permite cambiar el estado administrativo del usuario (ACTIVO, SUSPENDIDO, INACTIVO) y especificar motivo.
* **Modal `AsociadoDetalleModal`:**
  * *Qué hace:* Muestra la ficha completa del asociado, información técnica del medidor y fechas de registro.
* **Modal `AsociadoFinanzasModal`:**
  * *Qué hace:* Muestra el consolidado de deuda, últimas facturas emitidas, historial de pagos y multas de ese asociado específico.
* **Modal `AsociadoArchivarModal`:**
  * *Qué hace:* Permite archivar a un asociado inactivo o restaurar uno archivado.

---

### Pantalla 4: Gestión de Medidores (`/medidores`)
* **Ruta:** `/medidores`
* **Acceso:** `ADMINISTRADOR` y `TESORERO`.
* **Qué tiene la pantalla:**
  * Buscador por número de serie, código interno, ubicación o nombre del asociado vinculado.
  * Botón **"Nuevo medidor"** (Abre `MedidorFormModal`).
  * Lista de tarjetas de medidores (`MedidorCard`): Número, marca, lectura actual, estado (Activo, Dañado, Retirado), asociado titular.
  * Paginación integrada.

#### Modales de la pantalla Medidores:
* **Modal `MedidorFormModal`:**
  * *Qué hace:* Registro o edición de medidores (número serial, marca, diámetro, fecha de instalación, lectura inicial).
* **Modal `MedidorEstadoModal`:**
  * *Qué hace:* Actualiza el estado técnico del contador (ACTIVO, DANADO, SUSPENDIDO, RETIRADO).
* **Modal `MedidorDetalleModal`:**
  * *Qué hace:* Ficha técnica completa del medidor, histórico de consumo registrado e identificación del asociado asignado.

---

### Pantalla 5: Lecturas y Consumo (`/lecturas`)
* **Ruta:** `/lecturas`
* **Acceso:** Exclusivo `ADMINISTRADOR`.
* **Qué tiene la pantalla:**
  * Selector en cascada de **Año Contable** y **Mes Contable**.
  * Barra de progreso de toma de lecturas (medidores leídos vs faltantes).
  * Buscador rápido de predio o asociado.
  * Botón **"Registrar lectura"** (Abre `LecturaFormModal`).
  * Botón **"Simulador de consumo"** (Abre `CalculadoraConsumoModal`).
  * Botón **"Ir a facturación"**: Redirige a `/facturacion`.
  * Tarjetas de lecturas (`LecturaCard`): Lectura anterior, lectura actual, consumo en m³, anomalías detectadas y botón individual **"Generar factura"** que crea la factura de forma instantánea.

#### Modales de la pantalla Lecturas:
* **Modal `LecturaFormModal`:**
  * *Qué hace:* Formulario para ingresar la lectura actual de un contador. Permite buscar el medidor mediante `MedidorPicker`, calcula en tiempo real el consumo en m³, advierte consumos atípicos y permite adjuntar observaciones o fotografías.
* **Modal `LecturaHistorialModal`:**
  * *Qué hace:* Despliega la gráfica y tabla de lecturas históricas del medidor seleccionado para verificar tendencias.
* **Modal `CalculadoraConsumoModal`:**
  * *Qué hace:* Herramienta interactiva para calcular el valor monetario a cobrar según metros cúbicos ingresados, dividiendo por rangos (Básico, Complementario y Suntuario).

---

### Pantalla 6: Facturación (`/facturacion`)
* **Ruta:** `/facturacion`
* **Acceso:** `ADMINISTRADOR` y `TESORERO`.
* **Qué tiene la pantalla:**
  * **Pestañas de navegación:**
    1. *Por estado:* Filtros rápidos (Pendientes, Pago parcial, Pagadas, Vencidas, Anuladas).
    2. *Historial completo:* Todas las facturas del sistema.
    3. *Por asociado:* Buscador con autocompletado para consultar el historial de facturación de un usuario puntual.
  * Botón **"Generar lote"** (Abre `GenerarFacturacionModal` - Administrador).
  * Botón **"Exportar a Excel / CSV"** (`DownloadCsvButton`).
  * Listado de facturas (`FacturaCard`): Número de factura, período, asociado, valor total, saldo pendiente, estado y menú de acciones por factura.

#### Modales de la pantalla Facturación:
* **Modal `FacturaDetalleModal`:**
  * *Qué hace:* Desglose pormenorizado de la factura: consumo básico, complementario, cargo fijo, conceptos adicionales, historial de abonos recibidos, código QR de verificación y botón para imprimir/descargar PDF.
* **Modal `GenerarFacturacionModal`:**
  * *Qué hace:* Asistente de emisión masiva de facturación para el mes seleccionado con base en las lecturas cargadas.
* **Modal `ConceptoAdicionalModal`:**
  * *Qué hace:* Permite agregar cobros extras a una factura antes de su cobro (multas por inasistencia, reconexión, materiales, recargos).
* **Modal `AnularFacturaModal`:**
  * *Qué hace:* Anula una factura emitida erróneamente solicitando un motivo formal.
* **Modal `NotificarModal`:**
  * *Qué hace:* Envío de la factura al asociado a través de mensaje de WhatsApp con enlace directo, SMS o correo electrónico.
* **Modal `HistorialNotificacionesModal`:**
  * *Qué hace:* Registro de auditoría de los avisos y recordatorios de cobro enviados al asociado.

---

### Pantalla 7: Tesorería y Movimientos de Caja (`/tesoreria`)
* **Ruta:** `/tesoreria`
* **Acceso:** `ADMINISTRADOR` y `TESORERO`.
* **Qué tiene la pantalla:**
  * **Tarjetas KPI principales:** Saldo en Caja/Bancos, Total Ingresos del mes, Total Gastos/Egresos del mes, Meta de recaudación mensual con barra de porcentaje.
  * **Botonera de Operaciones de Caja:**
    * Botón **"Registrar Cobro"**: Abre `RegistrarPagoModal`.
    * Botón **"Nuevo Ingreso"**: Abre `RegistrarMovimientoModal` en modo ingreso.
    * Botón **"Nuevo Gasto"**: Abre `RegistrarMovimientoModal` en modo gasto.
    * Botón **"Registrar Multa"**: Abre `RegistrarMultaModal`.
    * Botón **"Consultar Multas"**: Abre `MultasAsociadoModal`.
    * Botón **"Escanear Factura QR"**: Redirige a `/escanear-qr?origin=tesoreria`.
  * **Filtros por pestaña:** *Todos los movimientos, Solo Entradas, Solo Salidas*.
  * **Tabla / Lista de Movimientos (`MovimientoRow`):** Concepto, categoría, método de pago (Efectivo, Nequi, Daviplata, Banco), valor, fecha y usuario responsable.
  * Botón de exportación a Excel / CSV.

#### Modales de la pantalla Tesorería:
* **Modal `RegistrarPagoModal`:**
  * *Qué hace:* Registra abonos o pagos totales de facturas. Incluye selector de asociado (`AsociadoPickerConFiltros`), desglose de facturas pendientes con selección múltiple, selección de método de pago y generación inmediata de recibo de caja.
* **Modal `RegistrarMovimientoModal`:**
  * *Qué hace:* Formulario para asentar entradas de dinero extraordinarias o compras/gastos operativos (mantenimiento, papelería, químicos, fontanería).
* **Modal `RegistrarMultaModal`:**
  * *Qué hace:* Asigna una multa económica a un asociado especificando concepto, monto y plazo.
* **Modal `MultasAsociadoModal`:**
  * *Qué hace:* Permite consultar y gestionar el estado de las multas de un asociado en particular.
* **Modal `AnularMovimientoModal`:**
  * *Qué hace:* Permite anular un movimiento contable erróneo registrando el motivo.
* **Modal `MovimientoReciboModal`:**
  * *Qué hace:* Vista previa e impresión del comprobante de ingreso/egreso.

---

### Pantalla 8: Recibos de Pago (`/recibos`)
* **Ruta:** `/recibos`
* **Acceso:** `ADMINISTRADOR`, `TESORERO` y `ASOCIADO`.
* **Qué tiene la pantalla:**
  * Pestañas según rol: *Todos los recibos, Por asociado, Búsqueda directa por número*.
  * Filtro especial "Solo multas".
  * Buscador rápido por número de recibo o nombre.
  * Tarjetas de recibos (`ReciboCard`): Número consecutivo (REC-XXXXXX), valor pagado, método de pago, fecha, detalle de facturas pagadas y botón para **Descargar PDF** o **Abrir enlace público**.
  * Botón "Exportar a CSV".

#### Modales de la pantalla Recibos:
* **Modal `NotificarModal`:** Permite compartir el comprobante de pago por WhatsApp o correo al titular.
* **Modal `HistorialNotificacionesModal`:** Muestra cuándo y por qué canal fue enviado el recibo.

---

### Pantalla 9: Períodos Contables (`/periodos-contables`)
* **Ruta:** `/periodos-contables`
* **Acceso:** `ADMINISTRADOR` y `TESORERO`.
* **Qué tiene la pantalla:**
  * Selector de Años Fiscales con botón **"Nuevo año"** (Abre `AnioFormModal`).
  * Indicadores anuales: Total facturado en el año, Total recaudado, Saldo de cartera.
  * Botón **"Nuevo mes contable"** (Abre `MesFormModal`).
  * Filtro por estado: *Todos, Abierto, Cerrado*.
  * Grilla de Meses Contables: Tarjetas con nombre del mes, estado (ABIERTO, CERRADO, REABIERTO), cantidad de facturas generadas y monto total.
  * **Navegación:** Al hacer clic en un mes, redirige a la vista detallada `/periodos-contables/:periodoId`.

#### Modales de la pantalla Períodos Contables:
* **Modal `AnioFormModal`:** Formulario para crear un nuevo año fiscal en el sistema.
* **Modal `MesFormModal`:** Formulario para habilitar un nuevo mes operativo (ej. Octubre 2026), definiendo fechas de lectura y vencimiento.
* **Modal `MesDetalleModal`:** Resumen rápido de datos operativos del mes.
* **Modal `ReabrirMesModal`:** Permite reabrir un período cerrado con justificación escrita para auditoría.

---

### Pantalla 10: Detalle de Período Contable (`/periodos-contables/:periodoId`)
* **Ruta:** `/periodos-contables/:periodoId`
* **Acceso:** `ADMINISTRADOR` y `TESORERO`.
* **Qué tiene la pantalla:**
  * Botón superior "Volver a períodos contables": Redirige a `/periodos-contables`.
  * Cabecera con mes, año y estado actual del período.
  * Tarjetas de métricas consolidadas: Total facturado, Total recaudado, Cartera pendiente del mes, Volumen de agua medido (m³).
  * Botón **"Imprimir lote de facturas"**: Abre una ventana de impresión con todas las facturas del mes compiladas listas para impresión física.
  * Botón **"Cerrar período contable"** / **"Reabrir período"**: Bloquea o desbloquea las operaciones del mes para garantizar la integridad contable.
  * Accesos rápidos para navegar a las facturas o lecturas filtradas de este período puntual.

---

### Pantalla 11: Notas de Crédito (`/notas-credito`)
* **Ruta:** `/notas-credito`
* **Acceso:** `ADMINISTRADOR` y `TESORERO`.
* **Qué tiene la pantalla:**
  * Buscador por número de nota, número de factura o asociado.
  * Filtro por estado: *Emitida, Aplicada, Anulada*.
  * Botón **"Nueva nota de crédito"**: Abre el modal de creación.
  * Botón **"Exportar a Excel / CSV"**.
  * Tabla de notas: Número de nota, factura afectada, valor del descuento o ajuste, fecha, motivo y estado.
  * Botón de acción **"Aplicar"**: Descuenta de inmediato el saldo a la factura indicada (con confirmación del navegador).
  * Botón de acción **"Anular"**: Solicita motivo y anula la nota de crédito.

#### Modales de la pantalla Notas de Crédito:
* **Modal `SimpleModal` (Crear Nota de Crédito):**
  * *Qué hace:* Formulario para emitir una nota crédito seleccionando factura de origen, monto a favor del usuario y justificación contable (ej. cobro indebido o error de medición).

---

### Pantalla 12: Deudas y Cartera (`/deudas-cartera`)
* **Ruta:** `/deudas-cartera`
* **Acceso:** `ADMINISTRADOR` y `TESORERO`.
* **Qué tiene la pantalla:**
  * **Tarjetas de Cartera:** Saldo Total en Cartera, Saldo Vencido, Asociados en Mora, Antigüedad Promedio.
  * **Gráfico de Envejecimiento de Saldos (Aging):** Barras visuales clasificadas en: *Vigente, 1-30 días, 31-60 días, 61-90 días, Más de 90 días*.
  * Resumen estadístico de sanciones y multas no pagadas.
  * Buscador y filtros por rango de envejecimiento.
  * **Listado de Deudores:** Nombre del asociado, teléfono, factura vencida, saldo pendiente y días de mora.
  * **Botón directo de WhatsApp:** Abre chat con mensaje automático redactado con nombre, saldo y días de mora.
  * Botón "Exportar a CSV".

---

### Pantalla 13: Conciliación Bancaria (`/conciliacion`)
* **Ruta:** `/conciliacion`
* **Acceso:** `ADMINISTRADOR` y `TESORERO`.
* **Qué tiene la pantalla:**
  * **Panel de Carga:** Input de archivo para importar extractos bancarios en formato CSV.
  * **Resumen de Conciliación:** Total en extracto vs total en sistema, diferencia no conciliada y porcentaje de coincidencia.
  * Tabla interactiva de movimientos bancarios: Fecha, descripción del banco, referencia, valor y estado de conciliación.
  * Acciones por fila: Botón para conciliar manualmente contra un movimiento del sistema, desconciliar o ignorar fila.
  * Exportación de informe a CSV.

---

### Pantalla 14: Informes y Reportes Financieros (`/informes`)
* **Ruta:** `/informes`
* **Acceso:** `ADMINISTRADOR` y `TESORERO`.
* **Qué tiene la pantalla:**
  * Navegación por pestañas superiores:
    1. **Informe Mensual (`InformeMensualPanel`):** Selector de mes, cuadro de pérdidas y ganancias, ingresos por tarifa, recaudo de cartera, balance neto y botón para generar documento PDF / impresión.
    2. **Informe Anual (`InformeAnualPanel`):** Resumen de los 12 meses del año en tabla comparativa, acumulado anual de ingresos vs egresos.
    3. **Informe por Asociado (`InformeAsociadoPanel`):** Estado de cuenta individual: histórico de consumos, facturas pagadas, saldos vigentes y gráfica de comportamiento.
    4. **Listado de Asociados (`ListadoAsociadosPanel`):** Padrón consolidado para control de asambleas generales con filtros y exportación.

---

### Pantalla 15: Panel de Control y Estadísticas (`/estadisticas`)
* **Ruta:** `/estadisticas`
* **Acceso:** `ADMINISTRADOR` y `TESORERO`.
* **Qué tiene la pantalla:**
  * **Gráficas Interactivas con Recharts:**
    * Gráfica de área: Histórico comparativo de Ingresos vs Gastos.
    * Gráfica circular (PieChart): Distribución del estado de la facturación (Pagadas, Pendientes, Vencidas).
  * **Tarjetas de Estadísticas Clave:**
    * Asociados activos y suspendidos.
    * Facturas pendientes y recaudadas.
    * Saldo global de cartera.
    * Balance financiero del mes en curso.
    * Encuestas comunitarias en curso.
  * Barras de progreso de eficiencia de cobro y recaudo.

---

## 3. Pantallas de Autoservicio del Asociado

---

### Pantalla 16: Mi Consumo (`/mi-consumo`)
* **Ruta:** `/mi-consumo`
* **Acceso:** Exclusivo para usuarios con rol `ASOCIADO`.
* **Qué tiene la pantalla:**
  * Mensaje personalizado con número de medidor asignado.
  * **Tarjetas de Métricas de Consumo:**
    * Promedio mensual de metros cúbicos (m³).
    * Mes con mayor consumo registrado.
    * Mes con menor consumo registrado.
    * Acumulado total consumido en el año.
  * **Gráfica de Barras:** Evolución del consumo mes a mes para detectar variaciones o posibles fugas internas.
  * **Tabla Histórica de Lecturas:** Fecha de lectura, lectura anterior, lectura actual, consumo resultante en m³ y estado del medidor.

---

### Pantalla 17: Mis Facturas (`/mis-facturas`)
* **Ruta:** `/mis-facturas`
* **Acceso:** Exclusivo para `ASOCIADO`.
* **Qué tiene la pantalla:**
  * Indicador destacado con el saldo actual pendiente por pagar.
  * Listado de tarjetas de facturas del usuario (`FacturaCard`):
    * Estado de pago (Pendiente, Pagada, Vencida).
    * Fechas de emisión y vencimiento.
    * Metros cúbicos facturados.
    * Botón **"Ver detalle"** (Abre `FacturaDetalleModal`).
    * Botón **"Descargar PDF"** (Abre vista de impresión / descarga oficial).

---

### Pantalla 18: Mis Multas (`/mis-multas`)
* **Ruta:** `/mis-multas`
* **Acceso:** Exclusivo para `ASOCIADO`.
* **Qué tiene la pantalla:**
  * Resumen de sanciones asociadas al predio.
  * Filtros por estado: *Todas, Pendientes, Pagadas, Anuladas*.
  * Buscador por concepto o número.
  * Tarjetas de multas: Motivo de la infracción (ej. inasistencia a minga o daño a tubería), fecha, monto asignado, fecha de límite de pago y estado.
  * Botón para abrir el comprobante de pago o recibo asociado si la multa ya fue cancelada.

#### Modales de la pantalla Mis Multas:
* **Modal `MultaDetalleModal`:** Ficha completa con la resolución o detalle del cobro de la sanción.

---

### Pantalla 19: Mi Cuenta y Perfil (`/mi-cuenta`)
* **Ruta:** `/mi-cuenta`
* **Acceso:** Autenticados (`ASOCIADO`, `TESORERO`, `ADMINISTRADOR`).
* **Qué tiene la pantalla:**
  * Cabecera con avatar, nombre de usuario, rol institucional y badge de estado del servicio de agua.
  * Ficha de datos personales: Correo electrónico, teléfono, dirección, sector y código de medidor.
  * **Opciones de Configuración Personal:**
    * **"Editar perfil"**: Abre `EditarPerfilModal` para actualizar teléfono y datos de contacto.
    * **"Cambiar contraseña"**: Abre `CambiarPasswordForm`.
    * **"Crear nueva cuenta de usuario"** (Visible para Admin/Tesorero): Abre `CrearUsuarioForm`.
    * **"Gestión de usuarios y accesos"** (Visible para Administrador): Abre `ListadoUsuariosModal`.
    * **Preferencia de Navegación Móvil:** Interruptor (`Toggle`) para habilitar o deshabilitar la barra inferior `BottomNav`.
    * **"Limpiar datos locales y caché"**: Botón de mantenimiento para vaciar datos offline y forzar actualización de sincronizaciones.

#### Modales de la pantalla Mi Cuenta:
* **Modal `EditarPerfilModal`:** Formulario para modificar números telefónicos y datos básicos.
* **Modal `CambiarPasswordForm`:** Permite ingresar contraseña anterior y definir una nueva clave segura.
* **Modal `CrearUsuarioForm`:** Permite a la administración crear credenciales de acceso para nuevos asociados o funcionarios.
* **Modal `ListadoUsuariosModal`:** Directorio de usuarios del sistema con opción de bloquear/desbloquear accesos mediante `BloqueoUsuarioModal`.

---

## 4. Pantallas Comunitarias y de Interacción

---

### Pantalla 20: Encuestas Comunitarias (`/encuestas`)
* **Ruta:** `/encuestas` (acepta parámetro opcional `?codigo=XXXX` para abrir una directamente).
* **Acceso:** Público general y Asociados (para responder); Administradores (para gestionar).
* **Qué tiene la pantalla:**
  * **Pestañas:**
    * *Encuestas públicas:* Formularios disponibles para responder por la comunidad.
    * *Gestión administrativa:* Muestra las encuestas creadas con estadísticas y control de vigencia.
  * Botón **"Nueva encuesta"** (Abre `EncuestaCrearModal` - Admin).
  * Tarjetas de encuestas (`EncuestaPublicCard` / `EncuestaAdminCard`): Título, descripción, fecha de expiración, estado (Activa / Finalizada).

#### Modales de la pantalla Encuestas:
* **Modal `EncuestaResponderModal`:**
  * *Qué hace:* Formulario interactivo donde el asociado o residente responde las preguntas (selección única, opción múltiple o respuestas abiertas de texto).
* **Modal `EncuestaStatsModal`:**
  * *Qué hace:* Presenta gráficas de resultados, porcentajes y total de votos acumulados en tiempo real.
* **Modal `EncuestaRespuestasModal`:**
  * *Qué hace:* Permite a la administración auditar el listado de respuestas individuales emitidas.
* **Modal `EncuestaPreguntasModal`:**
  * *Qué hace:* Permite añadir, editar el orden o eliminar preguntas de un formulario.
* **Modal `EncuestaQrModal`:**
  * *Qué hace:* Genera el código QR de la encuesta para imprimirlo en carteleras físicas o compartirlo en redes sociales.

---

### Pantalla 21: Escanear Código QR (`/escanear-qr`)
* **Ruta:** `/escanear-qr` (acepta parámetro opcional `?origin=tesoreria`).
* **Acceso:** Público y Asociados.
* **Qué tiene la pantalla:**
  * Visor de cámara en vivo para escanear códigos QR generados por el sistema (cámara frontal / trasera alternable).
  * Notificación de permisos de cámara requeridos.
* **Hacia dónde redirige:**
  * Si el código QR pertenece a una **Factura**: Redirige a `/factura/:numero` (o a `/tesoreria` para cobro inmediato si venía desde Tesorería).
  * Si el código QR pertenece a un **Recibo**: Redirige a `/recibo/:numero`.
  * Si el código QR pertenece a una **Encuesta**: Redirige a `/encuestas?codigo=:codigo`.

---

### Pantalla 22: Reportes de la Comunidad (`/reportes-comunidad`)
* **Ruta:** `/reportes-comunidad`
* **Acceso:** Público y Asociados (crean reportes); Administradores/Tesoreros (administran la bandeja).
* **Qué tiene la pantalla:**
  * **Modo Ciudadano / Formulario Público:**
    * Campos: Nombre de quien reporta, teléfono de contacto, descripción detallada del problema (daño en tubería, fuga en vía, falta de presión).
    * Subida de imagen / fotografía (`ImageUploader`).
    * Botón **"Enviar reporte"**: Se registra en el sistema y notifica al personal.
  * **Modo Administrativo (Bandeja de Reportes):**
    * Pestañas: *Pendientes* y *Atendidos*.
    * Listado de tarjetas de reportes: Fecha, contacto, descripción, fotografía adjunta ampliable.
    * Botón "Marcar como Atendido".
    * Botón "Eliminar reporte" (Abre modal de confirmación `ConfirmDialog`).

---

### Pantalla 23: Chat Comunitario (`/chat`)
* **Ruta:** `/chat`
* **Acceso:** Usuarios autenticados (`ASOCIADO`, `TESORERO`, `ADMINISTRADOR`).
* **Qué tiene la pantalla:**
  * Modal/Términos iniciales: `ChatCondiciones` (se acepta en la primera entrada).
  * Panel izquierdo: Buscador de chats, lista de conversaciones activas con último mensaje, fecha y badge de mensajes no leídos.
  * Botón **"Nuevo mensaje"**: Abre `NuevoChatModal` para buscar un usuario o funcionario e iniciar conversación.
  * Botón para eliminar historial de conversación local.
  * Panel derecho / Conversación activa (`ConversacionChat`):
    * Historial de mensajes en burbujas organizadas cronológicamente.
    * Soporte offline con base de datos local IndexedDB (`chatDB`).
    * Campo de entrada de texto y botón de envío.
    * Alertas y notificaciones push del sistema ante mensajes entrantes.

---

### Pantalla 24: Compartir Aplicación (`/compartir`)
* **Ruta:** `/compartir`
* **Acceso:** Público / Todos los roles.
* **Qué tiene la pantalla:**
  * Código QR generado en tiempo real que apunta al dominio de la aplicación.
  * Botón **"Descargar QR en imagen"**: Descarga el archivo PNG para impresión.
  * Campo con la dirección web de la app y botón **"Copiar enlace"** al portapapeles.
  * Botón **"Compartir por WhatsApp"**: Abre WhatsApp con mensaje prediseñado recomendando la plataforma.

---

### Pantalla 25: Centro de Ayuda (`/help`)
* **Ruta:** `/help`
* **Acceso:** Público y todos los roles.
* **Qué tiene la pantalla:**
  * Selector de rol para adaptar los tutoriales: *Público, Asociado, Tesorero, Administrador*.
  * Buscador temático de preguntas y guías paso a paso.
  * Componentes interactivos de demostración visual (`HelpVisual`): Muestra interfaces simuladas en miniatura de botones, formularios, facturas y tarjetas para enseñar a interactuar con la plataforma sin modificar datos reales.
  * Secciones colapsables con guías sobre cómo pagar, cómo reportar una fuga, cómo leer el contador y cómo descargar recibos.

---

## 5. Pantallas de Administración y Sistema

---

### Pantalla 26: Crear Notificación (`/notificaciones/crear`)
* **Ruta:** `/notificaciones/crear`
* **Acceso:** `ADMINISTRADOR` y `TESORERO`.
* **Qué tiene la pantalla:**
  * **Pestaña 1: Notificación General del Sistema:**
    * Tipo de notificación: *Pública (para todos), Privada (asociado puntual), Interna (administrativa)*.
    * Nivel de prioridad: *Baja, Normal, Media, Alta, Urgente*.
    * Campos: Título, resumen corto, contenido completo, enlace web de redirección, fecha de publicación y vencimiento.
    * Interruptor para enviar notificación emergente del sistema/navegador.
    * Asistente con plantillas rápidas de aviso comunitario.
    * Botón "Publicar notificación".
  * **Pestaña 2: Aviso de Tesorería (Recaudo de pagos):**
    * Interruptor de disponibilidad del tesorero (Activo / Recibiendo pagos).
    * Motivo de no recaudación en caso de ausencia.
    * Horarios y fechas de atención presencial para pagos de facturas.
    * Instrucciones especiales de consignación o transferencia.

---

### Pantalla 27: Bandeja de Notificaciones (`/notificaciones`)
* **Ruta:** `/notificaciones`
* **Acceso:** Todos los roles.
* **Qué tiene la pantalla:**
  * Pestañas: *Públicas* vs *Mis notificaciones privadas*.
  * Filtros por prioridad: *Todas, No leídas, Urgentes, Alta, Media, Normal, Baja*.
  * Buscador por texto.
  * Lista de avisos con tarjetas indicadoras de color según prioridad.
  * Botón "Marcar todas como leídas".
  * Al hacer clic sobre cualquier notificación se abre el modal de detalle `NotificationDetailModal`.

#### Modales de la pantalla Notificaciones:
* **Modal `NotificationDetailModal`:**
  * *Qué hace:* Presenta el mensaje completo, la fecha oficial de emisión, emisor y botón para ir al enlace adjunto si aplica.

---

### Pantalla 28: Configuración del Sistema (`/configuracion`)
* **Ruta:** `/configuracion`
* **Acceso:** `ADMINISTRADOR` y `TESORERO`.
* **Qué tiene la pantalla:**
  * **Pestaña 1: General y Tarifas (`ConfiguracionGeneralForm` - Admin):**
    * Datos institucionales: Razón social, NIT, teléfono, dirección, correo, logo y firma digital autorizada.
    * Parámetros de tarifas: Cargo fijo, tarifa m³ básico, complementario, suntuario, recargo por mora y valor de reconexión.
  * **Pestaña 2: Hero de Inicio (`HeroPanel` - Admin):**
    * Configuración de textos principales, imágenes de fondo y botones del encabezado de la página Home.
  * **Pestaña 3: Métodos de Pago (`MetodosPagoPanel` - Admin y Tesorero):**
    * Habilitación de efectivo, cuentas de ahorro bancarias, Daviplata, Nequi e instrucciones de pago para los asociados.
  * **Pestaña 4: Archivos Institucionales (`ArchivosInstitucionalesPanel` - Admin):**
    * Repositorio de documentos oficiales descargables: Estatutos del acueducto, reglamento interno y normativas en formato PDF.

---

### Pantalla 29: Auditoría del Sistema (`/auditoria`)
* **Ruta:** `/auditoria`
* **Acceso:** Exclusivo `ADMINISTRADOR`.
* **Qué tiene la pantalla:**
  * Interruptor para activar o desactivar el registro de trazabilidad en la base de datos (requiere confirmación por modal ingresando el nombre de usuario administrador).
  * Buscador y filtros por módulo operativo o por usuario.
  * Tabla cronológica de auditoría: Fecha y hora exacta, usuario responsable, módulo afectado, acción realizada (Creación, Modificación, Eliminación, Cierre) y dirección IP.
  * Paginación de registros.
  * Al hacer clic en un registro se abre el modal `SimpleModal` mostrando la carga técnica detallada del cambio antes y después.

---

### Pantalla 30: Datos Importantes / Eliminación Definitiva (`/datos-importantes`)
* **Ruta:** `/datos-importantes`
* **Acceso:** Exclusivo `ADMINISTRADOR`.
* **Qué tiene la pantalla:**
  * Selector del tipo de entidad a purgar: *Asociados, Medidores, Lecturas, Facturas, Pagos, Movimientos de tesorería, Años contables, Meses contables, Encuestas, etc.*
  * Buscador específico del registro que se desea depurar.
  * **Panel de Verificación de Impacto en Cascada:** Analiza la base de datos y advierte detalladamente qué otros registros dependientes se verán afectados o eliminados (ej. borrar un mes contable afectará todas las lecturas y facturas asociadas a él).
  * **Barrera de Seguridad:** Campo obligatorio de confirmación que exige ingresar la contraseña personal del administrador para ejecutar el borrado irreversible.

---

## 6. Pantallas Públicas y de Utilidad

---

### Pantalla 31: Documento Público (`/factura/:numero` y `/recibo/:numero`)
* **Ruta:** `/factura/:numero` y `/recibo/:numero` (acepta número consecutivo o token criptográfico compartido).
* **Acceso:** Público / No requiere iniciar sesión.
* **Qué tiene la pantalla:**
  * Renderizado web exacto del documento oficial (Factura de Servicios Públicos o Recibo Oficial de Caja).
  * Encabezado institucional, NIT, datos del titular, consumos, liquidación de cobro y código de barras/QR de verificación.
  * Botón superior para **Imprimir o Guardar como PDF**.
  * Enlace para volver a la página principal del acueducto.

---

### Pantalla 32: Recuperar Contraseña (`/recuperar`)
* **Ruta:** `/recuperar`
* **Acceso:** Público.
* **Qué tiene la pantalla:**
  * **Fase 1 (Solicitud):** Campo para ingresar el correo electrónico registrado y botón "Enviar enlace de recuperación".
  * **Fase 2 (Establecer nueva contraseña):** Al ingresar mediante el enlace seguro enviado al correo, muestra los campos de "Nueva contraseña" y "Confirmar contraseña". Al guardar con éxito, permite iniciar sesión de inmediato.

---

### Pantalla 33: Estado de la Conexión (`/servidor-despertando`)
* **Ruta:** `/servidor-despertando`
* **Acceso:** Público.
* **Qué tiene la pantalla:**
  * Tarjetas informativas sobre la arquitectura de la app (comunicación directa con Supabase, almacenamiento local y ausencia de intermediarios).
  * Consejos de resolución de problemas de red o fallas de conectividad.
  * Botón para regresar a la página anterior.

---

### Pantalla 34: Pantalla 404 - No Encontrada (`*`)
* **Ruta:** Cualquier ruta no mapeada en el enrutador.
* **Acceso:** Público.
* **Qué tiene la pantalla:**
  * Gráfico ilustrativo de ruta inexistente.
  * Mensaje claro indicando que la página solicitada no existe o fue movida.
  * Botón destacado **"Volver al inicio"**: Redirige a `/`.

---

## Resumen Matricial de Acceso por Roles

| Pantalla / Módulo | Ruta | Público | Asociado | Tesorero | Administrador |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Inicio / Comunidad** | `/` o `/comunidad` | Sí | Sí | Sí | Sí |
| **Panel Operativo** | `/panel` | No | No | Sí | Sí |
| **Directorio de Asociados** | `/asociados` | No | No | Sí | Sí |
| **Medidores** | `/medidores` | No | No | Sí | Sí |
| **Lecturas y Consumo** | `/lecturas` | No | No | No | Sí |
| **Facturación** | `/facturacion` | No | No | Sí | Sí |
| **Tesorería y Caja** | `/tesoreria` | No | No | Sí | Sí |
| **Recibos de Pago** | `/recibos` | No | Sí | Sí | Sí |
| **Períodos Contables** | `/periodos-contables` | No | No | Sí | Sí |
| **Detalle de Período** | `/periodos-contables/:id` | No | No | Sí | Sí |
| **Notas de Crédito** | `/notas-credito` | No | No | Sí | Sí |
| **Deudas y Cartera** | `/deudas-cartera` | No | No | Sí | Sí |
| **Conciliación Bancaria** | `/conciliacion` | No | No | Sí | Sí |
| **Informes y Reportes** | `/informes` | No | No | Sí | Sí |
| **Panel de Control / Estadísticas** | `/estadisticas` | No | No | Sí | Sí |
| **Mi Consumo** | `/mi-consumo` | No | Sí | No | No |
| **Mis Facturas** | `/mis-facturas` | No | Sí | No | No |
| **Mis Multas** | `/mis-multas` | No | Sí | No | No |
| **Mi Cuenta y Perfil** | `/mi-cuenta` | No | Sí | Sí | Sí |
| **Encuestas Comunitarias** | `/encuestas` | Sí | Sí | Sí | Sí |
| **Escanear QR** | `/escanear-qr` | Sí | Sí | Sí | Sí |
| **Reportes de la Comunidad** | `/reportes-comunidad` | Sí | Sí | Sí | Sí |
| **Chat Comunitario** | `/chat` | No | Sí | Sí | Sí |
| **Compartir App** | `/compartir` | Sí | Sí | Sí | Sí |
| **Centro de Ayuda** | `/help` | Sí | Sí | Sí | Sí |
| **Crear Notificación** | `/notificaciones/crear` | No | No | Sí | Sí |
| **Bandeja de Notificaciones** | `/notificaciones` | Sí | Sí | Sí | Sí |
| **Configuración** | `/configuracion` | No | No | Sí | Sí |
| **Auditoría** | `/auditoria` | No | No | No | Sí |
| **Datos Importantes** | `/datos-importantes` | No | No | No | Sí |
| **Documento Público** | `/factura/:num` / `/recibo/:num` | Sí | Sí | Sí | Sí |
| **Recuperar Contraseña** | `/recuperar` | Sí | Sí | Sí | Sí |
| **Estado Conexión** | `/servidor-despertando` | Sí | Sí | Sí | Sí |
