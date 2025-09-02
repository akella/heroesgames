const LAYERS = {
    slide1: ['slide1Layer'],
    slide2: ['slide2Layer'],
    slide3: ['slide3Layer'],
    slide4: ['slide4Layer'],
    slide5: ['slide5Layer'],
    slide6: ['slide6Layer'],
    slide7: ['slide7Layer'],
    slide8: ['slide8Layer'],
  slide9: ['slide9Layer'],
  slide10: ['slide10Layer'],
  slide11: ['slide11Layer'],
  slide12: ['slide12Layer'],
  slide13: ['slide13Layer'],
  slide14: ['slide14Layer'],
  };
  
  export class LayerManager {
    constructor(allLayers) {
      this.layers  = allLayers;          // { id: layerObj }
      this.active  = new Set();          // ids currently on screen
    }
  
    async syncToState(snapshot) {
      const want = new Set(LAYERS[snapshot.value] || []);

      console.log(want,'want',this.layers,'this.layers')
  
      // 1 — fade out layers no longer needed
      for (const id of Array.from(this.active)) {
        if (!want.has(id)) {
          this.layers[id].outro();   // ➜ wait for fade
          this.active.delete(id);
        }
      }
  
      // 2 — fade in new layers
      for (const id of want) {
        if (!this.active.has(id)) {
          this.layers[id].intro();   // ➜ wait for fade
          this.active.add(id);
        }
      }
    }
  
    update(dt) {                        // per-frame if you need it
      this.active.forEach(id => this.layers[id].update(dt));
    }
  }