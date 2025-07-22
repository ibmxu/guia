// === ANIMAÇÃO DE PARTÍCULAS NO TOPO ===
let particles = [];
let state = 0;
let stateTimer = 0;

function setup() {
  let canvas = createCanvas(800, 100);
  canvas.parent('animacao-biologica');
  for (let i = 0; i < 120; i++) {
    particles.push(new Particle());
  }
}

function draw() {
  clear();
  stateTimer++;
  if (stateTimer > 480) {
    state = (state + 1) % 5;
    stateTimer = 0;
  }
  for (let p of particles) {
    p.update(state);
    p.interactWithMouse();
    p.show();
  }
}

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.pos = createVector(random(width), random(height));
    this.vel = p5.Vector.random2D().mult(random(0.5, 2));
    this.color = color(50, 150, 255);
    this.size = 5;
  }
  interactWithMouse() {
    let d = dist(this.pos.x, this.pos.y, mouseX, mouseY);
    if (d < 80) {
      let flee = p5.Vector.sub(this.pos, createVector(mouseX, mouseY));
      flee.setMag(2);
      this.pos.add(flee);
    }
  }
  update(state) {
    switch (state) {
      case 0:
        this.pos.add(this.vel);
        this.edges();
        break;
      case 1:
        this.target = createVector(width / 2 + cos(this.angleIndex()) * 150, height / 2 + sin(this.angleIndex()) * 60);
        this.pos.lerp(this.target, 0.05);
        break;
      case 2:
        let a = this.angleIndex();
        this.target = createVector(width / 2 + sin(a * 5) * 70, height / 2 + (a - PI) * 50);
        this.pos.lerp(this.target, 0.05);
        break;
      case 3:
        let r = 90 * noise(this.angleIndex());
        this.target = createVector(width / 2 + cos(this.angleIndex()) * r, height / 2 + sin(this.angleIndex()) * r);
        this.pos.lerp(this.target, 0.05);
        break;
      case 4:
        this.vel = p5.Vector.random2D().mult(random(0.5, 2));
        this.pos.add(this.vel);
        break;
    }
  }
  angleIndex() {
    return map(particles.indexOf(this), 0, particles.length, 0, TWO_PI);
  }
  edges() {
    if (this.pos.x < 0 || this.pos.x > width) this.vel.x *= -1;
    if (this.pos.y < 0 || this.pos.y > height) this.vel.y *= -1;
  }
  show() {
    fill(0, 0, 0, 50);
    noStroke();
    ellipse(this.pos.x + 1, this.pos.y + 1, this.size);
    stroke(0, 0, 0, 150);
    strokeWeight(0.5);
    fill(255, 255, 255, 220);
    ellipse(this.pos.x, this.pos.y, this.size);
  }
}
