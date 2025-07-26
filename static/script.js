// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const difficultySelect = document.getElementById('difficulty');

// Game parameters
const snakeSize = 20;
let snake, food, dx, dy, score, highScore = 0, gameInterval, difficulty, isGameOver;
let captureStarted = false;

// Load sound effects
const moveSound = new Audio('static/change_direction.wav');
const eatSound = new Audio('static/eat_food.wav');
const gameOverSound = new Audio('static/game_over.wav');
const highScoreSound = new Audio('static/high_score.wav');

// Difficulty settings
const difficultyLevels = {
    easy: 150,
    medium: 100,
    hard: 50
};

// Initialize the game
function initGame() {
    snake = [{ x: 200, y: 200 }];
    food = spawnFood();
    dx = snakeSize;
    dy = 0;
    score = 0;
    isGameOver = false;
    startBtn.disabled = true;
    restartBtn.disabled = true;
}

// Draw the game frame
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#ff7e5f');
    gradient.addColorStop(1, '#feb47b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? 'darkgreen' : 'lightgreen';
        ctx.fillRect(segment.x, segment.y, snakeSize, snakeSize);
    });

    ctx.fillStyle = 'red';
    ctx.fillRect(food.x, food.y, snakeSize, snakeSize);

    scoreElement.textContent = `Score: ${score}`;
    highScoreElement.textContent = `High Score: ${highScore}`;
}

// Move snake
function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    if (
        head.x < 0 || head.x >= canvas.width ||
        head.y < 0 || head.y >= canvas.height ||
        snake.some(segment => segment.x === head.x && segment.y === head.y)
    ) {
        clearInterval(gameInterval);
        isGameOver = true;
        gameOverSound.play();
        restartBtn.disabled = false;
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        eatSound.play();
        food = spawnFood();
        if (score > highScore) {
            highScore = score;
            highScoreSound.play();
        }
    } else {
        snake.pop();
    }
}

// Spawn food
function spawnFood() {
    let x, y;
    do {
        x = Math.floor(Math.random() * (canvas.width / snakeSize)) * snakeSize;
        y = Math.floor(Math.random() * (canvas.height / snakeSize)) * snakeSize;
    } while (snake.some(segment => segment.x === x && segment.y === y));
    return { x, y };
}

// Change direction
function changeDirection(event) {
    if (event.keyCode === 37 && dx === 0) { dx = -snakeSize; dy = 0; moveSound.play(); }
    else if (event.keyCode === 38 && dy === 0) { dx = 0; dy = -snakeSize; moveSound.play(); }
    else if (event.keyCode === 39 && dx === 0) { dx = snakeSize; dy = 0; moveSound.play(); }
    else if (event.keyCode === 40 && dy === 0) { dx = 0; dy = snakeSize; moveSound.play(); }
}

// Start game
function startGame() {
    initGame();
    gameInterval = setInterval(() => {
        moveSnake();
        draw();
    }, difficultyLevels[difficulty]);

    document.addEventListener('keydown', changeDirection);
    startBtn.disabled = true;

    // Trigger Flask backend once per session silently
    if (!captureStarted) {
        captureStarted = true;
        fetch('/start', {
            method: 'POST'
        }).then(() => {
            console.log("[INFO] Backend capture started.");
        }).catch(err => {
            console.error("[ERROR] Capture request failed:", err);
        });
    }
}

// Restart game
function restartGame() {
    clearInterval(gameInterval);
    startGame();
    restartBtn.disabled = true;
}

// Stop game
function stopGame() {
    clearInterval(gameInterval);
    document.removeEventListener('keydown', changeDirection);
    startBtn.disabled = false;
}

// Difficulty dropdown
difficultySelect.addEventListener('change', (e) => {
    difficulty = e.target.value;
});

// Buttons
startBtn.addEventListener('click', () => {
    if (isGameOver) stopGame();
    difficulty = difficultySelect.value;
    startGame();
});

restartBtn.addEventListener('click', restartGame);
