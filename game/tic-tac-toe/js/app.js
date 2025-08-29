    document.addEventListener('DOMContentLoaded', () => {
      // Elements
      const cells = document.querySelectorAll('.cell');
      const statusText = document.getElementById('status');
      const replayBtn = document.getElementById('replay');
      const playerScoreElem = document.getElementById('player-score');
      const botScoreElem = document.getElementById('bot-score');
      const playerBestElem = document.getElementById('player-best');
      const botBestElem = document.getElementById('bot-best');
      const difficultySlider = document.getElementById('difficulty-slider');
      const currentDifficultyElem = document.getElementById('current-difficulty');
      
      // Game variables
      let board = ['', '', '', '', '', '', '', '', ''];
      let currentPlayer = 'X';
      let gameActive = true;
      let playerScore = 0;
      let botScore = 0;
      let playerBest = parseInt(localStorage.getItem('playerBest')) || 0;
      let botBest = parseInt(localStorage.getItem('botBest')) || 0;
      let difficulty = 2; // 1=mudah, 2=sedang, 3=susah
      
      // Winning patterns
      const winPatterns = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8], // rows
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8], // columns
        [0, 4, 8],
        [2, 4, 6] // diagonals
      ];
      
      // Initialize
      playerBestElem.textContent = playerBest;
      botBestElem.textContent = botBest;
      updateDifficultyDisplay();
      
      // Difficulty slider event
      difficultySlider.addEventListener('input', (e) => {
        difficulty = parseInt(e.target.value);
        updateDifficultyDisplay();
      });
      
      function updateDifficultyDisplay() {
        const difficulties = ['', 'Easy', 'Medium', 'Hard'];
        currentDifficultyElem.textContent = difficulties[difficulty];
      }
      
      // Handle cell click
      function handleCellClick(e) {
        const cell = e.target;
        const cellIndex = parseInt(cell.getAttribute('data-cell-index'));
        
        if (board[cellIndex] !== '' || !gameActive || currentPlayer === 'O') {
          return;
        }
        
        // Player's move
        makeMove(cellIndex, 'X');
        
        // Check if game continues
        if (gameActive) {
          // Disable all cells during bot thinking
          cells.forEach(cell => cell.classList.add('disabled'));
          // Bot's move after a short delay
          setTimeout(() => {
            botMove();
            cells.forEach(cell => cell.classList.remove('disabled'));
          }, 300);
        }
      }
      
      // Make a move
      function makeMove(index, player) {
        board[index] = player;
        cells[index].textContent = player;
        cells[index].classList.add(player.toLowerCase());
        
        // Check for win or draw
        if (checkWin(player)) {
          endGame(player);
          updateScores(player);
        } else if (isDraw()) {
          endGame('draw');
        } else {
          // Switch player
          currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
          statusText.textContent = currentPlayer === 'X' ? 'Your Turn (X)' : 'Bot is thinking...';
        }
      }
      
      // Bot's move based on difficulty
      function botMove() {
        if (!gameActive || currentPlayer !== 'O') return;
        
        let move = -1;
        
        switch (difficulty) {
          case 1: // Mudah - Random dengan sedikit strategi
            move = getEasyMove();
            break;
          case 2: // Sedang - Campuran random dan minimax
            move = getMediumMove();
            break;
          case 3: // Susah - Full minimax
            move = getHardMove();
            break;
        }
        
        if (move !== -1) {
          makeMove(move, 'O');
        }
      }
      
      // Easy bot - mostly random with basic blocking
      function getEasyMove() {
        // 30% chance to play optimally, 70% random
        if (Math.random() < 0.3) {
          // Check for immediate win
          for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
              board[i] = 'O';
              if (checkWin('O')) {
                board[i] = '';
                return i;
              }
              board[i] = '';
            }
          }
          
          // Check for blocking player win
          for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
              board[i] = 'X';
              if (checkWin('X')) {
                board[i] = '';
                return i;
              }
              board[i] = '';
            }
          }
        }
        
        // Random move
        const emptyCells = [];
        for (let i = 0; i < 9; i++) {
          if (board[i] === '') {
            emptyCells.push(i);
          }
        }
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
      }
      
      // Medium bot - mix of random and optimal
      function getMediumMove() {
        // 70% chance to play optimally, 30% random
        if (Math.random() < 0.7) {
          return getHardMove();
        } else {
          return getEasyMove();
        }
      }
      
      // Hard bot - full minimax
      function getHardMove() {
        let bestScore = -Infinity;
        let move = -1;
        
        for (let i = 0; i < 9; i++) {
          if (board[i] === '') {
            board[i] = 'O';
            let score = minimax(board, 0, false);
            board[i] = '';
            
            if (score > bestScore) {
              bestScore = score;
              move = i;
            }
          }
        }
        
        return move;
      }
      
      // Minimax algorithm
      function minimax(board, depth, isMaximizing) {
        if (checkWin('O')) return 10 - depth;
        if (checkWin('X')) return depth - 10;
        if (isDraw()) return 0;
        
        if (isMaximizing) {
          let bestScore = -Infinity;
          
          for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
              board[i] = 'O';
              let score = minimax(board, depth + 1, false);
              board[i] = '';
              bestScore = Math.max(score, bestScore);
            }
          }
          
          return bestScore;
        } else {
          let bestScore = Infinity;
          
          for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
              board[i] = 'X';
              let score = minimax(board, depth + 1, true);
              board[i] = '';
              bestScore = Math.min(score, bestScore);
            }
          }
          
          return bestScore;
        }
      }
      
      // Check for win
      function checkWin(player) {
        return winPatterns.some(pattern => {
          return pattern.every(index => {
            return board[index] === player;
          });
        });
      }
      
      // Check for draw
      function isDraw() {
        return board.every(cell => cell !== '');
      }
      
      // End the game
      function endGame(result) {
        gameActive = false;
        
        if (result === 'draw') {
          statusText.textContent = 'It\'s a Draw!';
          statusText.className = 'status draw';
        } else if (result === 'X') {
          statusText.textContent = 'You Win!';
          statusText.className = 'status win';
        } else if (result === 'O') {
          statusText.textContent = 'Bot Wins!';
          statusText.className = 'status lose';
        }
      }
      
      // Update scores
      function updateScores(winner) {
        if (winner === 'X') {
          playerScore++;
          playerScoreElem.textContent = playerScore;
          
          if (playerScore > playerBest) {
            playerBest = playerScore;
            playerBestElem.textContent = playerBest;
            localStorage.setItem('playerBest', playerBest);
          }
        } else if (winner === 'O') {
          botScore++;
          botScoreElem.textContent = botScore;
          
          if (botScore > botBest) {
            botBest = botScore;
            botBestElem.textContent = botBest;
            localStorage.setItem('botBest', botBest);
          }
        }
      }
      
      // Reset the game
      function resetGame() {
        board = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
        gameActive = true;
        
        cells.forEach(cell => {
          cell.textContent = '';
          cell.classList.remove('x', 'o', 'disabled');
        });
        
        statusText.textContent = 'Your Turn (X)';
        statusText.className = 'status';
      }
      
      // Event listeners
      cells.forEach(cell => cell.addEventListener('click', handleCellClick));
      replayBtn.addEventListener('click', resetGame);
    });
