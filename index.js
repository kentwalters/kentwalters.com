const COLLISION_ENERGY_LOSS = 0.15;
const FRAME_RATE = 100;
const ELASTIC_COLLISIONS = true;
const BALL_DIAMETER = 4;
const BALL_RADIUS = BALL_DIAMETER / 2;
const GRID_SIZE = 100;
const BALL_COLORS = ["#4f372d", "#00a0b0", "#d35d3a", "#cc2a36"]
let gravityEnabled = true;
let collisionsEnabled = true;
let lastFrameTime = Date.now();
let frameCount = 0;
let fps = 0;
let canvas, ctx;
let grid = [];
const universe = [];
let lastUpdateTime = 0;
let circle = true;
let currentColorIndex = 0;

class Vector {
  velocity;
  direction;

  constructor(m, d) {
    m ? (this.velocity = m) : (this.velocity = 0);
    d ? (this.direction = d) : (this.direction = 0);
  }
}

class Ball {
  xPos;
  yPos;
  mass;
  vector;
  color;

  constructor(x, y, m, v, c) {
    this.xPos = x;
    this.yPos = y;
    this.mass = m;
    this.vector = v;
    this.color = c;
  }
}

const setupGrid = () => {
  grid = [];
  for (let i = 0; i < Math.ceil(canvas.width / GRID_SIZE); i++) {
    grid[i] = [];
    for (let j = 0; j < Math.ceil(canvas.height / GRID_SIZE); j++) {
      grid[i][j] = [];
    }
  }
};

const initializeCanvas = () => {
  canvas = document.getElementById("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx = canvas.getContext("2d");
};

const configureDOMElements = () => {
  document.documentElement.style.setProperty(
    "--ball-diameter",
    `${BALL_DIAMETER}px`
  );
  setupEventListeners();
};

const updateControlDivBounds = () => {
  const controlDiv = document.getElementById("control");
  controlDivBounds = controlDiv.getBoundingClientRect();
};

const setupEventListeners = () => {
  document
    .getElementById("gravityToggle")
    .addEventListener("change", handleGravityToggle);
  document
    .getElementById("collisionToggle")
    .addEventListener("change", handleCollisionToggle);
  window.addEventListener("resize", resizeCanvas);
};

const handleGravityToggle = (event) => {
  gravityEnabled = event.target.checked;
};

const handleCollisionToggle = (event) => {
  collisionsEnabled = event.target.checked;
};

const basicSetup = () => {
  initializeCanvas();
  configureDOMElements();
  updateControlDivBounds();
  addClickHandler();
};

const addClickHandler = () => {
  canvas.addEventListener("click", (e) => {
    placeCircleOrSquare(e)
  });
};

const placeCircleOrSquare = (e) => {
  
  
  if (circle) {
    const options = [40, 80, 120];
    const NUM_BALLS = 40; // Number of balls to create
    const RADIUS = 100; // Radius of the circle of balls

    const clickColor = BALL_COLORS[currentColorIndex];  // Use a single color for this click

    for (let i = 0; i < NUM_BALLS; i++) {
      const angle = (i / NUM_BALLS) * Math.PI * 2; // Divide the circle into 100 parts
      const x = e.clientX + RADIUS * Math.cos(angle) - BALL_RADIUS;
      const y = e.clientY + RADIUS * Math.sin(angle) - BALL_RADIUS;

      // Create a new Ball object with the color for this click
      const newBallObject = new Ball(x, y, 100, new Vector(0, 0), clickColor);
      universe.push(newBallObject);
    }
    
    }  else {
      const gridSize =  Math.floor(Math.random() * (10 - 5 + 1)) + 5;
      const spacing = 10; // Spacing between balls

      const clickColor = BALL_COLORS[currentColorIndex];

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          // Calculate position for each ball in the grid
          const x = e.clientX + i * (BALL_DIAMETER + spacing);
          const y = e.clientY + j * (BALL_DIAMETER + spacing);

          const newBallObject = new Ball(x, y, 100, new Vector(0, 0), clickColor);
          universe.push(newBallObject);
        }
      }
    }
    circle = !circle
    currentColorIndex = (currentColorIndex + 1) % BALL_COLORS.length;
}



const tick = (timestamp) => {
  if (!lastUpdateTime) lastUpdateTime = timestamp;
  const deltaTime = timestamp - lastUpdateTime;
  lastUpdateTime = timestamp;

  move(deltaTime);
  render();
  updateFPS(deltaTime);

  window.requestAnimationFrame(tick);
};

const updateFPS = (deltaTime) => {
  frameCount++;
  const now = Date.now();
  const elapsed = now - lastFrameTime;

  if (elapsed >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastFrameTime = now;
    document.getElementById("fps-number").innerText = fps;
  }
};

const applyGravity = (ball, gravitationalConstant, timeStep) => {
  // The velocity in X remains the same, as gravity only affects the Y component
  const velocityX = ball.vector.velocity * Math.cos(ball.vector.direction);

  // Gravity affects the velocity in Y. It should always pull down, hence adding the force.
  // Assuming downwards is the positive direction in Y-axis.
  const velocityY =
    ball.vector.velocity * Math.sin(ball.vector.direction) +
    gravitationalConstant * timeStep;

  // Update the ball's velocity vector with the new values
  ball.vector = new Vector(
    Math.sqrt(velocityX ** 2 + velocityY ** 2),
    Math.atan2(velocityY, velocityX)
  );
};

const detectCollision = (ball1, ball2) => {
  const dx = ball1.xPos - ball2.xPos;
  const dy = ball1.yPos - ball2.yPos;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < BALL_DIAMETER;
};

const handleCollision = (ball1, ball2) => {
  // Calculate the difference in position
  const dx = ball2.xPos - ball1.xPos;
  const dy = ball2.yPos - ball1.yPos;

  // Calculate the distance between balls
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Normal vector
  const nx = dx / distance;
  const ny = dy / distance;

  // Tangential vector
  const tx = -ny;
  const ty = nx;

  // Dot product tangent direction
  const dpTan1 =
    ball1.vector.velocity * Math.cos(ball1.vector.direction) * tx +
    ball1.vector.velocity * Math.sin(ball1.vector.direction) * ty;
  const dpTan2 =
    ball2.vector.velocity * Math.cos(ball2.vector.direction) * tx +
    ball2.vector.velocity * Math.sin(ball2.vector.direction) * ty;

  // Dot product normal direction
  const dpNorm1 =
    ball1.vector.velocity * Math.cos(ball1.vector.direction) * nx +
    ball1.vector.velocity * Math.sin(ball1.vector.direction) * ny;
  const dpNorm2 =
    ball2.vector.velocity * Math.cos(ball2.vector.direction) * nx +
    ball2.vector.velocity * Math.sin(ball2.vector.direction) * ny;

  // Conservation of momentum in 1D
  const m1 =
    (dpNorm1 * (ball1.mass - ball2.mass) + 2 * ball2.mass * dpNorm2) /
    (ball1.mass + ball2.mass);
  const m2 =
    (dpNorm2 * (ball2.mass - ball1.mass) + 2 * ball1.mass * dpNorm1) /
    (ball1.mass + ball2.mass);

  // Update ball velocities
  ball1.vector.velocity = Math.sqrt(m1 * m1 + dpTan1 * dpTan1);
  ball1.vector.direction = Math.atan2(
    m1 * ny + dpTan1 * ty,
    m1 * nx + dpTan1 * tx
  );

  ball2.vector.velocity = Math.sqrt(m2 * m2 + dpTan2 * dpTan2);
  ball2.vector.direction = Math.atan2(
    m2 * ny + dpTan2 * ty,
    m2 * nx + dpTan2 * tx
  );

  // Separate the balls slightly to avoid sticking

  if (distance < BALL_DIAMETER) {
    const overlap = 0.5 * (BALL_DIAMETER - distance);
    const nx = (ball2.xPos - ball1.xPos) / distance;
    const ny = (ball2.yPos - ball1.yPos) / distance;

    ball1.xPos -= overlap * nx;
    ball1.yPos -= overlap * ny;
    ball2.xPos += overlap * nx;
    ball2.yPos += overlap * ny;
  }
};

const resizeCanvas = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  updateControlDivBounds();
};

const move = (deltaTime) => {
  setupGrid();
  const seconds = deltaTime / 1000; 

  for (let object of universe) {
    if (gravityEnabled) {
      const gravitationalConstant = 900.81; // m/s^2
      applyGravity(object, gravitationalConstant, seconds);
    }

    // Calculate new position based on velocity and direction
    const distance = object.vector.velocity * seconds;
    let newX = object.xPos + distance * Math.cos(object.vector.direction);
    let newY = object.yPos + distance * Math.sin(object.vector.direction);

    // Wall collision detection and response
    if (newX < 0 || newX > canvas.width - BALL_DIAMETER) {
      object.vector.direction = Math.PI - object.vector.direction;
      object.vector.velocity *= 1 - COLLISION_ENERGY_LOSS;
      newX = Math.max(0, Math.min(newX, canvas.width - BALL_DIAMETER)); // Constrain within bounds
    }
    if (newY < 0 || newY > canvas.height - BALL_DIAMETER) {
      object.vector.direction = -object.vector.direction;
      object.vector.velocity *= 1 - COLLISION_ENERGY_LOSS;
      newY = Math.max(0, Math.min(newY, canvas.height - BALL_DIAMETER)); // Constrain within bounds
    }

    // if (object.xPos < controlDivBounds.left || object.xPos > controlDivBounds.right - BALL_DIAMETER) {
    //   object.vector.direction = Math.PI - object.vector.direction;
    //   object.vector.velocity *= 1 - COLLISION_ENERGY_LOSS;
    // }
    // if (object.yPos < controlDivBounds.top || object.yPos > controlDivBounds.bottom - BALL_DIAMETER) {
    //   object.vector.direction = -object.vector.direction;
    //   object.vector.velocity *= 1 - COLLISION_ENERGY_LOSS;
    // }

    // Update ball position
    object.xPos = newX;
    object.yPos = newY;

    // Update grid and check collisions
    if (collisionsEnabled) {
      let gridX = Math.floor(object.xPos / GRID_SIZE);
      let gridY = Math.floor(object.yPos / GRID_SIZE);

      if (gridX && gridY) grid[gridX][gridY].push(object);

      // Check collisions in grid
      for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
          let cell = grid[i][j];
          for (let k = 0; k < cell.length; k++) {
            for (let l = k + 1; l < cell.length; l++) {
              if (detectCollision(cell[k], cell[l])) {
                handleCollision(cell[k], cell[l]);
              }
            }
          }
        }
      }
    }
  }
};

const render = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let ob of universe) {
    ctx.beginPath();
    ctx.arc(
      ob.xPos + BALL_RADIUS,
      ob.yPos + BALL_RADIUS,
      BALL_RADIUS,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = ob.color; // Ball color
    ctx.fill();
    ctx.closePath();
  }

  document.getElementById(
    "obs-number"
  ).innerText = `${universe.length}`;
};

const start = () => {
  basicSetup();
  setupGrid();
  window.requestAnimationFrame(tick);
};

start();
