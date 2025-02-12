const canvas = document.getElementById("gameBoard");
const ctx = canvas.getContext("2d");
const boardSize = 8;
const tileSize = canvas.width / boardSize;
let board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
let currentPlayer = "black";
let playerColor = "black";
let cpuColor = "white";
let isCpuMode = false;
let cpuLevel = 1;

const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],         [0, 1],
    [1, -1], [1, 0], [1, 1]
];

const messageBox = document.createElement("div");
messageBox.id = "messageBox";
messageBox.innerText = "モードを選択してスタート";
messageBox.style.position = "absolute";
messageBox.style.top = "50%";
messageBox.style.left = "50%";
messageBox.style.transform = "translate(-50%, -50%)";
messageBox.style.padding = "20px";
messageBox.style.background = "rgba(255, 255, 255, 0.8)";
messageBox.style.borderRadius = "10px";
messageBox.style.fontSize = "24px";
document.body.appendChild(messageBox);

document.getElementById("pvpMode").addEventListener("click", () => startGame(false));
document.getElementById("cpuMode").addEventListener("click", () => startGame(true));
document.getElementById("cpuLevel").addEventListener("change", (event) => {
    cpuLevel = parseInt(event.target.value, 10);
});
canvas.addEventListener("click", handlePlayerMove);

function startGame(cpuMode) {
    document.body.removeChild(messageBox);
    isCpuMode = cpuMode;
    if (isCpuMode) {
        playerColor = "black";
        cpuColor = "white";
    }
    initializeBoard();
    drawBoard();
    updateScore();
}

function initializeBoard() {
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            board[i][j] = null;
        }
    }
    board[3][3] = "white";
    board[3][4] = "black";
    board[4][3] = "black";
    board[4][4] = "white";
}

function drawBoard() {
    ctx.fillStyle = "#228B22";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i <= boardSize; i++) {
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(i * tileSize, 0);
        ctx.lineTo(i * tileSize, canvas.height);
        ctx.moveTo(0, i * tileSize);
        ctx.lineTo(canvas.width, i * tileSize);
        ctx.stroke();
    }
    drawPieces();
    displayPlayerColor();
}

function drawPieces() {
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j]) {
                ctx.beginPath();
                ctx.arc(j * tileSize + tileSize / 2, i * tileSize + tileSize / 2, tileSize / 3, 0, Math.PI * 2);
                ctx.fillStyle = board[i][j] === "black" ? "black" : "white";
                ctx.fill();
                ctx.stroke();
            }
        }
    }
}

function displayPlayerColor() {
    const colorDisplay = document.getElementById("playerColor");
    if (!colorDisplay) {
        const colorInfo = document.createElement("p");
        colorInfo.id = "playerColor";
        colorInfo.style.fontSize = "18px";
        colorInfo.innerText = `あなたの色: ${playerColor === "black" ? "黒" : "白"}`;
        document.body.appendChild(colorInfo);
    } else {
        colorDisplay.innerText = `あなたの色: ${playerColor === "black" ? "黒" : "白"}`;
    }
}

function handlePlayerMove(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / tileSize);
    const y = Math.floor((event.clientY - rect.top) / tileSize);
    
    if (board[y][x] === null && isValidMove(y, x, currentPlayer)) {
        placePiece(y, x, currentPlayer);
        currentPlayer = currentPlayer === "black" ? "white" : "black";
        drawBoard();
        updateScore();

        if (isCpuMode && currentPlayer === cpuColor) {
            setTimeout(cpuMove, 500);
        } else if (checkGameOver()) {
            displayWinner();
        } else if (!hasValidMove(currentPlayer)) {
            displayPass();
        }
    } else if (!hasValidMove(currentPlayer)) {
        displayPass();
    }
}

function isValidMove(row, col, color) {
    for (const [dx, dy] of directions) {
        let x = row + dx;
        let y = col + dy;
        let hasOpponent = false;
        while (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
            if (board[x][y] === null) break;
            if (board[x][y] !== color) {
                hasOpponent = true;
            } else {
                if (hasOpponent) return true;
                break;
            }
            x += dx;
            y += dy;
        }
    }
    return false;
}

function placePiece(row, col, color) {
    if (!isValidMove(row, col, color)) return;
    board[row][col] = color;
    for (const [dx, dy] of directions) {
        let x = row + dx;
        let y = col + dy;
        let piecesToFlip = [];
        while (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
            if (board[x][y] === null) break;
            if (board[x][y] !== color) {
                piecesToFlip.push([x, y]);
            } else {
                for (const [fx, fy] of piecesToFlip) {
                    board[fx][fy] = color;
                }
                break;
            }
            x += dx;
            y += dy;
        }
    }
}

function updateScore() {
    let whiteCount = 0;
    let blackCount = 0;

    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j] === "white") whiteCount++;
            if (board[i][j] === "black") blackCount++;
        }
    }

    document.getElementById("whiteCount").innerText = whiteCount;
    document.getElementById("blackCount").innerText = blackCount;
}

function cpuMove() {
    const possibleMoves = getPossibleMoves(cpuColor);
    if (possibleMoves.length === 0) {
        currentPlayer = currentPlayer === "black" ? "white" : "black";
        drawBoard();
        updateScore();
        if (checkGameOver()) {
            displayWinner();
        }
        return;
    }

    let selectedMove;
    if (cpuLevel === 1) {
        selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    } else if (cpuLevel === 2) {
        selectedMove = possibleMoves[0];
    } else {
        selectedMove = selectBestMove(possibleMoves);
    }

    placePiece(selectedMove.row, selectedMove.col, cpuColor);
    currentPlayer = currentPlayer === "black" ? "white" : "black";
    drawBoard();
    updateScore();

    if (checkGameOver()) {
        displayWinner();
    } else if (!hasValidMove(currentPlayer)) {
        displayPass();
    }
}

function getPossibleMoves(color) {
    const moves = [];
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j] === null && isValidMove(i, j, color)) {
                moves.push({ row: i, col: j });
            }
        }
    }
    return moves;
}

function selectBestMove(possibleMoves) {
    let bestMove = null;
    let bestScore = -Infinity;

    for (const move of possibleMoves) {
        const score = evaluateMove(move.row, move.col, cpuColor);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}

function evaluateMove(row, col, color) {
    let score = 0;
    const opponentColor = color === "black" ? "white" : "black";
    const copyBoard = JSON.parse(JSON.stringify(board));
    placePiece(row, col, color);

    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (copyBoard[i][j] === color) score++;
            if (copyBoard[i][j] === opponentColor) score--;
        }
    }

    return score;
}

function hasValidMove(color) {
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j] === null && isValidMove(i, j, color)) {
                return true;
            }
        }
    }
    return false;
}

function checkGameOver() {
    return !hasValidMove("black") && !hasValidMove("white") || board.flat().every(cell => cell !== null);
}

function displayWinner() {
    const whiteCount = document.getElementById("whiteCount").innerText;
    const blackCount = document.getElementById("blackCount").innerText;

    let winnerMessage = "引き分け";
    if (blackCount > whiteCount) {
        winnerMessage = "君の勝利";
    } else if (whiteCount > blackCount) {
        winnerMessage = "相手の勝利";
    }

    showMessage(winnerMessage);
}

function displayPass() {
    showMessage("パス");
}

function showMessage(message) {
    const messageDisplay = document.createElement("div");
    messageDisplay.id = "gameMessage";
    messageDisplay.innerText = message;
    messageDisplay.style.position = "absolute";
    messageDisplay.style.top = "50%";
    messageDisplay.style.left = "50%";
    messageDisplay.style.transform = "translate(-50%, -50%)";
    messageDisplay.style.padding = "20px";
    messageDisplay.style.background = "rgba(255, 255, 255, 0.8)";
    messageDisplay.style.borderRadius = "10px";
    messageDisplay.style.fontSize = "24px";
    messageDisplay.style.zIndex = "1000";
    document.body.appendChild(messageDisplay);

    setTimeout(() => {
        document.body.removeChild(messageDisplay);
    }, 1000);
}
