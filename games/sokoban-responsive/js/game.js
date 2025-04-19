 // constants with game elements
 var EMPTY = 0;
 var WALL = 1;
 var SPOT = 2;
 var CRATE = 3;
 var PLAYER = 4;
 // according to these values, the crate on the spot = CRATE+SPOT = 5 and the player on the spot = PLAYER+SPOT = 6
 // sokoban level, using hardcoded values rather than constants to save time, shame on me :) 
 var level = [
   [1, 1, 1, 1, 1, 1, 1, 1],
   [1, 0, 2, 0, 0, 0, 0, 1],
   [1, 0, 0, 1, 0, 0, 0, 1],
   [1, 0, 0, 2, 4, 4, 0, 1],
   [1, 0, 0, 0, 0, 0, 0, 1],
   [1, 0, 0, 0, 0, 0, 0, 1],
   [1, 0, 0, 0, 0, 0, 0, 1],
   [1, 0, 0, 0, 0, 1, 1, 1],
   [1, 1, 1, 1, 1, 1, 1, 1]
 ];
 // array which will keep track of undos
 var undoArray = [];
 // array which will contain all crates
 var crates = [];
 // size of a tile, in pixels
 var tileSize = 40; 
 // the players! Yeah!
 var players = [];

 var activePlayerIndex = 1;

 // is the player moving?
 var playerMoving = false;
 // variables used to detect and manage swipes
 var startX;
 var startY;
 var endX;
 var endY;
 // texts to display game name and level
 var levelText;
 var titleText;
 // Variables used to create groups. The fist group is called fixedGroup, it will contain
 // all non-moveable elements (everything but crates and player).
 // Then we add movingGroup which will contain moveable elements (crates and player)
 var fixedGroup;
 var movingGroup;


window.onload = function() {
  // game definition, 100% of browser window dimension
  var game = new Phaser.Game("100%", "100%", Phaser.CANVAS, "", {
    preload: onPreload,
    create: onCreate,
    resize: onResize // <- this will be called each time the game is resized
  });
  // first function to be called, when the game preloads I am loading the sprite sheet with all game tiles
  function onPreload() {
    game.load.spritesheet("tiles", "assets/tiles.png", 40, 40);
  }
  // function to scale up the game to full screen
  function goFullScreen() {
    // setting a background color
    game.stage.backgroundColor = "#555555";
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    // using RESIZE scale mode
    game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
    game.scale.setScreenSize(true);
  }
  // function to be called when the game has been created
  function onCreate() {
    // waiting for a key pressed
    game.input.keyboard.addCallbacks(this, onDown);
    // going full screen with the function defined at line 32
    goFullScreen();
    // adding the two groups to the game
    fixedGroup = game.add.group();
    movingGroup = game.add.group();
    // drawing the level 
    drawLevel();
    // once the level has been created, we wait for the player to touch or click, then we call
    // beginSwipe function
    game.input.onDown.add(beginSwipe, this);
    // placing a text on the horizontal center and bottom of the stage
    levelText = game.add.text(game.width / 2, game.height, "Level 1", {
      font: "bold 24px Arial",
      fill: "#ffffff"
    });
    // changing anchor so I don't have to calculate an offset based on text height
    levelText.anchor.y = 1;
    // placing a text on the horizontal center and top of the stage
    titleText = game.add.text(game.width / 2, 0, "BWBan", {
      font: "bold 24px Arial",
      fill: "#ffffff"
    });
    // normall, onResize is called each time the browser is resized, anyway I am calling it the first time
    // to place all responsive elements in their right positions.
    onResize();
  }

  function onResize() {
    // this function is called each time the browser is resized, and re-positions
    // game elements to keep them in their right position according to game size
    levelText.x = Math.round((game.width - levelText.width) / 2);
    levelText.y = game.height;
    titleText.x = Math.round((game.width - titleText.width) / 2);
    fixedGroup.x = Math.round((game.width - 320) / 2);
    fixedGroup.y = Math.round((game.height - 320) / 2);
    movingGroup.x = Math.round((game.width - 320) / 2);
    movingGroup.y = Math.round((game.height - 320) / 2);
  }

  function drawLevel() {
    // empty crates array. Don't use crates = [] or it could mess with pointers
    crates.length = 0;
    // variable used for tile creation
    var tile
      // looping trough all level rows
    for (var i = 0; i < level.length; i++) {
      // creation of 2nd dimension of crates array
      crates[i] = [];
      // looping through all level columns
      for (var j = 0; j < level[i].length; j++) {
        // by default, there are no crates at current level position, so we set to null its
        // array entry
        crates[i][j] = null;
        // what do we have at row j, col i?
        switch (level[i][j]) {
          case PLAYER:
          case PLAYER + SPOT:
            // player creation
            const player = game.add.sprite(40 * j, 40 * i, "tiles");
            // assigning the player the proper frame
            player.frame = level[i][j];
            // creation of two custom attributes to store player x and y position
            player.posX = j;
            player.posY = i;
            // adding the player to movingGroup
            movingGroup.add(player);
            // since the player is on the floor, I am also creating the floor tile
            tile = game.add.sprite(40 * j, 40 * i, "tiles");
            tile.frame = level[i][j] - PLAYER;
            // floor does not move so I am adding it to fixedGroup
            fixedGroup.add(tile);

            players.push(player);


            break;
          case CRATE:
          case CRATE + SPOT:
            // crate creation, both as a sprite and as a crates array item
            crates[i][j] = game.add.sprite(40 * j, 40 * i, "tiles");
            // assigning the crate the proper frame
            crates[i][j].frame = level[i][j];
            // adding the crate to movingGroup
            movingGroup.add(crates[i][j]);
            // since the create is on the floor, I am also creating the floor tile
            tile = game.add.sprite(40 * j, 40 * i, "tiles");
            tile.frame = level[i][j] - CRATE;
            // floor does not move so I am adding it to fixedGroup
            fixedGroup.add(tile);
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
  // function to be executed once a key is down
  function onDown(e) {
    // if the player is not moving...
    if (!playerMoving) {
      switch (e.keyCode) {
        // left
        case 37:
          move(-1, 0);
          break;
          // up
        case 38:
          move(0, -1);
          break;
          // right
        case 39:
          move(1, 0);
          break;
          // down
        case 40:
          move(0, 1);
          break;
          // undo
        case 85:
          // if there's something to undo...
          if (undoArray.length > 0) {
            // then undo! and remove the latest move from undoArray
            var undoLevel = undoArray.pop();
            fixedGroup.destroy();
            movingGroup.destroy();
            level = [];
            level = copyArray(undoLevel);
            drawLevel();
          }
          break;
      }
    }
  }
  // when the player begins to swipe we only save mouse/finger coordinates, remove the touch/click
  // input listener and add a new listener to be fired when the mouse/finger has been released,
  // then we call endSwipe function
  function beginSwipe() {
    startX = game.input.worldX;
    startY = game.input.worldY;

    console.log(game.input.worldX, game.input.worldY);
    console.log(players[activePlayerIndex].world.x, players[activePlayerIndex].world.y);

    // swicth to touched player, if any
    const player = getPlayerAtCoordinates(startX, startY);
    if (player) {
      activePlayerIndex = players.indexOf(player);
      console.log("activePlayerIndex", activePlayerIndex);
    }

    // check if input pointer is on the player
    // if x is between player.x and player.x + tileSize


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

    // if no player is found, try withv some more margin ( range - tileSize until tilezize*2 )
    for (let i = 0; i < players.length; i++) {
      if (x >= players[i].world.x - tileSize && x <= players[i].world.x + tileSize * 2 &&
        y >= players[i].world.y - tileSize && y <= players[i].world.y + tileSize * 2) {
        return players[i];
      }
    }

    return null;
  }


  // function to be called when the player releases the mouse/finger
  function endSwipe() {
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
        moveUntilBlocked(-1, 0);
      }
      // moving right, calling move function with horizontal and vertical tiles to move as arguments
      else {
        moveUntilBlocked(1, 0);
      }
    }
    // in order to have a vertical swipe, we need that y distance is at least twice the x distance
    // and the amount of vertical distance is at least 10 pixels
    if (Math.abs(distY) > Math.abs(distX) * 2 && Math.abs(distY) > 10) {
      // moving up, calling move function with horizontal and vertical tiles to move as arguments
      if (distY > 0) {
        moveUntilBlocked(0, -1);
      }
      // moving down, calling move function with horizontal and vertical tiles to move as arguments
      else {
        moveUntilBlocked(0, 1);
      }
    }
    // stop listening for the player to release finger/mouse, let's start listening for the player to click/touch
    game.input.onDown.add(beginSwipe);
    game.input.onUp.remove(endSwipe);
  }
  // function to move the player
  function move(deltaX, deltaY) {
    // if destination tile is walkable...
    if (isWalkable(players[activePlayerIndex].posX + deltaX, players[activePlayerIndex].posY + deltaY)) {
      // push current situation in the undo array
      undoArray.push(copyArray(level));
      // then move the player and exit the function
      movePlayer(deltaX, deltaY);
      return;
    }
  }

  function moveUntilBlocked(deltaX, deltaY) {
    let xMult = 1;
    let yMult = 1;

    while (isWalkable(players[activePlayerIndex].posX + deltaX * xMult, players[activePlayerIndex].posY + deltaY * yMult)) {
      xMult++;
      yMult++;
    }

    move(deltaX * (xMult - 1), deltaY * (yMult - 1));

  }


  // a tile is walkable when it's an empty tile or a spot tile
  function isWalkable(posX, posY) {
    return level[posY][posX] == EMPTY || level[posY][posX] == SPOT;
  }
  // a tile is a crate when it's a... guess what? crate, or it's a crate on its spot
  function isCrate(posX, posY) {
    return level[posY][posX] == CRATE || level[posY][posX] == CRATE + SPOT;
  }
  // function to move the player
  function movePlayer(deltaX, deltaY) {
    // now the player is moving
    playerMoving = true;
    // moving with a 1/10s tween
    var playerTween = game.add.tween(players[activePlayerIndex]);
    playerTween.to({
      x: players[activePlayerIndex].x + deltaX * tileSize,
      y: players[activePlayerIndex].y + deltaY * tileSize
    }, 100, Phaser.Easing.Linear.None, true);
    // setting a tween callback 
    playerTween.onComplete.add(function() {
      // now the player is not moving anymore
      playerMoving = false;
    }, this);
    // updating player old position in level array   
    level[players[activePlayerIndex].posY][players[activePlayerIndex].posX] -= PLAYER;
    // updating player custom posX and posY attributes
    players[activePlayerIndex].posX += deltaX;
    players[activePlayerIndex].posY += deltaY;
    // updating player new position in level array 
    level[players[activePlayerIndex].posY][players[activePlayerIndex].posX] += PLAYER;
    // changing player frame accordingly  
    players[activePlayerIndex].frame = level[players[activePlayerIndex].posY][players[activePlayerIndex].posX];
  }

    // need a recursive function to copy arrays, no need to reinvent the wheel so I got it here
  // http://stackoverflow.com/questions/10941695/copy-an-arbitrary-n-dimensional-array-in-javascript 
  function copyArray(a) {
    var newArray = a.slice(0);
    for (var i = newArray.length; i > 0; i--) {
      if (newArray[i] instanceof Array) {
        newArray[i] = copyArray(newArray[i]);
      }
    }
    return newArray;
  }
}