const bobik = document.getElementById('bobik');
const particleContainer = document.getElementById('particle-container');

// State machine
let state = 'idle'; // idle, running, tired, sleeping, eating
let pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let velocity = { x: 0, y: 0 };
let speed = 0;
let flipX = 1; // 1 for right, -1 for left

// Metrics for state machine
let highSpeedTime = 0;
let idleTime = 0;
let foodEaten = 0;
let lastFoodDrop = 0;

// Update target based on mouse
window.addEventListener('mousemove', (e) => {
  target.x = e.clientX;
  target.y = e.clientY;
  
  if (state === 'sleeping') {
    // Wake up if close
    const dist = Math.hypot(target.x - pos.x, target.y - pos.y);
    if (dist < 150) {
      changeState('idle');
    }
  }
});

// Click to wake up immediately
window.addEventListener('click', () => {
  if (state === 'sleeping' || state === 'tired') {
    changeState('idle');
    idleTime = 0;
  }
});

function changeState(newState) {
  if (state === newState) return;
  bobik.className = newState;
  state = newState;
}

function spawnZzz() {
  if (state !== 'sleeping') return;
  const zzz = document.createElement('div');
  zzz.className = 'particle';
  zzz.textContent = 'Z';
  zzz.style.color = '#fff';
  zzz.style.fontSize = Math.random() * 10 + 15 + 'px';
  zzz.style.left = (pos.x + (flipX === 1 ? 20 : -20)) + 'px';
  zzz.style.top = (pos.y - 60) + 'px';
  particleContainer.appendChild(zzz);
  
  setTimeout(() => zzz.remove(), 2000);
}

// Spawn Zzz occasionally
setInterval(spawnZzz, 800);

function spawnFood() {
  const foodTypes = ['🌭', '🥞']; // Emoji for Kolbasa(ish) and Blini
  const food = document.createElement('div');
  food.className = 'food';
  food.textContent = foodTypes[Math.floor(Math.random() * foodTypes.length)];
  food.style.fontSize = '24px';
  food.style.left = target.x + 'px';
  food.style.top = target.y + 'px';
  particleContainer.appendChild(food);
  
  setTimeout(() => food.remove(), 2000);
  foodEaten++;
  changeState('eating');
  setTimeout(() => {
    if (state === 'eating') changeState('idle');
  }, 500);
}

// Game Loop
let lastTime = performance.now();
function loop(time) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;
  
  const dx = target.x - pos.x;
  const dy = target.y - pos.y;
  const dist = Math.hypot(dx, dy);
  
  // Decide if we should move
  if (state !== 'sleeping' && state !== 'tired' && state !== 'eating') {
    if (dist > 50) {
      // Chasing
      // Max speed
      const maxSpeed = 300; // pixels per second
      velocity.x = (dx / dist) * maxSpeed;
      velocity.y = (dy / dist) * maxSpeed;
      
      pos.x += velocity.x * dt;
      pos.y += velocity.y * dt;
      
      speed = maxSpeed;
      changeState('running');
      idleTime = 0;
      
      // Face direction
      if (dx > 0) flipX = 1;
      else if (dx < 0) flipX = -1;
      
      highSpeedTime += dt;
      if (highSpeedTime > 4) { // 4 seconds of running = tired
        changeState('tired');
        highSpeedTime = 0;
      }
    } else {
      // Close to cursor
      speed = 0;
      if (state === 'running') {
        changeState('idle');
      }
      
      // Check for eating (moving cursor slowly near him)
      idleTime += dt;
      
      // If we are moving the mouse slowly near him, spawn food
      if (idleTime > 1 && dist > 10 && dist < 50 && time - lastFoodDrop > 2000) {
         spawnFood();
         lastFoodDrop = time;
      }
      
      if (idleTime > 10) { // 10 seconds idle = sleep
        changeState('sleeping');
        idleTime = 0;
      }
      highSpeedTime = Math.max(0, highSpeedTime - dt); // recover stamina
    }
  } else if (state === 'tired') {
    idleTime += dt;
    if (idleTime > 3) { // 3 seconds of panting
       changeState('sleeping');
       idleTime = 0;
    }
  }
  
  // Apply transforms
  // We center bobik using translate(-50%, -100%) so his anchor is his feet
  // Then we apply flip using scaleX
  bobik.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -100%) scaleX(${flipX})`;
  
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
