let sleepConfirmTimer = null;

const actions = {
  changeScene(sceneId) {
    state.currentScene = sceneId;
    state.zoom = null;
    closeZoom();
    render();
  },

  setBg(sceneId, elementId, newBg, isZoom = false) {
    setElementBg(sceneId, elementId, newBg, isZoom);
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

  fatigue(value) {
    changeFatigue(value);
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
    changeFatigue(-13);
  },

  sleepConfirm() {
    if (!state.sleepConfirm) {
      state["sleepConfirm"] = true;
      showText("确定要现在睡觉吗？", "red");
    }
    else {
      sleep();
    }
  },

  useItem({item, target}) {
    const key = item + "+" + target;

    const recipes = {
      "knife+toolboxClose": () => {
        openToolbox();
      },
      "knife+toolbox": () => {
        openToolbox();
      },
      "hammer+trapdoorClose": () => {
        openTrapdoor();
      },
      "hammer+trapdoor": () => {
        openTrapdoor();
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
        changeFatigue(-3);
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
        removeInventoryItem("needle");
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
        changeFatigue(-10);
      },
      "plank+windowClose": () => {
        setElementInteractable("room2", "windowClose", false);
        addSceneElement("room2", "plankWithoutNailsWindow");
        removeInventoryItem("plank");
        changeFatigue(-5);
      },
      "nails+plankWithoutNailsWindow": () => {
        removeSceneElement("room2", "plankWithoutNailsWindow");
        addSceneElement("room2", "plankWithNailsWindow");
        removeInventoryItem("nails");
        changeFatigue(-2);
      },
      "plank+door": () => {
        setElementInteractable("room4", "door", false);
        addSceneElement("room4", "plankWithoutNailsDoor");
        removeInventoryItem("plank");
        state["plankDoor"] = true;
        changeFatigue(-5);
      },
      "nails+plankWithoutNailsDoor": () => {
        removeSceneElement("room4", "plankWithoutNailsDoor");
        addSceneElement("room4", "plankWithNailsDoor");
        removeInventoryItem("nails");
        changeFatigue(-2);
      },
      "hammer+plankWithNailsWindow": () => {
        setElementInteractable("room2", "plankWithNailsWindow", false);
        removeInventoryItem("hammer");
        forceShowText("钉子加固好了，但锤子坏了");
        changeFatigue(-10);
        trigger["reinforcedWindow"] = true;
      },
      "hammer+plankWithNailsDoor": () => {
        setElementInteractable("room4", "plankWithNailsDoor", false);
        removeInventoryItem("hammer");
        forceShowText("钉子加固好了，但锤子坏了");
        changeFatigue(-10);
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

function setElementBg(sceneId, elementId, newBg, isZoom = false) {
  const container = isZoom ? zoomScenes : scenes;
  if (!container[sceneId]) return;

  const el = container[sceneId].elements.find(e => e.id === elementId);
  if (!el) return;

  el.bg = newBg;

  if ((isZoom && state.zoom === sceneId) || (!isZoom && state.currentScene === sceneId)) {
    if (isZoom) {
      refreshZoom(sceneId);
    } else {
      render();
    }
  }
}

function onFatigueEmpty() {
  trigger["didntOnBed"] = true;
}

function sleep() {
  trigger["sleepOnBed"] = true;
}

function changeFatigue(value) {
  state.fatigue += value;

  if (state.fatigue > 400) state.fatigue = 400;
  if (state.fatigue < 0) state.fatigue = 0;
}

function openToolbox() {
  removeSceneElement("toolboxZoom", "toolboxClose", true);
  addSceneElement("toolboxZoom", "toolboxOpen", true);
  addSceneElement("toolboxZoom", "toolboxFront", true);
  addSceneElement("toolboxZoom", "hammer", true);
  removeInventoryItem("knife");
  setElementBg("room2", "toolbox", "https://gaplouelpew.com/dont-escape-backroom/images/scene/Toolbox_Open.png");
  forceShowText("刀刃崩了");
  changeFatigue(-4);
}

function openTrapdoor() {
  removeSceneElement("trapdoorZoom", "trapdoorClose", true);
  addSceneElement("trapdoorZoom", "trapdoorOpen", true);
  addSceneElement("trapdoorZoom", "trapdoorBlack", true);
  addSceneElement("room3", "trapdoorBg");
  setElementBg("room3", "trapdoor", "https://gaplouelpew.com/dont-escape-backroom/images/scene/TrapDoor_Black.png");
  changeFatigue(-7);
}

let fatigueEndPlayed = false;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function playFatigueEnding() {
  if (fatigueEndPlayed) return;
  fatigueEndPlayed = true;

  state.gameLocked = true;

  const game = document.getElementById("game");
  game.style.pointerEvents = "none";
  game.style.userSelect = "none";
  state.end = true;

  const overlay = document.getElementById("black-overlay");
  const layer = document.getElementById("ending-text-layer");
  const restart = document.getElementById("restart");

  overlay.classList.add("show");

  await delay(3000);
  layer.innerHTML = "";

  let tempCount = 0;

  async function show(text, time = 2500) {
    const div = document.createElement("div");
    div.className = "ending-line";
    div.textContent = text;
    layer.appendChild(div);
    await delay(time);
  }

  if (trigger.didntOnBed) {
    await show("极度的疲倦如潮水般淹没意识，你甚至没能爬上那张床，便一头栽倒在冰冷的地板上。");
  }

  if (trigger.sleepOnBed) {
    await show("你躺在冰冷的床上，寒意顺着脊背爬满全身，意识逐渐进入了梦乡。");

    if (trigger.handcuffed) {
      await show("临睡前，你颤抖着将右手与那副锈迹斑斑的手铐，把自己和床架锁在一起。");
      await show("然而锈蚀早已将铁链蛀空，只听一声刺耳的金属脆响，链环直接崩裂。");
      tempCount++;
    }

    if (trigger.bound) {
      await show("麻绳深深勒紧皮肉，你动弹不得。");
      await show("但你的身躯不断地挣扎，绳结在反复摩擦中逐渐松脱。");
      tempCount++;
    }
  }

  await show("随着深夜时分到来，你如同被丝线操控的木偶，以扭曲姿态诡异地起身。");

  if (trigger.usedPills) {
    await show("你在入睡前服用了安眠药，似乎仍感到有些疲惫，步伐沉重，身形摇晃。");
    tempCount++;
  }

  if (trigger.usedBandage) {
    await show("先前仔细缠好的绷带包扎住了伤口，疼痛被隔绝在外，行动方便了许多。");
    tempCount--;
  }

  await show("没有丝毫犹豫，你本能地转向房门。");
  
  await delay(1500);
  layer.innerHTML = "";
  await delay(500);

  if (trigger.watered) {
    await show("迈腿踩中了睡前洒在地上的那摊水渍，湿滑的脚感使你瞬间栽倒在地面上。");
    await show("稍缓了一下，随后又毫无痛觉般爬起，走到门前。");
    tempCount++;
  }

  if (trigger.blockedDoor) {
    await show("沉重的柜子此时挡在门前，你耗费了很多力气，将书柜推到一旁。");
    tempCount++;
  }

  if (trigger.reinforcedDoor || trigger.lockedDoor) {
    if (trigger.reinforcedDoor) {
      await show("门扉近在咫尺，可纵横交错的木板将去路封的严实，你无论如何用力，都只是徒劳。");
      tempCount++;
    } else {
      await show("铁锁挂在门上，你抓住锁头，一下又一下地砸向门框，却毫无作用。");
      tempCount++;
    }

    await show("于是你只好转身向窗户走去。");

    if (trigger.reinforcedWindow) {
      tempCount++;
      if (tempCount >= 7) {
        await show("但是窗户已经被你用木板钉死，任凭你如何用力摇晃，都没有分毫松动。");
        await show("最后你无力地瘫倒在了冰冷的地板上。");
      } else {
        await show("虽然窗户已经被你用木板钉死，但在你用力摇晃的时候，伴随墙皮的剥落，所有被你钉上的木板都被一并拽下。");
        await show("于是你毫无阻碍地翻过窗沿，落入屋外深沉的夜色里。");
      }
    } else {
      if (trigger.lockedWindow) {
        await show("窗户虽然挂着锁，但木窗早已摇摇欲坠。");
        await show("你只是僵硬地一扒，整个窗扇便连同锁扣一同被卸下。");
      }
      await show("于是你毫无阻碍地翻过窗沿，落入屋外深沉的夜色里。");
    }
  } else {
    await show("你轻易地转动门把手，拉开房门，步入深邃的黑暗之中。");
  }

  await delay(4000);
  layer.innerHTML = "";
  await delay(1000);

  if (tempCount >= 7) {
    await show("凌晨的寒意最先顺着贴着地板的脊背传来，你猛地惊醒。");
    await show("阳光尚未顺着窗缝洒进室内，屋里一片狼藉。");
    await show("你瘫坐在原地，浑身酸痛，可内心却被劫后余生的清醒填满。");
    await show("你没有在这一夜再次犯下不可饶恕的罪孽。");
    await show("这间犹如囚笼般的房间，对你来说是最大的救赎。");
  } else {
    await show("意识回笼的瞬间，你感到掌心有种黏腻的温热。");
    await show("你睁开双眼，看到的不是天花板，而是灰青色的天。");
    await show("你的双手、衣袖，沾满了半干的褐色痕迹，散发着铁锈的腥味。");
  }

  restart.classList.add("end");
}

function restart() {
  const overlay = document.getElementById("black-overlay");
  const layer = document.getElementById("ending-text-layer");
  const game = document.getElementById("game");
  const restart = document.getElementById("restart");

  overlay.classList.remove("show");
  layer.innerHTML = "";
  game.style.display = isMobile ? "flex" : "block";
  game.style.pointerEvents = "unset";
  game.style.userSelect = "unset";
  restart.classList.remove("end");
  closeZoom();

  fatigueRunning = false;
  lastFatigueTime = Date.now();
  fatigueEndPlayed = false;

  initial();
  render();
}

function openDiary() {
  const scene = document.getElementById("scene");
  if (!scene) return;

  if (document.getElementById("diary")) return;
  state["diary"] = true;

  const diaryData = [
    `3月3日
    这里的人不多，但这两天就死了两个。

    那天晚上我没听到任何声音。
    死的非常诡异。`,

    `3月5日
    晚上的行动都取消了。
    现在每个人都小心翼翼。

    我本来不想多想。
    但是我醒来的时候，手上还有好多没干的血。
    我没敢告诉他们。`,

    `3月6日
    我昨晚把门彻底锁死，还拿柜子顶上了。
    但我睡醒的时候门是开着的。

    我不记得自己有起夜或者什么，但是我做梦了。
    梦里我在房间外面。`,

    `3月7日
    我找到了还能用的监控，原来是我干的。
    他们没有犹豫，甚至没有反抗。

    因为他们认识我，所以他们都信任我。`,

    `3月10日
    我出走了。
    我不能等到那时候。

    路上我几乎没睡，身上还有很多伤。
    但我已经撑不住了。`,

    `我找到了新的聚集地。
    虽然他们有武装，但是我不想死在外面。
    我也不能让他们知道这件事，不然我肯定会被赶走。
    我只能困住我自己。`
  ];

  let index = 0;

  const diary = document.createElement("div");
  diary.id = "diary";
  diary.innerText = diaryData[index];

  diary.onclick = () => {
    index++;

    if (index >= diaryData.length) {
      state["diary"] = false;
      diary.remove();
      return;
    }

    diary.innerText = diaryData[index];
  };

  scene.appendChild(diary);
}