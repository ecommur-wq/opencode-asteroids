# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye dos power-ups —velocidad y triple shot— y dos estrellas fugaces por nivel que aparecen al empezar y se desvanecen solas a los 20 segundos.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción                    |
| --------- | ------------------------- |
| `←` `→`   | Rotar nave                |
| `↑`       | Propulsar                 |
| `Espacio` | Disparar                  |
| `S`       | Cambiar de skin de nave   |

En la pantalla de `GAME OVER`, `Espacio` reinicia la partida.

## Puntuación

| Asteroide             | Puntos |
| --------------------- | ------ |
| Grande                | 20     |
| Mediano               | 50     |
| Pequeño               | 100    |
| Estrella fugaz        | 150    |
| Power-up              | 50     |

## Estrella fugaz

- Aparecen **2 al principio de cada nivel**, dibujadas en ámbar relleno con estela y
  resplandor (los asteroides normales son solo contorno blanco).
- Se mueven **más rápido que un asteroide grande** (~87 px/s frente a ~32 px/s), así que
  hay que anticipar el tiro.
- **No se parten**: un solo disparo las destruye y dan **+150 puntos** con una explosión
  grande, sin soltar power-up.
- **Desaparecen solas a los 20 segundos**; en sus últimos 3 s se atenúan y se apagan.
  Perderlas no penaliza nada.
- Chocan con la nave y te matan igual que un asteroide, pero **no bloquean el avance de
  nivel**: el nivel termina cuando no queda ningún asteroide, aunque las estrellas
  todavía estén volando.
- Si chocas con una mientras estás destruyendo un asteroide, solo pierdes **una** vida.

## Power-ups

Los dos sueltan un asteroide al destruirlo (**4%** el de triple shot, **8%** el de velocidad), se
recogen **pasando la nave por encima**, valen **+50 puntos** y duran **5 segundos**. Cada uno
puede estar activo a la vez que el otro: son temporizadores independientes y cada uno tiene su
barra bajo el `SCORE`. El efecto **sobrevive a la muerte y al cambio de nivel** en ambos casos.
Los power-ups sin recoger duran 10 s y parpadean antes de expirar.

### Velocidad (cuadrado cian)

- Duplica la propulsión durante **5 segundos**: la velocidad máxima pasa de ≈330 a ≈670 px/s.
  No afecta a la rotación ni a las balas.
- Mientras dura, la llama del propulsor se dibuja cian.

### Triple shot (círculo magenta con tres cañones)

- Cada disparo sale de **3 balas** en lugar de una durante **5 segundos**.
- Las tres van **en línea recta**, con el mismo ángulo que la nariz: no se abren en abanico,
  solo se separan unos píxeles en perpendicular para que no nazcan solapadas en el mismo punto.
- **No cambia la cadencia**: el cooldown entre disparos sigue siendo de 0.2 s, así que durante
  el efecto salen 15 balas por segundo en vez de 5.
- Mientras dura, la nariz de la nave muestra tres marcas magenta con la misma formación.

## Skins

- Cinco apariencias para la nave: `CLÁSICA`, `DELTA`, `PLATO`, `CRUZ` y `ESQUIRLA`. Cada una
  cambia **silueta, color del casco y color de la llama** del propulsor.
- Se cambian con la tecla `S`, que pasa a la siguiente en bucle. Funciona en cualquier estado
  (jugando, muerto o en `GAME OVER`).
- El nombre de la skin activa se ve abajo a la izquierda como `NAVE  <NOMBRE>` y **destella en
  su propio color** durante un momento al cambiarla.
- **La elección se recuerda** entre sesiones (`localStorage`); si el navegador lo bloquea, el
  juego sigue funcionando y vuelve a la primera skin.
- Las skins son solo apariencia: **la física y el radio de colisión son idénticos en todas**, así que
  la nave se maneja igual con cualquiera. Los iconos de vida del HUD usan también la silueta
  activa.
- Al cambiar de skin, la punta desde la que salen las balas (`nose`) se ajusta a la nueva
  silueta.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Niveles cada vez más poblados: 4 asteroides en el primero y `3 + nivel` en los siguientes; el nivel se muestra en el HUD como `NIVEL`
- GAME OVER con el puntaje final y reinicio con `Espacio`
