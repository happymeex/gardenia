# Simplifying the Combat System

## Goals
- Reduce complexity for players and developers
- Minimize edge-case bugs
- Make balancing faster and easier

## Pain Points
- Too many primary stats and secondary modifiers
- Complicated initiative and turn order rules
- Multiple damage types and resistance tables

## Proposed Simplifications
1. Collapse primary stats to **Attack**, **Defense**, **Speed**
2. Single damage type; vary effects through status conditions
3. Fixed 1-second combat tick; actors act when `speed` ≥ threshold
4. Standardise abilities to `power`, `cost`, `cooldown`, `effect`
5. Replace per-weapon crit tables with global crit formula

## Data Model Changes
```ts
interface Entity {
  id: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
}

interface Ability {
  id: string;
  name: string;
  power: number;
  cost: number;
  cooldown: number;
  effect: EffectFn;
}
```

## API / Protocol
- `POST /attack` → `{ sourceId, targetId }`
- WebSocket `combat_tick` every 1000 ms with state diff

## Migration Plan
1. Add new fields & migrate data
2. Refactor server combat loop and remove old stats
3. Update client UI & ability logic
4. Balance pass, closed-beta test, rollout

## Timeline
| Week | Focus |
|------|-------|
| 1 | Spec & schema migration |
| 2 | Server logic refactor |
| 3 | Client update & QA |
| 4 | Balance & release |

## Risks & Mitigations
- Balance reset → run closed beta & collect metrics

## Success Metrics
- 50 % reduction in combat bugs
- Onboarding tutorial < 5 min
- Dev time per new ability ↓ 40 %
