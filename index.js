let timerValue = 30;
let scoreValue = 0;
let hitsValue = 0;
let livesValue = 3;
let level = 1;
let maxBubbles = 50;
let timerInterval = null;
let isPaused = false;

let comboCount = 0;
let multiplier = 1;

const contentDiv = document.querySelector('.content');
const hitsNode = document.querySelector('.hitsvalue');
const scoreNode = document.querySelector('.scoreValue');
const livesNode = document.querySelector('.livesValue');
const levelNode = document.querySelector('.levelValue');
const timeNode = document.querySelector('.timer');
const progressBar = document.querySelector('.progress-timer');
const pauseBtn = document.getElementById('pauseBtn');

// Create bubbles dynamically, adapting number range based on level,
// including special bubbles (bonus and bomb)
function createBubbles() {
  let contentbox = '';
  const maxNum = 10 + level * 5;
  for (let i = 0; i < maxBubbles; i++) {
    const rand = Math.random();
    if (rand < 0.08) {
      // 8% chance bomb bubble
      contentbox += `<div class="bubble bomb">💣</div>`;
    } else if (rand < 0.16) {
      // 8% chance bonus bubble
      const bonusVal = Math.floor(Math.random() * (maxNum - 1)) + 1;
      contentbox += `<div class="bubble bonus">${bonusVal}</div>`;
    } else {
      // Normal bubble
      contentbox += `<div class="bubble">${Math.floor(Math.random() * maxNum)}</div>`;
    }
  }
  contentDiv.innerHTML = contentbox;
}

// Update all HUD elements (score, hits, lives, level, timer)
function updateHUD() {
  hitsNode.textContent = hitsValue;
  scoreNode.textContent = scoreValue;
  livesNode.textContent = livesValue;
  levelNode.textContent = level;
  timeNode.textContent = timerValue;
  const progressPercent = (timerValue / 30) * 100;
  progressBar.style.width = progressPercent + '%';
}

// Generate current hit target (display number player must click)
function generateHitNumber() {
  const maxNum = 10 + level * 5;
  hitsValue = Math.floor(Math.random() * maxNum);
  hitsNode.textContent = hitsValue;
  highlightHitNumber();
}

// Highlight the hit number display with a glowing effect
function highlightHitNumber() {
  hitsNode.classList.add('glow');
  setTimeout(() => hitsNode.classList.remove('glow'), 800);
}

// Start or resume the countdown timer
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!isPaused) {
      if (timerValue > 0 && livesValue > 0) {
        timerValue--;
        updateHUD();
      } else {
        clearInterval(timerInterval);
        endGame();
      }
    }
  }, 1000);
}

// Increase score based on multiplier and check level up condition
function incrementScore(points = 10) {
  scoreValue += points * level * multiplier;
  updateHUD();
  handleCombo(true);
  checkLevelUp();
  generateHitNumber();
  createBubbles();
}

// Reduce lives on incorrect click, end game if no lives remaining
function decrementLives() {
  handleCombo(false);
  livesValue--;
  updateHUD();
  if (livesValue <= 0) {
    clearInterval(timerInterval);
    endGame();
  }
}

// Check and handle leveling up
function checkLevelUp() {
  if (scoreValue >= level * 100) {
    level++;
    maxBubbles += 10;
    timerValue += 10; // Bonus time
    livesValue = Math.min(livesValue + 1, 5); // Max 5 lives
    updateHUD();
  }
}

// Pause or resume the game
function togglePause() {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
}

// End the game and show game over screen with score and high score
function endGame() {
  // Store high score in localStorage
  const highScore = localStorage.getItem('highScore') || 0;
  if (scoreValue > highScore) {
    localStorage.setItem('highScore', scoreValue);
  }

  contentDiv.innerHTML = `
    <h1 class="gameOver">
      Game Over <br>
      Your Score: ${scoreValue} <br>
      High Score: ${localStorage.getItem('highScore')} <br>
      <button onclick="startGame()">Restart</button>
    </h1>`;
  pauseBtn.textContent = 'Pause';
}

// Add bounce/pop animation to bubbles when clicked
function animateBubble(bubble) {
  bubble.classList.add('pop');
  bubble.addEventListener('animationend', () => {
    bubble.classList.remove('pop');
  }, { once: true });
}

// Combo system management
function handleCombo(isCorrect) {
  if (isCorrect) {
    comboCount++;
    if (comboCount > 1) {
      multiplier = 1 + Math.floor(comboCount / 3); // combo x2 after 3 hits, x3 after 6 hits, ...
      showCombo(multiplier);
    }
  } else {
    comboCount = 0;
    multiplier = 1;
    hideCombo();
  }
}

// Show combo badge
function showCombo(multi) {
  let comboEl = document.querySelector('.combo-display');
  if (!comboEl) {
    comboEl = document.createElement('div');
    comboEl.className = 'combo-display';
    contentDiv.appendChild(comboEl);
  }
  comboEl.textContent = `Combo x${multi}!`;
  comboEl.style.display = 'block';
  clearTimeout(comboEl._timeout);
  comboEl._timeout = setTimeout(() => {
    comboEl.style.display = 'none';
  }, 1500);
}

// Hide combo badge
function hideCombo() {
  let comboEl = document.querySelector('.combo-display');
  if (comboEl) comboEl.style.display = 'none';
}

// Handle special bubble clicks (bonus and bomb)
function handleSpecialBubble(bubble) {
  if (bubble.classList.contains('bonus')) {
    // Bonus bubble: add extra points and small time boost
    const bonusPoints = Number(bubble.textContent) || 5;
    incrementScore(bonusPoints * 2);
    timerValue = Math.min(timerValue + 5, 60);
    updateHUD();
    comboCount++; // bonus doesn't break combo
    showCombo(multiplier);
    playSound('bonus');
    return true;
  }
  if (bubble.classList.contains('bomb')) {
    // Bomb bubble: lose a life immediately and reset combo
    decrementLives();
    playSound('bomb');
    return true;
  }
  return false;
}

// Sound playback utility
const sounds = {
  correct: new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg'),
  wrong: new Audio('https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg'),
  bonus: new Audio('https://actions.google.com/sounds/v1/cartoon/slide_whistle_to_drum_hit.ogg'),
  bomb: new Audio('https://actions.google.com/sounds/v1/cartoon/metal_thud_and_bounce.ogg'),
  gameOver: new Audio('https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg'),
};

function playSound(name) {
  if (sounds[name]) {
    sounds[name].currentTime = 0;
    sounds[name].play();
  }
}

// Event listener for bubble clicks
contentDiv.addEventListener('click', (e) => {
  if (!e.target.classList.contains('bubble')) return;
  if (isPaused) return;

  animateBubble(e.target);

  if (handleSpecialBubble(e.target)) {
    // special bubble clicked and handled
    return;
  }

  const clickedNum = Number(e.target.textContent);
  if (clickedNum === hitsValue) {
    playSound('correct');
    incrementScore();
  } else {
    playSound('wrong');
    decrementLives();
  }
});

// Restart the game to initial values and start timers
function startGame() {
  scoreValue = 0;
  hitsValue = 0;
  livesValue = 3;
  timerValue = 30;
  level = 1;
  maxBubbles = 50;
  comboCount = 0;
  multiplier = 1;
  isPaused = false;
  pauseBtn.textContent = 'Pause';

  updateHUD();
  generateHitNumber();
  createBubbles();
  startTimer();
}

// Pause button toggle listener
pauseBtn.addEventListener('click', togglePause);

// On page load, just show start UI, without bubbles/timer yet
document.addEventListener('DOMContentLoaded', () => {
  updateHUD();
});

