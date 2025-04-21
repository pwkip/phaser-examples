// constants with game elements
var EMPTY = 0;
var WALL = 1;
var SPOT = 2;
var CRATE = 3;
var PLAYER = 4;
var TWO_PLAYERS = 8;

var level = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 3, 0, 0, 3, 0, 0, 1],
  [1, 3, 4, 0, 0, 0, 0, 1],
  [1, 3, 0, 0, 3, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1]
];

var tileSize = 40;
var players = [];
var activePlayerIndex = 1;
var crates = [];

// variables used to detect and manage swipes
var startX;
var startY;
var endX;
var endY;

var levelText;
var titleText;
var fixedGroup;
var movingGroup;

// game definition, 100% of browser window dimension
var game = new Phaser.Game("100%", "100%", Phaser.CANVAS, "", {
  preload: onPreload,
  create: onCreate,
  resize: onResize // <- this will be called each time the game is resized
});

function onPreload() {
  game.load.spritesheet("tiles", "assets/tiles.png", 40, 40);
}

function goFullScreen() {
  // setting a background color
  game.stage.backgroundColor = "#333";
  game.scale.pageAlignHorizontally = true;
  game.scale.pageAlignVertically = true;
  // using RESIZE scale mode
  game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
  game.scale.setScreenSize(true);
}

function onCreate() {
  goFullScreen();
  fixedGroup = game.add.group();
  movingGroup = game.add.group();
  drawLevel();
  game.input.onDown.add(beginSwipe, this);

  levelText = game.add.text(game.width / 2, game.height, "Level 1", {
    font: "bold 24px Arial",
    fill: "#ffffff"
  });
  levelText.anchor.y = 1;
  titleText = game.add.text(game.width / 2, 0, "Balls", {
    font: "bold 24px Arial",
    fill: "#f0f0f0"
  });

  onResize();
}

function onResize() {
  levelText.x = Math.round((game.width - levelText.width) / 2);
  levelText.y = game.height;
  titleText.x = Math.round((game.width - titleText.width) / 2);
  fixedGroup.x = Math.round((game.width - 320) / 2);
  fixedGroup.y = Math.round((game.height - 320) / 2);
  movingGroup.x = Math.round((game.width - 320) / 2);
  movingGroup.y = Math.round((game.height - 320) / 2);
}

function drawLevel() {
  var tile;

  for (var i = 0; i < level.length; i++) {
    for (var j = 0; j < level[i].length; j++) {

      // create floor tile and add it to fixedGroup
      tile = game.add.sprite(40 * j, 40 * i, "tiles");
      tile.frame = EMPTY;
      fixedGroup.add(tile);

      // what do we have at row j, col i?
      switch (level[i][j]) {
        case PLAYER:
        case PLAYER + SPOT:
          addPlayer(j, i);
          break;
        case CRATE:
        case CRATE + SPOT:
          // create crate tile and add it to movingGroup
          tile = game.add.sprite(40 * j, 40 * i, "tiles");
          tile.frame = CRATE;
          movingGroup.add(tile);
          tile.posX = j;
          tile.posY = i;
          crates.push(tile);
          break;
        default:
          // creation of a simple tile
          tile = game.add.sprite(40 * j, 40 * i, "tiles");
          tile.frame = level[i][j];
          fixedGroup.add(tile);
      }
    }
  }
}

function beginSwipe() {
  startX = game.input.worldX;
  startY = game.input.worldY;

  // switch to touched player, if any
  const player = getPlayerAtCoordinates(startX, startY);
  if (player) {
    activePlayerIndex = players.indexOf(player);
    console.log("activePlayerIndex", activePlayerIndex);
  }

  game.input.onDown.remove(beginSwipe);
  game.input.onUp.add(endSwipe);

}

function getPlayerAtCoordinates(x, y) {
  for (let i = 0; i < players.length; i++) {
    if (x >= players[i].world.x && x <= players[i].world.x + tileSize &&
      y >= players[i].world.y && y <= players[i].world.y + tileSize) {
      return players[i];
    }
  }

  // if no player is found, try with some more margin ( range - tileSize until tilezize*2 )
  for (let i = 0; i < players.length; i++) {
    if (x >= players[i].world.x - tileSize && x <= players[i].world.x + tileSize * 2 &&
      y >= players[i].world.y - tileSize && y <= players[i].world.y + tileSize * 2) {
      return players[i];
    }
  }

  return null;
}

function getPlayerAtLevelCoordinates(posX, posY) {
  for (let i = 0; i < players.length; i++) {
    if (players[i].posX === posX && players[i].posY === posY) {
      return players[i];
    }
  }
  return null;
}


// function to be called when the player releases the mouse/finger
function endSwipe() {

  const player = players[activePlayerIndex];

  // saving mouse/finger coordinates
  endX = game.input.worldX;
  endY = game.input.worldY;
  // determining x and y distance travelled by mouse/finger from the start
  // of the swipe until the end
  var distX = startX - endX;
  var distY = startY - endY;
  // in order to have an horizontal swipe, we need that x distance is at least twice the y distance
  // and the amount of horizontal distance is at least 10 pixels
  if (Math.abs(distX) > Math.abs(distY) * 2 && Math.abs(distX) > 10) {
    // moving left, calling move function with horizontal and vertical tiles to move as arguments
    if (distX > 0) {
      player.vectorX = -1;
      player.vectorY = 0;
      moveUntilBlocked(player);
    }
    // moving right, calling move function with horizontal and vertical tiles to move as arguments
    else {
      player.vectorX = 1;
      player.vectorY = 0;
      moveUntilBlocked(player);
    }
  }
  // in order to have a vertical swipe, we need that y distance is at least twice the x distance
  // and the amount of vertical distance is at least 10 pixels
  if (Math.abs(distY) > Math.abs(distX) * 2 && Math.abs(distY) > 10) {
    // moving up, calling move function with horizontal and vertical tiles to move as arguments
    if (distY > 0) {
      player.vectorX = 0;
      player.vectorY = -1;
      moveUntilBlocked(player);
    }
    // moving down, calling move function with horizontal and vertical tiles to move as arguments
    else {
      player.vectorX = 0;
      player.vectorY = 1;
      moveUntilBlocked(player);
    }
  }
  // stop listening for the player to release finger/mouse, let's start listening for the player to click/touch
  game.input.onDown.add(beginSwipe);
  game.input.onUp.remove(endSwipe);
}

function addPlayer(posX, posY) {

  // player creation
  const player = game.add.sprite(40 * posX, 40 * posY, "tiles");
  // assigning the player the proper frame
  player.frame = 4;
  // creation of two custom attributes to store player x and y position
  player.posX = posX;
  player.posY = posY;

  level[posY][posX] = PLAYER;

  // adding the player to movingGroup
  movingGroup.add(player);
  players.push(player);
  return player;
}

function removeCrate(posX, posY) {
  // remove the crate from the level array
  movingGroup.remove(level[posY][posX]);
  level[posY][posX] = EMPTY;
  crateSprite = crates.find(crate => crate.posX === posX && crate.posY === posY);
  if (crateSprite) {
    crateSprite.destroy();
    crates.splice(crates.indexOf(crateSprite), 1);
  }
}

function deletePlayer(player) {
  console.log("deletePlayer", player);
  // remove the player from the level array
  level[player.posY][player.posX] = 0;
  movingGroup.remove(player);
  player.destroy();
  players.splice(players.indexOf(player), 1);
  activePlayerIndex = players.length - 1;
}

function moveUntilBlocked(player) {

  deltaX = player.vectorX;
  deltaY = player.vectorY;

  if (
    isWalkable(player.posX + deltaX, player.posY + deltaY) && 
    !isCrate(player.posX, player.posY)
  ) {
    player.vectorX = deltaX;
    player.vectorY = deltaY;
    movePlayer(player);
  } else {
    player.vectorX = 0;
    player.vectorY = 0;
  }

}


// a tile is walkable when it's an empty tile or a spot tile
function isWalkable(posX, posY) {
  const player = getPlayerAtLevelCoordinates(posX, posY);
  return level[posY][posX] == EMPTY || level[posY][posX] == SPOT || level[posY][posX] == CRATE;
  
}

// a tile is a crate when it's a... guess what? crate, or it's a crate on its spot
function isCrate(posX, posY) {
  return level[posY][posX] == CRATE || level[posY][posX] == CRATE + PLAYER;
}


// function to move the player
function movePlayer(player) {
  deltaX = player.vectorX;
  deltaY = player.vectorY;
  // if player is already moving, return
  if (player.isMoving) {
    return;
  }
  player.isMoving = true;
  // moving with a 1/10s tween
  var playerTween = game.add.tween(player);
  playerTween.to({
    x: player.x + deltaX * tileSize,
    y: player.y + deltaY * tileSize
  }, 50, Phaser.Easing.Linear.None, true);

  // setting a tween callback 
  playerTween.onComplete.add(function () {

    player.isMoving = false;

    // now the player is not moving anymore

    if (isCrate(player.posX, player.posY)) {
      // if destination tile is a crate, delete the crate, and split the player in 2, each of them move in a perpendicular direction
      removeCrate(player.posX, player.posY);

      // case: moving up: y = -1, x = 0
      y = player.vectorX * player.vectorX; // 0
      x = player.vectorY * player.vectorY; // 1

      p1X = -1 * (x / x || 0);
      p1Y = -1 * (y / y || 0);
      p2X = x / x || 0;
      p2Y = y / y || 0;

      // remove the original player
      deletePlayer(player);

      const p1 = addPlayer(player.posX, player.posY + 0);
      p1.vectorX = p1X;
      p1.vectorY = p1Y;
      const p2 = addPlayer(player.posX, player.posY + 0);
      p2.vectorX = p2X;
      p2.vectorY = p2Y;

      moveUntilBlocked(p2);
      moveUntilBlocked(p1);

    } else {
      moveUntilBlocked(player);

    }


  }, this);

  // updating player old position in level array   
  level[player.posY][player.posX] = EMPTY;
  // updating player custom posX and posY attributes
  player.posX += deltaX;
  player.posY += deltaY;
  // updating player new position in level array 
  level[player.posY][player.posX] += PLAYER;
  // changing player frame accordingly  
  player.frame = level[player.posY][player.posX];
}

function copyArray(a) {
  var newArray = a.slice(0);
  for (var i = newArray.length; i > 0; i--) {
    if (newArray[i] instanceof Array) {
      newArray[i] = copyArray(newArray[i]);
    }
  }
  return newArray;
}