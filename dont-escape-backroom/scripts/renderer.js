function render() {
  renderScene();
  renderInventory();
}

function renderScene() {
  const sceneEl = document.getElementById("scene");
  const scene = scenes[state.currentScene];

  sceneEl.innerHTML = "";
  sceneEl.style.backgroundImage = `url(${scene.bg})`;

  scene.elements.forEach(el => {
    const dom = createElement(el);
    sceneEl.appendChild(dom);
  });
}

const interactiveElements = new Set();
let interactiveOrder = 0;
let currentHoverElement = null;
let rafId = null;
let hoverLocked = false;
let hoverUnlockReady = false;

function isInteractionLocked() {
  const zoomLayer = document.getElementById("zoom-layer");
  return zoomLayer && !zoomLayer.classList.contains("hidden");
}

function getLayerInfo(el) {
  const z = Number.parseInt(getComputedStyle(el).zIndex, 10);
  return {
    z: Number.isNaN(z) ? 0 : z,
    order: el._order ?? 0
  };
}

function compareTopFirst(a, b) {
  const la = getLayerInfo(a);
  const lb = getLayerInfo(b);

  if (la.z !== lb.z) return lb.z - la.z;
  return lb.order - la.order;
}

function clearHover() {
  if (!currentHoverElement) return;
  currentHoverElement.applyHoverState(false);
  currentHoverElement.style.pointerEvents = "none";
  currentHoverElement = null;
  showText("");
}

function onGlobalMouseMove(e) {
  if (state.dragging) return;

  if (hoverLocked && !hoverUnlockReady) {
    return;
  }

  if (hoverLocked && hoverUnlockReady) {
    hoverLocked = false;
    hoverUnlockReady = false;
    return;
  }

  if (rafId) return;

  const clientX = e.clientX;
  const clientY = e.clientY;

  rafId = requestAnimationFrame(() => {
    rafId = null;

    const zoomLayer = document.getElementById("zoom-layer");
    const zoomActive = zoomLayer && !zoomLayer.classList.contains("hidden");

    const scope = zoomActive ? zoomLayer : document;

    const candidates = [...interactiveElements]
      .filter(el =>
        el.isConnected &&
        el.checkInsideMask &&
        scope.contains(el)
      )
      .sort(compareTopFirst);

    let newHoverElement = null;

    for (const el of candidates) {
      const hit = el.checkInsideMask(clientX, clientY);

      if (!hit) continue;

      if (el.classList.contains("noInteract")) {
        newHoverElement = null;
        break;
      }

      newHoverElement = el;
      break;
    }

    if (newHoverElement === currentHoverElement) return;

    if (currentHoverElement) {
      currentHoverElement.applyHoverState(false);
      currentHoverElement.style.pointerEvents = "none";
    }

    currentHoverElement = newHoverElement;

    if (currentHoverElement) {
      currentHoverElement.style.pointerEvents = "auto";
      currentHoverElement.applyHoverState(true);
    } else {
      showText("");
    }
  });
}

document.addEventListener("mousemove", onGlobalMouseMove);

document.addEventListener("mouseleave", () => {
  clearHover();
});

function createElement(data) {
  const el = document.createElement("div");
  el.className = "element";

  el._order = interactiveOrder++;
  el._data = data;

  el.style.left = data.x * 100 + "%";
  el.style.top = data.y * 100 + "%";
  el.style.width = data.w * 100 + "%";
  el.style.height = data.h * 100 + "%";
  if (!data.visible) {el.style.display = "none"}
  else {el.style.display = "unset"};
  if (data.rotate) el.style.rotate = `${data.rotate}deg`;
  if (data.noInteract) el.classList.add("noInteract");
  if (data.bg) {
    el.style.backgroundImage = `url(${data.bg})`;
    el.style.maskImage = `url(${data.bg})`;
  }

  el.style.pointerEvents = 'none';

  el.desc = data.desc || '';

  let canvas = null;
  let img = null;
  let pixelData = null;

  el.loadPixelData = function() {
    if (pixelData) return Promise.resolve(pixelData);
    return new Promise((resolve, reject) => {
      img = new Image();
      img.crossOrigin = "anonymous";
      img.src = data.bg;
      img.onload = () => {
        canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        try {
          pixelData = ctx.getImageData(0, 0, img.width, img.height).data;
          resolve(pixelData);
        } catch (e) {
          pixelData = null;
          reject(e);
        }
      };
      img.onerror = reject;
    });
  };

  function parseRotate(rotateStr) {
    if (!rotateStr) return 0;
    const match = rotateStr.match(/-?\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
  }

  el.checkInsideMask = function(clientX, clientY) {
    const rect = el.getBoundingClientRect();

    if (data.ignorePixelCheck) {
      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    }

    if (!pixelData) return false;

    if (!el._hitCanvas) {
      el._hitCanvas = document.createElement("canvas");
      el._hitCtx = el._hitCanvas.getContext("2d");
    }

    const canvas = el._hitCanvas;
    const ctx = el._hitCtx;

    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    ctx.translate(canvas.width / 2, canvas.height / 2);

    const angle = (data.rotate || 0) * Math.PI / 180;
    ctx.rotate(angle);

    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);

    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;

    const offsetX = (canvas.width - drawWidth) / 2;
    const offsetY = (canvas.height - drawHeight) / 2;

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    ctx.restore();

    const x = Math.floor(clientX - rect.left);
    const y = Math.floor(clientY - rect.top);

    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
      return false;
    }

    const pixel = ctx.getImageData(x, y, 1, 1).data;

    return pixel[3] > 10;
  };

  el.applyHoverState = function(inside) {
    if (inside && !data.ignorePixelCheck) {
      if (data.desc) showText(data.desc);
      el.classList.add("hover");
    } else {
      el.classList.remove("hover");
      if (currentHoverElement === el) showText("");
    }
  };

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      el.loadPixelData().catch(() => {});
      observer.disconnect();
    }
  });
  observer.observe(el);

  el.addEventListener("click", (e) => {
    if (data.zoom) {
      openZoom(data.zoom);
      clearHover();
    } else if (data.action) {
      const actionsList = data.action.split(";").map(s => s.trim()).filter(Boolean);
      actionsList.forEach(act => executeActionString(act));
    }
  });

  document.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  document.addEventListener("drop", (e) => {
    e.preventDefault();

    if (!state.dragging) return;

    const zoomLayer = document.getElementById("zoom-layer");
    const zoomActive = zoomLayer && !zoomLayer.classList.contains("hidden");
    const scope = zoomActive ? zoomLayer : document;

    const clientX = e.clientX;
    const clientY = e.clientY;

    const target = [...interactiveElements]
      .filter(el =>
        el.isConnected &&
        el.checkInsideMask &&
        scope.contains(el) &&
        !el.classList.contains("noInteract")
      )
      .sort(compareTopFirst)
      .find(el => el.checkInsideMask(clientX, clientY));

    if (target) {
      actions.useItem({
        item: state.dragging,
        target: target._data.id
      });
    }

    state.dragging = null;
  });

  interactiveElements.add(el);

  const originalRemove = el.remove;
  el.remove = function() {
    interactiveElements.delete(el);
    originalRemove.call(this);
  };

  return el;
}

function renderInventory() {
  const inv = document.getElementById("inventory");
  inv.innerHTML = "";

  state.inventory.forEach(id => {
    const data = items[id];

    const el = document.createElement("div");
    el.className = "item";
    el.dataset.id = id;

    if (state.usingItem === id) {
      el.innerText = "使用";
      el.style.background = "#a33";
    } else if (data.icon) {
      el.style.backgroundImage = `url(${data.icon})`;
    } else {
      el.innerText = data.name;
    }

    el.onmouseenter = () => {
      if (state.dragging) return;
      showText(data.name + "，" + data.desc);
    };

    el.onmouseleave = () => {
      showText("");
      if (state.usingItem === id && !state.dragging) {
        state.usingItem = null;
        renderInventory();
      }
    };

    let dragStartX = 0;
    let dragStartY = 0;
    let dragStarted = false;

    el.onmousedown = (e) => {
      if (e.button !== 0) return;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragStarted = false;

      state.dragging = id;
    };

    document.addEventListener("mousemove", (e) => {
      if (state.dragging !== id) return;
      if (state.usingItem === id) return;

      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;

      dragStarted = true;

      document.querySelectorAll("#drag-preview").forEach(el => el.remove());

      el.classList.add("drag-source");

      const preview = document.createElement("div");
      preview.id = "drag-preview";
      preview.style.backgroundImage = `url(${data.icon})`;
      preview.style.pointerEvents = "none";

      document.body.appendChild(preview);
      state.dragPreview = preview;

      if (dragStarted && state.dragPreview) {
        state.dragPreview.style.left = e.clientX + "px";
        state.dragPreview.style.top = e.clientY + "px";
      }
    });

    document.addEventListener("mouseup", (e) => {
      if (state.dragging !== id) return;

      const currentId = id;

      if (!dragStarted) {
        if (data.usable) {
          if (state.usingItem !== currentId) {
            state.usingItem = currentId;
          } else {
            state.usingItem = null;
            removeInventoryItem(currentId);
            if (data.onUse) data.onUse();
          }
          renderInventory();
        }
      } else {
        const clientX = e.clientX;
        const clientY = e.clientY;

        const invTarget = document.elementFromPoint(clientX, clientY)?.closest?.("#inventory .item");

        if (invTarget && invTarget.dataset.id && invTarget.dataset.id !== currentId) {
          actions.useItem({
            item: currentId,
            target: invTarget.dataset.id + "Inv"
          });
        } else {
          const zoomLayer = document.getElementById("zoom-layer");
          const zoomActive = zoomLayer && !zoomLayer.classList.contains("hidden");
          const scope = zoomActive ? zoomLayer : document;

          const target = [...interactiveElements]
            .filter(el =>
              el.isConnected &&
              el.checkInsideMask &&
              scope.contains(el) &&
              !el.classList.contains("noInteract")
            )
            .sort(compareTopFirst)
            .find(el => el.checkInsideMask(clientX, clientY));

          if (target) {
            actions.useItem({
              item: currentId,
              target: target._data.id
            });
          }
        }
      }

      state.dragging = null;
      dragStarted = false;

      if (state.dragPreview) {
        state.dragPreview.remove();
        state.dragPreview = null;
      }

      el.classList.remove("drag-source");

      renderInventory();
    });

    inv.appendChild(el);
  });
}

function openZoom(id) {
  state.zoom = id;
  const zoom = document.getElementById("zoom-layer");
  zoom.classList.remove("hidden");

  zoomScenes[id].elements.forEach(el => {
    const dom = createElement(el);
    zoom.appendChild(dom);
  });

  zoom.onclick = (e) => {
    if (e.target === zoom) closeZoom();
  };
}

function closeZoom() {
  state.zoom = null;
  const zoomLayer = document.getElementById("zoom-layer");
  zoomLayer.classList.add("hidden");
  zoomLayer.innerHTML = "";
}

function showText(text) {
  if (hoverLocked) return; 
  desc = document.getElementById("description");
  if (text == "") {desc.style.opacity = 0;}
  else {desc.style.opacity = 1;}
  desc.innerText = text;
}

function forceShowText(text, duration = 1000) {
  showText(text);
  hoverLocked = true;
  hoverUnlockReady = false;

  clearHover();

  setTimeout(() => {
    hoverUnlockReady = true;
  }, duration);
}

function executeActionString(actionStr) {
  if (!actionStr) return;

  const match = actionStr.match(/^(\w+)\((.*)\)$/);
  if (!match) {
    const fn = actions[actionStr];
    if (typeof fn === "function") fn.call(actions);
    return;
  }

  const fnName = match[1];
  const argStr = match[2];
  const args = argStr ? argStr.split(",").map(s => s.trim()) : [];
  const fn = actions[fnName];

  if (typeof fn === "function") {
    fn.apply(actions, args);
  }
}