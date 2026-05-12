const NUM_CUBES = 9;
const CUBE_SIZE = 60;
const SPACING = 88;
const CAM_RADIUS = 700;
const CAM_HEIGHT = -280;

const ROLL_SPEED = 0.08;
const PAUSE_FRAMES = 15;

let completedRolls = 0;
let rollAngle = 0;      // 0..PI/2 during rolling, 0 during pause
let phase = 'rolling';
let pauseTimer = 0;

function setup() {
  createCanvas(854, 480, WEBGL);
  frameRate(30);
  perspective(PI / 3, width / height, 0.1, 5000);
}

function draw() {
  background(0);
  camera(0, CAM_HEIGHT, CAM_RADIUS, 0, 0, 0, 0, 1, 0);

  const s = CUBE_SIZE;
  const baseOffset = ((NUM_CUBES - 1) * SPACING) / 2;

  // How far the belt has scrolled (pixels), grows continuously
  let beltScroll = completedRolls * s + (rollAngle / (PI / 2)) * s;

  drawBelt(beltScroll);

  for (let i = 0; i < NUM_CUBES; i++) {
    let cubeX = i * SPACING - baseOffset;

    // Y: cube center rises during each 90° roll (real rolling geometry)
    // derived from rotating around a fixed bottom edge in belt-frame coords
    let yOff = (s / 2) * (1 - sin(rollAngle) - cos(rollAngle));

    // Total rotation accumulates: 90° per completed roll + current partial roll
    let totalRot = completedRolls * PI / 2 + rollAngle;

    push();
    translate(cubeX, yOff, 0);
    rotateZ(totalRot);
    wireCube(s);
    pop();
  }

  if (phase === 'rolling') {
    rollAngle += ROLL_SPEED;
    if (rollAngle >= PI / 2) {
      rollAngle = 0;
      completedRolls++;
      phase = 'paused';
      pauseTimer = PAUSE_FRAMES;
    }
  } else {
    if (--pauseTimer <= 0) {
      phase = 'rolling';
    }
  }
}

function drawBelt(scrollOffset) {
  const s = CUBE_SIZE;
  const beltY = s / 2;
  const beltHalfX = 520;
  const beltHalfZ = s * 0.72;
  const slatSpacing = 22;

  stroke(85);
  strokeWeight(0.8);
  noFill();

  // Long edges of the belt top surface
  line(-beltHalfX, beltY, -beltHalfZ,  beltHalfX, beltY, -beltHalfZ);
  line(-beltHalfX, beltY,  beltHalfZ,  beltHalfX, beltY,  beltHalfZ);

  // Left/right end caps
  line(-beltHalfX, beltY, -beltHalfZ, -beltHalfX, beltY, beltHalfZ);
  line( beltHalfX, beltY, -beltHalfZ,  beltHalfX, beltY, beltHalfZ);

  // Scrolling slats (lines along Z, scrolling left)
  let phase = scrollOffset % slatSpacing;
  let startK = floor(-beltHalfX / slatSpacing) - 1;
  let endK   = ceil( beltHalfX / slatSpacing) + 1;
  for (let k = startK; k <= endK; k++) {
    let sx = k * slatSpacing - phase;
    if (sx >= -beltHalfX && sx <= beltHalfX) {
      line(sx, beltY, -beltHalfZ, sx, beltY, beltHalfZ);
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
