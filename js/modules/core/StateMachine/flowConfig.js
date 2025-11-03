// Centralized configuration for FlowHandlers: auto slides, canvas-active slides, and rules

export const AUTO_SLIDES = {
  slide3: 1500,
  slide5: 1500,
  slide6: 2000,
  slide8: 1500,
  slide16: 2000,
  slide20: 2000,
  slide23: 1500,
  slide45: 2000,
  slide46: 3000,
};

export const CANVAS_ACTIVE_SLIDES = new Set([
  "slide4",
  "slide6",
  "slide7",
  "slide9",
  "slide10",
  "slide10",
  "slide11",
  "slide12",
  "slide13",
  "slide14",
  "slide15",
  "slide16",
  "slide17",
  "slide18",
  "slide19",
  "slide20",
  "slide21",
  "slide22",
  "slide29",
  "slide30",
  "slide31",
  "slide32",
  "slide38",
  "slide39",
  "slide40",
  "slide41",
  "slide42",
  "slide43",
  "slide44",
  "slide45",
  "slide46",
  "slide47",
  "slide48",
  "slide49",
  "slide99",
]);

export const RULES = [
  { when: "slide7", gamePreload: ["finddiff"] },
  { when: "slide19", gamePreload: ["puzzle", "wordbox", "football"] },
  { when: "slide33", gamePreload: ["wordbox"] },
  { when: "slide41", gamePreload: ["football"] },
  {
    when: "slide99",
    pickers: { show: true, locked: false, close: true },
    // Reveal both variants; filterRoomRevealIds will hide football-0 after completion
    roomReveal: ["book-floor", "box", "football-0", "football"],
    score: { unlock: true, hide: true },
  },
  // Force-hide pickers across puzzle pre-intro and gameplay slides
  {
    when: ["slide23", "slide24", "slide25", "slide26", "slide27"],
    pickers: { hide: true },
  },
  { when: "slide4", character: "hide" },
  {
    when: "slide16",
    character: "show",
    pickers: { show: true, locked: true },
  },
  {
    when: ["slide17", "slide18", "slide19", "slide20", "slide21", "slide22"],
    pickers: { show: true, locked: false, closeOn: "slide20" },
  },
  {
    when: ["slide29", "slide30", "slide31"],
    pickers: { show: true, locked: false, close: true },
  },
  { when: ["slide33"], pickers: { hide: true } },
  { when: "slide39", pickers: { hide: true } },
  {
    when: ["slide34", "slide35", "slide36", "slide37"],
    pickers: { hide: true },
  },
  { when: "slide38", character: "show" },
  { when: ["slide40", "slide41", "slide42"], character: "hide" },
  // Activate finddiff for early mini-game slides
  { when: "slide9", game: { id: "finddiff", active: false, z: 5 } },
  // Generic mini-game early slides (existing behavior retained)
  {
    when: "slide9",
    gameMisc: { show: true, active: false, scoreHide: true, z: 5 },
  },
  { when: "slide13", gameMisc: { active: true, scoreShow: true, z: 20 } },
  { when: "slide14", gameMisc: { active: false, z: 5 } },
  {
    when: "slide15",
    gameMisc: { resetRound: 2, show: true, active: false, z: 5 },
  },
  // Puzzle preview / active / post
  {
    when: "slide25",
    game: {
      id: "puzzle",
      active: false,
      ensure: "slide25",
      score: { show: true },
      z: 40,
    },
  },
  { when: ["slide25", "slide26", "slide27"], pickers: { hide: true } },
  { when: "slide24", pickers: { hide: true } },
  {
    when: "slide26",
    gameEnsure: { id: "puzzle", active: true, z: 40, scoreShow: true },
  },
  {
    when: "slide27",
    gameEnsure: {
      id: "puzzle",
      hide: true,
      active: false,
      z: 5,
      scoreShow: true,
    },
  },
  // WordBox activation
  { when: "slide34", wordbox: { activate: true } },
  { when: ["slide36", "slide37"], wordbox: { hide: true, scoreHide: true } },
  // Room object reveal / scoreboard hides
  {
    when: "slide29",
    roomReveal: ["book-floor", "box", "football-0"],
    score: { unlock: true, hide: true },
    gameDeactivate: true,
    z: 5,
  },
  {
    when: ["slide30", "slide31", "slide32", "slide33"],
    roomReveal: ["book-floor", "box", "football-0"],
  },
  { when: "slide35", score: { unlock: true, hide: true } },
  {
    when: "slide38",
    roomReveal: ["book-floor", "box", "football-0"],
    score: { unlock: true, hide: true },
    z: 5,
  },
  { when: "slide41", roomRemove: ["wheel-pump", "sh-wheel-pump"] },
  { when: "slide42", football: true },
  { when: ["slide42", "slide43", "slide44"], pickers: { hide: true } },
  // Ensure completed football object is visible starting after slide 44
  { when: "slide44", roomReveal: ["football"] },
  {
    when: "slide43",
    postFootballPersist: {
      keepGame: true,
      z: 5,
      scene: {
        parallax: false,
        view: () => ({
          zoom: 1.5,
          offsetY: -Math.round(window.innerHeight * 0.25),
        }),
      },
    },
  },
  {
    when: "slide44",
    postFootballPersist: {
      keepGame: true,
      z: 5,
      scene: {
        parallax: false,
        view: () => ({
          zoom: 1.5,
          offsetY: -Math.round(window.innerHeight * 0.25),
        }),
      },
    },
  },
  { when: "slide45", afterFootballEnd: true },
  { when: "slide45", character: "show" },
  { when: ["slide43", "slide44"], character: "hide" },
  // Slide 45 specifics
  {
    when: "slide45",
    roomReveal: [
      "chandelier",
      "picture-2",
      "books-1",
      "books-3",
      "book-floor",
      "skipping-rope",
      "car-green",
      "car-yellow",
      "car-blue",
      "car",
      "box",
      "plane",
      "rocket",
      "football",
      "cubes",
      "books-4",
      "tablecloth",
      "skates",
      "dino",
      "ship",
      "ufo",
      "robot",
    ],
    score: { unlock: true, hide: true },
    roomRemove: ["books-shelf", "picture-1"],
  },
  // Slide 46
  {
    when: "slide46",
    onEnter: "slide46_setup",
    roomRestore: ["box", "book-floor", "picture-1"],
    roomReveal: ["picture-1", "box", "book-floor"],
    roomRemove: ["books-shelf", "picture-2"],
  },
  // Outro
  { when: "outro", outro: true },
];
