import type * as Phaser from "phaser";
import { gameInput } from "@/lib/game-input";
import { MenuRepeat } from "@/lib/menu-navigation";

type MenuObject = Phaser.GameObjects.GameObject & { visible: boolean; getBounds(): Phaser.Geom.Rectangle };
export function attachControllerNavigation(game: Phaser.Game): () => void {
  const repeat = new MenuRepeat();
  let sceneKey = "", selected: MenuObject | null = null, marker: Phaser.GameObjects.Graphics | null = null;
  const cleanupMarker = () => { marker?.destroy(); marker = null; selected = null; };
  const unsubscribe = gameInput.subscribe((frame) => {
    if (document.querySelector(".pause-overlay")) { cleanupMarker(); return; }
    const scene = game.scene.getScenes(true).filter((entry) => entry.input.enabled).at(-1);
    if (!scene || ["PlayScene", "OnlinePlayScene", "Boot", "Preloader", "Loading"].includes(scene.sys.settings.key)) { cleanupMarker(); sceneKey = ""; return; }
    if (sceneKey !== scene.sys.settings.key) { cleanupMarker(); sceneKey = scene.sys.settings.key; gameInput.reset(); return; }
    const choices = scene.children.list.filter((object) => object.input?.enabled && object.type !== "Rectangle" && "getBounds" in object && (object as MenuObject).visible) as MenuObject[];
    choices.sort((a, b) => { const aa = a.getBounds(), bb = b.getBounds(); return aa.y - bb.y || aa.x - bb.x; });
    if (!choices.length) return;
    const direction = repeat.read(frame);
    if (direction) {
      const index = choices.indexOf(selected!);
      selected?.emit("pointerout");
      selected = choices[index < 0 ? 0 : (index + (direction === "up" || direction === "left" ? -1 : 1) + choices.length) % choices.length];
      selected.emit("pointerover");
      marker ??= scene.add.graphics().setDepth(10000);
      const box = selected.getBounds();
      marker.clear().lineStyle(4, 0xffdc82, 1).strokeRoundedRect(box.x - 8, box.y - 8, box.width + 16, box.height + 16, 8);
    }
    if (frame.pressed.has("back") || frame.pressed.has("pause")) {
      const back = choices.find((object) => object.name === "close-btn" || object.name === "no-btn");
      if (back) { gameInput.reset(); back.emit("pointerup"); cleanupMarker(); }
    } else if (frame.pressed.has("confirm")) {
      if (selected && choices.includes(selected)) { const target = selected; gameInput.reset(); cleanupMarker(); target.emit("pointerup"); }
      else { selected = choices[0]; selected.emit("pointerover"); }
    }
  });
  return () => { unsubscribe(); cleanupMarker(); };
}
