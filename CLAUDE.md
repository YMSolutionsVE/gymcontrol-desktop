# CLAUDE.md — GymControl Desktop

## Proyecto
Versión desktop de GymControl, construida con Tauri 2. Producto de YM Solutions.

## Owner
Yennor Miranda — YM Solutions (Monagas, Venezuela)

## Stack
- Tauri 2 (Rust backend)
- React + TypeScript (frontend)
- Supabase (backend cloud)
- Org GitHub: YMSolutionsVE

## Contexto de negocio
- App de escritorio para gimnasios que prefieren instalación local
- Misma lógica de negocio que la webapp pero empaquetada como app nativa
- Cliente activo: Aurum Sport Center

## Build
- `npm install` para dependencias frontend
- `cargo tauri dev` para desarrollo
- `cargo tauri build` para producción
- Dependencias Linux: libwebkit2gtk-4.1-dev, libgtk-3-dev, libayatana-appindicator3-dev, librsvg2-dev, patchelf

## Convenciones
- .env para configuración de Supabase
- Tauri commands en src-tauri/src/
- Frontend en src/
