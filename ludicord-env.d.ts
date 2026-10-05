/// <reference path="./ludicord.generated.d.ts" />
/// <reference path="./ludicord.plugins.generated.d.ts" />

declare module "*.css" {}
declare module "phaser/dist/phaser.esm.js" {
  import Phaser = require("phaser");
  export = Phaser;
}

interface ImportMetaEnv {
  readonly LUDICORD_DISCORD_CLIENT_ID?: string;
  readonly PROD: boolean;
}
interface ImportMeta { readonly env: ImportMetaEnv; }
