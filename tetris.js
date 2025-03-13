let score = 0;
let level = 1;
let rowsCleared = 0;

let gameOverState = false;

document.getElementById("level").innerText = level;

document.getElementById("high-score").innerText = localStorage.getItem("highScore") || 0;

const canvas = document.getElementById("tetris");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

const TETROMINOES = {
    I: [
        [1, 1, 1, 1]
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1]
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1]
    ],
    O: [
        [1, 1],
        [1, 1]
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0]
    ],
    T: [
        [0, 1, 0],
        [1, 1, 1]
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1]
    ]
};

// Tetromino Colors
const COLORS = {
    I: "rgb(0, 255, 255)",   
    J: "rgb(0, 0, 255)",     
    L: "rgb(255, 165, 0)",   
    O: "rgb(255, 255, 0)",   
    S: "rgb(0, 255, 0)",     
    T: "rgb(128, 0, 128)",   
    Z: "rgb(255, 0, 0)"      
};


function createTetromino() {
    const types = Object.keys(TETROMINOES);
    const randomType = types[Math.floor(Math.random() * types.length)];

    return {
        shape: TETROMINOES[randomType],
        x: Math.floor(COLS / 2) - Math.floor(TETROMINOES[randomType][0].length / 2),
        y: 0,
        color: COLORS[randomType]
    };
}


function drawTetromino() {
    const { shape, x, y, color } = activeTetromino;
    const ghostY = getGhostPosition();
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";

    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = color;

    shape.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell) {
                ctx.fillRect((x + colIndex) * BLOCK_SIZE, (ghostY + rowIndex) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                // ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
                ctx.strokeStyle = color;
                ctx.strokeRect((x + colIndex) * BLOCK_SIZE, (ghostY + rowIndex) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
    ctx.restore();

    ctx.fillStyle = color;
    shape.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell) {
                ctx.fillRect((x + colIndex) * BLOCK_SIZE, (y + rowIndex) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = "#FFF";
                ctx.lineWidth = 1.5;
                ctx.strokeRect((x + colIndex) * BLOCK_SIZE, (y + rowIndex) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
}

const nextPieces = [createTetromino(), createTetromino(), createTetromino()];
const nextCanvas = document.getElementById("next-piece");
const nextCtx = nextCanvas.getContext("2d");

function drawNextPieces() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);

    nextPieces.forEach((tetromino, index) => {
        const { shape, color } = tetromino;
        nextCtx.fillStyle = color;

        shape.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell) {
                    nextCtx.fillRect((colIndex * 20) + 30, (rowIndex * 20) + (index * 60), 20, 20);
                    nextCtx.strokeStyle = "#FFF";
                    nextCtx.lineWidth = 1.5;
                    nextCtx.strokeRect((colIndex * 20) + 30, (rowIndex * 20) + (index * 60), 20, 20);
                }
            });
        });
    });
}

let activeTetromino = createTetromino();

let dropCounter = 0;
let dropSpeed = 800;
let dropInterval = 1000;
let lastTime = 0;
let isSoftDropping = false;
let updateFrame;
let isClearing = false;

let softDropSpeed = 50;

function update(time = 0) {
    if (gameOverState) return;

    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;

    drawGrid();

    // if (dropCounter > dropInterval) {
    //     softDrop();
    //     dropCounter = 0;
    // }
    if (!isClearing && !softDropActive) {
        if (dropCounter > dropSpeed) {
            if (!collisionAt(activeTetromino.x, activeTetromino.y + 1, activeTetromino.shape)) {
                activeTetromino.y += 1;
            } else {
                placeTetromino();
            }
            dropCounter = 0;
        }
    }

    if (softDropActive) {
        if (dropCounter > softDropSpeed) {
            const newY = activeTetromino.y + 1;
            if (!collisionAt(activeTetromino.x, newY, activeTetromino.shape)) {
                activeTetromino.y = newY;
                score += 1;
                document.getElementById("score").innerText = score;
            } else {
                placeTetromino();
            }
            dropCounter = 0;
        }
    }
    
    if (flashRows.length > 0) {
        drawFlashOverlay();
    }

    drawTetromino();
    drawNextPieces();
    drawHoldPiece();

    updateFrame = requestAnimationFrame(update);
}
drawNextPieces();

function drawGrid() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#222";
    for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
            ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
    }

    // ctx.strokeStyle = "#222";
    ctx.strokeStyle = "rgba(34, 34, 34, 0.3)";

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                const cell = board[y][x];
                ctx.fillStyle = cell.color;
                // ctx.fillStyle = board[y][x];
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                // ctx.strokeStyle = "#FFF";
                ctx.strokeStyle = cell.stroke;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
}

document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") moveTetromino(-1); 
    if (event.key === "ArrowRight") moveTetromino(1); 
    if (event.key === "ArrowDown") {
        // dropSpeed = 1000 / 60;
        // isSoftDropping = false;
        // softDrop();
        softDropActive = true;
    } 
    if (event.key === " ") hardDrop(); 
    if (event.key === "ArrowUp") rotateTetromino();
    if (event.key.toLowerCase() === "c") holdTetromino();
});

document.addEventListener("keyup", (event) => {
    if (event.key === "ArrowDown") {
        // dropSpeed = 800;
        // isSoftDropping = false;
        softDropActive = false;
    }
});

function clearFullRows() {
    if (gameOverState) return;

    let rowsToClear = [];

    // for (let y = ROWS - 1; y >= 0; y--) {
    //     if (board[y].every(cell => cell !== 0 && cell !== undefined)) {
    //         board.splice(y, 1);
    //         board.unshift(Array(COLS).fill(0));
    //         score += 100;
    //         document.getElementById("score").innerText = score;
    //         rowsToClear.push(y);
    //         y++;
    //     }
    // }

    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            rowsToClear.push(y);
        }
    }

    if (rowsToClear.length > 0) {
        rowsCleared += rowsToClear.length;
        score += rowsToClear.length * 100;
        document.getElementById("score").innerText = score;

        if (rowsCleared >= level * 10) {
            levelUp();
        }

        animateRowClearing(rowsToClear);
    }
}

function levelUp() {
    level++;
    document.getElementById("level").innerText = level; // Update level display

    dropSpeed = Math.max(200, dropSpeed * 0.9);
}

let isFlashing = false;
let flashRows = [];
let flashAnimFrame = 0;

function animateRowClearing(rowsToClear) {
    isFlashing = true;
    flashRows = rowsToClear.slice();
    flashAnimFrame = 0;

    // isClearing = true;
    let animationFrame = 0;
    let flashInterval = setInterval(() => {
        // animationFrame++;
        flashAnimFrame++;

        if (flashAnimFrame > 6) {
            clearInterval(flashInterval);
            setTimeout(() => {
                isFlashing = false;
                flashRows = [];
                removeRows(rowsToClear);
            }, 100);
        }

        // drawGrid();

        // rowsToClear.forEach(y => {
        //     ctx.fillStyle = (animationFrame % 2 === 0) ? "white" : board[y][0] || "#111";
        //     ctx.fillRect(0, y * BLOCK_SIZE, canvas.width, BLOCK_SIZE);
        // });

        // if (animationFrame > 6) { 
        //     clearInterval(flashInterval);
        //     setTimeout(() => {
        //         isClearing = false;
        //         removeRows(rowsToClear);
        //     }, 100);
        // }
    }, 100);
}

function drawFlashOverlay() {
    flashRows.forEach(y => {
        let fillColor = (flashAnimFrame % 2 === 0) ? "white" : ([board[y][0] || "#111"]);
        ctx.fillStyle = fillColor;
        ctx.fillRect(0, y * BLOCK_SIZE, canvas.width, BLOCK_SIZE);
    });
}

function removeRows(rowsToClear) {
    rowsToClear.sort((a, b) => b - a);
    
    rowsToClear.forEach(y => {
        board.splice(y, 1);
        // board.unshift(Array(COLS).fill(0));
        // score += 100;
    });

    for (let i = 0; i < rowsToClear.length; i++) {
        board.unshift(Array(COLS).fill(0));
    }

    document.getElementById("score").innerText = score;
    drawGrid();
}

function moveTetromino(direction) {
    if (gameOverState) return;
    
    const newX = activeTetromino.x + direction;
    
    if (!collisionAt(newX, activeTetromino.y, activeTetromino.shape)) {
        activeTetromino.x = newX;
    }
}

let softDropActive = false;

function softDrop() {
    if (!isSoftDropping) {
        dropSpeed = 50;
        isSoftDropping = true;
    }
    const newY = activeTetromino.y + 1;

    if (!collisionAt(activeTetromino.x, newY, activeTetromino.shape)) {
        activeTetromino.y = newY;
        dropCounter = 0;
        score += 1;
        document.getElementById("score").innerText = score;
    } else {
        placeTetromino();
    }
}

function hardDrop() {
    let dropDistance = 0;

    while (!collisionAt(activeTetromino.x, activeTetromino.y + 1, activeTetromino.shape)) {
        activeTetromino.y += 1;
        dropDistance++;
    }
    score += dropDistance * 2;
    document.getElementById("score").innerText = score;
    placeTetromino();
    dropCounter = 0;
}

function rotateTetromino() {
    const rotatedShape = activeTetromino.shape[0].map((_, index) =>
        activeTetromino.shape.map(row => row[index]).reverse()
    );

    if (!collisionAt(activeTetromino.x, activeTetromino.y, rotatedShape)) {
        activeTetromino.shape = rotatedShape;
    }
}

let holdPiece = null;
let canHold = true;
const holdCanvas = document.getElementById("hold-piece");
const holdCtx = holdCanvas.getContext("2d");

function holdTetromino() {
    if (!canHold) return; 

    if (holdPiece) {
        [activeTetromino, holdPiece] = [holdPiece, activeTetromino];
    } else {
        holdPiece = activeTetromino;
        activeTetromino = nextPieces.shift();
        nextPieces.push(createTetromino());
    }

    canHold = false; 
    drawHoldPiece(); 
    drawNextPieces(); 
}

function drawHoldPiece() {
    holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);

    if (!holdPiece) return;

    const { shape, color } = holdPiece;
    holdCtx.fillStyle = color;

    shape.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell) {
                holdCtx.fillRect((colIndex * 20) + 10, (rowIndex * 20) + 10, 20, 20);
                holdCtx.strokeStyle = "#FFF";
                holdCtx.lineWidth = 1.5;
                holdCtx.strokeRect((colIndex * 20) + 10, (rowIndex * 20) + 10, 20, 20);
            }
        });
    });
}

function collisionAt(x, y, shape) {
    return shape.some((row, rowIndex) => {
        return row.some((cell, colIndex) => {
            if (!cell) return false; 
            
            const newX = x + colIndex;
            const newY = y + rowIndex;

            if (newX < 0 || newX >= COLS || newY >= ROWS) return true;

            if (board[newY] && board[newY][newX] !== 0) return true;
            
            return false;
        });
    });
}

const board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

function placeTetromino() {
    activeTetromino.shape.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell) {
                // board[activeTetromino.y + rowIndex][activeTetromino.x + colIndex] = activeTetromino.color;

                const newY = activeTetromino.y + rowIndex;
                // const newX = activeTetromino.x + colIndex;

                if (newY < 0) {
                    gameOver();
                    return;
                }

                // board[newY][newX] = activeTetromino.color;
                // board[newY][activeTetromino.x + colIndex] = activeTetromino.color;
                board[newY][activeTetromino.x + colIndex] = {
                    color: activeTetromino.color,
                    stroke: "#FFF"
                };
            }
        });
    });
    setTimeout(() => {
        clearFullRows();
    }, 300);

    // setTimeout(() => {
    //     activeTetromino = createTetromino();
    // }, 50);
    // activeTetromino = nextPieces.shift();
    // nextPieces.push(createTetromino());
    spawnTetromino();
    canHold = true;
    drawNextPieces();
}

function gameOver() {
    gameOverState = true;
    cancelAnimationFrame(updateFrame);
    document.getElementById("game-over").style.display = "block";
    document.getElementById("final-score").innerText = score;

    let highScore = parseInt(localStorage.getItem("highScore") || "0", 10);
    if (score > highScore) {
        localStorage.setItem("highScore", score);
        document.getElementById("high-score").innerText = score;
    }
}

function resetGame() {
    document.getElementById("game-over").style.display = "none";
    gameOverState = false;

    board.forEach(row => row.fill(0));

    score = 0;
    level = 1;
    rowsCleared = 0;
    dropSpeed = 800;

    holdPiece = null;
    canHold = true;
    holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);

    activeTetromino = createTetromino();
    nextPieces.length = 0;
    nextPieces.push(createTetromino(), createTetromino(), createTetromino());
    
    document.getElementById("score").innerText = score;
    document.getElementById("level").innerText = level;

    drawGrid();
    drawHoldPiece();

    dropCounter = 0;
    lastTime = 0;
    updateFrame = requestAnimationFrame(update);
    // update();
}

function spawnTetromino() {
    activeTetromino = nextPieces.shift();
    nextPieces.push(createTetromino());
  
    if (collisionAt(activeTetromino.x, activeTetromino.y, activeTetromino.shape)) {
        gameOver();
    }
}

function getGhostPosition() {
    let ghostY = activeTetromino.y;

    while (!collisionAt(activeTetromino.x, ghostY + 1, activeTetromino.shape)) {
        ghostY++;
    }

    return ghostY;
}



document.getElementById("left").addEventListener("click", () => moveTetromino(-1));
document.getElementById("right").addEventListener("click", () => moveTetromino(1));
document.getElementById("down").addEventListener("click", () => softDrop());
document.getElementById("rotate").addEventListener("click", () => rotateTetromino());
document.getElementById("hard-drop").addEventListener("click", () => hardDrop());
document.getElementById("hold").addEventListener("click", () => holdTetromino());

function movePiece(direction) {
    console.log(`Move piece ${direction > 0 ? "right" : "left"}`);
}

// function softDrop() {
//     console.log("Soft drop");
// }

// function rotatePiece() {
//     console.log("Rotate piece");
// }

// function hardDrop() {
//     console.log("Hard drop");
// }

// function holdPiece() {
//     console.log("Hold piece");
// }
update();