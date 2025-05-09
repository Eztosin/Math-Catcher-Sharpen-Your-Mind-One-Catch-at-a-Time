// Enhanced Math Catcher Game

// Cloud class for background elements
class Cloud {
  constructor(x, y, speed, size) {
      this.x = x;
      this.y = y;
      this.speed = speed;
      this.size = size;
  }

  draw(ctx) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.arc(this.x + this.size * 0.5, this.y - this.size * 0.4, this.size * 0.8, 0, Math.PI * 2);
      ctx.arc(this.x + this.size, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
  }

  update(canvasWidth) {
      this.x += this.speed;
      if (this.x > canvasWidth + this.size * 2) {
          this.x = -this.size * 2;
      }
  }
}

// Bowl class for the player
class Bowl {
  constructor(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.color = "#8B4513"; // Brown color
  }

  draw(ctx) {
      // Draw a semi-circle for the bowl
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y, this.width / 2, 0, Math.PI, false);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.strokeStyle = "#000000"; // Black outline
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.closePath();
      
      // Draw a rectangle for the bowl base
      ctx.beginPath();
      ctx.rect(this.x, this.y, this.width, this.height / 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.strokeStyle = "#000000";
      ctx.stroke();
      ctx.closePath();
  }

  moveLeft(step) {
      if (this.x > 0) this.x -= step;
  }

  moveRight(step, canvasWidth) {
      if (this.x + this.width < canvasWidth) this.x += step;
  }
}

// FallingItem class for the math answers
class FallingItem {
  constructor(x, y, value, speed = 2, isCorrect = false) {
      this.x = x;
      this.y = y;
      this.value = value;
      this.speed = speed;
      this.radius = 10;
      this.isCorrect = isCorrect;
      this.caught = false;
      this.caughtAnimation = 0;
  }

  draw(ctx) {
      if (this.caught) {
          // Draw caught animation
          ctx.font = "24px Arial";
          ctx.fillStyle = this.isCorrect ? "green" : "red";
          ctx.textAlign = "center";
          const symbol = this.isCorrect ? "✓" : "✗";
          ctx.fillText(symbol, this.x, this.y - this.caughtAnimation);
          this.caughtAnimation += 2;
          return this.caughtAnimation > 50; // Return true when animation is complete
      } else {
          // Draw normal falling item
          ctx.font = "24px Arial";
          ctx.textAlign = "center";
          ctx.fillText(`🍎 ${this.value}`, this.x, this.y + 10);
          return false;
      }
  }

  update() {
      if (!this.caught) {
          this.y += this.speed;
      }
  }

  isCaught(bowl) {
      return (
          !this.caught &&
          this.y + this.radius >= bowl.y &&
          this.x > bowl.x &&
          this.x < bowl.x + bowl.width
      );
  }

  isOffScreen(canvasHeight) {
      return this.y > canvasHeight;
  }

  catch(isCorrect) {
      this.caught = true;
      this.isCorrect = isCorrect;
  }
}

// Main Game Object
const Game = {
  // Game properties
  canvas: null,
  ctx: null,
  bowl: null,
  clouds: [],
  fallingItems: [],
  caughtItems: [],
  score: 0,
  level: 1,
  timeRemaining: 60,
  timerInterval: null,
  isPaused: false,
  isGameOver: false,
  isStarted: false,
  currentQuestion: null,
  itemSpeed: 2,
  soundEnabled: true,
  difficulty: "medium",
  highScores: [],

  // DOM elements
  questionElement: null,
  scoreElement: null,
  levelElement: null,
  timerElement: null,
  finalScoreElement: null,
  finalLevelElement: null,

  // Audio elements
  correctSound: null,
  wrongSound: null,
  levelUpSound: null,
  gameOverSound: null,

  // Initialize the game
  init: function () {
    // Get canvas and context
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    // Set fixed dimensions
    this.canvas.width = 500;
    this.canvas.height = 375;

    // Get DOM elements
    this.questionElement = document.getElementById("question");
    this.scoreElement = document.getElementById("score");
    this.levelElement = document.getElementById("level");
    this.timerElement = document.getElementById("timer");
    this.finalScoreElement = document.getElementById("final-score");
    this.finalLevelElement = document.getElementById("final-level");

    // Get audio elements
    this.correctSound = document.getElementById("correct-sound");
    this.wrongSound = document.getElementById("wrong-sound");
    this.levelUpSound = document.getElementById("level-up-sound");
    this.gameOverSound = document.getElementById("game-over-sound");

    // Create bowl
    const bowlWidth = 70;
    const bowlHeight = 20;
    this.bowl = new Bowl(
      this.canvas.width / 2 - bowlWidth / 2,
      this.canvas.height - 50,
      bowlWidth,
      bowlHeight
    );

    // Create clouds
    this.createClouds();

    // Load high scores
    this.loadHighScores();
    this.displayHighScores();

    // Set up event listeners
    this.setupEventListeners();

    // Draw the initial screen
    this.drawBackground();
    this.bowl.draw(this.ctx);

    console.log("Game initialized");
  },

  // Create cloud objects for the background
  createClouds: function () {
    this.clouds = [];
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * (this.canvas.height / 3);
      const speed = Math.random() * 0.5 + 0.1;
      const size = Math.random() * 20 + 20;
      this.clouds.push(new Cloud(x, y, speed, size));
    }
  },

  // Set up event listeners
  setupEventListeners: function () {
    // Keyboard controls
    document.addEventListener("keydown", (e) => {
      if (!this.isStarted || this.isGameOver) return;

      const step = 15;
      if (e.key === "ArrowLeft" || e.key === "a") this.bowl.moveLeft(step);
      if (e.key === "ArrowRight" || e.key === "d")
        this.bowl.moveRight(step, this.canvas.width);
      if (e.key === "Escape" || e.key === "p") this.togglePause();
    });

    // Touch controls for mobile
    const leftBtn = document.getElementById("leftBtn");
    const rightBtn = document.getElementById("rightBtn");

    if (leftBtn && rightBtn) {
      // Left button
      leftBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (!this.isStarted || this.isGameOver || this.isPaused) return;
        this.leftInterval = setInterval(() => {
          this.bowl.moveLeft(15);
        }, 50);
      });

      leftBtn.addEventListener("touchend", () => {
        clearInterval(this.leftInterval);
      });

      // Right button
      rightBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (!this.isStarted || this.isGameOver || this.isPaused) return;
        this.rightInterval = setInterval(() => {
          this.bowl.moveRight(15, this.canvas.width);
        }, 50);
      });

      rightBtn.addEventListener("touchend", () => {
        clearInterval(this.rightInterval);
      });
    }

    // Exit button - properly indented inside the function
    const exitButton = document.getElementById("exit-button");
    if (exitButton) {
      exitButton.addEventListener("click", () => {
        if (
          confirm(
            "Are you sure you want to exit the game? Your progress will be lost."
          )
        ) {
          // Stop the game
          clearInterval(this.timerInterval);
          this.isGameOver = true;
          this.isPaused = true;

          // Show start screen
          document.getElementById("start-screen").style.display = "flex";
        }
      });
    }

    // Start button
    document.getElementById("start-button").addEventListener("click", () => {
      this.soundEnabled = document.getElementById("sound-toggle").checked;
      this.difficulty = document.getElementById("difficulty").value;
      this.startGame();
    });

    // Logout button
    document.getElementById("logout-button").addEventListener("click", () => {
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });

    // Restart button
    document.getElementById("restart-button").addEventListener("click", () => {
      document.getElementById("game-over").style.display = "none";
      this.resetGame();
      this.startGame();
    });
  },

  // Start the game
  startGame: function () {
    document.getElementById("start-screen").style.display = "none";
    this.isStarted = true;
    this.isPaused = false;
    this.isGameOver = false;

    // Set difficulty
    switch (this.difficulty) {
      case "easy":
        this.itemSpeed = 1.5;
        this.timeRemaining = 90;
        break;
      case "hard":
        this.itemSpeed = 3;
        this.timeRemaining = 45;
        break;
      default: // medium
        this.itemSpeed = 2;
        this.timeRemaining = 60;
    }

    // Generate first question
    this.generateQuestion();

    // Start timer
    this.startTimer();

    // Start game loop
    this.update();
  },

  // Reset the game
  resetGame: function () {
    this.score = 0;
    this.level = 1;
    this.fallingItems = [];
    this.caughtItems = [];

    // Reset UI
    this.updateUI();

    // Reset bowl position
    this.bowl.x = this.canvas.width / 2 - this.bowl.width / 2;
  },

  // Start the timer
  startTimer: function () {
    clearInterval(this.timerInterval);
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      if (!this.isPaused) {
        this.timeRemaining--;
        this.updateTimerDisplay();

        // Low time warning
        if (this.timeRemaining <= 10) {
          this.timerElement.classList.add("low-time");
        } else {
          this.timerElement.classList.remove("low-time");
        }

        if (this.timeRemaining <= 0) {
          if (this.level < 5) {
            this.levelUp();
          } else {
            this.endGame();
          }
        }
      }
    }, 1000);
  },
  // Update timer display
  updateTimerDisplay: function () {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    this.timerElement.textContent = `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;
  },

  // Generate a question based on the current level
  generateQuestion: function () {
    let a, b, answer, operation, questionText;

    // Different operations based on level
    if (this.level === 1) {
      // Level 1: Simple addition
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a + b;
      operation = "+";
    } else if (this.level === 2) {
      // Level 2: Addition and subtraction
      operation = Math.random() < 0.5 ? "+" : "-";
      if (operation === "+") {
        a = Math.floor(Math.random() * 20) + 1;
        b = Math.floor(Math.random() * 20) + 1;
        answer = a + b;
      } else {
        a = Math.floor(Math.random() * 20) + 10;
        b = Math.floor(Math.random() * 10) + 1;
        answer = a - b;
      }
    } else if (this.level === 3) {
      // Level 3: Addition, subtraction, and multiplication
      const operations = ["+", "-", "×"];
      operation = operations[Math.floor(Math.random() * operations.length)];

      if (operation === "+") {
        a = Math.floor(Math.random() * 30) + 1;
        b = Math.floor(Math.random() * 30) + 1;
        answer = a + b;
      } else if (operation === "-") {
        a = Math.floor(Math.random() * 30) + 10;
        b = Math.floor(Math.random() * 10) + 1;
        answer = a - b;
      } else {
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
        answer = a * b;
      }
    } else {
      // Level 4+: All operations including division
      const operations = ["+", "-", "×", "÷"];
      operation = operations[Math.floor(Math.random() * operations.length)];

      if (operation === "+") {
        a = Math.floor(Math.random() * 50) + 1;
        b = Math.floor(Math.random() * 50) + 1;
        answer = a + b;
      } else if (operation === "-") {
        a = Math.floor(Math.random() * 50) + 10;
        b = Math.floor(Math.random() * 20) + 1;
        answer = a - b;
      } else if (operation === "×") {
        a = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * 12) + 1;
        answer = a * b;
      } else {
        // Division with whole number answers
        b = Math.floor(Math.random() * 10) + 1;
        answer = Math.floor(Math.random() * 10) + 1;
        a = b * answer;
      }
    }

    questionText = `Solve: ${a} ${operation} ${b}`;
    this.questionElement.textContent = questionText;
    this.currentQuestion = { a, b, answer, operation };

    // Generate falling items
    this.generateFallingItems();
  },

  // Generate falling items with answers
  generateFallingItems: function () {
    const answer = this.currentQuestion.answer;

    // Create options (correct answer and distractors)
    let values = [answer];

    // Add distractors based on level
    if (this.level <= 2) {
      values.push(answer + 1, answer - 1);
    } else if (this.level <= 4) {
      values.push(answer + 1, answer - 1, answer + 2);
    } else {
      values.push(answer + 1, answer - 1, answer + 2, answer - 2);
    }

    // Shuffle values
    values.sort(() => 0.5 - Math.random());

    // Make sure correct answer is included
    if (!values.includes(answer)) {
      values[0] = answer;
    }

    // Create falling items
    const spacing = this.canvas.width / (values.length + 1);
    this.fallingItems = values.map((val, i) => {
      const x = spacing * (i + 1);
      const isCorrect = val === answer;
      return new FallingItem(x, 0, val, this.itemSpeed, isCorrect);
    });
  },

  // Toggle pause state
  togglePause: function () {
    this.isPaused = !this.isPaused;
  },

  // Draw pause screen
  drawPauseScreen: function () {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.font = "36px Arial";
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "center";
    this.ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.font = "18px Arial";
    this.ctx.fillText(
      "Press ESC or P to continue",
      this.canvas.width / 2,
      this.canvas.height / 2 + 40
    );
  },

  // Level up
  levelUp: function () {
    this.level++;

    // Play sound
    if (this.soundEnabled) {
      this.levelUpSound.currentTime = 0;
      this.levelUpSound.play();
    }

    // Increase difficulty
    this.itemSpeed += 0.5;

    // Reset timer based on level
    this.timeRemaining = Math.max(30, 60 - (this.level - 1) * 5);
    this.timerElement.classList.remove("low-time");

    // Update UI
    this.updateUI();

    // Generate new question
    this.generateQuestion();
  },

  // End the game
  endGame: function () {
    clearInterval(this.timerInterval);
    this.isGameOver = true;

    // Play sound
    if (this.soundEnabled) {
      this.gameOverSound.currentTime = 0;
      this.gameOverSound.play();
    }

    // Update final score display
    this.finalScoreElement.textContent = `Your Score: ${this.score}`;
    this.finalLevelElement.textContent = `Level Reached: ${this.level}`;

    // Save high score
    this.saveHighScore();

    // Show game over screen
    document.getElementById("game-over").style.display = "flex";
  },

  // Update UI elements
  updateUI: function () {
    this.scoreElement.textContent = `Score: ${this.score}`;
    this.levelElement.textContent = `Level: ${this.level}`;
  },

  // Draw background with clouds
  drawBackground: function () {
    // Clear canvas
    this.ctx.fillStyle = "#cce7ff";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw clouds
    this.clouds.forEach((cloud) => {
      cloud.draw(this.ctx);
    });
  },

  // Save high score
  saveHighScore: function () {
    this.highScores.push({
      score: this.score,
      level: this.level,
      date: new Date().toISOString(),
    });

    // Sort by score (highest first)
    this.highScores.sort((a, b) => b.score - a.score);

    // Keep only top 5
    this.highScores = this.highScores.slice(0, 5);

    // Save to localStorage
    localStorage.setItem(
      "mathCatcherHighScores",
      JSON.stringify(this.highScores)
    );

    // Update display
    this.displayHighScores();
  },

  // Load high scores from localStorage
  loadHighScores: function () {
    const savedScores = localStorage.getItem("mathCatcherHighScores");
    if (savedScores) {
      this.highScores = JSON.parse(savedScores);
    }
  },

  // Display high scores in the table
  displayHighScores: function () {
    const table = document.getElementById("high-scores-table");

    // Clear existing rows except header
    while (table.rows.length > 1) {
      table.deleteRow(1);
    }

    if (this.highScores.length === 0) {
      const row = table.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 3;
      cell.textContent = "No scores yet";
    } else {
      this.highScores.forEach((score, index) => {
        const row = table.insertRow();

        const rankCell = row.insertCell();
        rankCell.textContent = index + 1;

        const scoreCell = row.insertCell();
        scoreCell.textContent = score.score;

        const levelCell = row.insertCell();
        levelCell.textContent = score.level;
      });
    }
  },

  // Main game loop
  update: function () {
    if (!this.isStarted) {
      requestAnimationFrame(() => this.update());
      return;
    }

    // Update clouds
    this.clouds.forEach((cloud) => {
      cloud.update(this.canvas.width);
    });

    // Draw background
    this.drawBackground();

    if (this.isPaused) {
      this.drawPauseScreen();
      this.bowl.draw(this.ctx);
      requestAnimationFrame(() => this.update());
      return;
    }

    if (this.isGameOver) {
      requestAnimationFrame(() => this.update());
      return;
    }

    // Draw bowl
    this.bowl.draw(this.ctx);

    // Update and draw caught items (animations)
    this.caughtItems = this.caughtItems.filter((item) => {
      const done = item.draw(this.ctx);
      return !done; // Keep if not done
    });

    // Update and draw falling items
    let newQuestionNeeded = false;

    this.fallingItems = this.fallingItems.filter((item) => {
      item.update();

      // Check for catch
      if (item.isCaught(this.bowl)) {
        const isCorrect = item.value === this.currentQuestion.answer;

        if (isCorrect) {
          this.score += this.level; // More points for higher levels
          this.updateUI();
          this.timeRemaining += 5; // Bonus time
          this.updateTimerDisplay();

          // Play sound
          if (this.soundEnabled) {
            this.correctSound.currentTime = 0;
            this.correctSound.play();
          }
        } else {
          this.timeRemaining -= 3; // Penalty
          this.updateTimerDisplay();

          // Play sound
          if (this.soundEnabled) {
            this.wrongSound.currentTime = 0;
            this.wrongSound.play();
          }
        }

        // Add to caught items for animation
        item.catch(isCorrect);
        this.caughtItems.push(item);

        newQuestionNeeded = true;
        return false; // Remove from falling items
      }

      // Check if item is off screen
      if (item.isOffScreen(this.canvas.height)) {
        if (item.value === this.currentQuestion.answer) {
          this.timeRemaining -= 2; // Penalty for missing correct answer
          this.updateTimerDisplay();
        }
        newQuestionNeeded = true;
        return false; // Remove from falling items
      }

      // Draw the item
      item.draw(this.ctx);
      return true; // Keep in falling items
    });

    if (newQuestionNeeded) {
      this.generateQuestion();
    }

    // Continue game loop
    requestAnimationFrame(() => this.update());
  },
};

// Initialize game when page loads
window.addEventListener('load', () => {
  // Check if user is logged in
  const user = localStorage.getItem("user");
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Display username
  const userInfo = document.getElementById("user-info");
  if (userInfo) {
    userInfo.innerHTML = `Logged in as: <strong>${user}</strong> <a href="#" id="logout-link" class="text-blue-600 hover:underline">(Logout)</a>`;
    
    // Add logout functionality
    document.getElementById("logout-link").addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });
  }

  // Initialize the game
  Game.init();
});


