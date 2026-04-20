window.addEventListener("load", async () => {
  const loadingScreen = document.getElementById("loading-screen");
  const game = document.getElementById("game");
  const loadingBar = document.getElementById("loading-bar");
  const loadingText = document.getElementById("loading-text");

  game.style.display = "none";

  function updateProgress(loaded, total) {
    const percent = Math.floor((loaded / total) * 100);
    loadingBar.style.width = percent + "%";
    loadingText.innerText = `正在加载资源... ${percent}% (${loaded}/${total})`;
  }
  
  await preloadImages(IMAGE_URLS, updateProgress);

  loadingScreen.style.display = "none";
  game.style.display = "block";

  render();
});