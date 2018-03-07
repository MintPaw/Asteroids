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
	asteroids: []
};

var scene = null;

function preload() {
	scene = this;

	scene.load.atlas("assets", "assets/sprites.png", "assets/sprites.json");
}

function create() {
	{ /// Create Player
		var spr = scene.physics.add.image(0, 0, "assets", "sprites/player/player");
		spr.setDrag(5, 5);
		spr.setMaxVelocity(300, 300);

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

	var speed = 100;
	game.playerSprite.setAcceleration(0, 0);
	if (left) game.playerSprite.body.acceleration.x -= speed;
	if (right) game.playerSprite.body.acceleration.x += speed;
	if (up) game.playerSprite.body.acceleration.y -= speed;
	if (down) game.playerSprite.body.acceleration.y += speed;

	{ /// Update sceeen looping
		var loopingSprites = game.asteroids.concat();
		loopingSprites.push(game.playerSprite);

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
	var spr = scene.physics.add.image(0, 0, "assets", "sprites/asteroids/asteroid1");
	spr.setVelocity(rnd(-50, 50), rnd(-50, 50));
	spr.x = x;
	spr.y = y;

	game.asteroids.push(spr);
	return spr;
}
