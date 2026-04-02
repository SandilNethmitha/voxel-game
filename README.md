# Stonewild Prototype (Three.js)

A small original voxel sandbox survival prototype.

## Features
- Chunk-based voxel terrain generation with caves, trees, and glowshard deposits.
- Break/place blocks via first-person raycasting.
- Hotbar (1-5), inventory, and simple crafting panel.
- Movement: walk, jump, sprint.
- Day/night cycle with night enemy spawns ("Dusklings").
- Original generated pixel-art textures.
- Save/load using browser localStorage.

## Run
Because this uses ES modules, run from a local web server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Controls
- WASD: move
- Space: jump
- Shift: sprint
- Left click: break block
- Right click: place selected block
- 1-5: select hotbar slot
