const lineCount = 1200; // min=100 max=1200 step=10
const steps = 250; // min=40 max=250 step=5
const stepSize = 2.86; // min=0.3 max=3 step=0.05

// Controls how chaotic the flow field is.
// Low value = smoother stream.
// High value = more turbulent, noisy movement.
const noiseStrength = 4.0; // min=0 max=4 step=0.05

// Controls how strongly the lines bend.
const curveStrength = 5.45; // min=0 max=6 step=0.05


Canvas.setpenopacity(-0.25);
const turtle = new Turtle();


// ------------------------------------------------------------
// HASH FUNCTION
// This function creates a repeatable pseudo-random value.
// The result is always between 0 and 1.
// ------------------------------------------------------------
function hash(x, y) {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return s - Math.floor(s);
}

function noise(x, y) {
    // Integer grid cell coordinates.
    const ix = Math.floor(x);
    const iy = Math.floor(y);

    // Local coordinates inside the current grid cell.
    const fx = x - ix;
    const fy = y - iy;

    // Random values at the four corners of the grid cell.
    const a = hash(ix, iy);
    const b = hash(ix + 1, iy);
    const c = hash(ix, iy + 1);
    const d = hash(ix + 1, iy + 1);

    // Smooth interpolation weights.
    // This makes the transition between grid cells soft.
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);

    // Bilinear interpolation between the four corner values.
    return a * (1 - ux) * (1 - uy)
        + b * ux * (1 - uy)
        + c * (1 - ux) * uy
        + d * ux * uy;
}


// ------------------------------------------------------------
// FLOW FIELD FUNCTION
// ------------------------------------------------------------
function angleField(x, y) {
    // Smooth random value at the current position.
    // The coordinates are scaled down so the noise changes slowly.
    const n = noise(x * 0.035, y * 0.035);

    // A wave component that creates large smooth bends.
    // It prevents the flow from looking like plain straight lines.
    const wave = Math.sin(y * 0.045) + Math.cos(x * 0.035);

    // Attraction direction toward a point near the left/middle area.
    // This helps bend the stream into a large sweeping shape.
    // More than 50 leads to singularity (default = 45)
    xAttractionShift = 54
    const attract = Math.atan2(y + 12, x + xAttractionShift);

    // Final angle is a combination of:
    // 1. attraction direction,
    // 2. sinusoidal wave,
    // 3. smooth noise,
    // 4. extra diagonal bending.
    return attract
        + wave * 0.35
        + (n - 0.5) * noiseStrength
        + Math.sin((x + y) * 0.018) * curveStrength * 0.15;
}


// ------------------------------------------------------------
// DRAW ONE STREAM LINE
//
// The line starts at x, y.
// Then it repeatedly:
//   1. asks angleField() for the local movement direction,
//   2. moves a small step in that direction,
//   3. draws a segment to the new position.
//
// Repeating this creates one curved flowing line.
// ------------------------------------------------------------
function drawStream(x, y, len, drift) {
    // Move to the start position without drawing.
    turtle.penup();
    turtle.goto(x, y);

    // Start drawing from this point.
    turtle.pendown();

    // Move step by step through the flow field.
    for (let i = 0; i < len; i++) {
        // Get the local direction and add a small personal drift.
        // Drift makes lines slightly different from each other.
        const a = angleField(x, y) + drift;

        // Move forward using the angle.
        // cos(angle) gives horizontal movement.
        // sin(angle) gives vertical movement.
        x += Math.cos(a) * stepSize;
        y += Math.sin(a) * stepSize;

        // Draw a line segment from the previous point to the new point.
        turtle.goto(x, y);

        // Stop drawing if the line leaves the visible TurtleToy area.
        // This avoids wasting time drawing invisible segments.
        if (x < -105 || x > 105 || y < -65 || y > 65) {
            break;
        }
    }
}


// ------------------------------------------------------------
// START POINT FUNCTION
// This decides where each line begins.
// Most lines start on the left side.
// ------------------------------------------------------------
function startPoint(i) {
    const t = i / lineCount;

    topGenBorder = 65
    bottomGenBorder = -65

    // Vertical placement along the left side.
    // const y = -58 + t * 155 + Math.sin(t * 18) * 9;
    const y = -46 + t * 92 + Math.sin(t * 18) * 4;
    // Horizontal placement near the left border.
    const x = -96 + Math.sin(t * 9) * 12 + hash(i, 3) * 14;
    return [x, y];
}


// ------------------------------------------------------------
// MAIN LINE DRAWING LOOP
//
// This creates hundreds of stream lines.
// Each line gets:
//   - a start point,
//   - a small random offset,
//   - a slightly different drift,
//   - a slightly different length.
// ------------------------------------------------------------
for (let i = 0; i < lineCount; i++) {
    const p = startPoint(i);

    // Small random shift around the original start point.
    // This prevents all lines from starting on the exact same curve.
    const jitterX = (hash(i, 1) - 0.5) * 12;
    const jitterY = (hash(i, 2) - 0.5) * 12;

    // Small angle offset unique to each line.
    // This spreads the bundle and makes it look more natural.
    const drift = (hash(i, 4) - 0.5) * 0.22;

    // Draw one flowing line.
    drawStream(
        p[0] + jitterX,
        p[1] + jitterY,
        steps + Math.floor(hash(i, 5) * 80),
        drift
    );
}