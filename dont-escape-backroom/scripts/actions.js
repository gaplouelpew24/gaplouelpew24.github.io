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

  setState(name, value = true) {
    state[name] = value;
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
      trigger["blockedDoor"] = true;
    }
    else {
      moveElementX("room4", "shelf", 64);
      state.moveShelf = !state.moveShelf;
      trigger["blockedDoor"] = false;
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
        addSceneElement("trapdoorZoom", "candleLit", true);
        setElementInteractable("trapdoorZoom", "trapdoorBlack", false, true);
        removeInventoryItem("candleLit");
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
      },
      "keyDoor+door": () => {
        removeInventoryItem("keyDoor");
        forceShowText("钥匙断了");
      },
      "keyDoor+padlockLockInv": () => {
        forceShowText("打不开，应该不是这把钥匙");
      },
      "needle+padlockLockInv": () => {
        forceShowText("撬不开，还是需要钥匙");
      },
      "keyDoor+handcuffsInv": () => {
        forceShowText("捅不进去");
      },
      "keyPadlock+handcuffsInv": () => {
        forceShowText("捅不进去");
      },
      "keyPadlock+padlockLockInv": () => {
        removeInventoryItem("keyPadlock");
        removeInventoryItem("padlockLock");
        addInventoryItem("padlockUnlock");
        forceShowText("锁开了");
      },
      "needle+handcuffsInv": () => {
        removeInventoryItem("handcuffs");
        addInventoryItem("handcuffsUnlock");
        forceShowText("把手铐打开了");
      },
      "plank+windowOpen": () => {
        forceShowText("得先把窗户关上");
      },
      "axe+desk": () => {
        removeSceneElement("room2", "desk");
        addSceneElement("room2", "plankCanPick");
        removeInventoryItem("axe");
        forceShowText("斧子坏了");
        state["plankWindow"] = true;
      },
      "plank+windowClose": () => {
        setElementInteractable("room2", "windowClose", false);
        addSceneElement("room2", "plankWithoutNailsWindow");
        removeInventoryItem("plank");
      },
      "nails+plankWithoutNailsWindow": () => {
        removeSceneElement("room2", "plankWithoutNailsWindow");
        addSceneElement("room2", "plankWithNailsWindow");
        removeInventoryItem("nails");
      },
      "plank+door": () => {
        setElementInteractable("room4", "door", false);
        addSceneElement("room4", "plankWithoutNailsDoor");
        removeInventoryItem("plank");
        state["plankDoor"] = true;
      },
      "nails+plankWithoutNailsDoor": () => {
        removeSceneElement("room4", "plankWithoutNailsDoor");
        addSceneElement("room4", "plankWithNailsDoor");
        removeInventoryItem("nails");
      },
      "hammer+plankWithNailsWindow": () => {
        setElementInteractable("room2", "plankWithNailsWindow", false);
        removeInventoryItem("hammer");
        forceShowText("钉子加固好了，但锤子坏了");
        trigger["reinforcedWindow"] = true;
      },
      "hammer+plankWithNailsDoor": () => {
        setElementInteractable("room4", "plankWithNailsDoor", false);
        removeInventoryItem("hammer");
        forceShowText("钉子加固好了，但锤子坏了");
        trigger["reinforcedDoor"] = true;
      },
      "handcuffsUnlock+bed": () => {
        removeInventoryItem("handcuffsUnlock");
        addSceneElement("room1", "handcuffsBed");
        forceShowText("将手铐一边铐在了床上，睡觉的时候可以把自己的手铐起来");
        trigger["handcuffed"] = true;
      },
      "twine+bed": () => {
        removeInventoryItem("twine");
        addSceneElement("room1", "twineBed");
        forceShowText("将麻绳提前绑在床上，睡觉的时候可以把自己的身体固定");
        trigger["bound"] = true;
      },
      "waterBottle+waterArea": () => {
        removeSceneElement("room4", "waterArea");
        addSceneElement("room4", "water");
        removeInventoryItem("waterBottle");
        forceShowText("将水洒到了地板上");
        trigger["watered"] = true;
      },
      "padlockUnlock+door": () => {
        if (!state.plankDoor) {
          addSceneElement("room4", "padlockDoor");
          removeInventoryItem("padlockUnlock");
          forceShowText("将锁装到了门上");
          trigger["lockedDoor"] = true;
          setElementInteractable("room4", "door", false);
        }
        else {
          forceShowText("装不了了");
        }
      },
      "padlockUnlock+windowClose": () => {
        if (!state.plankDoor) {
          addSceneElement("room2", "padlockWindow");
          removeInventoryItem("padlockUnlock");
          forceShowText("将锁装到了窗户上");
          trigger["lockedWindow"] = true;
          setElementInteractable("room2", "windowClose", false);
        }
        else {
          forceShowText("装不了了");
        }
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