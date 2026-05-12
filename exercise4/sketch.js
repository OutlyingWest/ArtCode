const NUM_CUBES = 9;
const CUBE_SIZE = 60;
const SPACING = 88;
const CAM_RADIUS = 700;
const CAM_HEIGHT = -280;

// Roll: PI/2 over ~20 frames at 30fps (~0.65s), pause 15 frames (~0.5s)
const ROLL_SPEED = 0.08;
const PAUSE_FRAMES = 15;

let completedRolls = 0;
let rollAngle = 0;
let phase = 'rolling';
let pauseTimer = 0;
let pivotX = []; // fixed X pivot for each cube during current roll

function computePivots() {
  const s = CUBE_SIZE;
  const beltWidth = NUM_CUBES * SPACING;
  const halfBelt = beltWidth / 2;
  const baseOffset = ((NUM_CUBES - 1) * SPACING) / 2;
  pivotX = [];
  for (let i = 0; i < NUM_CUBES; i++) {
    // Raw X after completedRolls, then wrap within belt period
    let rawX = i * SPACING - baseOffset + completedRolls * s;
    let wrappedX = ((rawX + halfBelt) % beltWidth + beltWidth) % beltWidth - halfBelt;
    // Pivot is at the cube's right bottom edge
    pivotX[i] = wrappedX + s / 2;
  }
}

function setup() {
  createCanvas(854, 480, WEBGL);
  frameRate(30);
  perspective(PI / 3, width / height, 0.1, 5000);
  computePivots();
}

function draw() {
  background(0);

  // Fixed camera — no orbital rotation
  camera(0, CAM_HEIGHT, CAM_RADIUS, 0, 0, 0, 0, 1, 0);

  const s = CUBE_SIZE;
  const floorY = s / 2; // cube centers sit at y=0, floor at y=s/2

  for (let i = 0; i < NUM_CUBES; i++) {
    push();
    // Move to pivot (bottom-right edge of cube at rest), rotate, draw
    translate(pivotX[i], floorY, 0);
    rotateZ(rollAngle);
    translate(-s / 2, -s / 2, 0);
    wireCube(s);
    pop();
  }

  if (phase === 'rolling') {
    rollAngle += ROLL_SPEED;
    if (rollAngle >= PI / 2) {
      rollAngle = 0;
      completedRolls++;
      computePivots();   // recompute pivots for the next roll
      phase = 'paused';
      pauseTimer = PAUSE_FRAMES;
    }
  } else {
    if (--pauseTimer <= 0) {
      phase = 'rolling';
    }
  }
}

function wireCube(s) {
  let h = s / 2;
  let v = [
    [-h, -h, -h], [ h, -h, -h], [ h,  h, -h], [-h,  h, -h],
    [-h, -h,  h], [ h, -h,  h], [ h,  h,  h], [-h,  h,  h]
  ];
  let edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7]
  ];

  noFill();
  stroke(255);
  strokeWeight(1.2);
  for (let [a, b] of edges) {
    beginShape(LINES);
    vertex(v[a][0], v[a][1], v[a][2]);
    vertex(v[b][0], v[b][1], v[b][2]);
    endShape();
  }

  noStroke();
  fill(255);
  for (let p of v) {
    push();
    translate(p[0], p[1], p[2]);
    sphere(3.5);
    pop();
  }
}
