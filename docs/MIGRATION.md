# Migration map

## Preserved

Phaser remains the gameplay engine: three story stages, forest/cave maps, boss encounter, enemy AI and combat, hitboxes/projectiles, collectables, checkpoints, lives, health and coins. Original art and recordings remain. All 24 WAV recordings were converted to Vorbis OGG, reducing audio transfer from about 124 MB to 13.6 MB. WAV sources remain recoverable from upstream Git history.

## Replaced and removed

| Original | Ludicord edition |
| --- | --- |
| Next.js page / React bootstrap | One Activity root and game embed |
| Express + Socket.IO server | Authenticated `app/ws/adventure/socket.ts` |
| Manual multiplayer username | Framework-authenticated Discord identity |
| Public/custom rooms and passwords | Party keyed by trusted application + Activity instance |
| Hero/lobby/rankings Phaser screens | React lobby and server-generated results |
| Browser winner/time | Server-observed position, elapsed time and order |

Original MongoDB signup stored user accounts, not story progression. Signup, Mongoose and the unused account endpoint were removed. Level/audio preferences use local storage. Old room-code UI and rexUI integration were removed after their replacements existed.

## Refactored

React receives low-frequency party snapshots. Movement goes directly through the adapter to Phaser; local movement is responsive, remote movement interpolated. Enemies and health are locally simulated as in the original race. This is not a co-op campaign or a server physics rewrite.

The engine owns hero/readiness, leader, load barrier, timestamp, finish order, connection status, accepted positions and reached checkpoints. Rules enforce four party members, two-player starts, payload/byte rates and movement bounds. Late arrivals wait. Exit withdraws without logging out of Discord; rematch resets readiness, sequences, positions, loading flags, timing and finishes while retaining the party.

Stable scalar launch fields prevent React progress updates from recreating Phaser. Animation initialization is scoped to each AnimationManager. Update/global event subscriptions, audio and scene timers clean up on shutdown. Blur resets held inputs. FIT scaling avoids stretching. Asset failures produce a visible loading error.

Keyboard and controller input now share one lifecycle-managed adapter. Both gameplay modes accept WASD, ZQSD and arrows, with R for the bow to avoid Q's AZERTY conflict. Standard Xbox / Sony button positions, analog deadzones, D-pad movement, configurable buttons/axes and saved preferences use the browser Gamepad API. React menus and the original Phaser dialogs/stage selector support navigation without a mouse. Story pause stops its scene; the race menu stops local movement while the race continues. Focus loss, device changes and screen changes clear or suppress stale input.

## Baseline and verification

The original application was run before replacement; its rexUI setup failed at startup in that environment. The migration removes that integration and fixes explicit Phaser ESM imports while retaining the gameplay. The upstream README is archived for reference.

Automated tests cover readiness/authority, loading cancellation, capacity/late joins, checkpoint restrictions, finish validation/order, leadership, reconnect and rematch, plus keyboard layouts, synthetic standard/custom pads, drift filtering, disconnects, queued press edges and menu repeats. The transport test opens real authenticated Ludicord WebSockets on a local ephemeral server and verifies party isolation, heroes, readiness, countdown, movement identity, reconnect state and rematch. Physical controller verification remains separate from synthetic input tests.

Browser checks cover the real race scene with a labeled stationary DEV peer, the three story stage entries, the original level selector and successive game launches. Type, route, hooks lint, dependency audit and production build checks run separately.

**Real Discord frame validation remains required.** Fake sessions do not prove real SDK OAuth, iframe cookies, two rendered Discord clients, voice context, final URL mapping or a complete boss fight. Configure a real Discord application and exercise the README flow before marking this migration fully Discord-validated.

State is transient and belongs to one server process. Persistent achievements, mobile-touch gameplay, spectator mode, co-op campaign and cross-replica state are outside this migration.
