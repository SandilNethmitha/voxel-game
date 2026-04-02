export const RECIPES = [
  { id: 'planks', name: '2x Plank (from 1 Trunk)', input: { trunk: 1 }, output: { plank: 2 } },
  { id: 'glowshard', name: '1x Glowshard (from 2 Basalt + 1 Plank)', input: { basalt: 2, plank: 1 }, output: { glowshard: 1 } },
  { id: 'turf', name: '4x Turf (from 1 Loam + 1 Leaves)', input: { loam: 1, leaves: 1 }, output: { turf: 4 } },
];

export function canCraft(inventory, recipe) {
  return Object.entries(recipe.input).every(([type, amount]) => inventory.count(type) >= amount);
}

export function craft(inventory, recipe) {
  if (!canCraft(inventory, recipe)) return false;
  Object.entries(recipe.input).forEach(([type, amount]) => inventory.consume(type, amount));
  Object.entries(recipe.output).forEach(([type, amount]) => inventory.add(type, amount));
  return true;
}
