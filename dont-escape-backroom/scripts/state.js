const state = {
  currentScene: "room1",
  zoom: null,
  inventory: ["firstAidKit", "lighter"],
  dragging: null,
  dragPreview: null,
  usingItem: null,
  plankWindow: false,
  plankDoor: false,
  sleepConfirm: false,
  fatigue: 400,
  end: false,
  diary: false,
  moveShelf: false
};

const trigger = {
  usedPills: false,
  usedBandage: false,
  bound: false,
  handcuffed: false,
  reinforcedWindow: false,
  lockedWindow: false,
  watered: false,
  blockedDoor: false,
  reinforcedDoor: false,
  lockedDoor: false,
  didntOnBed: false,
  sleepOnBed: false
}

let fatigueRunning = false;
let lastFatigueTime = Date.now();

function startFatigue() {
  if (fatigueRunning) return;
  fatigueRunning = true;
  lastFatigueTime = Date.now();
  requestAnimationFrame(updateFatigue);
}

function updateFatigue() {
  if (!fatigueRunning) return;

  const now = Date.now();
  const delta = (now - lastFatigueTime) / 1000;
  lastFatigueTime = now;

  state.fatigue -= delta;

  if (trigger.sleepOnBed || state.fatigue <= 0) {
    state.fatigue = 0;
    fatigueRunning = false;

    if (!trigger.sleepOnBed) {
      onFatigueEmpty();
    }

    playFatigueEnding();
    return;
  }

  requestAnimationFrame(updateFatigue);
  updateFatigueBar();
}

function updateFatigueBar() {
  const bar = document.getElementById("fatigue-bar");

  const max = 400;
  const percent = (state.fatigue / max) * 100;

  bar.style.height = percent + "%";
}