var config = {
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 200 }
		}
	},
	scene: {
		preload: preload,
		create: create,
		update: update
	}
};

var abs = Math.abs;
var Point = Phaser.Geom.Point;
var log = console.log;
var phaser = new Phaser.Game(config);

var game = {
	playerSprite: null,
	playerVelo: new Point(),
	playerAccel: new Point(),
	playerMaxVelo: new Point(),
	playerDrag: 0.01,

	asteroids: []
};

var scene = null;

function preload() {
}

function create() {
	scene = this;

	{ /// Create Player
		var spr = scene.add.graphics(0, 0);
		spr.fillStyle(0x0000FF, 1);
		spr.fillCircle(0, 0, 30);

		game.playerSprite = spr;
		game.playerMaxVelo = new Point(5, 5);
	}

	createAsteroid(300, 400);
	createAsteroid(500, 400);
}

function update() {
	var keyW = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
	var keyS = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
	var keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
	var keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
	var keyUp = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
	var keyDown = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
	var keyLeft = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
	var keyRight = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

	var left = false;
	var right = false;
	var up = false;
	var down = false;
	if (keyW.isDown || keyUp.isDown) up = true;
	if (keyS.isDown || keyDown.isDown) down = true;
	if (keyA.isDown || keyLeft.isDown) left = true;
	if (keyD.isDown || keyRight.isDown) right = true;

	game.playerAccel.x = 0;
	game.playerAccel.y = 0;

	var speed = 0.05;
	if (left) game.playerAccel.x -= speed;
	if (right) game.playerAccel.x += speed;
	if (up) game.playerAccel.y -= speed;
	if (down) game.playerAccel.y += speed;

	game.playerVelo.x += game.playerAccel.x;
	game.playerVelo.y += game.playerAccel.y;

	game.playerVelo.x *= 1 - game.playerDrag;
	game.playerVelo.y *= 1 - game.playerDrag;

	if (game.playerVelo.x > game.playerMaxVelo.x) game.playerVelo.x = game.playerMaxVelo.x;
	if (game.playerVelo.x < -game.playerMaxVelo.x) game.playerVelo.x = -game.playerMaxVelo.x;
	if (game.playerVelo.y > game.playerMaxVelo.y) game.playerVelo.y = game.playerMaxVelo.y;
	if (game.playerVelo.y < -game.playerMaxVelo.y) game.playerVelo.y = -game.playerMaxVelo.y;

	game.playerSprite.x += game.playerVelo.x;
	game.playerSprite.y += game.playerVelo.y;

	{ /// Update sceeen looping
		var loopingSprites = [];
		loopingSprites.push(game.playerSprite);

		for (asteroid of game.asteroids) {
			asteroid.sprite.x += asteroid.velo.x;
			asteroid.sprite.y += asteroid.velo.y;

			loopingSprites.push(asteroid.sprite);
		}

		for (spr of loopingSprites) {
			if (spr.x < 0) spr.x = phaser.canvas.width;
			if (spr.y < 0) spr.y = phaser.canvas.height;
			if (spr.x > phaser.canvas.width) spr.x = 0;
			if (spr.y > phaser.canvas.height) spr.y = 0;
		}
	}
}

function rnd(min, max) {
	return Math.random() * (max - min) + min;
}

function createAsteroid(x, y) {
	var spr = scene.add.graphics(0, 0);
	spr.fillStyle(0xFFFFFF, 0.8);
	spr.fillCircle(0, 0, 30);
	spr.x = x;
	spr.y = y;

	var asteroid = {
		sprite: spr,
		velo: new Point(rnd(-1, 1), rnd(-1, 1))
	};

	game.asteroids.push(asteroid);
	return asteroid;
}
