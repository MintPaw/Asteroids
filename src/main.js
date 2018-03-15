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
	pixelArt: true,
	disableContextMenu: true,
	antialias: true,
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

var WARNING_TIME = 2;

var game = {
	player: null,

	bulletGroup: null,
	enemyBulletsGroup: null,
	baseGroup: null,
	enemyGroup: null,
	minimapGroup: null,

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
	keyCtrl: null,
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
	inGame: false,

	map: null,
	mapTiles: null,
	mapLayers: [],

	minimap: null
};

var scene = null;

function preload() {
	scene = this;

	scene.load.atlas("sprites", "assets/sprites.png", "assets/sprites.json");
	scene.load.atlas("minimap", "assets/minimap.png", "assets/minimap.json");
	scene.load.image("tilesheet", "assets/tilesheet.png");
	scene.load.tilemapTiledJSON("map1", "assets/maps/map1.json");
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

	{ /// Setup game and groups
		game.mapLayers = [];

		game.bulletGroup = scene.physics.add.group();
		game.enemyBulletsGroup = scene.physics.add.group();
		game.baseGroup = scene.physics.add.group();
		game.enemyGroup = scene.physics.add.group();
		game.minimapGroup = scene.add.group();
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
		game.keyCtrl = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL);
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

	{ /// Setup map
		game.map = scene.make.tilemap({ key: "map1" });
		game.mapTiles = game.map.addTilesetImage("tilesheet", "tilesheet");
		scene.cameras.main.setBounds(0, 0, game.map.widthInPixels, game.map.heightInPixels);

		game.mapLayers[0] = game.map.createStaticLayer(0, game.mapTiles, 0, 0);

		for (baseData of game.map.getObjectLayer("bases").objects) {
			var minimapSpr = game.minimapGroup.create(baseData.x + game.map.tileWidth/2, baseData.y + game.map.tileHeight/2, "minimap", "minimap/base1");
			scene.cameras.main.ignore(minimapSpr);

			var spr = game.baseGroup.create(baseData.x + game.map.tileWidth/2, baseData.y + game.map.tileHeight/2, "sprites", "sprites/bases/base1");
			spr.userdata = {
				minimapSpr: minimapSpr,
				type: "base",
				hp: 10
			};
		}
	}

	{ /// Setup player
		var spr = scene.physics.add.image(0, 0, "sprites", "sprites/player/player");
		scaleSpriteToSize(spr, 64, 64);
		spr.x = game.map.widthInPixels / 2;
		spr.y = game.map.heightInPixels / 2;
		spr.setDrag(5, 5);
		spr.setMaxVelocity(300, 300);

		game.player = spr;
	}

	{ /// Setup camera
		scene.cameras.main.startFollow(game.player);
		scene.cameras.main.roundPixels = true;
	}

	{ /// Setup minimap
		var mapScale = 0.04;
		game.minimap = scene.cameras.add(0, 0, game.map.widthInPixels * mapScale, game.map.heightInPixels * mapScale);
		game.minimap.y = phaser.canvas.height - game.minimap.height;
		game.minimap.setBounds(0, 0, game.map.widthInPixels, game.map.heightInPixels);
		game.minimap.scrollX = game.map.widthInPixels / 2 - game.minimap.width/2;
		game.minimap.scrollY = game.map.heightInPixels / 2 - game.minimap.height/2;
		game.minimap.zoom = mapScale;
		game.minimap.setBackgroundColor(0x002244);
		game.minimap.ignore(game.mapLayers[0]);
		game.minimap.roundPixels = true;
	}

	{ /// Setup collision
		scene.physics.world.addOverlap(game.bulletGroup, game.enemyGroup, bulletVEnemy);
		scene.physics.world.addOverlap(game.enemyBulletsGroup, game.player, bulletVPlayer);
		scene.physics.world.addOverlap(game.enemyGroup, game.player, enemyVPlayer);
		scene.physics.world.addOverlap(game.enemyBulletsGroup, game.baseGroup, bulletVBase);
		scene.physics.world.addCollider(game.enemyGroup, game.player);
	}

	{ /// Setup level
		var level = game.level;

		if (level == 1) {
			timedMsg(1, "Wave incoming, top left!");
			timedCreateEnemy(2, ENEMY_BASIC_SHIP, 300, 400);
			timedCreateEnemy(2, ENEMY_BASIC_SHIP, 400, 400);
			timedCreateEnemy(2, ENEMY_BASIC_SHIP, 500, 400);

			timedMsg(20, "Next wave incoming, bottom right!");
			timedCreateEnemy(20, ENEMY_BASIC_SHIP, 79 * game.map.tileWidth, 95 * game.map.tileHeight);
			timedCreateEnemy(20, ENEMY_BASIC_SHIP, 81 * game.map.tileWidth, 95 * game.map.tileHeight);
			timedCreateEnemy(20, ENEMY_BASIC_SHIP, 83 * game.map.tileWidth, 95 * game.map.tileHeight);
		} else if (level == 2) {
			timedCreateEnemy(2, ENEMY_ASTEROID, 300, 400);
			timedCreateEnemy(2, ENEMY_ASTEROID, 400, 400);
			timedCreateEnemy(2, ENEMY_ASTEROID, 500, 400);
			timedCreateEnemy(8, ENEMY_BASIC_SHIP, 300, 400);
			timedCreateEnemy(8, ENEMY_BASIC_SHIP, 500, 400);
		} else if (level == 3) {
			createEnemy(ENEMY_BASIC_SHIP, 300, 400);
			createEnemy(ENEMY_ASTEROID, 400, 400);
			createEnemy(ENEMY_ASTEROID, 500, 400);
		} else if (level == 4) {
			createEnemy(ENEMY_BASIC_SHIP, 300, 400);
			createEnemy(ENEMY_ASTEROID, 300, 400);
			createEnemy(ENEMY_ASTEROID, 400, 400);
			createEnemy(ENEMY_ASTEROID, 500, 400);
		} else if (level == 5) {
			createEnemy(ENEMY_BASIC_SHIP, 300, 400);
			createEnemy(ENEMY_ASTEROID, 200, 400);
			createEnemy(ENEMY_ASTEROID, 300, 400);
			createEnemy(ENEMY_ASTEROID, 400, 400);
			createEnemy(ENEMY_ASTEROID, 500, 400);
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

			var turnSpeed = 3;
			if (up) game.player.setAcceleration(Math.cos((game.player.angle - 90)  * Math.PI/180) * speed, Math.sin((game.player.angle - 90) * Math.PI/180) * speed);
			if (left) game.player.angle -= turnSpeed;
			if (right) game.player.angle += turnSpeed;

			game.timeTillNextShot -= 1/60;
			if (shoot && game.timeTillNextShot <= 0) {
				game.timeTillNextShot = 1;
				shootBullet(game.player, game.player.angle - 90, 200, true);
			}
		}
	}

	{ /// Update sceeen edges
		var edgeSprites = []
		edgeSprites.push(...game.enemyGroup.getChildren());
		edgeSprites.push(...game.bulletGroup.getChildren());
		if (game.player.active) edgeSprites.push(game.player);

		var edgeX = game.map.widthInPixels;
		var edgeY = game.map.heightInPixels;

		for (spr of edgeSprites) {
			if (spr.x < 0) {
				spr.x = 0;
				spr.setVelocityX(0);
			} else if (spr.y < 0) {
				spr.y = 0;
				spr.setVelocityY(0);
			} else if (spr.x > edgeX) {
				spr.x = edgeX;
				spr.setVelocityX(0);
			} else if (spr.y > edgeY) {
				spr.y = edgeY;
				spr.setVelocityY(0);
			}
		}
	}

	{ /// Update enemies
		for (spr of game.enemyGroup.getChildren()) {
			if (spr.userdata.type == ENEMY_ASTEROID) {
				/// Asteroid stuff
			}

			if (spr.userdata.type == ENEMY_BASIC_SHIP) {
				var targets = [];
				targets.push(game.player);
				targets.push(...game.baseGroup.getChildren());
				spr.userdata.target = getClosestSprite(spr, targets);

				if (spr.userdata.target) {
					var target = spr.userdata.target;

					spr.angle = getAngleBetween(spr.x, spr.y, target.x, target.y) + 90;
					spr.userdata.timeTillNextShot -= 1/60;
					spr.setAcceleration();

					var dist = spr.getCenter().distance(target.getCenter());
					if (dist > 200) {
						scene.physics.accelerateToObject(spr, target);
					} else {
						if (spr.userdata.timeTillNextShot <= 0) {
							spr.userdata.timeTillNextShot = spr.userdata.timePerShot;
							shootBullet(spr, spr.angle - 90, 200, false);
						}
					}
				}
			}
		}
	}

	{ /// Update bullets
		for (spr of game.bulletGroup.getChildren()) {
			spr.alpha -= 0.005;
			if (spr.alpha <= 0) {
				spr.destroy();
				game.bulletGroup.remove(spr);
			}
		}

		for (spr of game.enemyBulletsGroup.getChildren()) {
			spr.alpha -= 0.005;
			if (spr.alpha <= 0) {
				spr.destroy();
				game.enemyBulletsGroup.remove(spr);
			}
		}
	}

	{ /// Reset inputs
		game.mouseJustDown = false;
		game.mouseJustUp = false;
	}
}

function msg(str) {
	var text = scene.add.text(0, 0, str, {font: "64px Arial"});
	text.x = phaser.canvas.width/2 - text.width/2;
	text.y = -text.height;
	text.setScrollFactor(0, 0);

	scene.tweens.add({
		targets: text,
		y: { value: 10, duration: 500, ease: "Power1" },
		alpha: { value: 0, duration: 500, ease: "Power1", delay: 3000 },
		onComplete: function() {
			text.destroy();
		}
	});
}

function switchLevel(newLevel) {
	game.level = newLevel;
	phaser.scene.stop("game");
	phaser.scene.start("game");

	msg("Level "+game.level);
}

function shootBullet(sourceSprite, angle, speed, isFriendly) {
	var spr = null;

	if (isFriendly) spr = game.bulletGroup.create(0, 0, "sprites", "sprites/bullets/bullet1");
	else spr = game.enemyBulletsGroup.create(0, 0, "sprites", "sprites/bullets/bullet1");

	spr.userdata = {};

	angle = angle * Math.PI/180;

	spr.x = sourceSprite.x + Math.cos(angle) * (sourceSprite.width/2);
	spr.y = sourceSprite.y + Math.sin(angle) * (sourceSprite.height/2);

	spr.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

	return spr;
}

function bulletVEnemy(s1, s2) {
	var bullet = game.bulletGroup.contains(s1) ? s1 : s2;
	var enemy = bullet == s1 ? s2 : s1;

	if (enemy.userdata.type == ENEMY_ASTEROID) {
		bullet.alpha = 0;

		if (enemy.scaleX <= 0.1) {
			enemy.destroy();
			game.enemyGroup.remove(enemy);
		} else {
			enemy.scaleX -= 0.3;
			enemy.scaleY -= 0.3;
		}
	}

	if (enemy.userdata.type == ENEMY_BASIC_SHIP) {
		bullet.alpha = 0;

		enemy.destroy();
		game.enemyGroup.remove(enemy);
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

function bulletVBase(s1, s2) {
	var bullet = game.enemyBulletsGroup.contains(s1) ? s1 : s2;
	var base = bullet == s1 ? s2 : s1;

	base.userdata.hp--;
	if (base.userdata.hp <= 0) {
		game.minimapGroup.remove(base.userdata.minimapSpr);
		base.userdata.minimapSpr.destroy();

		game.baseGroup.remove(base);
		base.destroy();
	}

	bullet.alpha = 0;
}


function warnEnemy(timeTill, type, x, y) {
	var spr = scene.add.image(0, 0, "sprites", "sprites/exclam");
	spr.x = x;
	spr.y = y;

	var loops = 5;

	scene.tweens.add({
		targets: spr,
		loop: loops,
		y: { value: spr.y - 5, duration: timeTill/loops*1000, ease: "Power1" },
		alpha: { value: 0, duration: timeTill/loops*1000, ease: "Power1" },
		onComplete: function() {
			spr.destroy();
		}
	});
}

function createEnemy(type, x, y) {
	if (type == ENEMY_ASTEROID) {
		var spr = game.enemyGroup.create(0, 0, "sprites", "sprites/enemies/asteroid");
		scaleSpriteToSize(spr, 64, 64);
		spr.userdata = {};
		spr.userdata.type = ENEMY_ASTEROID;
		spr.setVelocity(rnd(-50, 50), rnd(-50, 50));
		spr.x = x;
		spr.y = y;

		return spr;
	}

	if (type == ENEMY_BASIC_SHIP) {
		var spr = game.enemyGroup.create(0, 0, "sprites", "sprites/enemies/basicShip");
		scaleSpriteToSize(spr, 64, 64);
		spr.userdata = {};
		spr.userdata.type = ENEMY_BASIC_SHIP;
		spr.userdata.timePerShot = 3;
		spr.userdata.timeTillNextShot = spr.userdata.timePerShot;
		spr.userdata.target = null;

		spr.x = x;
		spr.y = y;

		return spr;
	}
}

function timedCreateEnemy(time, type, x, y) {
	var warningTime = time - WARNING_TIME;
	if (warningTime < 0) warningTime = 0;

	scene.time.delayedCall(warningTime * 1000, warnEnemy.bind(null, time - warningTime, type, x, y));
	scene.time.delayedCall(time * 1000, createEnemy.bind(null, type, x, y));
}

function timedMsg(time, str) {
	scene.time.delayedCall(time * 1000, msg.bind(null, str));
}
