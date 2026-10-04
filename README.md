# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye un power-up de velocidad que duplica la propulsión durante 5 segundos, un power-up de escudo que absorbe un impacto durante 5 segundos y dos estrellas fugaces por nivel que aparecen al empezar y se desvanecen solas a los 20 segundos.

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
| Power-up de escudo    | 50     |

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

- Al destruir un asteroide hay un **8%** de probabilidad de que suelte un power-up (cuadrado
  cian); la mitad de las veces es el de escudo (ver abajo).
- Se recoge **pasando la nave por encima** y vale **+50 puntos**.
- Duplica la propulsión durante **5 segundos**: la velocidad máxima pasa de ≈330 a ≈670 px/s.
  No afecta a la rotación ni a las balas.
- El tiempo restante se ve en una **barra bajo el `SCORE`**; mientras dura, la llama del propulsor se dibuja cian.
- El efecto **sobrevive a la muerte y al cambio de nivel**. El power-up sin recoger dura 10 s y parpadea antes de expirar.

## Power-up: Escudo

- Comparte tirada con el de velocidad: al destruir un asteroide hay un **8%** de probabilidad
  de que suelte un power-up, y la mitad de las veces es el del escudo (**+50 puntos**).
- Se distingue por el **verde** y por un círculo dentro del cuadrado, además del cian liso del
  de velocidad.
- Al recogerlo, una **burbuja verde** rodea la nave durante **5 segundos**, con su barra `ESCUDO`
  en el HUD al lado de la de `VELOCIDAD x2`. La burbuja se atenúa en el último segundo.
- **Absorbe un impacto**: chocar con un asteroide o con una estrella fugaz destruye lo que
  golpea (con su explosión) y consume el escudo **en lugar de** costarte una vida.
  No da puntos ni parte el asteroide: solo te salva.
- Tras absorber, tienes **1 segundo de invencibilidad** para recolocarte sin que te mate otro
  impacto. El segundo choque ya es mortal.
- Solo protege de **contactos**: no hay proyectiles enemigos en el juego, así que no llega a
  bloquear balas (las del jugador tampoco se ven afectadas).
- El efecto **sobrevive a la muerte y al cambio de nivel**, igual que el de velocidad.
  Si el impacto absorbido era el último asteroide, el nivel avanza igualmente.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Escudo temporal que absorbe un impacto (asteroide o estrella fugaz) sin coste de vida
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Niveles cada vez más poblados: 4 asteroides en el primero y `3 + nivel` en los siguientes; el nivel se muestra en el HUD como `NIVEL`
- GAME OVER con el puntaje final y reinicio con `Espacio`
