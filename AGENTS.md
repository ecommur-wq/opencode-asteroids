# AGENTS.md

Clone de Asteroids en canvas HTML5 puro. Sin dependencias, sin bundler, sin package.json,
sin tests, sin lint, sin CI. Todo el juego vive en `game.js`.

## Ejecutar

```bash
npx serve .      # puerto 3000 por defecto
```

También funciona abrir `index.html` con doble clic. **La única verificación del repo es
abrir el juego en el navegador y jugar:** no hay forma de correr tests o typecheck. Si
añades tooling (package.json, lint, tests), documéntalo aquí.

## Arquitectura

- `index.html` — canvas 800x600, carga `game.js` con `<script src>` **clásico** (sin
  `type="module"`). No hay módulos ES: no uses `import`/`export`, todo es global en un
  solo archivo. Para agregar otro `.js` hay que añadir el `<script>` en `index.html`.
- `game.js` — clases `Bullet`, `Asteroid`, `Ship`, `Particle`, `Pickup` + estado global del
  juego. Convención por clase: `constructor` → `update(dt)` → `draw()`, y bandera
  `this.dead` en vez de borrar del array (los arrays se filtran con `.filter(x => !x.dead)`
  al final de `update`).
- Máquina de estados en la variable global `state`: `'playing' | 'dead' | 'gameover'`.
  `initGame()` arranca, `killShip()` gestiona las vidas, `nextLevel()` limpia y regenera.

## Power-up "Velocidad" (no lo rompas)

- `SPEED_DURATION` (game.js:122) es **global a propósito**: lo usan `Ship.update()` para
  fijar el timer y `drawSpeedBar()` para la proporción de la barra. No lo bajes a local.
- `Ship.speedTimer` se inicializa en el `constructor`, **deliberadamente fuera de `reset()`**
  (game.js:124-129): el efecto tiene que sobrevivir a la muerte y a `nextLevel()`. No lo
  "arregles" moviéndolo a `reset()`.
- `nextLevel()` sí limpia el array `pickups` (las entidades no sobreviven al nivel); solo el
  buff persiste.
- La barra se dibuja en `drawSpeedBar()` y solo aparece si `speedTimer > 0`. El HUD la
  llama al final de `drawHUD()` porque cambia `ctx.font`; si la mueves al principio, el
  `font` de 15px del resto del HUD se pisa.

## Gotchas (no obvios)

- **El tamaño de pantalla está duplicado y hay que cambiarlo en dos sitios:**
  `index.html:23` (atributos `width`/`height`) y `game.js:5-6` (constantes `W`/`H`).
- **`pressed(code)` consume el flag**: lee y borra `justPressed[code]`. Se llama una sola
  vez por frame y por tecla. Si añades otra llamada a `pressed()` para una tecla que ya se
  consume en otra rama, el flanco se pierde. Usa `keys[code]` para estado sostenido.
- **`pressed('Space')` ya se consulta en dos ramas** de `update()` (`'gameover'` y
  `'playing'`); ambas están precintadas por un `return` temprano.
- **El espacio es toroidal solo para el movimiento** (`wrap()`), no para las colisiones:
  `dist()` usa coordenadas crudas, así que un objeto cerca de un borde choca mal con uno
  cerca del borde opuesto. Afecta también a los `Pickup`: uno junto a un borde es
  incogible desde el lado opuesto. Si añades colisiones nuevas, no asumas que está resuelto.
- **Física dependiente del framerate**: `DRAG = 0.987` (game.js:152) se aplica por frame,
  no por segundo, y `draw()` consume `Math.random()` para la llama del propulsor. El
  `dt` sí está acotado a 0.05 s (game.js:504), pero eso no normaliza el drag.
- **`draw()` solo pinta el overlay de `GAME OVER`.** El estado `'dead'` no dibuja nada
  especial; si añades una pantalla de "has muerto", hay que añadirla explícitamente.
- **Índices de tamaño de asteroide**: `1` = pequeño, `2` = mediano, `3` = grande.
  Los arrays `RADITS`/`SPEEDS`/`POINTS` (game.js:61-63) se indexan por tamaño con el
  índice `0` sin usar; `split()` decrementea el tamaño. Ojo: el array se llama `RADII`.
- `ArrowDown` tiene `preventDefault` (game.js:16) pero no está implementado. No asumas
  que el retroceso thrust existe.

## README.md está desactualizado

Describe "tipos especiales de asteroide" como la estrella fugaz, que **no existen** en
`game.js`. También omite el `NIVEL`, la pantalla de `GAME OVER` y el reinicio con Espacio.
Trata `game.js` como fuente de verdad y corrige el README si tocas esas áreas.

## Convenciones

- **Comentarios, HUD y textos de interfaz en español** (`SCORE`, `NIVEL`, `PUNTAJE`,
  `GAME OVER`, "ESPACIO PARA REINICIAR"). Mantén ese idioma al añadir features.
- Secciones separadas por comentarios de caja: `// ── Nombre ─────...`.
- Constantes de ajuste (rad/s, px/s², radios, puntos) mágicas y locales al constructor o al
  `update`; no hay configuración central. Mantén ese estilo al añadir clases.
