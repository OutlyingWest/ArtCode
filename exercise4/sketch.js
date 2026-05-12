const NUM_CUBES = 5;
const CUBE_SIZE = 80;
const SPACING = 160;
const CAM_RADIUS = 400;
const CAM_HEIGHT = -200;

const ROLL_SPEED = 0.08;
const BELT_TURN_AXIS = 'z';      // 'z' = screen plane, 'y' = horizontal turn
const BELT_TURN_DIRECTION = -1;  // -1 = clockwise, 1 = counter-clockwise
const PATTERN_SIZE = 18;

// Bounce physics: one-sided contact with the belt.
// Gravity pulls the cube back into the belt; restitution reflects impact
// velocity with energy loss, so the cube bounces instead of springing.
const BOUNCE_GRAVITY     = 0.006;  // angular acceleration back toward the belt (rad/frame^2)
const BOUNCE_RESTITUTION = 0.62;   // 0..1; lower = less elastic collision
const BOUNCE_STOP_SPEED  = 0.006;  // impact speed below this settles the cube

const PHASE_ROLLING = 'rolling';
const PHASE_BOUNCING = 'bouncing';
const PHASE_BELT_TURNING = 'belt_turning';
const PHASE_BELT_BOUNCING = 'belt_bouncing';

let cubeRolls = Array(NUM_CUBES).fill(0);
let beltTravelSteps = 0;
let beltQuarterTurns = 0;
let rollAngle   = 0;   // 0..PI/2 during 'rolling'
let bounceDelta = 0;   // angular deviation from rest during 'bouncing'
let bounceVel   = 0;   // angular velocity of bounce
let beltTurnAngle = 0;
let beltTurnBounceDelta = 0;
let beltTurnBounceVel = 0;
let phase       = PHASE_ROLLING;

const PHASES = {
  [PHASE_ROLLING]: {
    beltAngle() {
      return settledBeltAngle();
    },

    beltTravel(s) {
      return rollProgress() * s;
    },

    cubePose(s, cubeX) {
      return rollingPose(s, cubeX, rollAngle);
    },

    update() {
      rollAngle += ROLL_SPEED;
      if (rollAngle >= PI / 2) {
        rollAngle = 0;
        advanceCubeRolls();
        beltTravelSteps++;
        transitionTo(PHASE_BOUNCING, { impactSpeed: ROLL_SPEED });
      }
    }
  },

  [PHASE_BOUNCING]: {
    beltAngle() {
      return settledBeltAngle();
    },

    enter({ impactSpeed }) {
      bounceDelta = 0;
      // The roll ends by hitting the belt. Reflect that impact immediately
      // so the next motion goes upward, away from the surface.
      bounceVel = -impactSpeed * BOUNCE_RESTITUTION;
    },

    beltTravel() {
      return 0;
    },

    cubePose(s, cubeX) {
      return bouncePose(s, cubeX, bounceDelta);
    },

    update() {
      bounceVel += BOUNCE_GRAVITY;
      bounceDelta += bounceVel;

      // bounceDelta must stay <= 0. Positive values rotate the cube through the
      // belt, so contact clamps the angle and reflects velocity with energy loss.
      if (bounceDelta >= 0) {
        bounceDelta = 0;
        if (bounceVel < BOUNCE_STOP_SPEED) {
          bounceVel = 0;
          transitionTo(PHASE_BELT_TURNING);
        } else {
          bounceVel = -bounceVel * BOUNCE_RESTITUTION;
        }
      }
    }
  },

  [PHASE_BELT_TURNING]: {
    enter() {
      beltTurnAngle = 0;
      rollAngle = 0;
    },

    beltAngle() {
      return settledBeltAngle() + beltTurnAngle;
    },

    beltTravel(s) {
      return rollProgress() * s;
    },

    cubePose(s, cubeX, index) {
      if (index === centerCubeIndex()) {
        return restPose(s, cubeX);
      }
      return rollingPose(s, cubeX, rollAngle);
    },

    update() {
      rollAngle += ROLL_SPEED;
      beltTurnAngle += BELT_TURN_DIRECTION * ROLL_SPEED;

      if (abs(beltTurnAngle) >= PI / 2) {
        rollAngle = 0;
        beltTurnAngle = beltTurnTarget();
        advanceCubeRollsExcept(centerCubeIndex());
        beltTravelSteps++;
        transitionTo(PHASE_BELT_BOUNCING, { impactSpeed: ROLL_SPEED });
      }
    }
  },

  [PHASE_BELT_BOUNCING]: {
    enter({ impactSpeed }) {
      beltTurnBounceDelta = 0;
      beltTurnBounceVel = -BELT_TURN_DIRECTION * impactSpeed * BOUNCE_RESTITUTION;
    },

    beltAngle() {
      return settledBeltAngle() + beltTurnTarget() + beltTurnBounceDelta;
    },

    beltTravel() {
      return 0;
    },

    cubePose(s, cubeX) {
      return restPose(s, cubeX);
    },

    update() {
      beltTurnBounceVel += BELT_TURN_DIRECTION * BOUNCE_GRAVITY;
      beltTurnBounceDelta += beltTurnBounceVel;

      if (BELT_TURN_DIRECTION * beltTurnBounceDelta >= 0) {
        beltTurnBounceDelta = 0;
        if (abs(beltTurnBounceVel) < BOUNCE_STOP_SPEED) {
          beltTurnBounceVel = 0;
          beltTurnAngle = 0;
          beltQuarterTurns = (beltQuarterTurns + 1) % 4;
          transitionTo(PHASE_ROLLING);
        } else {
          beltTurnBounceVel = -beltTurnBounceVel * BOUNCE_RESTITUTION;
        }
      }
    }
  }
};

function setup() {
  createCanvas(854, 480, WEBGL);
  frameRate(30);
  perspective(PI / 3, width / height, 0.1, 5000);
}

function draw() {
  background(0);

  const s = CUBE_SIZE;
  const baseOffset = ((NUM_CUBES - 1) * SPACING) / 2;
  const currentPhase = getCurrentPhase();
  const centerIndex = centerCubeIndex();
  const centerCubeX = cubeXAt(centerIndex, baseOffset);
  const centerPose = currentPhase.cubePose(s, centerCubeX, centerIndex);
  const beltAngle = currentPhase.beltAngle();

  attachCameraTo(beltToWorld(cubeCenterFromPose(s, centerPose), beltAngle));

  let beltScroll = beltTravelSteps * s + currentPhase.beltTravel(s);
  push();
  rotateBelt(beltAngle);
  drawBelt(beltScroll);

  for (let i = 0; i < NUM_CUBES; i++) {
    let cubeX  = cubeXAt(i, baseOffset);
    let pose = currentPhase.cubePose(s, cubeX, i);

    push();
    translate(pose.pivotX, s / 2, 0);
    rotateZ(pose.angle);
    translate(pose.cubeOffsetX, -s / 2, 0);
    rotateZ(cubeRolls[i] * PI / 2);
    wireCube(s);
    pop();
  }
  pop();

  currentPhase.update();
}

function cubeXAt(index, baseOffset) {
  return index * SPACING - baseOffset;
}

function attachCameraTo(anchor) {
  camera(
    anchor.x,
    anchor.y + CAM_HEIGHT,
    anchor.z + CAM_RADIUS,
    anchor.x,
    anchor.y,
    anchor.z,
    0,
    1,
    0
  );
}

function beltToWorld(point, beltAngle) {
  if (BELT_TURN_AXIS === 'y') {
    return {
      x: point.x * cos(beltAngle) + point.z * sin(beltAngle),
      y: point.y,
      z: -point.x * sin(beltAngle) + point.z * cos(beltAngle)
    };
  }

  return {
    x: point.x * cos(beltAngle) - point.y * sin(beltAngle),
    y: point.x * sin(beltAngle) + point.y * cos(beltAngle),
    z: point.z
  };
}

function rotateBelt(beltAngle) {
  if (BELT_TURN_AXIS === 'y') {
    rotateY(beltAngle);
  } else {
    rotateZ(beltAngle);
  }
}

function cubeCenterFromPose(s, pose) {
  let localX = pose.cubeOffsetX;
  let localY = -s / 2;
  return {
    x: pose.pivotX + localX * cos(pose.angle) - localY * sin(pose.angle),
    y: s / 2 + localX * sin(pose.angle) + localY * cos(pose.angle),
    z: 0
  };
}

function rollingPose(s, cubeX, angle) {
  let beltShift = angle / (PI / 2) * s;
  return {
    angle,
    pivotX: cubeX + s / 2 - beltShift,
    cubeOffsetX: -s / 2
  };
}

function bouncePose(s, cubeX, angle) {
  return {
    angle,
    pivotX: cubeX - s / 2,
    cubeOffsetX: s / 2
  };
}

function restPose(s, cubeX) {
  return bouncePose(s, cubeX, 0);
}

function rollProgress() {
  return rollAngle / (PI / 2);
}

function settledBeltAngle() {
  return beltQuarterTurns * beltTurnTarget();
}

function beltTurnTarget() {
  return BELT_TURN_DIRECTION * PI / 2;
}

function centerCubeIndex() {
  return Math.floor(NUM_CUBES / 2);
}

function advanceCubeRolls() {
  for (let i = 0; i < cubeRolls.length; i++) {
    cubeRolls[i]++;
  }
}

function advanceCubeRollsExcept(excludedIndex) {
  for (let i = 0; i < cubeRolls.length; i++) {
    if (i !== excludedIndex) {
      cubeRolls[i]++;
    }
  }
}

function getCurrentPhase() {
  let currentPhase = PHASES[phase];
  if (!currentPhase) {
    throw new Error(`Unknown phase: ${phase}`);
  }
  return currentPhase;
}

function transitionTo(nextPhase, payload = {}) {
  let next = PHASES[nextPhase];
  if (!next) {
    throw new Error(`Unknown phase: ${nextPhase}`);
  }

  phase = nextPhase;
  if (next.enter) {
    next.enter(payload);
  }
}

function drawBelt(scrollOffset) {
  const s = CUBE_SIZE;
  const beltY      = s / 2;
  const beltHalfX  = 520;
  const cellSize   = s;
  const beltHalfZ  = s * 0.72;

  stroke(85);
  strokeWeight(0.8);
  noFill();

  line(-beltHalfX, beltY, -beltHalfZ,  beltHalfX, beltY, -beltHalfZ);
  line(-beltHalfX, beltY,  beltHalfZ,  beltHalfX, beltY,  beltHalfZ);
  line(-beltHalfX, beltY, -beltHalfZ, -beltHalfX, beltY,  beltHalfZ);
  line( beltHalfX, beltY, -beltHalfZ,  beltHalfX, beltY,  beltHalfZ);

  // Lines are one cube-size apart and offset by half a cell, so each settled
  // cube sits centered between two transverse lines after every roll.
  let off    = scrollOffset % cellSize;
  let startK = floor(-beltHalfX / cellSize) - 1;
  let endK   = ceil( beltHalfX / cellSize) + 1;
  for (let k = startK; k <= endK; k++) {
    let sx = k * cellSize + cellSize / 2 - off;
    if (sx >= -beltHalfX && sx <= beltHalfX) {
      line(sx, beltY, -beltHalfZ, sx, beltY, beltHalfZ);
    }
  }

  stroke(145);
  strokeWeight(1);
  for (let k = startK; k <= endK; k++) {
    let cellCenterX = k * cellSize - off;
    if (cellCenterX >= -beltHalfX && cellCenterX <= beltHalfX) {
      push();
      translate(cellCenterX, beltY, 0);
      rotateX(PI / 2);
      cornerSquarePattern(PATTERN_SIZE);
      pop();
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

  drawCubeFacePatterns(s);
}

function drawCubeFacePatterns(s) {
  let h = s / 2;

  stroke(255);
  strokeWeight(1);

  push();
  translate(0, 0, h);
  cornerSquarePattern(PATTERN_SIZE);
  pop();

  push();
  translate(0, 0, -h);
  cornerSquarePattern(PATTERN_SIZE);
  pop();

  push();
  translate(h, 0, 0);
  rotateY(PI / 2);
  cornerSquarePattern(PATTERN_SIZE);
  pop();

  push();
  translate(-h, 0, 0);
  rotateY(PI / 2);
  cornerSquarePattern(PATTERN_SIZE);
  pop();

  push();
  translate(0, h, 0);
  rotateX(PI / 2);
  cornerSquarePattern(PATTERN_SIZE);
  pop();

  push();
  translate(0, -h, 0);
  rotateX(PI / 2);
  cornerSquarePattern(PATTERN_SIZE);
  pop();
}

function cornerSquarePattern(size) {
  let h = size / 2;
  let c = size * 0.32;

  line(-h, -h, 0, -h + c, -h, 0);
  line(-h, -h, 0, -h, -h + c, 0);

  line(h, -h, 0, h - c, -h, 0);
  line(h, -h, 0, h, -h + c, 0);

  line(h, h, 0, h - c, h, 0);
  line(h, h, 0, h, h - c, 0);

  line(-h, h, 0, -h + c, h, 0);
  line(-h, h, 0, -h, h - c, 0);
}
