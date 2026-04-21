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
  saveGame();
  loadingScreen.remove();
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
  menu.remove();
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
  loadGame();
  render();
}

function loadMobileStyle() {
  if (document.getElementById("mobile-style")) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "style_mobile.css";

  document.head.appendChild(link);
}

function saveGame() {

  const sceneData = {};

  for (const [sceneId, scene] of Object.entries(scenes)) {
    sceneData[sceneId] = {};

    scene.elements.forEach(el => {
      sceneData[sceneId][el.id] = {
        visible: el.visible,
        noInteract: el.noInteract,
        bg: el.bg,
        rotate: el.rotate
      };
    });
  }

  const zoomData = {};

  for (const [sceneId, scene] of Object.entries(zoomScenes)) {
    zoomData[sceneId] = {};

    scene.elements.forEach(el => {
      zoomData[sceneId][el.id] = {
        visible: el.visible,
        noInteract: el.noInteract,
        bg: el.bg,
        rotate: el.rotate
      };
    });
  }

  localStorage.setItem("sceneData", JSON.stringify(sceneData));
  localStorage.setItem("zoomData", JSON.stringify(zoomData));
  localStorage.setItem("state", JSON.stringify(state));
  localStorage.setItem("trigger", JSON.stringify(trigger));
}

function loadGame() {

  const sceneData = JSON.parse(localStorage.getItem("sceneData") || "{}");
  const zoomData = JSON.parse(localStorage.getItem("zoomData") || "{}");

  function apply(list, saved) {
    list.forEach(el => {
      const data = saved?.[el.id];
      if (!data) return;

      Object.assign(el, data);
    });
  }

  for (const [sceneId, scene] of Object.entries(scenes)) {
    apply(scene.elements, sceneData[sceneId]);
  }

  for (const [sceneId, scene] of Object.entries(zoomScenes)) {
    apply(scene.elements, zoomData[sceneId]);
  }

  Object.assign(state, JSON.parse(localStorage.getItem("state") || "{}"));
  Object.assign(trigger, JSON.parse(localStorage.getItem("trigger") || "{}"));
}