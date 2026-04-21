window.addEventListener("load", async () => {
  const loadingScreen = document.getElementById("loading-screen");
  const loadingBar = document.getElementById("loading-bar");
  const loadingText = document.getElementById("loading-text");
  const game = document.getElementById("game");
  const menu = document.getElementById("menu");

  menu.style.display = "none";
  game.style.display = "none";

  function updateProgress(loaded, total) {
    const percent = Math.floor((loaded / total) * 100);
    loadingBar.style.width = percent + "%";
    loadingText.innerText = `正在加载资源... ${percent}% (${loaded}/${total})`;
  }
  
  await preloadImages(IMAGE_URLS, updateProgress);

  loadingScreen.style.display = "none";
  menu.style.display = "flex";
});

let isMobile = false;
let enablePixelHitTest = true;

function mobile() {
  isMobile = true;
  enablePixelHitTest = false;
  loadMobileStyle();
  startGame();
}

function pc() {
  isMobile = false;
  enablePixelHitTest = true;
  startGame();
}

function startGame() {
  const menu = document.getElementById("menu");
  const game = document.getElementById("game");
  const overlay = document.getElementById("black-overlay");
  menu.style.display = "none";
  game.style.display = isMobile ? "flex" : "block";
  initial();
  overlay.classList.add("show");
  setTimeout(() => {
    overlay.classList.remove("show");
  }, 1);
}

function initial() {
  updateFatigueBar();
  startFatigue();

  Object.assign(state, {
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
    end: false
  });

  Object.assign(trigger, {
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
  });

  render();
}

function loadMobileStyle() {
  if (document.getElementById("mobile-style")) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "style_mobile.css";

  document.head.appendChild(link);
}