export const BLOCK_TYPES = ['turf', 'loam', 'basalt', 'trunk', 'glowshard'];

export class Inventory {
  constructor(seed = null) {
    this.items = seed ?? { turf: 20, loam: 15, basalt: 12, trunk: 8, leaves: 0, glowshard: 0, plank: 0 };
    this.selected = 0;
  }

  count(type) {
    return this.items[type] ?? 0;
  }

  add(type, amount = 1) {
    this.items[type] = (this.items[type] ?? 0) + amount;
  }

  consume(type, amount = 1) {
    if (this.count(type) < amount) return false;
    this.items[type] -= amount;
    return true;
  }

  currentType() {
    return BLOCK_TYPES[this.selected];
  }
}
