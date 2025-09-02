export class GameManager {
  constructor({ bus }) {
    this.bus = bus;
    this.registry = new Map(); // id -> loader fn
    this.active = null; // { id, api }
    this.root = null;
  }

  attachRoot(rootEl) { this.root = rootEl; }

  register(id, loader) { this.registry.set(id, loader); }

  async activate(id, ctx) {
    if (this.active && this.active.id === id) return;
    await this.deactivate();
    const loader = this.registry.get(id);
    if (!loader) throw new Error('Game not registered: '+id);
    const mod = await loader();
    const api = await mod.createGame(ctx);
    if (!this.root) throw new Error('Game root not attached');
    await api.init(this.root);
    api.show();
    this.active = { id, api };
  }

  async deactivate() {
    if (!this.active) return;
    const { api } = this.active;
    try { api.hide && api.hide(); } catch {}
    try { api.destroy && api.destroy(); } catch {}
    this.root.innerHTML = '';
    this.active = null;
  }

  update(dt) { if (this.active && this.active.api.update) this.active.api.update(dt); }
}
