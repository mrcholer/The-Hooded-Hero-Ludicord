import * as Phaser from "phaser/dist/phaser.esm.js";

class EventEmitter extends Phaser.Events.EventEmitter {
    constructor() {
        super();
    }
}

export default new EventEmitter();
