const items = {

  bandage: {
    name: "绷带",
    desc: "可以包扎伤口",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Bandage.png",
    usable: true,
    onUse() {
      trigger["usedBandage"] = true;
      forceShowText("你包扎了自己的伤口，感觉状态更好了");
    }
  },

  pill: {
    name: "安眠药",
    desc: "帮助入睡，吃完后可能会浑身乏力",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Pills.png",
    usable: true,
    onUse() {
      trigger["usedPills"] = true;
      forceShowText("你服用了安眠药，感觉更疲惫了");
    }
  },

  syringe: {
    name: "空注射器",
    desc: "里面是空的，针头似乎可以拔下来",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Syringe.png",
    usable: true,
    onUse() {
      addInventoryItem("needle");
      forceShowText("把针管拔下来并掰弯了");
    }
  },

  firstAidKit: {
    name: "急救包",
    desc: "里面有一些医疗用品",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/First_Aid_Kit.png",
    usable: true,
    onUse() {
      addInventoryItem("bandage");
      addInventoryItem("pill");
      addInventoryItem("syringe");
      forceShowText("打开了急救包");
    }
  },

  lighter: {
    name: "打火机",
    desc: "可以点亮一些东西",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Lighter.png",
    usable: false
  },

  notebook: {
    name: "笔记本",
    desc: "里面记了一些东西",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Notebook.png",
    usable: true,
    onUse() {
      addInventoryItem("notebook");
    }
  },

  knife: {
    name: "折叠刀",
    desc: "不是很利了",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Knife.png",
    usable: false
  },

  waterBottle: {
    name: "水瓶",
    desc: "装满了水",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/WaterBottle.png",
    usable: true,
    onUse() {
      forceShowText("我还不渴");
      addInventoryItem("waterBottle");
    }
  },

  nails: {
    name: "钉子",
    desc: "应该可以用来加固什么",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Nails.png",
    usable: false
  },

  keyDoor: {
    name: "钥匙",
    desc: "用于某个锁的钥匙",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Key_Door.png",
    usable: false
  },

  keyPadlock: {
    name: "钥匙",
    desc: "用于某个锁的钥匙",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Key_Padlock.png",
    usable: false
  },

  padlockLock: {
    name: "锁上的锁",
    desc: "可以用来给一些东西上锁，但是被锁上了",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Padlock_Lock.png",
    usable: false
  },

  padlockUnlock: {
    name: "锁",
    desc: "可以用来给一些东西上锁",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Padlock_Unlock.png",
    usable: false
  },

  twine: {
    name: "麻绳",
    desc: "可以捆住什么东西",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Twine.png",
    usable: false
  },

  candle: {
    name: "蜡烛",
    desc: "点燃了或许可以照明",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Candle.png",
    usable: false
  },

  candleLit: {
    name: "点亮的蜡烛",
    desc: "或许可以照明",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Candle_Lit.png",
    usable: false
  },

  hammer: {
    name: "锤子",
    desc: "一把羊角锤",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Hammer.png",
    usable: false
  },

  axe: {
    name: "斧子",
    desc: "可以给一些东西劈坏",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Axe.png",
    usable: false
  },

  handcuffs: {
    name: "锁住的手铐",
    desc: "用不了",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Handcuffs.png",
    usable: false
  },

  handcuffsUnlock: {
    name: "手铐",
    desc: "可以铐住什么",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Handcuffs.png",
    usable: false
  },

  needle: {
    name: "掰弯的针管",
    desc: "或许可以用来撬锁",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Needle.png",
    usable: false
  },

  plank: {
    name: "木板",
    desc: "或许可以用来加固门窗",
    icon: "https://gaplouelpew.com/dont-escape-backroom/images/prop/Plank.png",
    usable: false
  }

};