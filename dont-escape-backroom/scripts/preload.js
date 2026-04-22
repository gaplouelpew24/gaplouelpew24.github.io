const IMAGE_URLS = [
  "images/prop/Axe.png",
  "images/prop/Bandage.png",
  "images/prop/Candle.png",
  "images/prop/Candle_Lit.png",
  "images/prop/First_Aid_Kit.png",
  "images/prop/Hammer.png",
  "images/prop/Handcuffs.png",
  "images/prop/Key_Door.png",
  "images/prop/Key_Padlock.png",
  "images/prop/Knife.png",
  "images/prop/Lighter.png",
  "images/prop/Nails.png",
  "images/prop/Needle.png",
  "images/prop/Notebook.png",
  "images/prop/Padlock_Lock.png",
  "images/prop/Padlock_Unlock.png",
  "images/prop/Pills.png",
  "images/prop/Plank.png",
  "images/prop/Syringe.png",
  "images/prop/Twine.png",
  "images/prop/WaterBottle.png",

  "images/scene/Background.jpg",
  "images/scene/Backpack.png",
  "images/scene/Backpack_Front.png",
  "images/scene/Bed.png",
  "images/scene/Desk_Close.png",
  "images/scene/Desk_Open.png",
  "images/scene/Door.png",
  "images/scene/Left.png",
  "images/scene/Nails.png",
  "images/scene/Plank_1.png",
  "images/scene/Plank_2.png",
  "images/scene/Right.png",
  "images/scene/Shelf.png",
  "images/scene/Toolbox_Close.png",
  "images/scene/Toolbox_Front.png",
  "images/scene/Toolbox_Open.png",
  "images/scene/TrapDoor_Black.png",
  "images/scene/TrapDoor_Close.png",
  "images/scene/TrapDoor_Open.png",
  "images/scene/Window_Close.png",
  "images/scene/Window_Open.png",
  "images/scene/Water.png",
  "images/scene/WallDesk.png",

  "images/Cursor.png"
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