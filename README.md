# Countries Explorer — Diseño de API REST

Countries Explorer es una aplicación web para explorar información de países del
mundo (listado, búsqueda, filtrado y detalle). Este documento detalla el diseño
de la **API REST** que necesitará la aplicación, tomando como referencia la
API [REST Countries](https://restcountries.com).

---

## 1. Recurso central: `paises`

La entidad central del proyecto es el **país**. Es un recurso con identidad única,
atributos bien definidos y relaciones con otros recursos de su mismo tipo (las
fronteras), por lo que se presta naturalmente al modelo REST.

Como identificador, usar el **código ISO 3166-1 alpha-3** (`BOL`, `ARG`, `DEU`)
en lugar de un id numérico, por estas razones:

- Es un estándar internacional: estable, documentado y reconocido.
- Tiene significado por sí mismo, lo que hace legibles las URLs
  (`/api/v1/paises/BOL` en vez de `/api/v1/paises/7`).

### Campos del recurso

Los nombres de campo van en inglés —la convención técnica universal para
esquemas JSON— mientras que el **contenido** se entrega en español, que es el
idioma de los usuarios de la aplicación. La única excepción es `official_name`,
que se mantiene en el idioma oficial de cada país: un nombre oficial es, por
definición, un término nativo.

| Campo           | Tipo           | Descripción                                                | Ejemplo                                        |
| --------------- | -------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| `code`          | string (3)     | Código ISO 3166-1 alpha-3. Identificador del recurso       | `"BOL"`                                        |
| `name`          | string         | Nombre de uso común                                        | `"Bolivia"`                                    |
| `official_name` | string         | Denominación oficial, en el idioma del país                | `"Estado Plurinacional de Bolivia"`            |
| `population`    | number         | Cantidad de habitantes                                     | `11673021`                                     |
| `region`        | string         | Región geográfica                                          | `"América"`                                    |
| `subregion`     | string         | Subregión según el geoesquema de la ONU                    | `"América del Sur"`                            |
| `capital`       | string         | Ciudad capital                                             | `"Sucre"`                                      |
| `currency_code` | string (3)     | Código de la moneda, estándar ISO 4217                     | `"BOB"`                                        |
| `currency_name` | string         | Nombre de la moneda                                        | `"Boliviano"`                                  |
| `languages`     | string[]       | Idiomas oficiales                                          | `["Español", "Quechua", "Aymara"]`             |
| `borders`       | string[]       | Países limítrofes (códigos alpha-3)                        | `["ARG", "BRA", "CHL", "PRY", "PER"]`          |
| `landlocked`    | boolean        | Sin salida al mar (pareja conceptual de `borders`)         | `true`                                         |
| `area`          | number         | Superficie en km²                                          | `1098581`                                      |
| `coordinates`   | object         | Centro geográfico: `{ latitude, longitude }`               | `{"latitude": -16.29, "longitude": -63.59}`    |
| `timezones`     | string[]       | Husos horarios, formato IANA                               | `["America/La_Paz"]`                           |
| `calling_code`  | string         | Prefijo telefónico, con el `+` incluido                    | `"+591"`                                       |
| `demonym`       | string         | Gentilicio                                                 | `"Boliviano"`                                  |
| `flag_url`      | string (URL)   | Imagen de la bandera                                       | `"https://flagcdn.com/w320/bo.png"`            |
| `flag_emoji`    | string         | Bandera en emoji, para interfaces livianas                | `"🇧🇴"`                                         |

---

## 2. Endpoints CRUD

Ruta base del recurso: **`/api/v1/paises`**

| Método   | Ruta                      | Descripción                                   | Respuesta exitosa |
| -------- | ------------------------- | --------------------------------------------- | ----------------- |
| `GET`    | `/api/v1/paises`          | Lista de países (filtros, orden, paginación)  | `200 OK`          |
| `GET`    | `/api/v1/paises/{codigo}` | Un país por su código alpha-3                 | `200 OK`          |
| `POST`   | `/api/v1/paises`          | Crea un país nuevo                            | `201 Created`     |
| `PUT`    | `/api/v1/paises/{codigo}` | Reemplaza por completo un país existente      | `200 OK`          |
| `PATCH`  | `/api/v1/paises/{codigo}` | Actualiza solo los campos enviados            | `200 OK`          |
| `DELETE` | `/api/v1/paises/{codigo}` | Elimina un país                               | `204 No Content`  |

`PUT` y `PATCH` se complementan: `PUT` exige el recurso completo en el body
(los campos omitidos se pierden), mientras que `PATCH` modifica únicamente lo
que envía el cliente. Un editor de ficha completa usa `PUT`; uno que solo
actualiza la población de un país usa `PATCH` sin riesgo de borrar el resto.

### 2.1 La lista: filtros, orden, proyección y paginación

Un buen endpoint de lista no devuelve "todo de una vez": se diseña desde el
inicio con parámetros de consulta, porque cualquier cliente (web, móvil, otro
servicio) puede necesitarlos:

| Parámetro | Ejemplo                     | Descripción                                                        |
| --------- | --------------------------- | ------------------------------------------------------------------ |
| `region`  | `?region=América`           | Filtra por región exacta                                           |
| `q`       | `?q=bol`                    | Búsqueda por nombre, coincidencia parcial e insensible a mayúsculas |
| `sort`    | `?sort=population-desc`     | Ordena por `name` o `population`, ascendente o descendente         |
| `fields`  | `?fields=code,name,population` | Devuelve solo los campos indicados (proyección de la respuesta) |
| `limit`   | `?limit=20`                 | Países por página (por defecto 20)                                 |
| `offset`  | `?offset=40`                | Cuántos saltar (para avanzar de página)                            |

Los parámetros se pueden combinar entre sí:
`GET /api/v1/paises?region=Europa&sort=population-desc&limit=10&offset=0`

### 2.2 Endpoints auxiliares

| Método | Ruta                             | Descripción                                                       |
| ------ | -------------------------------- | ----------------------------------------------------------------- |
| `GET`  | `/api/v1/regions`                | Catálogo de regiones y subregiones                                 |
| `GET`  | `/api/v1/paises/{codigo}/borders`| Los países vecinos de un país, como recursos completos            |

- **`/api/v1/regions`**: cualquier cliente necesita llenar un filtro por
  región, y pedirlo "adivinando" al endpoint de lista sería frágil. Un catálogo
  auxiliar entrega los valores válidos de una sola vez.
- **`/api/v1/paises/{codigo}/borders`**: el campo `borders` devuelve códigos;
  para mostrar los vecinos con nombre y bandera, un cliente tendría que hacer
  una petición extra por cada código (el clásico problema *N+1*). El
  sub-recurso los entrega ya resueltos en una sola petición.

### 2.3 Códigos de estado

| Código | Cuándo se devuelve                                        |
| ------ | --------------------------------------------------------- |
| `200`  | Petición exitosa (GET, PUT y PATCH)                       |
| `201`  | País creado (POST)                                        |
| `204`  | Eliminación exitosa (DELETE) — sin cuerpo en la respuesta |
| `400`  | Body inválido (campos faltantes o con tipos incorrectos)  |
| `404`  | No existe un país con el código indicado                  |
| `500`  | Error inesperado del servidor                             |

---

## 3. JSON de ejemplo

### GET `/api/v1/paises/BOL` → `200 OK`

```json
{
    "code": "BOL",
    "name": "Bolivia",
    "official_name": "Estado Plurinacional de Bolivia",
    "population": 11673021,
    "region": "América",
    "subregion": "América del Sur",
    "capital": "Sucre",
    "currency_code": "BOB",
    "currency_name": "Boliviano",
    "languages": ["Español", "Quechua", "Aymara"],
    "borders": ["ARG", "BRA", "CHL", "PRY", "PER"],
    "landlocked": true,
    "area": 1098581,
    "coordinates": { "latitude": -16.29, "longitude": -63.59 },
    "timezones": ["America/La_Paz"],
    "calling_code": "+591",
    "demonym": "Boliviano",
    "flag_url": "https://flagcdn.com/w320/bo.png",
    "flag_emoji": "🇧🇴"
}
```

### GET `/api/v1/paises?region=América&fields=code,name,population,flag_url&limit=2` → `200 OK`

```json
{
    "total": 5,
    "paises": [
        {
            "code": "ARG",
            "name": "Argentina",
            "population": 45376763,
            "flag_url": "https://flagcdn.com/w320/ar.png"
        },
        {
            "code": "BOL",
            "name": "Bolivia",
            "population": 11673021,
            "flag_url": "https://flagcdn.com/w320/bo.png"
        }
    ]
}
```

(`total` informa cuántos países cumplen el filtro en total, sin importar el
`limit`: así el cliente puede armar su paginación. Con `fields`, los campos no
incluidos simplemente no viajan en la respuesta.)

### POST `/api/v1/paises` — body de la petición

```json
{
    "code": "URY",
    "name": "Uruguay",
    "official_name": "República Oriental del Uruguay",
    "population": 3473730,
    "region": "América",
    "subregion": "América del Sur",
    "capital": "Montevideo",
    "currency_code": "UYU",
    "currency_name": "Peso uruguayo",
    "languages": ["Español"],
    "borders": ["ARG", "BRA"],
    "landlocked": false,
    "area": 176215,
    "coordinates": { "latitude": -32.52, "longitude": -55.77 },
    "timezones": ["America/Montevideo"],
    "calling_code": "+598",
    "demonym": "Uruguayo",
    "flag_url": "https://flagcdn.com/w320/uy.png",
    "flag_emoji": "🇺🇾"
}
```

Respuesta `201 Created`: el recurso creado (igual al body enviado) más el
header `Location: /api/v1/paises/URY`.
Si ya existiera un país con ese `code` → `400` con
`{ "error": "Ya existe un país con el código URY" }`.

### GET `/api/v1/paises/BOL/borders` → `200 OK`

```json
{
    "total": 5,
    "paises": [
        { "code": "ARG", "name": "Argentina", "flag_emoji": "🇦🇷" },
        { "code": "BRA", "name": "Brasil", "flag_emoji": "🇧🇷" }
    ]
}
```

(Respuesta abreviada para el ejemplo: el endpoint devuelve el objeto completo
de cada vecino, y aquí se usó el parámetro `fields` para mantenerla corta.)

### GET `/api/v1/paises/XXX` (no existe) → `404 Not Found`

```json
{
    "error": "No se encontró el país con código XXX"
}
```

---

## 4. Lenguaje elegido: Node.js con Express

El backend se implementaría en **JavaScript con Node.js y el framework
Express**, por las siguientes razones:

1. **Un solo lenguaje en todo el proyecto.** El frontend ya es JavaScript;
   usar el mismo lenguaje en el backend reduce la curva de aprendizaje y evita
   cambiar de contexto entre capas.
2. **JSON es nativo.** Una API REST vive de JSON, y en JavaScript leer,
   escribir y manipular objetos JSON es parte del lenguaje mismo, sin
   conversiones.
3. **Express es simple y está muy documentado.** Es minimalista: definir una
   ruta `GET /api/v1/paises/:codigo` toma unas líneas, y al ser uno de los
   frameworks más usados del mundo, el material de estudio y la comunidad son
   enormes.
4. **Ecosistema npm.** Validación de datos, conexión a bases de datos, tests:
   casi todo tiene un paquete maduro a un `npm install` de distancia.

