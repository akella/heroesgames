// Auto-generated initial room layers config.
// - Mask PNGs placed at assets/room/masks/masks_room_#.png (0..24)
// - Variant groups: floor (4), wall (5), table (3) can be switched later via ShaderLayer.setVariant(id, idx)

export const maskTextures = [
  "assets/room/masks/mask_room_0.png",
  "assets/room/masks/mask_room_1.png",
  "assets/room/masks/mask_room_2.png",
  "assets/room/masks/mask_room_3.png",
  "assets/room/masks/mask_room_4.png",
  "assets/room/masks/mask_room_5.png",
  "assets/room/masks/mask_room_6.png",
  "assets/room/masks/mask_room_7.png",
  "assets/room/masks/mask_room_8.png",
  "assets/room/masks/mask_room_9.png",
  "assets/room/masks/mask_room_10.png",
  "assets/room/masks/mask_room_11.png",
  "assets/room/masks/mask_room_12.png",
  "assets/room/masks/mask_room_13.png",
  "assets/room/masks/mask_room_14.png",
  "assets/room/masks/mask_room_15.png",
  "assets/room/masks/mask_room_16.png",
  "assets/room/masks/mask_room_17.png",
  "assets/room/masks/mask_room_18.png",
  "assets/room/masks/mask_room_19.png",
  "assets/room/masks/mask_room_20.png",
  "assets/room/masks/mask_room_21.png",
  "assets/room/masks/mask_room_22.png",
  "assets/room/masks/mask_room_23.png",
  "assets/room/masks/mask_room_24.png",
];

// Layer definition schema:
// { id, mask: { i, c }, tex (for static) | variants (for variant layers), z }

const RAW = [
  { id: "ufo", mask: { i: 0, c: "r" }, tex: "assets/room/objects/ufo.png" },
  { id: "plane", mask: { i: 0, c: "g" }, tex: "assets/room/objects/plane.png" },
  { id: "dino", mask: { i: 0, c: "b" }, tex: "assets/room/objects/dino.png" },
  {
    id: "rocket",
    mask: { i: 1, c: "r" },
    tex: "assets/room/objects/rocket.png",
  },
  { id: "robot", mask: { i: 1, c: "g" }, tex: "assets/room/objects/robot.png" },
  { id: "lamp", mask: { i: 1, c: "b" }, tex: "assets/room/objects/lamp.png" },
  { id: "chess", mask: { i: 2, c: "r" }, tex: "assets/room/objects/chess.png" },
  {
    id: "car-yellow",
    mask: { i: 2, c: "g" },
    tex: "assets/room/objects/car-yellow.png",
  },
  {
    id: "car-green",
    mask: { i: 2, c: "b" },
    tex: "assets/room/objects/car-green.png",
  },
  { id: "bed", mask: { i: 3, c: "r" }, tex: "assets/room/objects/bed.png" },
  {
    id: "window",
    mask: { i: 3, c: "g" },
    tex: "assets/room/objects/window.png",
  },
  {
    id: "bookcase-2",
    mask: { i: 3, c: "b" },
    tex: "assets/room/objects/bookcase-2.png",
  },
  // Variant floor
  {
    id: "floor",
    mask: { i: 4, c: "r" },
    variants: [
      "assets/room/floors/floor-1.png",
      "assets/room/floors/floor-2.png",
      "assets/room/floors/floor-3.png",
      "assets/room/floors/floor-4.png",
    ],
    variant: true,
  },
  {
    id: "wall",
    mask: { i: 5, c: "r" },
    fit: "fill",
    variants: [
      "assets/room/walls/wall-1.png",
      "assets/room/walls/wall-2.png",
      "assets/room/walls/wall-3.png",
      "assets/room/walls/wall-4.png",
      "assets/room/walls/wall-5.png",
    ],
    variant: true,
  },
  {
    id: "rug",
    mask: { i: 6, c: "r" },
    fit: "fill",
    variants: [
      "assets/room/rugs/rug-1.png",
      "assets/room/rugs/rug-2.png",
      "assets/room/rugs/rug-3.png",
      "assets/room/rugs/rug-4.png",
    ],
    variant: true,
  },
  {
    id: "car-blue",
    mask: { i: 6, c: "g" },
    tex: "assets/room/objects/car-blue.png",
  },
  {
    id: "glass-pencils",
    mask: { i: 6, c: "b" },
    tex: "assets/room/objects/glass-pencils.png",
  },
  {
    id: "table",
    mask: { i: 7, c: "r" },
    variants: [
      "assets/room/tables/table-1.png",
      "assets/room/tables/table-2.png",
      "assets/room/tables/table-3.png",
    ],
    variant: true,
  },
  { id: "shelf", mask: { i: 7, c: "g" }, tex: "assets/room/objects/shelf.png" },
  {
    id: "window-light",
    mask: { i: 7, c: "b" },
    tex: "assets/room/objects/window-lights.png",
  },
  {
    id: "chandelier",
    mask: { i: 8, c: "r" },
    tex: "assets/room/objects/chandelier.png",
  },
  {
    id: "medals",
    mask: { i: 8, c: "g" },
    tex: "assets/room/objects/medals.png",
  },
  {
    id: "wheel-pump",
    mask: { i: 8, c: "b" },
    tex: "assets/room/objects/wheel-pump.png",
  },
  {
    id: "sh-wheel-pump",
    mask: { i: 9, c: "r" },
    tex: "assets/room/objects/sh-wheel-pump.png",
  },
  { id: "box", mask: { i: 9, c: "g" }, tex: "assets/room/objects/box.png" },
  {
    id: "books-1",
    mask: { i: 9, c: "b" },
    tex: "assets/room/objects/Books-1.png",
  },
  {
    id: "books-3",
    mask: { i: 10, c: "r" },
    tex: "assets/room/objects/books-3.png",
  },
  {
    id: "books-4",
    mask: { i: 10, c: "g" },
    tex: "assets/room/objects/books-4.png",
  },
  {
    id: "books-table",
    mask: { i: 10, c: "b" },
    tex: "assets/room/objects/books-table.png",
  },
  {
    id: "books-shelf",
    mask: { i: 24, c: "g" },
    tex: "assets/room/objects/books-shelf.png",
  },
  {
    id: "book-floor",
    mask: { i: 11, c: "r" },
    tex: "assets/room/objects/book-floor.png",
  },
  {
    id: "goblet",
    mask: { i: 11, c: "g" },
    tex: "assets/room/objects/goblet.png",
  },
  {
    id: "skates",
    mask: { i: 11, c: "b" },
    tex: "assets/room/objects/skates.png",
  },
  {
    id: "hockey",
    mask: { i: 12, c: "r" },
    tex: "assets/room/objects/hockey.png",
  },
  {
    id: "picture",
    mask: { i: 12, c: "g" },
    tex: "assets/room/objects/picture.png",
  },
  {
    id: "skipping-rope",
    mask: { i: 12, c: "b" },
    tex: "assets/room/objects/skipping-rope.png",
  },
  {
    id: "hockey-puck",
    mask: { i: 13, c: "r" },
    tex: "assets/room/objects/hockey-puck.png",
  },
  { id: "ship", mask: { i: 13, c: "g" }, tex: "assets/room/objects/ship.png" },
  {
    id: "tennis-bookcase",
    mask: { i: 13, c: "b" },
    tex: "assets/room/objects/tennis-bookcase.png",
  },
  {
    id: "box-tennis",
    mask: { i: 14, c: "r" },
    tex: "assets/room/objects/box-tennis.png",
  },
  {
    id: "tennis-shelf",
    mask: { i: 14, c: "g" },
    tex: "assets/room/objects/tennis-shelf.png",
  },
  {
    id: "plants",
    mask: { i: 14, c: "b" },
    tex: "assets/room/objects/plants.png",
  },
  {
    id: "football",
    mask: { i: 15, c: "r" },
    tex: "assets/room/objects/football.png",
  },
  {
    id: "tablecloth",
    mask: { i: 15, c: "g" },
    tex: "assets/room/objects/tablecloth.png",
  },
  {
    id: "hockey-stick",
    mask: { i: 15, c: "b" },
    tex: "assets/room/objects/hockey-stick.png",
  },
  {
    id: "football-0",
    mask: { i: 16, c: "r" },
    tex: "assets/room/objects/football-0.png",
  },
  {
    id: "pencils-on-tha-floor",
    mask: { i: 16, c: "g" },
    tex: "assets/room/objects/pencils-on-tha-floor.png",
  },
  {
    id: "cubes",
    mask: { i: 16, c: "b" },
    tex: "assets/room/objects/cubes.png",
  },
  {
    id: "curtains",
    mask: { i: 17, c: "r" },
    tex: "assets/room/objects/curtains.png",
  },
  {
    id: "tennis-floor",
    mask: { i: 17, c: "g" },
    tex: "assets/room/objects/tennis-floor.png",
  },
  {
    id: "picture-1",
    mask: { i: 17, c: "b" },
    tex: "assets/room/objects/picture-1.png",
  },
  {
    id: "picture-2",
    mask: { i: 18, c: "r" },
    tex: "assets/room/objects/picture-2.png",
  },
  { id: "car", mask: { i: 18, c: "g" }, tex: "assets/room/objects/car.png" },
  {
    id: "posters",
    mask: { i: 18, c: "b" },
    tex: "assets/room/objects/posters.png",
  },
  {
    id: "picture-sh",
    mask: { i: 19, c: "r" },
    tex: "assets/room/objects/picture-sh.png",
  },
  {
    id: "stickers",
    mask: { i: 19, c: "g" },
    tex: "assets/room/objects/stickers.png",
  },
  {
    id: "tennis-racket",
    mask: { i: 19, c: "b" },
    tex: "assets/room/objects/tennis-racket.png",
  },
  {
    id: "sh-walls",
    mask: { i: 20, c: "r" },
    tex: "assets/room/objects/sh-walls.png",
  },
  {
    id: "sh-bed",
    mask: { i: 21, c: "r" },
    tex: "assets/room/objects/sh-bed.png",
  },
  {
    id: "sh-bed-2",
    mask: { i: 22, c: "r" },
    tex: "assets/room/objects/sh-bed-2.png",
  },
  {
    id: "bookcase",
    mask: { i: 22, c: "g" },
    tex: "assets/room/objects/bookcase.png",
  },
  {
    id: "sh-book-floor",
    mask: { i: 23, c: "r" },
    tex: "assets/room/objects/sh-book-floor.png",
  },
  {
    id: "sh-football",
    mask: { i: 23, c: "g" },
    tex: "assets/room/objects/sh-football.png",
  },
  {
    id: "picture-hover",
    mask: { i: 24, c: "r" },
    tex: "assets/room/objects/picture-hover.png",
  },
];

// Explicit z-index map.
// 0-19 background structures & walls
// 20-49 wall-mounted and large furniture
// 50-69 floor & rugs & shadows
// 70-109 tables, shelves contents, small props
// 110-149 toys / vehicles / balls
// 150+ floating / foreground highlights
export const Z_INDEX = {
  // Background
  wall: 0,
  "sh-walls": 1,
  window: 5,
  "window-light": 52.5,
  curtains: 7,
  // Large furniture & fixtures
  bookcase: 20,
  "bookcase-2": 21,
  "tennis-bookcase": 22,
  shelf: 25,
  "tennis-shelf": 26,
  chandelier: 28,
  posters: 30,
  stickers: 31,
  medals: 32,
  // Floor & base layers
  floor: 3,
  rug: 52,
  "tennis-floor": 53,
  // Shadows
  "sh-bed": 54,
  "sh-bed-2": 55,
  "sh-book-floor": 56,
  "sh-football": 57,
  "sh-wheel-pump": 58,
  "hockey-stick": 59,
  "tennis-racket": 60,
  // Furniture pieces (raised above floor items)
  bed: 70,
  table: 72,
  tablecloth: 73,
  // Books & small stacks
  "book-floor": 74,
  "books-1": 75,
  "books-3": 76,
  "books-4": 77,
  "books-table": 78,
  // Place books-shelf slightly above books-table and below glass-pencils
  "books-shelf": 78.2,
  "glass-pencils": 79,
  "pencils-on-tha-floor": 80,
  // Sports & play items on floor
  football: 82,
  "football-0": 83,
  "hockey-puck": 84,
  hockey: 85,
  "wheel-pump": 86,
  box: 87,
  "box-tennis": 88,
  // Vehicles / toys
  car: 90,
  "car-blue": 91,
  "car-green": 92,
  "car-yellow": 93,
  cubes: 61,
  // Misc props
  goblet: 95,
  plants: 96,
  ship: 97,
  rocket: 98,
  ufo: 99,
  plane: 100,
  dino: 101,
  skates: 102,
  "skipping-rope": 103,
  "tennis-shelf": 104,
  // Pictures & overlays
  picture: 110,
  "picture-2": 111,
  "picture-1": 112,
  "picture-sh": 113,
  "picture-hover": 114,
  // Remaining / fallback
  lamp: 120,
};

// Produce final layers with z. Unspecified ids get appended after max with increment.
let maxZ = Math.max(...Object.values(Z_INDEX));
export const layers = RAW.map((l) => {
  if (Z_INDEX[l.id] == null) {
    maxZ += 1;
    Z_INDEX[l.id] = maxZ;
  }
  return { ...l, z: Z_INDEX[l.id] };
}).sort((a, b) => a.z - b.z);

// Helper maps
export const layerById = Object.fromEntries(layers.map((l) => [l.id, l]));

// ---------------- Visibility Phases ----------------
// Objects explicitly requested to stay hidden until the END phase (revealed together)
export const END_GAME_GROUP = [
  // Remaining final-only items after moving many to mid reveal group
  "box-tennis",
  "goblet",
  "hockey",
  "hockey-puck",
  "hockey-stick",
  "chess",
  "medals",
  "posters",
  "tennis-bookcase",
  "tennis-floor",
  "tennis-racket",
  "tennis-shelf",
];

// Individually revealable during MID phase (still hidden at start)
export const MID_GAME_REVEALABLE = [
  // original
  "dino",
  "robot",
  "ship",
  // newly added per request
  "ufo",
  "plane",
  "rocket",
  "chandelier", // user: chanelier
  "car-blue",
  "car-green",
  "car-yellow",
  "cubes",
  "car",
  "football",
  "picture",
  "books-1",
  "books-3",
  "books-4",
  "skipping-rope",
  "skates",
]; // appear one-by-one mid game

// Initial hidden set = all above
export const INITIAL_HIDE = Array.from(
  new Set([...END_GAME_GROUP, ...MID_GAME_REVEALABLE])
);
