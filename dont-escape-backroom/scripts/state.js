const state = {
  currentScene: "room1",
  zoom: null,
  inventory: ["firstAidKit", "lighter"],
  dragging: null,
  dragPreview: null,
  usingItem: null,
  plankWindow: false,
  plankDoor: false
};

const trigger = {
  usedPills: false,
  usedBandage: false,
  bound: false,
  handcuffed: false,
  reinforcedWindow: false,
  lockedWindow: false,
  watered: false,
  blockedDoor: false,
  reinforcedDoor: false,
  lockedDoor: false
}