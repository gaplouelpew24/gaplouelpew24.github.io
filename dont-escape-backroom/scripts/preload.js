const IMAGE_URLS = [
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/Axe.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/Bandage.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/Candle.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/Candle_Lit.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/First_Aid_Kit.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/Hammer.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/Handcuffs.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/Key_Door.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/Key_Padlock.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/Knife.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/Lighter.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/Nails.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/Needle.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/Notebook.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/Padlock_Lock.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/Padlock_Unlock.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/Pills.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/Plank.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/Syringe.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/Twine.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/prop/WaterBottle.png",

  "https://gaplouelpew.com/dont-escape-backroom/images/scene/Background.jpg",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/Backpack.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/Backpack_Front.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/Bed.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/Desk_Close.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/Desk_Open.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/Door.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/Left.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/Nails.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/Plank_1.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/Plank_2.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/Right.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/Shelf.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/Toolbox_Close.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/Toolbox_Front.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/Toolbox_Open.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/TrapDoor_Black.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/TrapDoor_Close.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/TrapDoor_Open.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/Window_Close.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/Window_Open.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/Water.png",
  "https://gaplouelpew.com/dont-escape-backroom/images/scene/WallDesk.png",

  "https://gaplouelpew.com/dont-escape-backroom/images/Cursor.png"
];

function preloadImages(urls, onProgress) {
  let loaded = 0;
  const total = urls.length;

  const promises = urls.map(url => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = img.onerror = () => {
        loaded++;
        if (onProgress) onProgress(loaded, total, url);
        resolve(url);
      };
    });
  });

  return Promise.all(promises);
}