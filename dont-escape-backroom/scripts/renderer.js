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

let dragInfo = null;

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

function getPoint(e) {
  return {
    clientX: e.clientX,
    clientY: e.clientY
  };
}

function getTopElement(x, y) {
  const zoomLayer = document.getElementById("zoom-layer");
  const zoomActive = zoomLayer && !zoomLayer.classList.contains("hidden");
  const scope = zoomActive ? zoomLayer : document;

  return [...interactiveElements]
    .filter(el =>
      el.isConnected &&
      el.checkInsideMask &&
      scope.contains(el) &&
      !el.classList.contains("noInteract")
    )
    .sort(compareTopFirst)
    .find(el => el.checkInsideMask(x, y)) || null;
}

function getTopElementRaw(x, y) {
  const zoomLayer = document.getElementById("zoom-layer");
  const zoomActive = zoomLayer && !zoomLayer.classList.contains("hidden");
  const scope = zoomActive ? zoomLayer : document;

  return [...interactiveElements]
    .filter(el =>
      el.isConnected &&
      el.checkInsideMask &&
      scope.contains(el)
    )
    .sort(compareTopFirst)
    .find(el => el.checkInsideMask(x, y)) || null;
}

function hitNoInteract(x, y) {
  const el = getTopElementRaw(x, y);
  return !!el && el.classList.contains("noInteract");
}

function onPointerMove(e) {
  const { clientX, clientY } = getPoint(e);

  if (state.dragging && dragInfo) {
    const dx = clientX - dragInfo.startX;
    const dy = clientY - dragInfo.startY;

    if (!dragInfo.dragStarted && Math.hypot(dx, dy) > 8) {
      dragInfo.dragStarted = true;
    }

    if (dragInfo.dragStarted) {
      if (!state.dragPreview) {
        dragInfo.sourceEl.classList.add("drag-source");

        const preview = document.createElement("div");
        preview.id = "drag-preview";
        preview.style.backgroundImage = `url(${dragInfo.data.icon})`;
        preview.style.pointerEvents = "none";
        document.body.appendChild(preview);
        state.dragPreview = preview;
      }

      state.dragPreview.style.left = clientX + "px";
      state.dragPreview.style.top = clientY + "px";
    }

    e.preventDefault();
    return;
  }

  if (e.pointerType === "touch") return;

  if (hoverLocked && !hoverUnlockReady) return;

  if (hoverLocked && hoverUnlockReady) {
    hoverLocked = false;
    hoverUnlockReady = false;
    return;
  }

  if (rafId) return;

  rafId = requestAnimationFrame(() => {
    rafId = null;

    const target = getTopElement(clientX, clientY);

    if (target === currentHoverElement) return;

    if (currentHoverElement) {
      currentHoverElement.applyHoverState(false);
      currentHoverElement.style.pointerEvents = "none";
    }

    currentHoverElement = target;

    if (target) {
      target.style.pointerEvents = "auto";
      target.applyHoverState(true);
    } else {
      showText("");
    }
  });
}

function onPointerUp(e) {
  const { clientX, clientY } = getPoint(e);

  if (state.dragging && dragInfo) {
    const id = dragInfo.id;
    const data = dragInfo.data;

    if (!dragInfo.dragStarted) {
      if (data.usable) {
        if (state.usingItem !== id) {
          state.usingItem = id;
        } else {
          state.usingItem = null;
          removeInventoryItem(id);
          data.onUse?.();
        }
        renderInventory();
      }

      clearDrag();
      return;
    }

    const invTarget = document.elementFromPoint(clientX, clientY)
      ?.closest("#inventory .item");

    if (invTarget && invTarget.dataset.id !== id) {
      actions.useItem({
        item: id,
        target: invTarget.dataset.id + "Inv"
      });
    } else {
      const target = getTopElement(clientX, clientY);
      if (target) {
        actions.useItem({
          item: id,
          target: target._data.id
        });
      }
    }

    clearDrag();
    return;
  }

  if (e.pointerType === "touch") {
    const target = getTopElement(clientX, clientY);
    const rawHit = getTopElementRaw(clientX, clientY);

    if (rawHit?.classList.contains("noInteract")) {
      return;
    }

    if (target) {
      if (target._data?.desc) {
        showMobileDesc(target._data.desc);
      }

      if (target._data.zoom) {
        openZoom(target._data.zoom);
      } else if (target._data.action) {
        target._data.action
          .split(";")
          .map(s => s.trim())
          .filter(Boolean)
          .forEach(executeActionString);
      }
    } else {
      clearHover();
    }
  }
}

function clearDrag() {
  if (dragInfo?.sourceEl) {
    dragInfo.sourceEl.classList.remove("drag-source");
  }

  dragInfo = null;
  state.dragging = null;

  if (state.dragPreview) {
    state.dragPreview.remove();
    state.dragPreview = null;
  }
}

document.addEventListener("pointermove", onPointerMove, { passive: false });
document.addEventListener("pointerup", onPointerUp);
document.addEventListener("pointercancel", clearDrag);
window.addEventListener("blur", () => {
  clearDrag();
  clearHover();
});
document.addEventListener("mouseleave", clearHover);
document.addEventListener("touchstart", (e) => {
  const target = e.target;

  const isInv = target.closest?.("#inventory .item");
  const { clientX, clientY } = e.touches[0];
  const hitEl = getTopElement(clientX, clientY);

  const isScene = !!hitEl;

  if (!isInv && !isScene) {
    hoverLocked = false;
    hoverUnlockReady = false;
    showText("");
    state["sleepConfirm"] = false;
  }

  if (!state.usingItem) return;
  if (isInv) return;
  if (state.dragging) return;
  if (isScene) return;

  state.usingItem = null;
  renderInventory();
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
  el.style.pointerEvents = "none";

  if (!data.visible) el.style.display = "none";
  if (data.rotate) el.style.rotate = `${data.rotate}deg`;
  if (data.noInteract) el.classList.add("noInteract");

  if (data.bg) {
    el.style.backgroundImage = `url(${data.bg})`;
    el.style.maskImage = `url(${data.bg})`;
  }

  el.desc = data.desc || "";

  let img = null;
  let pixelData = null;

  el.loadPixelData = function() {
    if (!data.bg) return Promise.resolve(null);
    if (pixelData) return Promise.resolve(pixelData);

    return new Promise((resolve) => {
      img = new Image();
      img.crossOrigin = "anonymous";
      if (data.bg) img.src = data.bg;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        try {
          pixelData = ctx.getImageData(0, 0, img.width, img.height).data;
        } catch {
          pixelData = null;
        }

        resolve(pixelData);
      };

      img.onerror = () => resolve(null);
    });
  };

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

    if (!pixelData || !img) {
      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    }

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    let x = clientX - cx;
    let y = clientY - cy;

    const angle = (data.rotate || 0) * Math.PI / 180;
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);

    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;

    const localX = rx + rect.width / 2;
    const localY = ry + rect.height / 2;

    if (
      localX < 0 ||
      localY < 0 ||
      localX >= rect.width ||
      localY >= rect.height
    ) {
      return false;
    }

    const px = Math.floor(localX * (img.width / rect.width));
    const py = Math.floor(localY * (img.height / rect.height));

    if (px < 0 || py < 0 || px >= img.width || py >= img.height) return false;

    const index = (py * img.width + px) * 4;
    return pixelData[index + 3] > 10;
  };

  el.applyHoverState = function(inside) {
    if (!data.ignorePixelCheck && !state.diary && !state.end) {
      if (inside) {
        if (data.desc) showText(data.desc);
        el.classList.add("hover");
      } else {
        el.classList.remove("hover");
        if (currentHoverElement === el) showText("");
        state["sleepConfirm"] = false;
      }
    }
  };

  el.addEventListener("click", (e) => {
    if (isMobile) return;

    if (!el.checkInsideMask(e.clientX, e.clientY)) return;

    if (data.zoom) {
      openZoom(data.zoom);
      clearHover();
    } else if (data.action) {
      const actionsList = data.action
        .split(";")
        .map(s => s.trim())
        .filter(Boolean);

      actionsList.forEach(act => executeActionString(act));
    }
  });

  el.addEventListener("pointerdown", (e) => {
    if (isMobile) {
      e.stopPropagation();
    }
  });

  if (enablePixelHitTest) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        el.loadPixelData().catch(() => {});
        observer.disconnect();
      }
    });
    observer.observe(el);
  }

  if (isMobile) {
    el.loadPixelData().catch(() => {});
  }

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
      if (state.usingItem === id && !state.dragging && !dragStartedMap?.[id]) {
        state.usingItem = null;
        renderInventory();
      }
    };

    let dragStartX = 0;
    let dragStartY = 0;
    let dragStarted = false;

    if (!window.dragStartedMap) window.dragStartedMap = {};
    dragStartedMap[id] = false;

    el.onmousedown = (e) => {
      if (e.button !== 0) return;

      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragStarted = false;
      dragStartedMap[id] = false;

      state.dragging = id;
    };

    document.addEventListener("mousemove", (e) => {
      if (state.dragging !== id) return;
      if (state.usingItem === id) return;

      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;

      if (!dragStarted && Math.hypot(dx, dy) < 8) return;

      dragStarted = true;
      dragStartedMap[id] = true;

      document.querySelectorAll("#drag-preview").forEach(el => el.remove());

      el.classList.add("drag-source");

      const preview = document.createElement("div");
      preview.id = "drag-preview";
      preview.style.backgroundImage = `url(${data.icon})`;
      preview.style.pointerEvents = "none";

      document.body.appendChild(preview);
      state.dragPreview = preview;

      if (state.dragPreview) {
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
      dragStartedMap[id] = false;

      if (state.dragPreview) {
        state.dragPreview.remove();
        state.dragPreview = null;
      }

      el.classList.remove("drag-source");
      renderInventory();
    });

    el.addEventListener("touchstart", (e) => {
      e.stopPropagation();

      const t = e.touches[0];
      dragStartX = t.clientX;
      dragStartY = t.clientY;
      dragStarted = false;
      dragStartedMap[id] = false;

      state.dragging = id;
    }, { passive: true });

    document.addEventListener("touchmove", (e) => {
      if (state.dragging !== id) return;

      const t = e.touches[0];
      const dx = t.clientX - dragStartX;
      const dy = t.clientY - dragStartY;

      if (!dragStarted && Math.hypot(dx, dy) < 8) return;

      dragStarted = true;
      dragStartedMap[id] = true;

      document.querySelectorAll("#drag-preview").forEach(el => el.remove());

      const preview = document.createElement("div");
      preview.id = "drag-preview";
      preview.style.backgroundImage = `url(${data.icon})`;
      preview.style.pointerEvents = "none";

      document.body.appendChild(preview);
      state.dragPreview = preview;

      state.dragPreview.style.left = t.clientX + "px";
      state.dragPreview.style.top = t.clientY + "px";

      e.preventDefault();
    }, { passive: false });

    document.addEventListener("touchend", (e) => {
      if (state.dragging !== id) return;

      e.preventDefault();
      e.stopPropagation();

      const t = e.changedTouches[0];
      const clientX = t.clientX;
      const clientY = t.clientY;

      if (!dragStarted) {

        forceShowText(data.desc || "");
        showMobileDesc(data.name || "");

        if (data.usable) {

          if (state.usingItem !== id) {
            state.usingItem = id;
          } else {
            state.usingItem = null;
            removeInventoryItem(id);
            if (data.onUse) data.onUse();
          }

        }

        renderInventory();
      } 
      
      else {

        const target = document.elementFromPoint(clientX, clientY);
        const invTarget = target?.closest?.("#inventory .item");

        if (invTarget && invTarget.dataset.id && invTarget.dataset.id !== id) {
          actions.useItem({
            item: id,
            target: invTarget.dataset.id + "Inv"
          });
        } else {
          const zoomLayer = document.getElementById("zoom-layer");
          const zoomActive = zoomLayer && !zoomLayer.classList.contains("hidden");
          const scope = zoomActive ? zoomLayer : document;

          const sceneTarget = [...interactiveElements]
            .filter(el =>
              el.isConnected &&
              el.checkInsideMask &&
              scope.contains(el) &&
              !el.classList.contains("noInteract")
            )
            .sort(compareTopFirst)
            .find(el => el.checkInsideMask(clientX, clientY));

          if (sceneTarget) {
            actions.useItem({
              item: id,
              target: sceneTarget._data.id
            });
          }
        }
      }

      state.dragging = null;
      dragStarted = false;
      dragStartedMap[id] = false;

      if (state.dragPreview) {
        state.dragPreview.remove();
        state.dragPreview = null;
      }

      renderInventory();
    });

    inv.appendChild(el);
  });
}

let zoomJustOpened = false;

function openZoom(id) {
  state.zoom = id;

  const zoom = document.getElementById("zoom-layer");
  zoom.classList.remove("hidden");

  zoom.innerHTML = "";

  zoomScenes[id].elements.forEach(el => {
    zoom.appendChild(createElement(el));
  });

  zoomJustOpened = true;
  setTimeout(() => {
    zoomJustOpened = false;
  }, 100);

  zoom.onpointerup = (e) => {
    if (zoomJustOpened) return;

    const { clientX, clientY } = getPoint(e);

    const rawHit = [...interactiveElements]
      .filter(el =>
        el.isConnected &&
        el.checkInsideMask &&
        zoom.contains(el)
      )
      .sort(compareTopFirst)
      .find(el => el.checkInsideMask(clientX, clientY));

    if (rawHit) return;

    closeZoom();
  };
}

function closeZoom() {
  state.zoom = null;
  const zoomLayer = document.getElementById("zoom-layer");
  zoomLayer.classList.add("hidden");
  zoomLayer.innerHTML = "";
}

function showText(text, color = "white") {
  if (hoverLocked) return;

  const desc = document.getElementById("description");

  if (state.diary) {
    desc.style.opacity = 0;
    return;
  }

  desc.style.opacity = text ? 1 : 0;
  desc.innerText = text;
  desc.style.color = color;
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
    actions[actionStr]?.();
    return;
  }

  const fnName = match[1];
  const args = match[2]
    ? match[2].split(",").map(s => s.trim())
    : [];

  actions[fnName]?.(...args);
}

let desc2Timer = null;

function showMobileDesc(text, duration = 2000) {
  const el = document.getElementById("description2");
  if (!el) return;

  el.innerText = text;
  el.style.opacity = 1;

  if (desc2Timer) clearTimeout(desc2Timer);

  desc2Timer = setTimeout(() => {
    el.style.opacity = 0;
  }, duration);
}

