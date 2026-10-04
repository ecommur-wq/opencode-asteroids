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
- `game.js` — clases `Bullet`, `Asteroid`, `Shooter`, `Ship`, `Particle`, `Pickup` + estado
  global del juego. Convención por clase: `constructor` → `update(dt)` → `draw()`, y bandera
  `this.dead` en vez de borrar del array (los arrays se filtran con `.filter(x => !x.dead)`
  al final de `update`).
- Máquina de estados en la variable global `state`: `'playing' | 'dead' | 'gameover'`.
  `initGame()` arranca, `killShip()` gestiona las vidas, `nextLevel()` limpia y regenera.

## Power-up "Velocidad" (no lo rompas)

## Power-ups (no los rompas)

Hay **dos**, gemelos en estructura: `Velocidad` (cian) y `Triple shot` (magenta). Cada uno
tiene su constante de duración global, su timer en `Ship`, su barra en el HUD y su rama en
`Pickup.draw()`.

- `SPEED_DURATION` (game.js:216) es **global a propósito**: lo usan `Ship.update()` para
  fijar el timer y `drawSpeedBar()` para la proporción de la barra. No lo bajes a local.
  `TRIPLE_DURATION` (game.js:217) es global por el mismo motivo con `Ship.update()` y
  `drawTripleBar()`.
- `Ship.speedTimer` y `Ship.tripleTimer` se inicializan en el `constructor`, **deliberadamente
  fuera de `reset()`** (game.js:220-224): los efectos tienen que sobrevivir a la muerte y a
  `nextLevel()`. No los "arregles" moviéndolos a `reset()`.
- `nextLevel()` sí limpia el array `pickups` (las entidades no sobreviven al nivel); solo los
  buffs persisten.
- La barra de velocidad se dibuja en `drawSpeedBar()` y solo aparece si `speedTimer > 0`. El
  HUD llama a las dos barras **al final** de `drawHUD()` porque cambian `ctx.font`; si mueves
  alguna al principio, el `font` de 15px del resto del HUD se pisa. `drawTripleBar()` va en
  `y = 72` para no solaparse con la de velocidad (que ocupa `y = 42` hasta su etiqueta).
- `Pickup` lleva un `kind` (`'speed' | 'triple'`, default `'speed'`) que decide **el dibujo y
  el efecto**; la recogida en `update()` ramifica por `p.kind`. No añadas un tercer power-up
  sin pasar por `kind`.
- **El reparto de la tirada de caída es de una sola variable** (game.js:549-551): `drop < 0.04`
  es triple shot y `drop < 0.12` velocidad, para que un mismo punto nunca suelte los dos a la
  vez. Ojo: los 0.08 de velocidad están **sumados** dentro del 0.12, así que subir uno sin
  recalcular el otro cambia la probabilidad documentada del otro.

## Triple shot

- `Ship.tryShoot()` devuelve **3** `Bullet` con `this.angle` **idéntico** y offset lateral
  `[-5, 0, 5]` sobre el perpendicular `angle + Math.PI/2`. "En línea recta" significa eso:
  paralelas, **no** en abanico. Si añades una cuarta bala o cambias el ángulo, deja de ser triple
  shot y pasa a ser un disparo en abanico.
- **El cooldown no se toca** (`shootCooldown = 0.2`): el buff multiplica balas por disparo, no
  la cadencia. No lo bajes para "compensar" el daño: pasa de 5 a 15 balas/s.
- Las 3 balas no se estorban entre sí porque no hay colisión bala-bala; y en el bucle
  bala-vs-asteroide el `!a.dead` evita que las 3 que impactan a la vez puntuen tres veces.
- El indicador en la nariz (game.js:317-327) usa los mismos offsets `[-5, 0, 5]` a propósito:
  muestra la formación real de salida.

## Estrella fugaz (asteroide especial)

- Clase `Shooter` (game.js:129). Aparece en el array global `shooters`, **2 por nivel**:
  `spawnShooters(2)` en `initGame()` y en `nextLevel()`. Usa el mismo
  `SAFE_DIST = 130` contra el centro que `spawnAsteroids`, así que nunca aparece encima
  de la nave.
- `SHOOTING_STAR_TTL = 20` (game.js:66) y `SHOOTING_STAR_POINTS = 150` (game.js:67) son
  globales a propósito (los lee `draw()` para el desvanecido y `update()` para el score).
- **`size = 3` a propósito**, aunque no se parte: es lo que permite reutilizar `RADII` y
  `explode(x, y, size * 5)`. El radio real es el `RADIUS = 40` local al constructor, no
  `RADII[3]`. No lo "simplifiques" a `this.radius = RADII[this.size]`.
- `split()` devuelve `[]` explícitamente. No depende del `if (this.size <= 1) return []`
  de `Asteroid` a propósito: "no se divide" está escrito, no implícito.
- **No bloquea el avance de nivel.** El check sigue siendo solo
  `if (asteroids.length === 0) nextLevel()` (game.js:605): `shooters` se ignora. Si añades
  shooters al check, dejas una estrella huérvana arrastrada al nivel siguiente.
- `nextLevel()` limpia `shooters` (las entidades no sobreviven al nivel, igual que
  `pickups`). La rama `'gameover'` de `update()` **no** actualiza `shooters`: si lo hiciera,
  se filtrarían en `GAME OVER` sin dibujarse. En `'dead'` sí se mueven, como los asteroides,
  y hay que filtrarlas ahí (game.js:515-517) porque son lo único que puede morir sin bala:
  sin ese filtro la estrella caducada seguiría dibujándose hasta 2 s, con el `fade` ya en
  negativo.
- El bucle de colisión nave-vs-`Shooter` está **guardado con `if (!ship.dead)`** (game.js:594)
  porque va después del de asteroides: sin esa guarda, tocar un asteroide y una estrella en
  el mismo frame descuenta 2 vidas y deja `lives` en negativo.
- La estela (`Shooter.trail`, 14 muestras) y el `shadowBlur` del resplandor son solo
  decorativos; el `fade` de `draw()` atenúa la estrella en sus últimos 3 s de vida.

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
  incogible desde el lado opuesto, y a las `Shooter`, que son rápidas y por eso pasan más
  tiempo cerca de los bordes (tienen una ventana de colisión peor). Si añades colisiones
  nuevas, no asumas que está resuelto.
- **Física dependiente del framerate**: `DRAG = 0.987` (game.js:249) se aplica por frame,
  no por segundo, y `draw()` consume `Math.random()` para la llama del propulsor. El
  `dt` sí está acotado a 0.05 s (game.js:711), pero eso no normaliza el drag.
- **`draw()` solo pinta el overlay de `GAME OVER`.** El estado `'dead'` no dibuja nada
  especial; si añades una pantalla de "has muerto", hay que añadirla explícitamente.
- **Índices de tamaño de asteroide**: `1` = pequeño, `2` = mediano, `3` = grande.
  Los arrays `RADITS`/`SPEEDS`/`POINTS` (game.js:61-63) se indexan por tamaño con el
  índice `0` sin usar; `split()` decrementea el tamaño. Ojo: el array se llama `RADII`.
- `ArrowDown` tiene `preventDefault` (game.js:16) pero no está implementado. No asumas
  que el retroceso thrust existe.

## README.md

Las estrellas fugaces ya existen en `game.js` y el README las documenta. `NIVEL`,
`GAME OVER` y el reinicio con Espacio también. Trata `game.js` como fuente de verdad y
corrige el README si tocas esas áreas.

## Convenciones

- **Comentarios, HUD y textos de interfaz en español** (`SCORE`, `NIVEL`, `PUNTAJE`,
  `GAME OVER`, "ESPACIO PARA REINICIAR"). Mantén ese idioma al añadir features.
- Secciones separadas por comentarios de caja: `// ── Nombre ─────...`.
- Constantes de ajuste (rad/s, px/s², radios, puntos) mágicas y locales al constructor o al
  `update`; no hay configuración central. Mantén ese estilo al añadir clases.
