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

	mouseX: 0,
	mouseY: 0,
	mouseDown: false,
	mouseJustDown: false,
	mouseJustUp: false
};

var scene = null;

function preload() {
	scene = this;

	scene.load.atlas("assets", "assets/sprites.png", "assets/sprites.json");
}

function create() {
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
	createAsteroid(300, 400);
	createAsteroid(500, 400);

	scene.physics.world.addOverlap(game.bulletsGroup, game.asteroidGroup, bulletVAsteroid);
}

function update(delta) {
	var left = false;
	var right = false;
	var up = false;
	var down = false;
	var shoot = false;
	if (game.keyW.isDown || game.keyUp.isDown) up = true;
	if (game.keyS.isDown || game.keyDown.isDown) down = true;
	if (game.keyA.isDown || game.keyLeft.isDown) left = true;
	if (game.keyD.isDown || game.keyRight.isDown) right = true;
	if (game.keySpace.isDown || game.mouseDown) shoot = true;

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
