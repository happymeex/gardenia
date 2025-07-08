# Story Mode Implementation Guide

This document explains the structure, required code changes and recommended workflow to add new story-mode content or port the existing real-time combat systems into a narrative flow.

## 1. High-level flow

1. Player connects → server creates/loads a `User` record.
2. Client transitions to `Story` scene (`client/scenes/Story.ts`).
3. The scene asks the server for the next **story node** and renders it (dialogue, choices, combat, cut-scene, etc.).
4. When the player makes a choice or finishes combat, the result is POSTed to `/api/story/advance`.
5. Server stores progress in Redis and returns the next node.
6. Client repeats until the "END" node is reached.

```
┌────────┐    WebSocket (state updates)    ┌─────────┐
│ Client │ ───────────────────────────────▶│  Server │
└────────┘◀─────────────────────────────── │         │
   ▲  │  REST /api/story/* (blocking)       └─────────┘
   │  ▼
 Story Scene
```

## 2. Data model

| Concept | Location | Description |
|---------|----------|-------------|
| StoryNode | `server/story/node.go` | Immutable JSON describing dialogue, NPCs, branching options, embedded combat IDs. |
| Progress  | Redis key `story:{userId}` | Stores current node ID and any flags. |

A minimal `StoryNode` schema:
```jsonc
{
  "id": "village_intro",
  "type": "dialogue",            // dialogue | choice | combat | cutscene
  "text": "Welcome to Gardenia!",
  "next": "choose_path"           // or array of option IDs for branching
}
```

## 3. Server-side endpoints

```
GET  /api/story/start     # returns first node (creates progress if missing)
POST /api/story/advance   # body = {choiceId | result}
```

Handlers live in `server/story/handler.go` and publish `story:update` events over the existing WebSocket hub so any open tabs stay in sync.

## 4. Client-side scene (`client/scenes/Story.ts`)

1. On `create()`, call `/api/story/start`.
2. Render node via helper `renderNode(node)` that switches on `node.type`.
3. For choices, create clickable buttons; on click → `advance(choice.id)`.
4. For combat nodes, push the existing `CombatScene`, wait for `exit`, then auto-advance with combat result.
5. Listen for `story:update` WS events to update UI if progress changes from another tab.

_UI helpers live in_ `client/utils/storyUI.ts` _(create if missing)._  Keep visuals minimal—plain text & Phaser buttons are enough.

## 5. Adding new content

1. Append new `*.json` files under `server/story/nodes/`.
2. Reference by ID in parent nodes.
3. No code changes needed unless introducing a new `node.type`.

## 6. Saving & Loading

Progress is persisted automatically on each POST. Logging out or refreshing reloads the current node via `/api/story/start`.

## 7. Testing checklist

- [ ] New user flows through intro without errors.
- [ ] Choosing each branch moves to correct node.
- [ ] Combat nodes transition back to story scene.
- [ ] Progress survives page refresh.

---

Feel free to update this guide whenever the story engine evolves.
