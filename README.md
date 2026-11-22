# Aerolíneas y tripulantes

API REST desarrollada con Node.js, Express y MongoDB para crear aerolíneas y agregarles tripulantes.

## Relación entre los modelos

Una aerolínea puede tener varios tripulantes. Es una relación uno a muchos (1:N). Los tripulantes se guardan dentro del arreglo `crew` del documento de la aerolínea.

## Validaciones

- El nombre y el país de la aerolínea son obligatorios.
- El nombre del tripulante acepta tildes y `ñ`.
- El cargo y la licencia del tripulante son obligatorios.
- Se usa `trim()` para quitar los espacios al principio y al final del nombre.

## Cómo ejecutar el proyecto

Instala las dependencias:

```powershell
pnpm install
```

La primera vez, crea el contenedor de MongoDB:

```powershell
docker run --detach --name aerolineas-mongo-27018 --publish 127.0.0.1:27018:27017 --volume aerolineas-mongo-data-27018:/data/db mongodb/mongodb-community-server:9.0.4-ubuntu2204
```

En las siguientes ejecuciones, inicia el contenedor que ya existe:

```powershell
docker start aerolineas-mongo-27018
```

Crea el archivo `.env` si todavía no existe:

```powershell
Copy-Item .env.example .env
```

El archivo `.env` debe contener:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27018
MONGODB_DB=aerolineas_tripulantes
PORT=3002
```

Inicia la API y deja esa terminal abierta:

```powershell
pnpm dev
```

La API estará disponible en `http://localhost:3002`.

## Resumen de endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Comprobar que la API responde |
| POST | `/airlines` | Crear una aerolínea |
| GET | `/airlines` | Listar todas las aerolíneas |
| GET | `/airlines/:airlineId` | Consultar una aerolínea y sus tripulantes |
| PUT | `/airlines/:airlineId` | Actualizar una aerolínea |
| DELETE | `/airlines/:airlineId` | Eliminar una aerolínea y sus tripulantes |
| POST | `/airlines/:airlineId/crew` | Agregar un tripulante dentro de `crew` |

## Probar con curl en PowerShell

Deja `pnpm dev` ejecutándose en una terminal de VS Code. Abre una segunda terminal de PowerShell para hacer las pruebas.

Ejecuta los comandos de esta sección **uno por uno y en orden** en la segunda terminal. Déjala abierta durante toda la prueba porque allí se guardará la variable `$airlineId`.

### 1. Comprobar la API

Este comando verifica que el servidor esté respondiendo:

```powershell
curl.exe -i "http://localhost:3002/health"
```

La respuesta esperada es `200 OK`.

### 2. Crear una aerolínea

Cambia `NOMBRE DE AEROLINEA` por el nombre que quieras registrar.

Prepara los datos:

```powershell
$airlineBody = @{ name = "NOMBRE DE AEROLINEA"; country = "Colombia" } | ConvertTo-Json -Compress
```

Guarda el JSON en un archivo temporal:

```powershell
[System.IO.File]::WriteAllBytes("$env:TEMP\airline.json", [System.Text.Encoding]::UTF8.GetBytes($airlineBody))
```

Envía la solicitud para crear la aerolínea:

```powershell
curl.exe -i -X POST "http://localhost:3002/airlines" -H "Content-Type: application/json" --data-binary "@$env:TEMP\airline.json"
```

La respuesta esperada es `201 Created` e incluye el `id` de la aerolínea. Copia ese ID y guárdalo así, reemplazando el texto de ejemplo:

```powershell
$airlineId = "PEGA_AQUI_EL_ID_RECIBIDO"
```

Conserva esta terminal abierta para que `$airlineId` siga disponible en los siguientes comandos.

### 3. Agregar un tripulante

Cambia `NOMBRE DE TRIPULANTE` por el nombre que quieras registrar. Los espacios antes y después sirven para comprobar que `trim()` los quite.

Prepara los datos:

```powershell
$crewBody = @{ name = "  NOMBRE DE TRIPULANTE  "; role = "Piloto"; licenseNumber = "LIC-2030" } | ConvertTo-Json -Compress
```

Guarda el JSON en un archivo temporal:

```powershell
[System.IO.File]::WriteAllBytes("$env:TEMP\crew.json", [System.Text.Encoding]::UTF8.GetBytes($crewBody))
```

Envía el tripulante a la aerolínea que guardaste en `$airlineId`:

```powershell
curl.exe -i -X POST "http://localhost:3002/airlines/$airlineId/crew" -H "Content-Type: application/json" --data-binary "@$env:TEMP\crew.json"
```

La respuesta esperada es `201 Created`. El nombre debe aparecer sin los espacios externos.

### 4. Listar y consultar aerolíneas

Este comando muestra todas las aerolíneas:

```powershell
curl.exe -i "http://localhost:3002/airlines"
```

Este comando consulta la aerolínea creada y su arreglo `crew`:

```powershell
curl.exe -i "http://localhost:3002/airlines/$airlineId"
```

La segunda respuesta debe mostrar el tripulante dentro de `crew`.

### 5. Actualizar la aerolínea

Puedes cambiar `NOMBRE DE AEROLINEA Actualizada` por el nuevo nombre que quieras.

Prepara los datos:

```powershell
$updateBody = @{ name = "NOMBRE DE AEROLINEA Actualizada"; country = "Colombia" } | ConvertTo-Json -Compress
```

Guarda el JSON en un archivo temporal:

```powershell
[System.IO.File]::WriteAllBytes("$env:TEMP\update.json", [System.Text.Encoding]::UTF8.GetBytes($updateBody))
```

Envía la actualización:

```powershell
curl.exe -i -X PUT "http://localhost:3002/airlines/$airlineId" -H "Content-Type: application/json" --data-binary "@$env:TEMP\update.json"
```

La respuesta esperada es `200 OK`.

### 6. Eliminar la aerolínea

Haz este paso al final. Elimina la aerolínea y también los tripulantes que estén dentro de ella:

```powershell
curl.exe -i -X DELETE "http://localhost:3002/airlines/$airlineId"
```

La respuesta esperada es `204 No Content`.