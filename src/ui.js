import { BLOCK_TYPES } from './inventory.js';
import { RECIPES, canCraft } from './crafting.js';

export function renderHUD({ hud, hotbar, crafting, message }, player, inventory, worldTime, enemyCount, onCraft) {
  hud.innerHTML = [
    `Pos: ${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}, ${player.position.z.toFixed(1)}`,
    `Time: ${worldTime.toFixed(1)}h`,
    `Night foes: ${enemyCount}`,
    `Bag: ${Object.entries(inventory.items).map(([k, v]) => `${k}:${v}`).join(' | ')}`,
  ].join('<br>');

  hotbar.innerHTML = BLOCK_TYPES.map((type, i) => `
    <div class="slot ${inventory.selected === i ? 'active' : ''}">
      <div>${i + 1}</div>
      <div class="name">${type}</div>
      <div class="count">${inventory.count(type)}</div>
    </div>
  `).join('');

  crafting.innerHTML = `<h4 style="margin:2px 0 8px">Crafting</h4>` + RECIPES.map((recipe) => {
    const enabled = canCraft(inventory, recipe);
    return `<button data-id="${recipe.id}" ${enabled ? '' : 'disabled'}>${recipe.name}</button>`;
  }).join('');

  crafting.querySelectorAll('button').forEach((btn) => {
    btn.onclick = () => onCraft(btn.dataset.id);
  });

  if (message.value) {
    message.el.textContent = message.value;
    message.el.style.display = 'block';
  } else {
    message.el.style.display = 'none';
  }
}
