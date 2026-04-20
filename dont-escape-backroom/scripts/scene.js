const scenes = {
  room1: {
    bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Background.jpg",
    elements: [
      {
        id: "bed",
        x: 0.7, y: 0.65, w: 0.35, h: 0.5,
        desc: "铁架床",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Bed.png",
        action: "sleep",
        visible: true
      },
      {
        id: "backpack",
        x: 0.57, y: 0.72, w: 0.18, h: 0.27,
        desc: "背包",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Backpack.png",
        zoom: "backpackZoom",
        visible: true
      },
      {
        id: "nails",
        x: 0.32, y: 0.81, w: 0.12, h: 0.18,
        desc: "散落的钉子",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Nails.png",
        action: "addItem(nails); removeElement(room1, nails)",
        visible: true
      },
      {
        id: "left",
        x: 0.1, y: 0.5, w: 0.15, h: 0.15,
        desc: "向左",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Left.png",
        action: "changeScene(room2)",
        visible: true
      },
      {
        id: "right",
        x: 0.9, y: 0.5, w: 0.15, h: 0.15,
        desc: "向右",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Right.png",
        action: "changeScene(room3)",
        visible: true
      }
    ]
  },
  room2: {
    bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Background.jpg",
    elements: [
      {
        id: "desk",
        x: 0.5, y: 0.57, w: 0.3, h: 0.45,
        desc: "有抽屉的桌子",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Desk_Close.png",
        zoom: "deskZoom",
        visible: true
      },
      {
        id: "toolbox",
        x: 0.23, y: 0.7, w: 0.18, h: 0.20,
        desc: "工具箱",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Toolbox_Close.png",
        zoom: "toolboxZoom",
        visible: true
      },
      {
        id: "windowOpen",
        x: 0.5, y: 0.25, w: 0.3, h: 0.45,
        desc: "窗户",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Window_Open.png",
        action: "removeElement(room2, windowOpen); addElement(room2, windowClose)",
        visible: true
      },
      {
        id: "windowClose",
        x: 0.5, y: 0.25, w: 0.3, h: 0.45,
        desc: "窗户",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Window_Close.png",
        action: "removeElement(room2, windowClose); addElement(room2, windowOpen)",
        visible: false
      },
      {
        id: "left",
        x: 0.1, y: 0.5, w: 0.15, h: 0.15,
        desc: "向左",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Left.png",
        action: "changeScene(room4)",
        visible: true
      },
      {
        id: "right",
        x: 0.9, y: 0.5, w: 0.15, h: 0.15,
        desc: "向右",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Right.png",
        action: "changeScene(room1)",
        visible: true
      }
    ]
  },
  room3: {
    bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Background.jpg",
    elements: [
      {
        id: "trapdoor",
        x: 0.3, y: 0.72, w: 0.33, h: 0.49,
        desc: "活板门",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/TrapDoor_Close.png",
        zoom: "trapdoorZoom",
        visible: true
      },
      {
        id: "wallDesk",
        x: 0.5, y: 0.4, w: 0.28, h: 0.22,
        noInteract: true,
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/WallDesk.png",
        visible: true
      },
      {
        id: "twine",
        x: 0.49, y: 0.34, w: 0.07, h: 0.12, rotate: 47,
        desc: "麻绳",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Twine.png",
        action: "addItem(twine); removeElement(room3, twine)",
        visible: true
      },
      {
        id: "candle",
        x: 0.45, y: 0.31, w: 0.07, h: 0.12,
        desc: "蜡烛",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Candle.png",
        action: "addItem(candle); removeElement(room3, candle)",
        visible: true
      },
      {
        id: "left",
        x: 0.1, y: 0.5, w: 0.15, h: 0.15,
        desc: "向左",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Left.png",
        action: "changeScene(room1)",
        visible: true
      },
      {
        id: "right",
        x: 0.9, y: 0.5, w: 0.15, h: 0.15,
        desc: "向右",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Right.png",
        action: "changeScene(room4)",
        visible: true
      }
    ]
  },
  room4: {
    bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Background.jpg",
    elements: [
      {
        id: "door",
        x: 0.35, y: 0.41, w: 0.35, h: 0.6,
        desc: "门",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Door.png",
        action: "text(太晚了，还是不要出门了)",
        visible: true
      },
      {
        id: "keyPadlock",
        x: 0.58, y: 0.71, w: 0.04, h: 0.09, rotate: 66,
        desc: "一把钥匙",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Key_Padlock.png",
        action: "addItem(keyPadlock); removeElement(room4, keyPadlock)",
        visible: true
      },
      {
        id: "shelf",
        x: 0.64, y: 0.43, w: 0.35, h: 0.65,
        desc: "书柜",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Shelf.png",
        action: "moveShelf",
        visible: true
      },
      {
        id: "left",
        x: 0.1, y: 0.5, w: 0.15, h: 0.15,
        desc: "向左",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Left.png",
        action: "changeScene(room3)",
        visible: true
      },
      {
        id: "right",
        x: 0.9, y: 0.5, w: 0.15, h: 0.15,
        desc: "向右",
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Right.png",
        action: "changeScene(room2)",
        visible: true
      }
    ]
  }
};

const zoomScenes = {
  backpackZoom: {
    elements: [
      {
        id: "backpackCenter",
        x: 0.5, y: 0.5, w: 0.5, h: 0.7,
        noInteract: true,
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Backpack.png",
        visible: true
      },
      {
        id: "notebook",
        x: 0.46, y: 0.48, w: 0.15, h: 0.2, rotate: -16,
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Notebook.png",
        desc: "笔记本",
        action: "addItem(notebook); removeElement(backpackZoom, notebook, true)",
        visible: true
      },
      {
        id: "knife",
        x: 0.52, y: 0.46, w: 0.15, h: 0.2, rotate: -25,
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Knife.png",
        desc: "折叠刀",
        action: "addItem(knife); removeElement(backpackZoom, knife, true)",
        visible: true
      },
      {
        id: "waterBottle",
        x: 0.58, y: 0.41, w: 0.23, h: 0.29, rotate: -32,
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/prop/WaterBottle.png",
        desc: "水瓶",
        action: "addItem(waterBottle); removeElement(backpackZoom, waterBottle, true)",
        visible: true
      },
      {
        id: "backpackFront",
        x: 0.5, y: 0.5, w: 0.5, h: 0.7,
        noInteract: true,
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Backpack_Front.png",
        visible: true
      }
    ]
  },
  toolboxZoom: {
    elements: [
      {
        id: "toolboxClose",
        x: 0.5, y: 0.5, w: 0.5, h: 0.75,
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Toolbox_Close.png",
        desc: "工具箱",
        action: "text(打不开，或许可以找个东西撬开)",
        visible: true
      },
      {
        id: "toolboxOpen",
        x: 0.5, y: 0.5, w: 0.5, h: 0.75,
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Toolbox_Open.png",
        noInteract: true,
        visible: false
      },
      {
        id: "hammer",
        x: 0.52, y: 0.55, w: 0.3, h: 0.4,
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Hammer.png",
        desc: "一把锤子",
        action: "addItem(hammer); removeElement(toolboxZoom, hammer, true)",
        visible: false
      },
      {
        id: "toolboxFront",
        x: 0.5, y: 0.5, w: 0.5, h: 0.75,
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Toolbox_Front.png",
        noInteract: true,
        visible: false
      }
    ]
  },
  deskZoom: {
    elements: [
      {
        id: "deskClose",
        x: 0.5, y: 0.5, w: 0.5, h: 0.75,
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Desk_Close.png",
        desc: "有抽屉的桌子",
        action: "addElement(deskZoom, deskOpen, true);addElement(deskZoom, keyDoor, true); removeElement(deskZoom, deskClose, true); ",
        visible: true
      },
      {
        id: "deskOpen",
        x: 0.5, y: 0.5, w: 0.5, h: 0.75,
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Desk_Open.png",
        noInteract: true,
        visible: false
      },
      {
        id: "deskOpen",
        x: 0.5, y: 0.5, w: 0.5, h: 0.75,
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/Desk_Open.png",
        desc: "有抽屉的桌子",
        action: "opendesk",
        visible: false
      },
      {
        id: "padlock",
        x: 0.52, y: 0.24, w: 0.08, h: 0.15, rotate: -38,
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Padlock_Lock.png",
        desc: "一把锁",
        action: "addItem(padlockLock); removeElement(deskZoom, padlock, true)",
        visible: true
      },
      {
        id: "keyDoor",
        x: 0.39, y: 0.51, w: 0.08, h: 0.12, rotate: 38,
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Key_Door.png",
        desc: "一把钥匙",
        action: "addItem(keyDoor); removeElement(deskZoom, keyDoor, true)",
        visible: false
      }
    ]
  },
  trapdoorZoom: {
    elements: [
      {
        id: "trapdoorClose",
        x: 0.5, y: 0.5, w: 0.5, h: 0.75,
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/TrapDoor_Close.png",
        desc: "活板门",
        action: "text(打不开，或许可以找个东西撬开)",
        visible: true
      },
      {
        id: "trapdoorBlack",
        x: 0.5, y: 0.5, w: 0.5, h: 0.75,
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/TrapDoor_Black.png",
        desc: "黑漆漆的，得找个东西照明一下",
        visible: false
      },
      {
        id: "handcuffs",
        x: 0.45, y: 0.52, w: 0.1, h: 0.21, rotate: -143,
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Handcuffs.png",
        desc: "一把锁住的手铐",
        action: "addItem(handcuffs); removeElement(trapdoorZoom, handcuffs, true)",
        visible: false
      },
      {
        id: "axe",
        x: 0.42, y: 0.68, w: 0.23, h: 0.33,
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Axe.png",
        desc: "一把斧子",
        action: "addItem(axe); removeElement(trapdoorZoom, axe, true)",
        visible: false
      },
      {
        id: "trapdoorOpen",
        x: 0.5, y: 0.5, w: 0.5, h: 0.75,
        bg: "https://gaplouelpew.com/dont-escape-backroom/images/scene/TrapDoor_Open.png",
        noInteract: true,
        visible: false
      }
    ]
  }
};