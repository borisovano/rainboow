# Maze stage

The green gate at the end of the rainbow opens after the final gold-pot question. Entering resets the previous realm's powers. For quick testing use `?stage=maze`, then select the school grade.

The maze is a connected 11×11 graph shared by walls, collisions, guard routing and the temporary map. Rescue any friend to gain the next power. Rescue all eight and solve the exit question to finish and earn 100 points.

1. B: break one interior wall once.
2. M: map and route arrows for 30 visible-tab seconds, once. The map expires even during questions or breathing.
3. Passive: two questions per guard encounter, with two allowed mistakes total, including timeouts. The third mistake fails. Each question has 30 seconds; the breathing overlay appears for five seconds once at encounter start.
4. Passive: chalk marks on the last 12 visited cells.
5. E: point toward the nearest unrescued friend for 8 seconds; 20-second cooldown.
6. F: freeze guards for 5 seconds; 25-second cooldown.
7. T: return to the entrance once, preserving score and rescues.
8. L: reveal hidden math chests for 20 seconds; 30-second cooldown. Each chest awards 25 points once.

Arrow keys/touch controls move; Space jumps. ABUBU retains the 5× speed shortcut; swept collision prevents crossing walls. HUD buttons also activate powers.

Run `node tests/maze.cjs` from this project or any directory. It checks 100 layouts, connectivity, rescue placement, collision, portal/exit gating, rewards, limits, map expiry, breathing, two-question encounters, and victory. Other `tests/check-*.cjs` files verify prior worlds.
