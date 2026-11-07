# Global Scene Background

A system-independent Foundry VTT module targeting versions 13 and 14. A GM selects one world-wide background colour, applied to all existing scenes and automatically to newly created, duplicated and imported scenes. In v14, it also applies to every scene level, including newly added levels.

## Installation

### Via manifest URL (recommended)

1. In Foundry's setup screen, open **Add-on Modules → Install Module**.
2. Paste this into the **Manifest URL** field at the bottom and click **Install**:

   ```
   https://raw.githubusercontent.com/Jombolio/VTT_GlobalBackground/main/module.json
   ```

Foundry will offer updates automatically when the `version` in that manifest is bumped.

### Manual

1. Create the folder `Data/modules/global-scene-background/` in your Foundry user-data directory.
2. Extract `dist/global-scene-background.zip` into it. The resulting path must be `Data/modules/global-scene-background/module.json`.
3. Restart Foundry if it is already running.

### Enabling

1. Open your world and enable **Global Scene Background** in **Manage Modules**.
2. Open **Configure Settings → Global Scene Background**, choose **Background colour**, tick **Use a global background colour**, and save.

The setting is world-scoped and restricted to GMs by Foundry. Players receive the persisted scene updates automatically. Enable it separately in each world where you want it.

While enabled, individual scene/level background colour edits are replaced with the global colour. Background images, image tints, lighting and fog settings are unaffected. Compendium source documents are not modified; scenes imported into the world receive the global colour.

The module starts disabled so installing it does not immediately overwrite existing colours. Applying it persists the new colours in scene documents. Disabling or uninstalling stops enforcement but does not restore previous colours; back up your world first if you want to preserve those values.

## Releasing an update

1. Bump `version` in `module.json`.
2. Rebuild `dist/global-scene-background.zip` with `module.json`, `scripts/` and `README.md` at the zip root (no wrapping folder).
3. Commit and push to `main`. Installed copies will see the update on their next check.

## Validation

Run `node --test tests/module.test.cjs`. These are isolated hook tests with a simulated Foundry environment; a live Foundry smoke test is still required. No live compatibility verification is claimed in the manifest.

In Foundry, test two differently coloured scenes, one scene with multiple v14 levels, creation, duplication, compendium import, a new level, a player client, and disabling the setting. Verify all backgrounds match while enabled, and that normal per-scene edits work after disabling.

API references: [Scene data](https://foundryvtt.com/api/v14/interfaces/foundry.documents.types.SceneData.html), [Level data](https://foundryvtt.com/api/v14/interfaces/foundry.documents.types.LevelData.html), [world settings](https://foundryvtt.com/api/classes/foundry.helpers.ClientSettings.html).
