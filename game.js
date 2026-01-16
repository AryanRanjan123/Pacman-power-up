const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const powerMsg = document.getElementById('power-msg');

const TILE_SIZE = 32;
const ROWS = 15;
const COLS = 15;
canvas.width = COLS * TILE_SIZE;
canvas.height = ROWS * TILE_SIZE;

let score = 0;
let lives = 3;
let gameRunning = false;
let powerMode = false;
let powerTimer = 0;

// 1: Wall, 0: Pellet, 3: POWER PELLET, 2: Path
const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,0,0,0,0,1,0,0,0,0,0,0,3,1],
    [1,0,1,1,0,1,1,0,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,1,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,1,1,0,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,1,1,1,0,1,1,1,1,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
    [1,0,0,1,0,0,0,0,0,0,0,1,0,0,1],
    [1,1,0,1,0,1,1,1,1,1,0,1,0,1,1],
    [1,3,0,0,0,0,0,0,0,0,0,0,0,3,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

class Entity {
    constructor(startX, startY, speed, color) {
        this.startX = startX * TILE_SIZE;
        this.startY = startY * TILE_SIZE;
        this.x = this.startX;
        this.y = this.startY;
        this.speed = speed;
        this.baseColor = color;
        this.color = color;
        this.dir = { x: 0, y: 0 };
        this.nextDir = { x: 0, y: 0 };
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.dir = { x: 0, y: 0 };
        this.nextDir = { x: 0, y: 0 };
    }

    update() {
        if (this.x % TILE_SIZE === 0 && this.y % TILE_SIZE === 0) {
            const r = this.y / TILE_SIZE;
            const c = this.x / TILE_SIZE;
            if (map[r + this.nextDir.y] && map[r + this.nextDir.y][c + this.nextDir.x] !== 1) {
                this.dir = { ...this.nextDir };
            }
            if (map[r + this.dir.y] && map[r + this.dir.y][c + this.dir.x] === 1) {
                this.dir = { x: 0, y: 0 };
            }
        }
        this.x += this.dir.x * this.speed;
        this.y += this.dir.y * this.speed;
    }

    draw(isPacman = false) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        const centerX = this.x + TILE_SIZE / 2;
        const centerY = this.y + TILE_SIZE / 2;
        if (isPacman) {
            const mouth = Math.abs(Math.sin(Date.now() / 150)) * 0.2;
            ctx.arc(centerX, centerY, TILE_SIZE / 2 - 2, mouth * Math.PI, (2 - mouth) * Math.PI);
            ctx.lineTo(centerX, centerY);
        } else {
            ctx.arc(centerX, centerY, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
        }
        ctx.fill();
    }
}

const pacman = new Entity(1, 1, 2, "#ffff00");
const ghosts = [
    new Entity(13, 13, 2, "#ff0000"),
    new Entity(1, 13, 2, "#ffb8ff"),
    new Entity(13, 1, 2, "#00ffff")
];

function checkCollisions() {
    ghosts.forEach(g => {
        const distance = Math.hypot(pacman.x - g.x, pacman.y - g.y);
        if (distance < TILE_SIZE * 0.7) {
            if (powerMode) {
                // Eat ghost
                score += 200;
                scoreDisplay.innerText = score;
                g.reset();
            } else {
                // Lose life
                lives--;
                livesDisplay.innerText = "❤️".repeat(lives);
                if (lives <= 0) {
                    alert("GAME OVER!");
                    location.reload();
                } else {
                    gameRunning = false;
                    overlay.style.display = "flex";
                    overlay.innerHTML = "<h1>LIFE LOST!</h1><p>Tap to Resume</p>";
                    pacman.reset();
                    ghosts.forEach(ghost => ghost.reset());
                }
            }
        }
    });
}

function gameLoop() {
    if (!gameRunning) return;

    // TRAIL EFFECT: Clear with transparent black
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Map
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (map[r][c] === 1) {
                ctx.fillStyle = "#1919a6";
                ctx.fillRect(c * TILE_SIZE + 1, r * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
            } else if (map[r][c] === 0) {
                ctx.fillStyle = "#fff";
                ctx.beginPath();
                ctx.arc(c * TILE_SIZE + 16, r * TILE_SIZE + 16, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (map[r][c] === 3) {
                // Power Pellet (Blinking)
                ctx.fillStyle = (Date.now() % 500 < 250) ? "#fff" : "#ffb8ff";
                ctx.beginPath();
                ctx.arc(c * TILE_SIZE + 16, r * TILE_SIZE + 16, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    pacman.update();
    pacman.draw(true);

    // Eating logic
    const r = Math.floor((pacman.y + 16) / TILE_SIZE);
    const c = Math.floor((pacman.x + 16) / TILE_SIZE);
    if (map[r][c] === 0) {
        map[r][c] = 2; score += 10; scoreDisplay.innerText = score;
    } else if (map[r][c] === 3) {
        map[r][c] = 2; score += 50; scoreDisplay.innerText = score;
        activatePowerMode();
    }

    // Power Timer logic
    if (powerMode) {
        powerTimer--;
        if (powerTimer <= 0) {
            powerMode = false;
            powerMsg.style.visibility = "hidden";
            ghosts.forEach(g => g.color = g.baseColor);
        }
    }

    ghosts.forEach(g => {
        if (g.x % TILE_SIZE === 0 && g.y % TILE_SIZE === 0) {
            const directions = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
            const rG = g.y / TILE_SIZE; const cG = g.x / TILE_SIZE;
            const valid = directions.filter(d => map[rG + d.y] && map[rG + d.y][cG + d.x] !== 1);
            
            // AI: If powerMode, move AWAY from player. If normal, move TOWARDS.
            valid.sort((a,b) => {
                const distA = Math.hypot((g.x + a.x*TILE_SIZE) - pacman.x, (g.y + a.y*TILE_SIZE) - pacman.y);
                const distB = Math.hypot((g.x + b.x*TILE_SIZE) - pacman.x, (g.y + b.y*TILE_SIZE) - pacman.y);
                return powerMode ? distB - distA : distA - distB;
            });
            g.nextDir = valid[0] || {x:0, y:0};
        }
        g.update();
        g.draw();
    });

    checkCollisions();
    requestAnimationFrame(gameLoop);
}

function activatePowerMode() {
    powerMode = true;
    powerTimer = 400; // About 7 seconds
    powerMsg.style.visibility = "visible";
    ghosts.forEach(g => g.color = "#0000ff"); // Vulnerable Blue
}

// Controls
window.addEventListener('keydown', e => {
    if (e.key === "ArrowUp") pacman.nextDir = { x: 0, y: -1 };
    if (e.key === "ArrowDown") pacman.nextDir = { x: 0, y: 1 };
    if (e.key === "ArrowLeft") pacman.nextDir = { x: -1, y: 0 };
    if (e.key === "ArrowRight") pacman.nextDir = { x: 1, y: 0 };
});

let sX, sY;
canvas.addEventListener('touchstart', e => { sX = e.touches[0].clientX; sY = e.touches[0].clientY; });
canvas.addEventListener('touchmove', e => {
    if (!sX || !sY) return;
    let dx = sX - e.touches[0].clientX; let dy = sY - e.touches[0].clientY;
    if (Math.abs(dx) > Math.abs(dy)) pacman.nextDir = dx > 0 ? {x:-1,y:0} : {x:1,y:0};
    else pacman.nextDir = dy > 0 ? {x:0,y:-1} : {x:0,y:1};
    sX = null; sY = null;
});

overlay.addEventListener('click', () => { overlay.style.display = "none"; gameRunning = true; gameLoop(); });