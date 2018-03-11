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

var ENEMY_ASTEROID = "asteroid";
var ENEMY_BASIC_SHIP = "basicShip";

var game = {
	player: null,
	bulletGroup: null,
	enemyBulletsGroup: null,

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

	{ /// Setup inputs
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
	}

	{ /// Create Player
		var spr = scene.physics.add.image(0, 0, "assets", "sprites/player/player");
		spr.x = phaser.canvas.width/2 - spr.width/2;
		spr.y = phaser.canvas.height * 0.25;
		spr.setDrag(5, 5);
		spr.setMaxVelocity(300, 300);

		game.player = spr;
	}

	{ /// Setup groups and collision
		game.bulletGroup = scene.physics.add.group();
		game.enemyBulletsGroup = scene.physics.add.group();
		game.enemyGroup = scene.physics.add.group();

		scene.physics.world.addOverlap(game.bulletGroup, game.enemyGroup, bulletVEnemy);
		scene.physics.world.addOverlap(game.enemyBulletsGroup, game.player, bulletVPlayer);
		scene.physics.world.addOverlap(game.enemyGroup, game.player, enemyVPlayer);
		scene.physics.world.addCollider(game.enemyGroup, game.player);
	}

	{ /// Setup Level
		var level = game.level;

		if (level == 1) {
			createBasicShip(300, 400);
		} else if (level == 2) {
			createBasicShip(300, 400);
			createAsteroid(500, 400);
		} else if (level == 3) {
			createBasicShip(300, 400);
			createAsteroid(400, 400);
			createAsteroid(500, 400);
		} else if (level == 4) {
			createBasicShip(300, 400);
			createAsteroid(300, 400);
			createAsteroid(400, 400);
			createAsteroid(500, 400);
		} else if (level == 5) {
			createBasicShip(300, 400);
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

	/// Update Player
	{
		if (game.player.active) {
			game.player.setAcceleration(0, 0);

			var speed = 100;
			if (left) game.player.body.acceleration.x -= speed;
			if (right) game.player.body.acceleration.x += speed;
			if (up) game.player.body.acceleration.y -= speed;
			if (down) game.player.body.acceleration.y += speed;

			game.timeTillNextShot -= 1/60;

			if (shoot && game.timeTillNextShot <= 0) {
				game.timeTillNextShot = 1;
				shootBullet(game.player, game.player.angle - 90, 200, true);
			}

			game.player.angle = getAngleBetween(game.player.x, game.player.y, game.mouseX, game.mouseY) + 90;
		}
	}

	{ /// Update sceeen looping
		var loopingSprites = []
		loopingSprites.push(...game.enemyGroup.getChildren());
		loopingSprites.push(...game.bulletGroup.getChildren());
		loopingSprites.push(game.player);

		for (spr of loopingSprites) {
			if (spr.x < 0) spr.x = phaser.canvas.width;
			if (spr.y < 0) spr.y = phaser.canvas.height;
			if (spr.x > phaser.canvas.width) spr.x = 0;
			if (spr.y > phaser.canvas.height) spr.y = 0;
		}
	}

	/// Update enemies
	for (spr of game.enemyGroup.getChildren()) {
		if (spr.userdata.type == ENEMY_ASTEROID) {
		} else if (spr.userdata.type == ENEMY_BASIC_SHIP) {
			spr.angle = getAngleBetween(spr.x, spr.y, game.player.x, game.player.y) + 90;
			spr.userdata.timeTillNextShot -= 1/60;
			if (spr.userdata.timeTillNextShot <= 0) {
				spr.userdata.timeTillNextShot = spr.userdata.timePerShot;
				shootBullet(spr, spr.angle - 90, 200, false);
			}
		}
	}

	/// Update bullets
	for (spr of game.bulletGroup.getChildren()) {
		spr.alpha -= 0.005;
		if (spr.alpha <= 0) {
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

	var text = scene.add.text(0, 0, "Level "+game.level, {font: "64px Arial"});
	text.x = phaser.canvas.width/2 - text.width/2;
	text.y = -text.height;

	scene.tweens.add({
		targets: text,
		y: { value: 10, duration: 500, ease: "Power1" },
		alpha: { value: 0, duration: 500, ease: "Power1", delay: 3000 }
	});
}

function shootBullet(sourceSprite, angle, speed, isFriendly) {
	var spr = null;

	if (isFriendly) spr = game.bulletGroup.create(0, 0, "assets", "sprites/bullets/bullet1");
	else spr = game.enemyBulletsGroup.create(0, 0, "assets", "sprites/bullets/bullet1");

	spr.userdata = {};

	angle = angle * Math.PI/180;

	spr.x = sourceSprite.x + Math.cos(angle) * (sourceSprite.width/2);
	spr.y = sourceSprite.y + Math.sin(angle) * (sourceSprite.height/2);

	spr.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

	return spr;
}

function bulletVEnemy(s1, s2) {
	var bullet = game.bulletGroup.getChildren().indexOf(s1) != -1 ? s1 : s2;
	var enemy = bullet == s1 ? s2 : s1;

	if (enemy.userdata.type == ENEMY_ASTEROID) {
		bullet.alpha = 0;

		if (enemy.scaleX <= 0.1) {
			enemy.destroy();
		} else {
			enemy.scaleX -= 0.3;
			enemy.scaleY -= 0.3;
		}
	}

	if (enemy.userdata.type == ENEMY_BASIC_SHIP) {
		bullet.alpha = 0;

		enemy.destroy();
	}
}

function bulletVPlayer(s1, s2) {
	var player = s1 == game.player ? s1 : s2;
	var bullet = player == s1 ? s2 : s1;
	player.destroy();
	bullet.alpha = 0;
}

function enemyVPlayer(s1, s2) {
	var player = s1 == game.player ? s1 : s2;
	var enemy = player == s1 ? s2 : s1;

	/// This pushes players away, but we can just use phaser collision for now
	// var playerAngle = getAngleBetween(player.x, player.y, enemy.x, enemy.y);

	// var force = 10;
	// enemy.body.velocity.x += Math.cos(playerAngle) * force;
	// enemy.body.velocity.y += Math.sin(playerAngle) * force;

	// player.body.velocity.x += Math.cos(playerAngle-180) * force;
	// player.body.velocity.y += Math.sin(playerAngle-180) * force;
}

function rnd(min, max) {
	return Math.random() * (max - min) + min;
}

function getAngleBetween(x1, y1, x2, y2) {
	var angle = Math.atan2(y2 - y1, x2 - x1);
	angle = angle * (180/Math.PI);
	return angle;
}

function createBasicShip(x, y) {
	var spr = game.enemyGroup.create(0, 0, "assets", "sprites/enemies/basicShip");
	spr.userdata = {};
	spr.userdata.type = ENEMY_BASIC_SHIP;
	spr.userdata.timePerShot = 3;
	spr.userdata.timeTillNextShot = spr.userdata.timePerShot;

	spr.setVelocity(rnd(-50, 50), rnd(-50, 50));
	spr.tint = 0xFF0000;
	spr.x = x;
	spr.y = y;

	return spr;
}

function createAsteroid(x, y) {
	var spr = game.enemyGroup.create(0, 0, "assets", "sprites/enemies/asteroid");
	spr.userdata = {};
	spr.userdata.type = ENEMY_ASTEROID;
	spr.setVelocity(rnd(-50, 50), rnd(-50, 50));
	spr.x = x;
	spr.y = y;

	return spr;
}
