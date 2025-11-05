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

export const BOARD_W = 620;
export const BOARD_H = 350; // fits 4 rows (17 pieces)
export const COLS = 5;
export const ROWS = 4;

export const KEEP_ORIGINAL_SIZES = true;

export const GROUP_SCALE = 1.19;

export const BOARD_ADJUST_X = 16;
export const BOARD_ADJUST_Y = -73;

export const pieces = [
  {
    id: 1,
    src: piece1,
    x: 343,
    y: 185,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 2,
    src: piece2,
    x: 230,
    y: 202,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 3,
    src: piece3,
    x: 111,
    y: 199,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 4,
    src: piece4,
    x: 126,
    y: 182,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 5,
    src: piece5,
    x: -24,
    y: 189,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 6,
    src: piece6,
    x: 214,
    y: 138,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 7,
    src: piece7,
    x: 106,
    y: 82,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 8,
    src: piece8,
    x: -16,
    y: 163,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 9,
    src: piece9,
    x: 309,
    y: 153,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 10,
    src: piece10,
    x: 163,
    y: 97,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 11,
    src: piece11,
    x: 53,
    y: 66,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 12,
    src: piece12,
    x: -62,
    y: 107,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 13,
    src: piece13,
    x: 377,
    y: 38,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 14,
    src: piece14,
    x: 246,
    y: 46,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 15,
    src: piece15,
    x: 162,
    y: 8,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 16,
    src: piece16,
    x: 63,
    y: 3,
    anchorX: 0,
    anchorY: 0,
  },
  {
    id: 17,
    src: piece17,
    x: -48,
    y: -10,
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
];
