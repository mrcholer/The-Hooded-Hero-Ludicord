# The-Hooded-Hero

<img align="left" src="https://res.cloudinary.com/dgxqotorm/image/upload/v1721368753/logo2_gmrprh.png" width=100px>

https://the-hooded-hero.vercel.app/ is A 2D platformer game where users can choose to go through a story mode with several stages or play with friends online to see who can reach the end of the level the fastest!

<br/>

-   Note: This is the latest version of the app. My older version of the app can be found here in this repo: https://github.com/Tandid/The-Hooded-Hero

## Tech Stack

Typescript, Next, PhaserJS, and WebSockets

## How to Run Locally

-   Install all dependencies using `npm install`

-   Create a build file using`npm run build`

-   Start the production environment using `npm start`

-   Start the server simultaneously by opening a separate terminal and running `npm run server`

## Initial Screen

-   Main Menu Screen where users can choose between Story Mode, Multiplayer or Level Selection. Top right paper button leads to contacts, whereas the book icon on the bottom show controls and settings for adjusting volume.

<p align="center">
  <img src="https://res.cloudinary.com/dgxqotorm/image/upload/v1721349038/mainMenu_yrgszo.png" alt="Main Menu" width="350">
  <img src="https://res.cloudinary.com/dgxqotorm/image/upload/v1721349038/controls_a3wuke.png" alt="Controls" width="350">
</p>

## Story Mode

-   Players go through a story mode with three levels and a final boss at the end. These levels consist of physics engines which involve raycasting, collisions, as well as the use of hitboxes and projectiles.

-   Player HUD: The top left corner displays character information such as their health and number of lives. The top right corner displays the number of coins collected throughout the level.

-   Player: The player is controlled with keybindings and collides with platforms, enemies, and projectiles. When hit, the player receives damage and moves accordingly. When health reaches zero or player falls off the map, the player respawns after three seconds. Player respawns at nearest checkpoint.

-   Enemies: There are many enemy variants including a boss. The enemies patrol a specific area and avoid falling off of platforms through raycasting. However, the enemies also have a detection radius if a player gets too close, triggering them to pursue the player. That said, the enemies are somewhat intelligent.

-   Buttons: Book Icon used to view controls. Restart Icon used to reset the scene and start the game again from scratch. Home button allows player to return to Menu. Settings Icon used to adjust volume or mute sounds.

### Level 1 - Forest

-   Enemy Variants: Bee, Spider, Slime

<p align="center">
<img src="https://res.cloudinary.com/dgxqotorm/image/upload/v1721350170/level_1_ak5lmy.png" alt="Level 1" width="600">
</p>

-   Level Design (Created using Tiled)

<p align="center">
<img src="https://res.cloudinary.com/dgxqotorm/image/upload/v1721367254/Screenshot_2024-07-19_at_1.32.08_AM_zkboo9.png" alt="Level 1" width="1000">
</p>

### Level 2 - Cave

-   Enemy Variants: Bat, Skeleton Archer, Skeleton Shield, Skeleton Spear

<p align="center">
<img src="https://res.cloudinary.com/dgxqotorm/image/upload/v1721350171/level_2_txs0f0.png" alt="Level 2" width="600">
</p>

-   Level Design (Created using Tiled)

<p align="center">
<img src="https://res.cloudinary.com/dgxqotorm/image/upload/v1721367620/Screenshot_2024-07-19_at_1.37.50_AM_y5zhv6.png" alt="Level 1" width="1000">
</p>

### Level 3 - Cave & Boss Battle

-   Enemy Variants: Skeleton Mage, Crossbow, Skeleton Boss

<p align="center">
<img src="https://res.cloudinary.com/dgxqotorm/image/upload/v1721350172/level_3_domw7a.png" alt="Level 3" width="600">
</p>

-   Level Design (Created using Tiled)

<p align="center">
<img src="https://res.cloudinary.com/dgxqotorm/image/upload/v1721367619/Screenshot_2024-07-19_at_1.38.32_AM_svuxkf.png" alt="Level 1" width="1000">
</p>

## Multiplayer

### 1. Hero Select

-   Player chooses between four different player sprites to use as their online character.

<p align="center">
<img src="https://res.cloudinary.com/dgxqotorm/image/upload/v1721349038/heroSelect_ksb6de.png" alt="Hero Select" width="600">
</p>

### 2. Room Select

-   Player has the option to create a room, join a custom room, or join a predefined room.
-   Create New Room leads to the Waiting Lobby where a code is generated for others to join.
-   Join Custom Room leads to a screen that asks to provide a password to a custom room.
-   Server Rooms are predefines rooms that anyone can join regardless of password.
-   When a game is in session or is full, the room will be closed.

<p align="center">
<img src="https://res.cloudinary.com/dgxqotorm/image/upload/v1721349039/roomSelect_ibkhcs.png" alt="RoomSelect" width="600">
</p>

### 3. Waiting Lobby

-   If player created a new room, a code will be generated and displayed at the bottom left for other players to join with.
-   If at least 2 players are in the Waiting Lobby, the Play button will appear and anyone can start the game.

<p align="center">
<img src="https://res.cloudinary.com/dgxqotorm/image/upload/v1721349039/waitingRoom_t9kh4e.png" alt="WaitingRoom" width="600">
</p>

-   There may be up to 4 players per lobby.

<p align="center">
<img src="https://res.cloudinary.com/dgxqotorm/image/upload/v1721349041/multiplayer_qqe9ra.png" alt="Multiplayer" width="600">
</p>

### 4. Race to the Finish!

-   Once everyone is in, all players race to reach the finish line!
-   Players have infinite health and unlimited respawns, but they can still get hit and fall off the map.

<p align="center">
<img src="https://res.cloudinary.com/dgxqotorm/image/upload/v1721350174/online_nlffyw.png" alt="Online" width="600">
</p>

-   Level Design (Created using Tiled)

<p align="center">
<img src="https://res.cloudinary.com/dgxqotorm/image/upload/v1721367621/Screenshot_2024-07-19_at_1.38.50_AM_zyugcp.png" alt="Online" width="1000">
</p>

