// ============================================
// ROCK PAPER SCISSORS — GAME LOGIC
// ============================================

const ICONS = {
  rock: "🪨",
  paper: "📄",
  scissors: "✂️",
};

const BEATS = {
  rock: "scissors", // rock beats scissors
  paper: "rock", // paper beats rock
  scissors: "paper", // scissors beats paper
};

// ---------- State ----------
let state = {
  youScore: 0,
  cpuScore: 0,
  highScore: 0,
  soundOn: true,
};

// ---------- Elements ----------
const els = {
  youIcon: document.getElementById("youIcon"),
  cpuIcon: document.getElementById("cpuIcon"),
  youBox: document.getElementById("youBox"),
  cpuBox: document.getElementById("cpuBox"),
  resultBanner: document.getElementById("resultBanner"),
  resultText: document.getElementById("resultText"),
  youScore: document.getElementById("youScore"),
  cpuScore: document.getElementById("cpuScore"),
  highScore: document.getElementById("highScore"),
  soundToggle: document.getElementById("soundToggle"),
  resetBtn: document.getElementById("resetBtn"),
  moveButtons: document.querySelectorAll(".move-btn"),
};

// ---------- Persistence ----------
const STORAGE_KEY = "rps_retro_arcade_state";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      state.youScore = saved.youScore ?? 0;
      state.cpuScore = saved.cpuScore ?? 0;
      state.highScore = saved.highScore ?? 0;
      state.soundOn = saved.soundOn ?? true;
    }
  } catch (e) {
    // ignore corrupted storage
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // storage unavailable — game still works, just won't persist
  }
}

// ---------- Sound (mp3 files from /assets) ----------
// Add or swap files in the assets folder and update the paths below.
const SOUND_FILES = {
  toggle: "assets/sound-on.mp3", // plays when sound is switched ON
  win: "assets/sound-on.mp3", // swap for your own win.mp3 if you like
  lose: "assets/sound-on.mp3", // swap for your own lose.mp3 if you like
  tie: "assets/sound-on.mp3", // swap for your own tie.mp3 if you like
};

// Preload each sound once so playback is instant on click.
const audioCache = {};
Object.entries(SOUND_FILES).forEach(([key, src]) => {
  const audio = new Audio(src);
  audio.preload = "auto";
  audioCache[key] = audio;
});

function playSound(key) {
  if (!state.soundOn) return;
  const original = audioCache[key];
  if (!original) return;
  // Clone the node so overlapping plays (e.g. rapid clicks) don't cut each other off.
  const instance = original.cloneNode();
  instance.volume = 0.6;
  instance.play().catch(() => {
    // Playback can be blocked until the user interacts with the page — safe to ignore.
  });
}

// ---------- Helpers ----------
function randomMove() {
  const moves = Object.keys(ICONS);
  return moves[Math.floor(Math.random() * moves.length)];
}

function decideOutcome(you, cpu) {
  if (you === cpu) return "tie";
  return BEATS[you] === cpu ? "win" : "lose";
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function padHigh(n) {
  return String(n).padStart(5, "0");
}

function updateScoreboard() {
  els.youScore.textContent = pad(state.youScore);
  els.cpuScore.textContent = pad(state.cpuScore);
  els.highScore.textContent = padHigh(state.highScore);
}

function setResult(outcomeText, cssState) {
  els.resultText.textContent = outcomeText;
  els.resultBanner.classList.remove(
    "state-win",
    "state-lose",
    "state-tie",
    "state-idle",
  );
  els.resultBanner.classList.add(cssState);
}

function playRound(playerMove) {
  const cpuMove = randomMove();

  els.youIcon.textContent = ICONS[playerMove];
  els.cpuIcon.textContent = ICONS[cpuMove];

  // retrigger reveal animation
  [els.youBox, els.cpuBox].forEach((box) => {
    box.classList.remove("reveal");
    // force reflow so animation restarts
    void box.offsetWidth;
    box.classList.add("reveal");
  });

  const outcome = decideOutcome(playerMove, cpuMove);

  if (outcome === "win") {
    state.youScore += 1;
    if (state.youScore > state.highScore) state.highScore = state.youScore;
    setResult("YOU WIN!", "state-win");
    playSound("win");
  } else if (outcome === "lose") {
    state.cpuScore += 1;
    setResult("YOU LOSE!", "state-lose");
    playSound("lose");
  } else {
    setResult("IT'S A TIE!", "state-tie");
    playSound("tie");
  }

  updateScoreboard();
  saveState();
}

function resetScore() {
  state.youScore = 0;
  state.cpuScore = 0;
  els.youIcon.textContent = "?";
  els.cpuIcon.textContent = "?";
  setResult("MAKE YOUR MOVE", "state-idle");
  updateScoreboard();
  saveState();
}

function toggleSound() {
  state.soundOn = !state.soundOn;
  els.soundToggle.textContent = state.soundOn ? "ON" : "OFF";
  els.soundToggle.setAttribute("aria-pressed", String(state.soundOn));
  if (state.soundOn) playSound("toggle");
  saveState();
}

// ---------- Wire up events ----------
els.moveButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const move = btn.getAttribute("data-move");
    playRound(move);
  });
});

els.resetBtn.addEventListener("click", resetScore);
els.soundToggle.addEventListener("click", toggleSound);

// ---------- Init ----------
loadState();
els.soundToggle.textContent = state.soundOn ? "ON" : "OFF";
els.soundToggle.setAttribute("aria-pressed", String(state.soundOn));
setResult("MAKE YOUR MOVE", "state-idle");
updateScoreboard();
