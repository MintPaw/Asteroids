var MenuScene = {
	key: "menu",
	create: menuCreate,
	update: menuUpdate
};

var GameScene = {
	key: "game",
	preload: preload,
	create: create,
	update: update
};

var config = {
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	physics: {
		default: "arcade",
		arcade: {
			gravity: { y: 0 }
		}
	},
	scene: [ GameScene, MenuScene ]
};

var abs = Math.abs;
var Point = Phaser.Geom.Point;
var log = console.log;
var phaser = new Phaser.Game(config);

var game = {
	player: null,
	asteroids: [],
	bullets: [],
	bulletsGroup: null,

	timeTillNextShot: 0,

	keyW: null,
	keyS: null,
	keyA: null,
	keyD: null,
	keyUp: null,
	keyDown: null,
	keyLeft: null,
	keyRight: null,
	keySpace: null,
	key1: null,
	key2: null,
	key3: null,
	key4: null,
	key5: null,

	mouseX: 0,
	mouseY: 0,
	mouseDown: false,
	mouseJustDown: false,
	mouseJustUp: false,

	level: 0,
	inGame: false
};

var scene = null;

function preload() {
	scene = this;

	scene.load.atlas("assets", "assets/sprites.png", "assets/sprites.json");
}

function create() {
	{ /// Level reloader
		if (game.level == 0) {
			switchLevel(1);
			return;
		}
	}

	{ /// Add remove to array
		Array.prototype.remove = function(val, all) {
			var i, removedItems = [];
			if (all) {
				for(i = this.length; i--;){
					if (this[i] === val) removedItems.push(this.splice(i, 1));
				}
			}
			else {  //same as before...
				i = this.indexOf(val);
				if(i>-1) removedItems = this.splice(i, 1);
			}
			return removedItems;
		};
	}

	game.keyW = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
	game.keyS = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
	game.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
	game.keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
	game.keyUp = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
	game.keyDown = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
	game.keyLeft = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
	game.keyRight = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
	game.keySpace = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
	game.key1 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
	game.key2 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
	game.key3 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
	game.key4 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
	game.key5 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE);

	scene.input.on("pointermove", function (pointer) {
		game.mouseX = pointer.x;
		game.mouseY = pointer.y;
	}, this);

	scene.input.on("pointerdown", function (e) {
		game.mouseDown = true;
		game.mouseJustDown = true;
	}, this);

	scene.input.on("pointerup", function (e) {
		game.mouseDown = false;
		game.mouseJustUp = true;
	}, this);

	{ /// Create Player
		var spr = scene.physics.add.image(0, 0, "assets", "sprites/player/player");
		spr.setDrag(5, 5);
		spr.setMaxVelocity(300, 300);

		game.player = spr;
	}

	game.bulletsGroup = scene.physics.add.group();
	game.asteroidGroup = scene.physics.add.group();
	scene.physics.world.addOverlap(game.bulletsGroup, game.asteroidGroup, bulletVAsteroid);

	{ /// Setup Level
		var level = game.level;

		if (level == 1) {
			createAsteroid(300, 400);
		} else if (level == 2) {
			createAsteroid(300, 400);
			createAsteroid(500, 400);
		} else if (level == 3) {
			createAsteroid(300, 400);
			createAsteroid(400, 400);
			createAsteroid(500, 400);
		} else if (level == 4) {
			createAsteroid(200, 400);
			createAsteroid(300, 400);
			createAsteroid(400, 400);
			createAsteroid(500, 400);
		} else if (level == 5) {
			createAsteroid(100, 400);
			createAsteroid(200, 400);
			createAsteroid(300, 400);
			createAsteroid(400, 400);
			createAsteroid(500, 400);
		}
	}

	game.inGame = true;
}

function update(delta) {
	if (!game.inGame) return;
	var left = false;
	var right = false;
	var up = false;
	var down = false;
	var shoot = false;
	var levelToSwitchTo = 0;

	{ /// Update inputs
		if (game.keyW.isDown || game.keyUp.isDown) up = true;
		if (game.keyS.isDown || game.keyDown.isDown) down = true;
		if (game.keyA.isDown || game.keyLeft.isDown) left = true;
		if (game.keyD.isDown || game.keyRight.isDown) right = true;
		if (game.keySpace.isDown || game.mouseDown) shoot = true;
		if (game.key1.isDown) levelToSwitchTo = 1;
		if (game.key2.isDown) levelToSwitchTo = 2;
		if (game.key3.isDown) levelToSwitchTo = 3;
		if (game.key4.isDown) levelToSwitchTo = 4;
		if (game.key5.isDown) levelToSwitchTo = 5;
	}

	{ /// Might need to switch levels
		if (levelToSwitchTo != 0) {
			switchLevel(levelToSwitchTo);
			return;
		}
	}

	var speed = 100;
	game.player.setAcceleration(0, 0);
	if (left) game.player.body.acceleration.x -= speed;
	if (right) game.player.body.acceleration.x += speed;
	if (up) game.player.body.acceleration.y -= speed;
	if (down) game.player.body.acceleration.y += speed;

	if (game.timeTillNextShot > 0) game.timeTillNextShot -= 1/60;

	if (shoot && game.timeTillNextShot <= 0) {
		game.timeTillNextShot = 1;

		var spr = game.bulletsGroup.create(0, 0, "assets", "sprites/bullets/bullet1");
		var angle = (game.player.angle-90) * Math.PI/180;

		spr.x = game.player.x + Math.cos(angle) * (game.player.width/2);
		spr.y = game.player.y + Math.sin(angle) * (game.player.height/2);

		var speed = 200;
		spr.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
		game.bullets.push(spr);
	}

	var angle = Math.atan2(game.mouseY - game.player.y, game.mouseX - game.player.x);
	angle = angle * (180/Math.PI);
	game.player.angle = angle + 90;

	{ /// Update sceeen looping
		var loopingSprites = []
		loopingSprites.push(...game.asteroids);
		loopingSprites.push(...game.bullets);
		loopingSprites.push(game.player);

		for (spr of loopingSprites) {
			if (spr.x < 0) spr.x = phaser.canvas.width;
			if (spr.y < 0) spr.y = phaser.canvas.height;
			if (spr.x > phaser.canvas.width) spr.x = 0;
			if (spr.y > phaser.canvas.height) spr.y = 0;
		}
	}

	/// Update bullets
	for (spr of game.bullets) {
		spr.alpha -= 0.005;
		if (spr.alpha <= 0) {
			game.bullets.remove(spr);
			spr.destroy();
		}
	}

	{ /// Reset inputs
		game.mouseJustDown = false;
		game.mouseJustUp = false;
	}
}

function switchLevel(newLevel) {
	game.level = newLevel;
	phaser.scene.stop("game");
	phaser.scene.start("game");
}

function bulletVAsteroid(bullet, asteroid) {
	bullet.destroy();

	if (asteroid.scaleX <= 0.1) {
		asteroid.destroy();
	} else {
		asteroid.scaleX -= 0.3;
		asteroid.scaleY -= 0.3;
	}
}

function rnd(min, max) {
	return Math.random() * (max - min) + min;
}

function createAsteroid(x, y) {
	var spr = game.asteroidGroup.create(0, 0, "assets", "sprites/asteroids/asteroid1");
	spr.setVelocity(rnd(-50, 50), rnd(-50, 50));
	spr.x = x;
	spr.y = y;

	game.asteroids.push(spr);
	return spr;
}
