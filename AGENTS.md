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

## Power-ups (no los rompas)

Hay **tres**, gemelos en estructura: `Velocidad` (cian), `Triple shot` (magenta) y `Escudo`
(verde). Cada uno tiene su constante de duración global, su timer en `Ship`, su barra en el
HUD y su rama en `Pickup.draw()`. Los tres pueden estar activos a la vez.

- Las duraciones (`SPEED_DURATION`, `TRIPLE_DURATION`, `SHIELD_DURATION`) son **globales a
  propósito**: las leen `Ship.update()` para fijar el timer y las barras para la proporción del
  relleno. No las bajes a local. `SHIELD_GRACE` son los segundos de invencibilidad que se dan
  tras absorber un impacto con escudo.
- Los tres timers (`Ship.speedTimer`, `Ship.tripleTimer`, `Ship.shieldTimer`) se inicializan en
  el `constructor`, **deliberadamente fuera de `reset()`**: los efectos tienen que sobrevivir a
  la muerte y a `nextLevel()`. No los "arregles" moviéndolos a `reset()`.
- `nextLevel()` sí limpia el array `pickups` (las entidades no sobreviven al nivel); solo los
  buffs persisten.
- Las tres barras son **la misma geometría**: `drawSpeedBar()`, `drawShieldBar()` y
  `drawTripleBar()` no dibujan nada por su cuenta, delegan en
  `drawTimerBar(x, y, color, label, timer, duration)`. Cada una sale solo si su timer `> 0` y van
  **apiladas en vertical** en `x = 14`: velocidad `y = 42`, escudo `y = 72`, triple `y = 102`
  (30 px de paso = 8 de alto + 13 de etiqueta + margen). El HUD las llama **al final** de
  `drawHUD()` porque cambian `ctx.font`; si mueves alguna al principio, el `font` de 15px del
  resto del HUD se pisa.
- `Pickup` lleva un `kind` (`'speed' | 'triple' | 'shield'`, default `'speed'`) que decide **el
  dibujo y el efecto**: la recogida en `update()` ramifica por `p.kind`. No añadas un cuarto
  power-up sin pasar por `kind`, ni hardcodees el cian: el color y la marca interior salen de
  `this.kind` en `Pickup.draw()`.
- **El reparto de la tirada de caída es de una sola variable**: `drop < 0.03` triple shot,
  `drop < 0.06` escudo y `drop < 0.14` velocidad, para que un mismo punto nunca suelte dos a la
  vez. Ojo: los porcentajes están **encadenados** (0.03 + 0.03 + 0.08 = 0.14), así que subir uno
  sin recalcular los siguientes cambia la probabilidad documentada de los otros.

## Triple shot

- `Ship.tryShoot()` devuelve **3** `Bullet` con `this.angle` **idéntico** y offset lateral
  `[-5, 0, 5]` sobre el perpendicular `angle + Math.PI/2`. "En línea recta" significa eso:
  paralelas, **no** en abanico. Si añades una cuarta bala o cambias el ángulo, deja de ser triple
  shot y pasa a ser un disparo en abanico.
- Las tres nacen en el `nose` de la skin activa (`SKINS[skinIndex].nose`), igual que la bala
  normal, así que cambiar de skin no desalinea la formación.
- **El cooldown no se toca** (`shootCooldown = 0.2`): el buff multiplica balas por disparo, no
  la cadencia. No lo bajes para "compensar" el daño: pasa de 5 a 15 balas/s.
- Las 3 balas no se estorban entre sí porque no hay colisión bala-bala; y en el bucle
  bala-vs-asteroide el `!a.dead` evita que las 3 que impactan a la vez puntuen tres veces.
- El indicador de la nariz usa los mismos offsets `[-5, 0, 5]` y se dibuja en
  `skin.nose + 1 → skin.nose + 7` a propósito: muestra la formación real de salida y se adapta
  a la silueta activa.

## Power-up "Escudo" (no lo rompas)

- `Ship.shieldTimer` sigue el patrón de los otros dos buffs, y `ship.shieldTimer > 0` es el
  `hasShield` que se consulta en el bloque de colisión nave-vs-entidad de `update()`: la entidad
  que golpea choca, se marca `dead`, estalla y `shieldTimer` vuelve a 0. Sin puntos y **sin
  `split()`**: partir el asteroide sobre la nave que acaba de bloquearlo sería matarla igualmente.
- **El escudo no bloquea proyectiles**: no hay balas enemigas en el juego (el array `bullets`
  solo lo rellena `ship.tryShoot()`).
- Los dos `filter()` extra al final de ese bloque son obligatorios: lo absorbido se marca muerto
  **después** del filtro de asteroides del principio de `update()`, así que sin ellos la entidad
  se dibujaría un frame de más.
- El bucle de las estrellas se guarda con `if (!ship.dead && !hasShield)`: sin el `hasShield`,
  un impacto ya absorbido volvería a matar (y a restar una segunda vida) en el mismo frame.
- Si el impacto absorbido era el último asteroide, el check `if (asteroids.length === 0)
  nextLevel()` avanza igual que con una bala. No añadas casos especiales.
- La burbuja se dibuja en `Ship.draw()` **después** del `ctx.restore()` del bloque rotado,
  porque es un círculo centrado en la nave y hereda el parpadeo de invencibilidad, incluido el de
  `SHIELD_GRACE`.

## Skins (no lo rompas)

- `SKINS` es un array de objetos planos con `name`, `hull`, `flame`, `nose`, `rear`,
  `verts` y `detail` (opcional, polilínea `[[x,y], ...]`). El array **no tiene configuración
  central**: cada skin lleva sus propias constantes, como el resto del juego. Para añadir una,
  copia una entrada existente.
- **`ship.radius` sigue siendo 12 en todas las skins, a propósito.** Las skins son solo geometría
  y color: si le das un radio propio a una, la hitbox cambia en mitad de partida y las colisiones
  dejan de ser predecibles. No lo muevas a `SKINS`.
- Los `verts` caben en **±20 x / ±12 y**: `drawLifeIcon()` los escala con `ctx.scale(0.5, 0.5)` y el
  HUD los dibuja cada 22 px, así que un polígono de más de 40 px de ancho solapa los iconos de vida.
- **`pressed('KeyS')` se consulta al principio de `update()`**, antes de las ramas `'gameover'` y
  `'dead'`, que hacen `return` temprano. Por eso cambiar de skin funciona en los tres estados y el
  flanco se consume una sola vez por frame. Si mueves la llamada dentro de `'playing'`, en `GAME
  OVER` el flag queda pendiente y dispara un cambio fantasma al reaparecer.
- `drawSkinToast()` se llama en `drawHUD()` **antes** de las barras por lo mismo que ya documenta
  la sección de power-ups: `drawTimerBar()` cambia `ctx.font` a 11px. Va abajo a la izquierda
  (`14, H - 16`), lejos de la primera barra (`x = 14, y = 42`).
- `loadSkin()` / `saveSkin()` van envueltas en `try/catch`: `localStorage` puede lanzar
  `SecurityError` con `file://` en algunos navegadores. `loadSkin()` valida el índice guardado
  contra `SKINS.length`; si quitas skins, un índice guardado deja de ser válido y no debe romper
  el arranque.
- El cyan `#5cf` está reservado para el boost de velocidad: la llama normal usa el `flame` de la
  skin, pero con `speedTimer > 0` se sobreescribe a `#5cf` (game.js:389).

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
`if (asteroids.length === 0) nextLevel()` (game.js:722): `shooters` se ignora. Si añades
  shooters al check, dejas una estrella huérvana arrastrada al nivel siguiente.
- `nextLevel()` limpia `shooters` (las entidades no sobreviven al nivel, igual que
  `pickups`). La rama `'gameover'` de `update()` **no** actualiza `shooters`: si lo hiciera,
  se filtrarían en `GAME OVER` sin dibujarse. En `'dead'` sí se mueven, como los asteroides,
y hay que filtrarlas ahí (game.js:616-618) porque son lo único que puede morir sin bala:
  sin ese filtro la estrella caducada seguiría dibujándose hasta 2 s, con el `fade` ya en
  negativo.
- El bucle de colisión nave-vs-`Shooter` está **guardado con `if (!ship.dead && !hasShield)`**
  (game.js:708) porque va después del de asteroides: sin esa guarda, tocar un asteroide y una
  estrella en el mismo frame descuenta 2 vidas y deja `lives` en negativo.
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
- **Física dependiente del framerate**: `DRAG = 0.987` (game.js:318) se aplica por frame,
  no por segundo, y `draw()` consume `Math.random()` para la llama del propulsor. El
  `dt` sí está acotado a 0.05 s (game.js:831), pero eso no normaliza el drag.
- **`draw()` solo pinta el overlay de `GAME OVER`.** El estado `'dead'` no dibuja nada
  especial; si añades una pantalla de "has muerto", hay que añadirla explícitamente.
- **Índices de tamaño de asteroide**: `1` = pequeño, `2` = mediano, `3` = grande.
  Los arrays `RADITS`/`SPEEDS`/`POINTS` (game.js:61-63) se indexan por tamaño con el
  índice `0` sin usar; `split()` decrementea el tamaño. Ojo: el array se llama `RADII`.
- `ArrowDown` tiene `preventDefault` (game.js:16) pero no está implementado. No asumas
  que el retroceso thrust existe.

## README.md

Las estrellas fugaces ya existen en `game.js` y el README las documenta, igual que las
skins (tecla `S`). `NIVEL`, `GAME OVER` y el reinicio con Espacio también. Trata `game.js`
como fuente de verdad y corrige el README si tocas esas áreas.

## Convenciones

- **Comentarios, HUD y textos de interfaz en español** (`SCORE`, `NIVEL`, `PUNTAJE`,
  `GAME OVER`, "ESPACIO PARA REINICIAR"). Mantén ese idioma al añadir features.
- Secciones separadas por comentarios de caja: `// ── Nombre ─────...`.
- Constantes de ajuste (rad/s, px/s², radios, puntos) mágicas y locales al constructor o al
  `update`; no hay configuración central. Mantén ese estilo al añadir clases.
