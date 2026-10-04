# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye un power-up de velocidad que duplica la propulsión durante 5 segundos.

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

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

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
