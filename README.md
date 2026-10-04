# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye un power-up de velocidad que duplica la propulsión durante 5 segundos y dos estrellas fugaces por nivel que aparecen al empezar y se desvanecen solas a los 20 segundos.

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

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |

En la pantalla de `GAME OVER`, `Espacio` reinicia la partida.

## Puntuación

| Asteroide             | Puntos |
| --------------------- | ------ |
| Grande                | 20     |
| Mediano               | 50     |
| Pequeño               | 100    |
| Estrella fugaz        | 150    |
| Power-up de velocidad | 50     |

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

## Power-up: Velocidad

- Al destruir un asteroide hay un **8%** de probabilidad de que suelte un power-up (cuadrado cian).
- Se recoge **pasando la nave por encima** y vale **+50 puntos**.
- Duplica la propulsión durante **5 segundos**: la velocidad máxima pasa de ≈330 a ≈670 px/s.
  No afecta a la rotación ni a las balas.
- El tiempo restante se ve en una **barra bajo el `SCORE`**; mientras dura, la llama del propulsor se dibuja cian.
- El efecto **sobrevive a la muerte y al cambio de nivel**. El power-up sin recoger dura 10 s y parpadea antes de expirar.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Niveles cada vez más poblados: 4 asteroides en el primero y `3 + nivel` en los siguientes; el nivel se muestra en el HUD como `NIVEL`
- GAME OVER con el puntaje final y reinicio con `Espacio`
