@echo off
echo ========================================================
echo       MEKATRON AUTOMOTRIZ - COMPILADOR APK ANDROID
echo ========================================================
echo.

echo [1/4] Sincronizando recursos web estaticos hacia carpeta www...
node sync_www.js
if %ERRORLEVEL% NEQ 0 (
    echo Error al sincronizar recursos web.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/4] Sincronizando contenedor nativo Android con Capacitor...
cmd.exe /c "npx.cmd cap sync android"
if %ERRORLEVEL% NEQ 0 (
    echo Error al ejecutar Capacitor sync.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/4] Compilando APK nativa de depuracion (Debug APK)...
cd android
call gradlew.bat assembleDebug
set GRADLE_ERR=%ERRORLEVEL%
cd ..

if %GRADLE_ERR% EQU 0 (
    echo.
    echo ========================================================
    echo  [4/4] EXITO: APK COMPILADA SATISFACTORIAMENTE!
    echo ========================================================
    echo Ubicacion del APK:
    echo  android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo Puedes copiar e instalar este archivo directamente en tu telefono Android.
) else (
    echo.
    echo ========================================================
    echo  AVISO: Gradle requiere tener instalado Android SDK / Java JDK.
    echo ========================================================
    echo Si no tienes Java/SDK configurado en la terminal, puedes abrir
    echo el proyecto en Android Studio ejecutando:
    echo    cmd.exe /c "npx.cmd cap open android"
    echo Y hacer click en "Build" ^> "Build Bundle(s) / APK(s)" ^> "Build APK(s)"
)

echo.
pause
