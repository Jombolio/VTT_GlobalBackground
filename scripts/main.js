const ID = "global-scene-background";
const enabled = () => game.settings.get(ID, "enabled");
const colour = () => String(game.settings.get(ID, "colour"));
const numericColour = () => Number.parseInt(colour().replace("#", ""), 16);
const isWorld = document => !document.pack && !document.inCompendium;
const isCoordinator = () => game.user?.isGM && game.users.activeGM?.id === game.user.id;
let queue = Promise.resolve();

// Serialize changes and read the latest setting when each pass starts.
function scheduleSync() {
  if (!game.ready || !isCoordinator()) return queue;
  queue = queue.then(syncWorld).catch(error => {
    console.error(`${ID} | Could not apply background colour`, error);
    ui.notifications.error("Global Scene Background: could not update every scene. Check the console, then reload to retry.");
  });
  return queue;
}

async function syncWorld() {
  if (!enabled() || !isCoordinator()) return;
  const hex = colour();
  const number = numericColour();
  const updates = [];
  for (const scene of game.scenes) {
    const update = { _id: scene.id };
    if (String(scene.backgroundColor).toLowerCase() !== hex.toLowerCase()) update.backgroundColor = hex;
    const levels = Array.from(scene.levels ?? [])
      .filter(level => Number(level.background.color) !== number)
      .map(level => ({ _id: level.id, "background.color": number }));
    if (levels.length) update.levels = levels;
    if (Object.keys(update).length > 1) updates.push(update);
  }
  if (updates.length) await CONFIG.Scene.documentClass.updateDocuments(updates);
}

function applyLevelColour(data) {
  // Handle both flattened updates and complete embedded data without losing textures.
  if (data.background && typeof data.background === "object") data.background.color = numericColour();
  else data["background.color"] = numericColour();
  if (Object.hasOwn(data, "background.color")) data["background.color"] = numericColour();
}

Hooks.once("init", () => {
  game.settings.register(ID, "colour", {
    name: "Background colour",
    hint: "The shared background colour for all world scenes and levels. Saving applies it to existing scenes when enabled.",
    scope: "world", config: true,
    type: new foundry.data.fields.ColorField({ nullable: false, initial: "#000000" }),
    default: "#000000", onChange: scheduleSync
  });
  game.settings.register(ID, "enabled", {
    name: "Use a global background colour",
    hint: "Apply the selected colour to ALL existing and future scenes, including imported scenes and every v14 level. Overrides individual background colours. Disabling leaves the last applied colours in place.",
    scope: "world", config: true, type: Boolean,
    default: false, onChange: scheduleSync
  });
});

Hooks.once("ready", scheduleSync);
Hooks.on("updateUser", scheduleSync);
Hooks.on("userConnected", scheduleSync);

Hooks.on("preCreateScene", scene => {
  if (!enabled() || !isWorld(scene)) return;
  const update = { backgroundColor: colour() };
  const levels = scene.toObject().levels;
  if (levels?.length) {
    for (const level of levels) {
      level.background ??= {};
      level.background.color = numericColour();
    }
    update.levels = levels;
  }
  scene.updateSource(update);
});

Hooks.on("preUpdateScene", (scene, changes) => {
  if (!enabled() || !isWorld(scene)) return;
  changes.backgroundColor = colour();
  for (const level of changes.levels ?? []) applyLevelColour(level);
});

Hooks.on("preCreateLevel", level => {
  if (!enabled() || !isWorld(level) || !level.parent || !isWorld(level.parent)) return;
  level.updateSource({ "background.color": numericColour() });
});

Hooks.on("preUpdateLevel", (level, changes) => {
  if (!enabled() || !isWorld(level) || !level.parent || !isWorld(level.parent)) return;
  applyLevelColour(changes);
});

// Catch default levels created by core and imports made by other clients.
Hooks.on("createScene", scheduleSync);
Hooks.on("createLevel", scheduleSync);
