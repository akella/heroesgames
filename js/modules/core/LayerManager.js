const LAYERS = {
  slide1: ["slide1Layer"],
  slide2: ["slide2Layer"],
  slide3: ["slide3Layer"],
  slide4: ["slide4Layer"],
  slide5: ["slide5Layer"],
  slide6: ["slide6Layer"],
  slide7: ["slide7Layer"],
  slide8: ["slide8Layer"],
  slide9: ["slide9Layer"],
  slide10: ["slide10Layer"],
  slide11: ["slide11Layer"],
  slide12: ["slide12Layer"],
  slide13: ["slide13Layer"],
  slide14: ["slide14Layer"],
  slide15: ["slide15Layer"],
  slide16: ["slide16Layer"],
  slide17: ["slide17Layer"],
  slide18: ["slide18Layer"],
  slide19: ["slide19Layer"],
  slide20: ["slide20Layer"],
  slide21: ["slide21Layer"],
  slide22: ["slide22Layer"],
  slide23: ["slide23Layer"],
  slide24: ["slide24Layer"],
  slide25: ["slide25Layer"],
  slide26: ["slide26Layer"],
  slide27: ["slide27Layer"],
  slide28: ["slide28Layer"],
  slide29: ["slide29Layer"],
  slide30: ["slide30Layer"],
  slide31: ["slide31Layer"],
  slide32: ["slide32Layer"],
  slide33: ["slide33Layer"],
  slide34: ["slide34Layer"],
  slide35: ["slide35Layer"],
  slide36: ["slide36Layer"],
  slide37: ["slide37Layer"],
  slide38: ["slide38Layer"],
  slide39: ["slide39Layer"],
  slide40: ["slide40Layer"],
  slide41: ["slide41Layer"],
  slide42: ["slide42Layer"],
  slide43: ["slide43Layer"],
  slide44: ["slide44Layer"],
  slide45: ["slide45Layer"],
  slide46: ["slide46Layer"],
  slide47: ["slide47Layer"],
  slide48: ["slide48Layer"],
  slide99: ["slide99Layer"],
};

export class LayerManager {
  constructor(allLayers) {
    this.layers = allLayers; // { id: layerObj }
    this.active = new Set(); // ids currently on screen
  }

  async syncToState(snapshot) {
    const want = new Set(LAYERS[snapshot.value] || []);

    console.log(want, "want", this.layers, "this.layers");

    // 1 — fade out layers no longer needed
    for (const id of Array.from(this.active)) {
      if (!want.has(id)) {
        this.layers[id].outro(); // ➜ wait for fade
        this.active.delete(id);
      }
    }

    // 2 — fade in new layers
    for (const id of want) {
      if (!this.active.has(id)) {
        this.layers[id].intro(); // ➜ wait for fade
        this.active.add(id);
      }
    }
  }

  update(dt) {
    // per-frame if you need it
    this.active.forEach((id) => this.layers[id].update(dt));
  }
}
