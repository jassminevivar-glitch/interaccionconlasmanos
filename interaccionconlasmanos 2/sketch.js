// ============================================================================
// Mariposa de Manos — p5.js + p5.Sound
// Especificaciones: spec.md
//
// Entrada: cámara web (detección de movimiento simple)
// La cámara se muestra en la web, espejada.
// ============================================================================

let video;
let useCamera = false;
let camReady = false;

let state = 'IDLE';
let lastState = null;

let butterfly = {
  x: 0, y: 0, targetX: 0, targetY: 0,
  w: 110, h: 90, flap: 0, wingAngle: 0, glow: 0
};

let lastPos = null;
let particles = [];

let synth;
let pianoStart = 0;
let pianoDuration = 10000;
let lastNoteTime = 0;
let noteInterval = 180;

const LATERAL_THRESHOLD = 15;
const MOVEMENT_THRESHOLD = 5;

function preload() {}

function setup() {
  createCanvas(640, 480);

  let btn = createButton('Iniciar cámara y audio');
  btn.position(20, 20);
  btn.mousePressed(startApp);

  createDiv('Esperando inicio...').id('status').position(20, 60);

  synth = new p5.PolySynth();
}

function startApp() {
  userStartAudio();

  video = createCapture(VIDEO, () => {
    useCamera = true;
    camReady = true;
    select('#status').html('Cámara activa. Muévele la mano.');
  });

  video.size(640, 480);
  // No ocultamos el video: queremos que se vea en la web

  video.elt.onerror = () => {
    useCamera = false;
    camReady = false;
    select('#status').html('Cámara no disponible. Revisá los permisos del navegador.');
  };

  video.elt.onloadedmetadata = () => {
    if (!useCamera) {
      select('#status').html('Cámara activa. Muévele la mano.');
    }
  };
}

function draw() {
  background(15);

  // Mostrar video espejado si la cámara está activa y lista
  if (useCamera && camReady && video.elt && video.readyState >= 2) {
    push();
    translate(width, 0);
    scale(-1, 1); // espejo horizontal
    image(video, 0, 0, width, height);
    pop();
  }

  // Detectar movimiento de la mano desde la cámara
  let hand = detectMotionFromCamera();

  if (hand) {
    let screenX = width - hand.x; // espejado para coincidir con el video
    let screenY = hand.y;
    let isOpen = hand.isOpen;

    updateState(isOpen, screenX, screenY);
    updateButterfly(screenX, screenY);
    updateParticles();
    updatePiano();

    drawButterfly();
    drawParticles();
  } else {
    if (state !== 'IDLE') {
      state = 'IDLE';
      particles = [];
      pianoStart = 0;
    }
    if (useCamera && camReady) {
      drawStatus('Estado: IDLE — muévele la mano a la cámara');
    }
  }

  if (state !== lastState) {
    select('#status').html('Estado: ' + state);
    lastState = state;
  }
}

// --------------------------------------------------------------------------
// Detección de movimiento por diferencia de frames (cámara)
// --------------------------------------------------------------------------
function detectMotionFromCamera() {
  if (!useCamera || !camReady || !video.elt || video.readyState < 2) return null;

  video.loadPixels();
  if (video.pixels.length === 0) return null;

  let current = video.pixels;

  if (!window.prevCamPixels) {
    window.prevCamPixels = current.slice();
    return null;
  }

  let prev = window.prevCamPixels;

  let motion = 0;
  let sumX = 0;
  let sumY = 0;
  let count = 0;

  for (let i = 0; i < current.length; i += 4) {
    let d = abs(current[i] - prev[i]) +
            abs(current[i+1] - prev[i+1]) +
            abs(current[i+2] - prev[i+2]);

    if (d > 30) {
      motion++;
      sumX += (i / 4) % video.width;
      sumY += floor((i / 4) / video.width);
      count++;
    }
  }

  window.prevCamPixels = current.slice();

  if (count > 50) {
    return {
      x: sumX / count,
      y: sumY / count,
      isOpen: motion > 800
    };
  }

  return null;
}

// --------------------------------------------------------------------------
// Máquina de estados
// --------------------------------------------------------------------------
function updateState(isOpen, screenX, screenY) {
  if (!isOpen) {
    state = 'IDLE';
    particles = [];
    pianoStart = 0;
    return;
  }

  let dx = 0, dy = 0, speed = 0;
  if (lastPos) {
    dx = screenX - lastPos.x;
    dy = screenY - lastPos.y;
    speed = dist(dx, dy, 0, 0);
  }
  lastPos = { x: screenX, y: screenY };

  if (state === 'IDLE') state = 'MANOS_ABIERTAS';
  if (state === 'MANOS_ABIERTAS' && speed > MOVEMENT_THRESHOLD) state = 'MOVIENDOSE';
  if (state === 'MOVIENDOSE' && Math.abs(dx) > LATERAL_THRESHOLD) {
    state = 'LLUVIA';
    triggerRain(screenX, screenY);
  }
}

// --------------------------------------------------------------------------
// Mariposa
// --------------------------------------------------------------------------
function updateButterfly(screenX, screenY) {
  butterfly.targetX = screenX;
  butterfly.targetY = screenY;
  butterfly.x = lerp(butterfly.x, butterfly.targetX, 0.15);
  butterfly.y = lerp(butterfly.y, butterfly.targetY, 0.15);

  if (state === 'MOVIENDOSE' || state === 'LLUVIA') butterfly.flap += 0.25;
  else butterfly.flap += 0.05;
  butterfly.wingAngle = sin(butterfly.flap) * 0.9;
  butterfly.glow = sin(frameCount * 0.1) * 15 + 40;
}

function drawButterfly() {
  if (state === 'IDLE') return;

  push();
  translate(butterfly.x, butterfly.y);

  noFill();
  stroke(255, 255, 180, butterfly.glow);
  strokeWeight(2);
  ellipse(0, 0, butterfly.w + 30, butterfly.h + 30);

  drawFallbackButterfly();
  pop();
}

function drawFallbackButterfly() {
  fill(60);
  noStroke();
  ellipse(0, 0, 12, 34);
  ellipse(0, -18, 16, 16);

  stroke(60);
  strokeWeight(2);
  line(-4, -20, -12, -30);
  line(4, -20, 12, -30);

  push();
  rotate(-butterfly.wingAngle);
  fill(255, 200, 100, 230);
  noStroke();
  ellipse(-34, 4, 52, 38);
  fill(255, 140, 60, 200);
  ellipse(-34, 4, 38, 26);
  pop();

  push();
  rotate(butterfly.wingAngle);
  fill(255, 200, 100, 230);
  noStroke();
  ellipse(34, 4, 52, 38);
  fill(255, 140, 60, 200);
  ellipse(34, 4, 38, 26);
  pop();
}

// --------------------------------------------------------------------------
// Partículas de flores
// --------------------------------------------------------------------------
function triggerRain(x, y) {
  particles = [];
  for (let i = 0; i < 40; i++) particles.push(new FlowerParticle(x, y));
  pianoStart = millis();
  lastNoteTime = 0;
}

class FlowerParticle {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vx = random(-3, 3);
    this.vy = random(-4, -1);
    this.life = 255;
    this.size = random(5, 11);
    this.c = random() > 0.5 ? color(255, 140, 0) : color(255, 220, 0);
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.25;
    this.life -= 4;
  }
  display() {
    let c = this.c;
    fill(red(c), green(c), blue(c), this.life);
    noStroke();
    push();
    translate(this.x, this.y);
    ellipse(0, -this.size / 2, this.size, this.size * 0.6);
    ellipse(0, this.size / 2, this.size, this.size * 0.6);
    ellipse(-this.size / 2, 0, this.size * 0.6, this.size);
    ellipse(this.size / 2, 0, this.size * 0.6, this.size);
    fill(255, 200, 0, this.life);
    ellipse(0, 0, this.size * 0.4);
    pop();
  }
  isDead() {
    return this.life <= 0 || this.y > height + 50 || this.y < -50;
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    if (particles[i].isDead()) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (let p of particles) p.display();
}

// --------------------------------------------------------------------------
// Piano — notas al azar durante 10 s, se reinicia al disparar
// --------------------------------------------------------------------------
function updatePiano() {
  if (state !== 'LLUVIA') return;
  let now = millis();
  if (now - pianoStart >= pianoDuration) { pianoStart = 0; return; }
  if (now - lastNoteTime > noteInterval) {
    playRandomPianoNote();
    lastNoteTime = now;
  }
}

let pianoNotes = [60, 62, 64, 65, 67, 69, 71, 72];

function playRandomPianoNote() {
  if (!synth) return;
  let midi = random(pianoNotes);
  try {
    synth.note(midi, 0.5, 0, 0.4);
  } catch (e) {
    console.log('synth.note falló, usando oscilador:', e);
    let osc = new p5.Oscillator('sine');
    osc.freq(midiToFreq(midi));
    osc.amp(0.5, 0.1);
    setTimeout(() => osc.amp(0, 0.5), 400);
  }
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// --------------------------------------------------------------------------
// Ayudantes
// --------------------------------------------------------------------------
function drawStatus(txt) { select('#status').html(txt); }
