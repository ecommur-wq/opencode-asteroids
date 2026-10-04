'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

// ── Estrella fugaz ────────────────────────────────────────────────────────────
const SHOOTING_STAR_TTL    = 20;   // s que sobrevive antes de desaparecer
const SHOOTING_STAR_POINTS = 150;  // no se divide, así que vale más que un grande

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Shooter (estrella fugaz) ──────────────────────────────────────────────────
// Asteroide especial: no se divide, va más rápido que un grande y se autodestruye
// a los SHOOTING_STAR_TTL segundos. Usa size 3 para poder reutilizar RADII y
// explode(x, y, size * 5), pero con radio propio.
class Shooter {
  constructor(x, y) {
    this.x    = x;
    this.y    = y;
    this.size = 3;

    const RADIUS = 40;
    const SPEED  = SPEEDS[3] + 55 + rand(-15, 15);   // ~2.7x un asteroide grande
    const angle  = rand(0, Math.PI * 2);
    this.radius = RADIUS;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular, igual que Asteroid pero se rellena
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = RADIUS * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }

    this.trail = [];
    this.ttl  = SHOOTING_STAR_TTL;
    this.dead = false;
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;

    this.trail.push([this.x, this.y]);
    if (this.trail.length > 14) this.trail.shift();

    if (this.ttl <= 0) this.dead = true;
  }

  split() {
    return [];   // a propósito: la estrella fugaz no se parte
  }

  draw() {
    const fade = Math.min(1, this.ttl / 3);   // se apaga en los últimos 3 s

    // Estela
    if (this.trail.length > 1) {
      ctx.lineWidth = 2;
      ctx.lineCap   = 'round';
      for (let i = 1; i < this.trail.length; i++) {
        const alpha = (i / this.trail.length) * 0.5 * fade;
        ctx.strokeStyle = `rgba(255,190,80,${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.moveTo(this.trail[i - 1][0], this.trail[i - 1][1]);
        ctx.lineTo(this.trail[i][0], this.trail[i][1]);
        ctx.stroke();
      }
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.lineJoin = 'round';

    // Resplandor
    ctx.shadowColor = '#ffbe50';
    ctx.shadowBlur  = 14;
    ctx.fillStyle   = 'rgba(255,190,80,0.9)';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
const SPEED_DURATION  = 5;  // s que dura el power-up de velocidad
const TRIPLE_DURATION = 5;  // s que dura el power-up de triple shot

class Ship {
  constructor() {
    // A propósito fuera de reset(): los efectos sobreviven a la muerte y al cambio de nivel
    this.speedTimer = 0;
    this.tripleTimer = 0;
    this.reset();
  }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedTimer    > 0) this.speedTimer    -= dt;
    if (this.tripleTimer   > 0) this.tripleTimer   -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260 * (this.speedTimer > 0 ? 2 : 1);  // px/s² (x2 con "Velocidad")
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const nx = Math.cos(this.angle);
    const ny = Math.sin(this.angle);

    // Triple shot: las 3 balas salen con el MISMO ángulo (línea recta hacia delante) y se
    // separan solo en perpendicular unos píxeles, para que no se solapen en un solo punto
    if (this.tripleTimer > 0) {
      const px = Math.cos(this.angle + Math.PI / 2);
      const py = Math.sin(this.angle + Math.PI / 2);
      return [-5, 0, 5].map(o =>
        new Bullet(this.x + nx * NOSE + px * o, this.y + ny * NOSE + py * o, this.angle));
    }

    return [new Bullet(this.x + nx * NOSE, this.y + ny * NOSE, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo( 20,  0);   // nariz
    ctx.lineTo(-12, -9);   // ala izquierda
    ctx.lineTo( -7,  0);   // muesca trasera
    ctx.lineTo(-12,  9);   // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      const boost = this.speedTimer > 0;
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14) * (boost ? 2 : 1), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = boost ? '#5cf' : 'rgba(255, 130, 0, 0.85)';
      ctx.stroke();
    }

    // Triple shot: tres marcas magenta en la nariz, la misma formación que dispara
    if (this.tripleTimer > 0) {
      ctx.strokeStyle = '#f6f';
      ctx.lineWidth = 1.5;
      for (const o of [-5, 0, 5]) {
        ctx.beginPath();
        ctx.moveTo(22, o);
        ctx.lineTo(28, o);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-ups (Velocidad / Triple shot) ───────────────────────────────────────
class Pickup {
  constructor(x, y, kind = 'speed') {
    this.x = x;
    this.y = y;
    this.kind = kind;   // 'speed' | 'triple'
    this.vx = rand(-25, 25);
    this.vy = rand(-25, 25);
    this.rot = rand(0, Math.PI * 2);
    this.rotSpeed = rand(-2, 2);
    this.radius = 10;
    this.ttl = 10;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    if (this.ttl < 3 && Math.floor(this.ttl * 8) % 2 === 0) return;  // parpadeo al expirar

    const s = this.radius * 0.7;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.lineWidth = 1.5;
    ctx.lineJoin    = 'round';

    if (this.kind === 'triple') {
      // Círculo con tres cañones, la misma formación en línea que dispara la nave
      ctx.strokeStyle = '#f6f';
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.stroke();
      for (const o of [-4, 0, 4]) {
        ctx.beginPath();
        ctx.moveTo(o, -s * 0.55);
        ctx.lineTo(o,  s * 0.55);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = '#5cf';
      ctx.beginPath();
      ctx.moveTo(-s, -s);
      ctx.lineTo( s, -s);
      ctx.lineTo( s,  s);
      ctx.lineTo(-s,  s);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, pickups, shooters;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function spawnShooters(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    shooters.push(new Shooter(x, y));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  pickups   = [];
  shooters  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
  spawnShooters(2);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  pickups   = [];
  shooters  = [];
  ship.reset();
  spawnAsteroids(3 + level);
  spawnShooters(2);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    pickups.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    pickups = pickups.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    pickups.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    pickups = pickups.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    shooters.forEach(s => s.update(dt));
    // Las estrellas sí caducan solas, a diferencia de los asteroides: hay que filtrarlas aquí
    shooters = shooters.filter(s => !s.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  shooters.forEach(s => s.update(dt));
  particles.forEach(p => p.update(dt));
  pickups.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  pickups   = pickups.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        // Una sola tirada para que un mismo punto no suelte los dos power-ups:
        // 4% triple shot y 8% velocidad (la de velocidad conserva su probabilidad)
        const drop = Math.random();
        if (drop < 0.04)     pickups.push(new Pickup(a.x, a.y, 'triple'));
        else if (drop < 0.12) pickups.push(new Pickup(a.x, a.y));
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Bala vs estrella fugaz
  for (const b of bullets) {
    if (b.dead) continue;
    for (const s of shooters) {
      if (!s.dead && dist(b, s) < s.radius) {
        b.dead = true;
        s.dead = true;
        score += SHOOTING_STAR_POINTS;
        explode(s.x, s.y, 16);
        break;
      }
    }
  }
  shooters = shooters.filter(s => !s.dead);
  bullets  = bullets.filter(b => !b.dead);

  // Recoger power-up
  for (const p of pickups) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      score += 50;
      if (p.kind === 'triple') ship.tripleTimer = TRIPLE_DURATION;
      else                      ship.speedTimer  = SPEED_DURATION;
    }
  }

  // Nave vs asteroide / estrella fugaz
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
    // La guarda !ship.dead evita morir dos veces en el mismo frame (y perder 2 vidas)
    if (!ship.dead) {
      for (const s of shooters) {
        if (dist(ship, s) < ship.radius + s.radius * 0.82) {
          killShip();
          break;
        }
      }
    }
  }

  // Nivel completado (las estrellas fugaces no bloquean el avance a propósito)
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

// ── Barra de tiempo del power-up de velocidad ─────────────────────────────────
function drawSpeedBar() {
  if (ship.speedTimer <= 0) return;

  const x = 14, y = 42, w = 130, h = 8;

  ctx.strokeStyle = '#5cf';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#5cf';
  ctx.fillRect(x + 1, y + 1, (w - 2) * (ship.speedTimer / SPEED_DURATION), h - 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#5cf';
  ctx.font = '11px monospace';
  ctx.fillText('VELOCIDAD x2', x, y + h + 13);
}

// ── Barra de tiempo del power-up de triple shot ───────────────────────────────
function drawTripleBar() {
  if (ship.tripleTimer <= 0) return;

  const x = 14, y = 72, w = 130, h = 8;   // y 72: debajo de la de velocidad y su etiqueta

  ctx.strokeStyle = '#f6f';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#f6f';
  ctx.fillRect(x + 1, y + 1, (w - 2) * (ship.tripleTimer / TRIPLE_DURATION), h - 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f6f';
  ctx.font = '11px monospace';
  ctx.fillText('TRIPLE x3', x, y + h + 13);
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Al final porque las dos barras cambian ctx.font y textAlign del resto del HUD
  drawSpeedBar();
  drawTripleBar();
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  pickups.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  shooters.forEach(s => s.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
