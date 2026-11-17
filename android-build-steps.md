# Guía de Empaquetado y Compilación APK (Android) — Mekatron

Este documento detalla la configuración de **Capacitor** aplicada sobre el proyecto web estático de **Mekatron** (`index.html`, `assets/`, `css/`, `js/`, `public/`) sin alterar el diseño, los estilos CSS, el aislamiento de `localStorage` por usuario ni la lógica de negocio.

---

## 1. Configuración Base Implementada

- **Identificador de paquete (`appId`):** `com.mekatron.app`
- **Nombre de la aplicación (`appName`):** `Mekatron`
- **Archivo de configuración:** `capacitor.config.json`
- **Directorio web empaquetado (`webDir`):** `www` (sincronizado automáticamente mediante `sync_www.js` desde los archivos estáticos de la raíz, manteniendo intactos los archivos originales y evitando incluir `node_modules/` o `android/` dentro del APK).
- **Proyecto nativo:** Carpeta `android/` generada por Capacitor.

---

## 2. Permisos y Estilo Nativo Configurados

### `android/app/src/main/AndroidManifest.xml`
- **Red e Internet (para Supabase y APIs):**
  - `android.permission.INTERNET`
  - `android.permission.ACCESS_NETWORK_STATE`
  - `android:usesCleartextTraffic="true"`
- **Galería y Cámara (selector de fotos de vehículos):**
  - `android.permission.READ_MEDIA_IMAGES`
  - `android.permission.READ_EXTERNAL_STORAGE` (`maxSdkVersion="32"`)
  - `android.permission.CAMERA`
- **Orientación:** Fija en modo vertical (`android:screenOrientation="portrait"`).

### Ícono y Splash Screen (Estilo Visual Mekatron)
Configurados con **fondo oscuro (`#1E1F21`)** y **acento amarillo (`#F9C640`)**:
- `android/app/src/main/res/values/ic_launcher_background.xml`
- `android/app/src/main/res/drawable/ic_launcher_background.xml`
- `android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml`
- `android/app/src/main/res/drawable/splash_mekatron.xml`
- `android/app/src/main/res/values/styles.xml` (`AppTheme.NoActionBarLaunch`)

---

## 3. Comandos Exactos Ejecutados

```cmd
# 1. Instalación de dependencias de Capacitor
cmd.exe /c "npm.cmd install @capacitor/core @capacitor/cli @capacitor/android"

# 2. Sincronización de archivos estáticos hacia www/
node sync_www.js

# 3. Agregado de la plataforma nativa Android
cmd.exe /c "npx.cmd cap add android"

# 4. Sincronización de recursos web y configuración hacia android/
cmd.exe /c "npx.cmd cap sync android"
```

---

## 4. Cómo Actualizar el Proyecto Web en el Futuro

Si modificas `index.html` o cualquier archivo estático en la raíz, ejecuta:

```cmd
cmd.exe /c "npm.cmd run cap:sync"
```

Esto volverá a copiar los archivos actualizados hacia `www/` y los sincronizará dentro de `android/app/src/main/assets/public/`.

---

## 5. Pasos Pendientes (Generación del APK en Android Studio)

> **Nota:** La compilación binaria del archivo `.apk` se realiza fuera del código, utilizando **Android Studio** (y su JDK/Android SDK integrados), ya que este entorno no cuenta con `java` ni Android SDK instalados en el `PATH`.

1. **Instalar Android Studio** (si aún no lo tienes):
   - Descárgalo desde [developer.android.com/studio](https://developer.android.com/studio).
   - Durante la instalación estándar, asegúrate de incluir **Android SDK** y **Android SDK Platform-Tools**.
2. **Abrir el proyecto `android/` en Android Studio:**
   - Desde la terminal en la raíz del proyecto ejecuta:
     ```cmd
     cmd.exe /c "npx.cmd cap open android"
     ```
   - O abre Android Studio manualmente → **File → Open** → selecciona la carpeta `android/` de este proyecto.
3. **Esperar la sincronización de Gradle:**
   - Android Studio descargará las dependencias nativas automáticamente en la primera apertura (puede tardar unos minutos).
4. **Generar el archivo APK:**
   - En el menú superior de Android Studio ve a:
     **Build → Build Bundle(s) / APK(s) → Build APK(s)**
5. **Localizar e instalar el APK:**
   - Al terminar la compilación, aparecerá una notificación abajo a la derecha con el enlace **locate**.
   - El archivo generado estará en:
     `android\app\build\outputs\apk\debug\app-debug.apk`
   - Cópialo a tu dispositivo Android y ábrelo para instalarlo (habilitando "Instalar apps desconocidas" si Android lo solicita).
