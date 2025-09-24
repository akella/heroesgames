// Puzzle pieces configuration

// Explicit imports so bundler (Vite) tracks assets in production (same pattern as room layers)
import piece1 from "../../../assets/games/puzzle/puzzle-pieces/1.webp";
import piece2 from "../../../assets/games/puzzle/puzzle-pieces/2.webp";
import piece3 from "../../../assets/games/puzzle/puzzle-pieces/3.webp";
import piece4 from "../../../assets/games/puzzle/puzzle-pieces/4.webp";
import piece5 from "../../../assets/games/puzzle/puzzle-pieces/5.webp";
import piece6 from "../../../assets/games/puzzle/puzzle-pieces/6.webp";
import piece7 from "../../../assets/games/puzzle/puzzle-pieces/7.webp";
import piece8 from "../../../assets/games/puzzle/puzzle-pieces/8.webp";
import piece9 from "../../../assets/games/puzzle/puzzle-pieces/9.webp";
import piece10 from "../../../assets/games/puzzle/puzzle-pieces/10.webp";
import piece11 from "../../../assets/games/puzzle/puzzle-pieces/11.webp";
import piece12 from "../../../assets/games/puzzle/puzzle-pieces/12.webp";
import piece13 from "../../../assets/games/puzzle/puzzle-pieces/13.webp";
import piece14 from "../../../assets/games/puzzle/puzzle-pieces/14.webp";
import piece15 from "../../../assets/games/puzzle/puzzle-pieces/15.webp";
import piece16 from "../../../assets/games/puzzle/puzzle-pieces/16.webp";
import piece17 from "../../../assets/games/puzzle/puzzle-pieces/17.webp";
import piece18 from "../../../assets/games/puzzle/puzzle-pieces/18.webp";
import piece19 from "../../../assets/games/puzzle/puzzle-pieces/19.webp";
import piece20 from "../../../assets/games/puzzle/puzzle-pieces/20.webp";
import piece21 from "../../../assets/games/puzzle/puzzle-pieces/21.webp";
import piece22 from "../../../assets/games/puzzle/puzzle-pieces/22.webp";
import piece23 from "../../../assets/games/puzzle/puzzle-pieces/23.webp";
import piece24 from "../../../assets/games/puzzle/puzzle-pieces/24.webp";
import piece25 from "../../../assets/games/puzzle/puzzle-pieces/25.webp";
import piece26 from "../../../assets/games/puzzle/puzzle-pieces/26.webp";
import piece27 from "../../../assets/games/puzzle/puzzle-pieces/27.webp";
import piece28 from "../../../assets/games/puzzle/puzzle-pieces/28.webp";
import piece29 from "../../../assets/games/puzzle/puzzle-pieces/29.webp";
import piece30 from "../../../assets/games/puzzle/puzzle-pieces/30.webp";
import piece31 from "../../../assets/games/puzzle/puzzle-pieces/31.webp";
import piece32 from "../../../assets/games/puzzle/puzzle-pieces/32.webp";
import piece33 from "../../../assets/games/puzzle/puzzle-pieces/33.webp";
import piece34 from "../../../assets/games/puzzle/puzzle-pieces/34.webp";

export const BOARD_W = 620;
export const BOARD_H = 490; // fits 7 rows (34 pieces)
export const COLS = 5;
export const ROWS = 7;

export const KEEP_ORIGINAL_SIZES = true;

export const GROUP_SCALE = 1.19;

export const BOARD_ADJUST_X = 16;
export const BOARD_ADJUST_Y = -73;

export const pieces = [
  {
    id: 1,
    src: piece1,
    x: 298,
    y: 105,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 2,
    src: piece2,
    x: 215,
    y: 150,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 3,
    src: piece3,
    x: 242,
    y: 122,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 4,
    src: piece4,
    x: 327,
    y: 60,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 5,
    src: piece5,
    x: 247,
    y: 58,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 6,
    src: piece6,
    x: 177,
    y: 60,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 7,
    src: piece7,
    x: 177,
    y: 102,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 8,
    src: piece8,
    x: 152,
    y: 174,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 9,
    src: piece9,
    x: 117,
    y: 107,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 10,
    src: piece10,
    x: 269,
    y: 254,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 11,
    src: piece11,
    x: 178,
    y: 232,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 12,
    src: piece12,
    x: 197,
    y: 306,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 13,
    src: piece13,
    x: 132,
    y: 226,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 14,
    src: piece14,
    x: 63,
    y: 241,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 15,
    src: piece15,
    x: 188,
    y: 259,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 16,
    src: piece16,
    x: -12,
    y: 283,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 17,
    src: piece17,
    x: -13,
    y: 230,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 18,
    src: piece18,
    x: 41,
    y: 184,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 19,
    src: piece19,
    x: -13,
    y: 124,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 20,
    src: piece20,
    x: 63,
    y: 115,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 21,
    src: piece21,
    x: 79,
    y: 59,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 22,
    src: piece22,
    x: 123,
    y: 60,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 23,
    src: piece23,
    x: -15,
    y: 122,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 24,
    src: piece24,
    x: -15,
    y: 59,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 25,
    src: piece25,
    x: 29,
    y: 59,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 26,
    src: piece26,
    x: 322,
    y: 193,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 27,
    src: piece27,
    x: 432,
    y: 175,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 28,
    src: piece28,
    x: 427,
    y: 229,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 29,
    src: piece29,
    x: 437,
    y: 60,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 30,
    src: piece30,
    x: 377,
    y: 229,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 31,
    src: piece31,
    x: 310,
    y: 280,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 32,
    src: piece32,
    x: 298,
    y: 163,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 33,
    src: piece33,
    x: 241,
    y: 222,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 34,
    src: piece34,
    x: 388,
    y: 92,
    anchorX: 0,
    anchorY: 0,
  },
];

export const ALL_PIECE_SOURCES = [
  piece1,
  piece2,
  piece3,
  piece4,
  piece5,
  piece6,
  piece7,
  piece8,
  piece9,
  piece10,
  piece11,
  piece12,
  piece13,
  piece14,
  piece15,
  piece16,
  piece17,
  piece18,
  piece19,
  piece20,
  piece21,
  piece22,
  piece23,
  piece24,
  piece25,
  piece26,
  piece27,
  piece28,
  piece29,
  piece30,
  piece31,
  piece32,
  piece33,
  piece34,
];
