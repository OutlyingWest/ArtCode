const NUM_CUBES = 5;
const CUBE_SIZE = 80;
const SPACING = 160;
const CAM_RADIUS = 400;
const CAM_HEIGHT = -200;

const ROLL_SPEED = 0.08;

// Bounce physics: one-sided contact with the belt.
// Gravity pulls the cube back into the belt; restitution reflects impact
// velocity with energy loss, so the cube bounces instead of springing.
const BOUNCE_GRAVITY     = 0.006;  // angular acceleration back toward the belt (rad/frame^2)
const BOUNCE_RESTITUTION = 0.62;   // 0..1; lower = less elastic collision
const BOUNCE_STOP_SPEED  = 0.006;  // impact speed below this settles the cube

let completedRolls = 0;
let rollAngle   = 0;   // 0..PI/2 during 'rolling'
let bounceDelta = 0;   // angular deviation from rest during 'bouncing'
let bounceVel   = 0;   // angular velocity of bounce
let phase       = 'rolling'; // 'rolling' | 'bouncing'

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

  // Belt scrolls during rolling only; stops while cubes rock
  let beltScroll = completedRolls * s + (phase === 'rolling' ? rollAngle / (PI / 2) * s : 0);
  drawBelt(beltScroll);

  // Explicit pivot transform: rotate around the corner touching the belt,
  // not around the cube center.  beltShift tracks how far the pivot has
  // drifted left in world-X as the cube rolls (0 during bounce = belt stopped).
  let a         = (phase === 'rolling') ? rollAngle   : bounceDelta;
  let beltShift = (phase === 'rolling') ? rollAngle / (PI / 2) * s : 0;

  for (let i = 0; i < NUM_CUBES; i++) {
    let cubeX  = i * SPACING - baseOffset;
    // Rolling: pivot is the leading bottom edge, tracks with belt scroll.
    // Bouncing: pivot is the trailing edge (the one the cube just rolled around),
    //           always at cubeX − s/2 while the belt is stopped.
    let pivotX = (phase === 'rolling') ? cubeX + s / 2 - beltShift : cubeX - s / 2;
    let t2x    = (phase === 'rolling') ? -s / 2 : s / 2;

    push();
    translate(pivotX, s / 2, 0);
    rotateZ(a);
    translate(t2x, -s / 2, 0);
    rotateZ(completedRolls * PI / 2);
    wireCube(s);
    pop();
  }

  // ── state machine ──────────────────────────────────────────────
  if (phase === 'rolling') {
    rollAngle += ROLL_SPEED;
    if (rollAngle >= PI / 2) {
      rollAngle = 0;
      completedRolls++;
      bounceDelta = 0;
      // The roll ends by hitting the belt. Reflect that impact immediately
      // so the next motion goes upward, away from the surface.
      bounceVel   = -ROLL_SPEED * BOUNCE_RESTITUTION;
      phase       = 'bouncing';
    }
  } else { // bouncing: ballistic rotation with inelastic impacts
    bounceVel += BOUNCE_GRAVITY;
    bounceDelta += bounceVel;

    // bounceDelta must stay <= 0. Positive values rotate the cube through the
    // belt, so contact clamps the angle and reflects velocity with energy loss.
    if (bounceDelta >= 0) {
      bounceDelta = 0;
      if (bounceVel < BOUNCE_STOP_SPEED) {
        bounceVel = 0;
        phase     = 'rolling';
      } else {
        bounceVel = -bounceVel * BOUNCE_RESTITUTION;
      }
    }
  }
}

function drawBelt(scrollOffset) {
  const s = CUBE_SIZE;
  const beltY      = s / 2;
  const beltHalfX  = 520;
  const beltHalfZ  = s * 0.72;
  const slatSpacing = 22;

  stroke(85);
  strokeWeight(0.8);
  noFill();

  line(-beltHalfX, beltY, -beltHalfZ,  beltHalfX, beltY, -beltHalfZ);
  line(-beltHalfX, beltY,  beltHalfZ,  beltHalfX, beltY,  beltHalfZ);
  line(-beltHalfX, beltY, -beltHalfZ, -beltHalfX, beltY,  beltHalfZ);
  line( beltHalfX, beltY, -beltHalfZ,  beltHalfX, beltY,  beltHalfZ);

  let off    = scrollOffset % slatSpacing;
  let startK = floor(-beltHalfX / slatSpacing) - 1;
  let endK   = ceil( beltHalfX / slatSpacing) + 1;
  for (let k = startK; k <= endK; k++) {
    let sx = k * slatSpacing - off;
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
