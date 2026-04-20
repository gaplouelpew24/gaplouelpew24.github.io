const actions = {

  changeScene(sceneId) {
    state.currentScene = sceneId;
    state.zoom = null;
    closeZoom();
    render();
  },

  setTrigger(name, value = true) {
    trigger[name] = value;
  },

  addElement(sceneId, elementId, isZoom = false) {
    addSceneElement(sceneId, elementId, isZoom);
  },

  removeElement(sceneId, elementId, isZoom = false) {
    removeSceneElement(sceneId, elementId, isZoom);
  },

  addItem(itemId) {
    addInventoryItem(itemId);
  },

  removeItem(itemId) {
    removeInventoryItem(itemId);
  },

  setInteractable(sceneId, elementId, interactable = true, isZoom = false) {
    setElementInteractable(sceneId, elementId, interactable, isZoom);
  },

  text(content) {
    forceShowText(content);
  },

  moveShelf() {
    if (!state.moveShelf) {
      moveElementX("room4", "shelf", 35);
      state.moveShelf = !state.moveShelf;
    }
    else {
      moveElementX("room4", "shelf", 64);
      state.moveShelf = !state.moveShelf;
    }
  },

  useItem({item, target}) {
    const key = item + "+" + target;
    
    const recipes = {
      "knife+toolboxClose": () => {
        removeSceneElement("toolboxZoom", "toolboxClose", true);
        addSceneElement("toolboxZoom", "toolboxOpen", true);
        addSceneElement("toolboxZoom", "toolboxFront", true);
        addSceneElement("toolboxZoom", "hammer", true);
        removeInventoryItem("knife");
        forceShowText("刀刃崩了");
      },
      "hammer+trapdoorClose": () => {
        removeSceneElement("trapdoorZoom", "trapdoorClose", true);
        addSceneElement("trapdoorZoom", "trapdoorOpen", true);
        addSceneElement("trapdoorZoom", "trapdoorBlack", true);
      },
      "candleLit+trapdoorBlack": () => {
        addSceneElement("trapdoorZoom", "axe", true);
        addSceneElement("trapdoorZoom", "handcuffs", true);
        setElementInteractable("trapdoorZoom", "trapdoorBlack", false, true);
      },
      "lighter+trapdoorBlack": () => {
        forceShowText("不够亮");
      },
      "knife+trapdoorClose": () => {
        forceShowText("撬不开，需要强度更高的工具");
      },
      "lighter+candleInv": () => {
        removeInventoryItem("lighter");
        removeInventoryItem("candle");
        addInventoryItem("candleLit");
        forceShowText("打火机油用完了");
      }
    };

    if (recipes[key]) {
      recipes[key]();
    } else {
      forceShowText("没有用");
    }
  }
};

function getSceneContainer(isZoom = false) {
  return isZoom ? zoomScenes : scenes;
}

function addSceneElement(sceneId, elementId, isZoom = false) {
  const container = isZoom ? zoomScenes : scenes;
  if (!container[sceneId]) return;

  const element = container[sceneId].elements.find(el => el.id === elementId);
  if (!element) return;

  element.visible = true;

  if ((isZoom && state.zoom === sceneId) || (!isZoom && state.currentScene === sceneId)) {
    if (isZoom) {
      refreshZoom(sceneId);
    } else {
      render();
    }
  }
}

function removeSceneElement(sceneId, elementId, isZoom = false) {
  const container = isZoom ? zoomScenes : scenes;
  if (!container[sceneId]) return;

  const element = container[sceneId].elements.find(el => el.id === elementId);
  if (!element) return;

  element.visible = false;

  if ((isZoom && state.zoom === sceneId) || (!isZoom && state.currentScene === sceneId)) {
    if (isZoom) {
      refreshZoom(sceneId);
    } else {
      render();
    }
  }
}

function addInventoryItem(itemId) {
  if (!state.inventory.includes(itemId)) {
    state.inventory.push(itemId);
    renderInventory();
    return true;
  }
  return false;
}

function removeInventoryItem(itemId) {
  const index = state.inventory.indexOf(itemId);
  if (index === -1) return false;

  state.inventory.splice(index, 1);

  if (state.usingItem === itemId) {
    state.usingItem = null;
  }

  renderInventory();
  return true;
}

function refreshZoom(sceneId) {
    if (state.zoom !== sceneId) return;
    const zoomLayer = document.getElementById("zoom-layer");
    zoomLayer.innerHTML = "";
    zoomScenes[sceneId].elements.forEach(el => {
        const dom = createElement(el);
        zoomLayer.appendChild(dom);
    });
}

function setElementInteractable(sceneId, elementId, interactable = true, isZoom = false) {
  const container = isZoom ? zoomScenes : scenes;
  if (!container[sceneId]) return;

  const el = container[sceneId].elements.find(e => e.id === elementId);
  if (!el) return;

  el.noInteract = !interactable;

  if ((isZoom && state.zoom === sceneId) || (!isZoom && state.currentScene === sceneId)) {
    if (isZoom) {
      refreshZoom(sceneId);
    } else {
      render();
    }
  }
}

function moveElementX(sceneId, elementId, x, isZoom = false) {
  const container = isZoom ? zoomScenes : scenes;
  if (!container[sceneId]) return;

  const el = container[sceneId].elements.find(e => e.id === elementId);
  if (!el) return;

  el.x = x / 100;

  if ((isZoom && state.zoom === sceneId) || (!isZoom && state.currentScene === sceneId)) {
    if (isZoom) {
      refreshZoom(sceneId);
    } else {
      render();
    }
  }
}