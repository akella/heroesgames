// Centralized configuration for FlowHandlers: auto slides, canvas-active slides, and rules

export const AUTO_SLIDES = {
  slide3: 1500,
  slide5: 2000,
  slide6: 2000,
  slide8: 2000,
  slide20: 2000,
  slide23: 1500,
  slide31: 2000,
  slide48: 2000,
  slide49: 3000,
};

export const CANVAS_ACTIVE_SLIDES = new Set([
  "slide5",
  "slide4",
  "slide8",
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
  "slide41",
  "slide42",
  "slide43",
  "slide44",
  "slide45",
  "slide46",
  "slide47",
  "slide48",
  "slide49",
  "slide50",
  "slide51",
  "slide52",
  "slide99",
]);

export const RULES = [
  { when: "slide7", gamePreload: ["finddiff"] },
  { when: "slide19", gamePreload: ["puzzle", "wordbox", "football"] },
  { when: "slide33", gamePreload: ["wordbox"] },
  { when: "slide44", gamePreload: ["football"] },
  {
    when: "slide99",
    pickers: { hide: true },
    roomReveal: ["book-floor", "box", "football-0"],
    roomRevealAll: true,
    depthMap: "full",
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
    pickers: { hide: true },
  },
  {
    when: ["slide17", "slide18", "slide19"],
    pickers: { show: true, locked: false },
  },
  {
    when: ["slide20", "slide21", "slide22"],
    pickers: { hide: true },
  },
  {
    when: ["slide29", "slide30"],
    pickers: { hide: true },
  },
  {
    when: "slide31",
    pickers: { show: true, locked: false, close: true },
  },
  { when: ["slide33", "slide34", "slide35", "slide36"], pickers: { hide: true } },
  { when: "slide42", pickers: { hide: true } },
  {
    when: ["slide37", "slide38", "slide39", "slide40"],
    pickers: { hide: true },
  },
  { when: "slide41", character: "show" },
  { when: ["slide43", "slide44", "slide45"], character: "hide" },
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
  { when: "slide37", wordbox: { activate: true } },
  { when: ["slide39", "slide40"], wordbox: { hide: true, scoreHide: true } },
  // Room object reveal / scoreboard hides
  {
    when: "slide29",
    roomReveal: ["book-floor", "box", "football-0"],
    score: { unlock: true, hide: true },
    gameDeactivate: true,
    z: 5,
  },
  {
    when: ["slide30", "slide31", "slide32", "slide33", "slide34", "slide35", "slide36"],
    roomReveal: ["book-floor", "box", "football-0"],
  },
  { when: "slide38", score: { unlock: true, hide: true } },
  {
    when: "slide41",
    roomReveal: ["book-floor", "box", "football-0"],
    score: { unlock: true, hide: true },
    z: 5,
  },
  { when: "slide44", roomRemove: ["wheel-pump", "sh-wheel-pump"] },
  { when: "slide45", football: true },
  { when: ["slide45", "slide46", "slide47"], pickers: { hide: true } },
  { when: ["slide48", "slide49"], pickers: { hide: true } },
  // Ensure completed football object is visible starting from slide 48
  { when: "slide48", roomReveal: ["football"] },
  {
    when: "slide46",
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
    when: "slide47",
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
  { when: "slide48", afterFootballEnd: true },
  { when: "slide48", character: "show" },
  { when: ["slide46", "slide47"], character: "hide" },
  // Slide 48 specifics
  {
    when: "slide48",
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
    roomRevealAll: true,
    depthMap: "full",
    score: { unlock: true, hide: true },
    roomRemove: ["books-shelf", "picture-1"],
  },
  // Slide 49
  {
    when: "slide49",
    onEnter: "slide49_setup",
    roomRestore: ["box", "book-floor", "picture-1"],
    roomReveal: ["picture-1", "box", "book-floor"],
    roomRemove: ["books-shelf", "picture-2"],
  },
  // Outro
  { when: "outro", outro: true },
];
