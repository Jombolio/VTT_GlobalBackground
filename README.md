# Global Scene Background

A system-independent Foundry VTT module targeting versions 13 and 14. A GM selects one world-wide background colour, applied to all existing scenes and automatically to newly created, duplicated and imported scenes. In v14, it also applies to every scene level, including newly added levels.

## Installation

1. Extract `dist/global-scene-background.zip` into your Foundry user-data `Data/modules/` directory. The resulting path must be `Data/modules/global-scene-background/module.json`.
2. Restart Foundry if it is already running.
3. Open your world and enable **Global Scene Background** in **Manage Modules**.
4. Open **Configure Settings → Global Scene Background**, choose **Background colour**, tick **Use a global background colour**, and save.

The setting is world-scoped and restricted to GMs by Foundry. Players receive the persisted scene updates automatically. Enable it separately in each world where you want it.

While enabled, individual scene/level background colour edits are replaced with the global colour. Background images, image tints, lighting and fog settings are unaffected. Compendium source documents are not modified; scenes imported into the world receive the global colour.

The module starts disabled so installing it does not immediately overwrite existing colours. Applying it persists the new colours in scene documents. Disabling or uninstalling stops enforcement but does not restore previous colours; back up your world first if you want to preserve those values.

## Validation

Run `node --test tests/module.test.cjs`. These are isolated hook tests with a simulated Foundry environment; a live Foundry smoke test is still required. No live compatibility verification is claimed in the manifest.

In Foundry, test two differently coloured scenes, one scene with multiple v14 levels, creation, duplication, compendium import, a new level, a player client, and disabling the setting. Verify all backgrounds match while enabled, and that normal per-scene edits work after disabling.

API references: [Scene data](https://foundryvtt.com/api/v14/interfaces/foundry.documents.types.SceneData.html), [Level data](https://foundryvtt.com/api/v14/interfaces/foundry.documents.types.LevelData.html), [world settings](https://foundryvtt.com/api/classes/foundry.helpers.ClientSettings.html).
