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

var ENEMY_BASIC_SHIP = "basicShip";
var ENEMY_VESSEL = "vessel";
var ENEMY_VESSEL_LING = "vesselLing";

var WARNING_TIME = 2;
var PLAYER_INVINCIBILITY_TIME = 1;
var MONEY_LIFETIME = 10;

var UPGRADES_NAMES = [
	"Damage", "Bullet Speed", "Fire Rate",
	"Acceleration", "Brake Power", "none",
	"none", "none", "none"
];

var game = {
	width: 0,
	height: 0,
	time: 0,
	player: null,

	bulletGroup: null,
	enemyBulletsGroup: null,
	baseGroup: null,
	enemyGroup: null,
	moneyGroup: null,
	minimapGroup: null,
	hpGroup: null,

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
	keyE: null,

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

	minimap: null,
	minimapSprites: [],

	overBase: false, 
	inShop: false,
	shopPrompt: null,
	shopSprites: [],
	shopButtonTexts: [],

	upgrades: [],
	money: 0,
	moneyText: null,

	lastPlayerHitTime: 0,
};

var scene = null;

function preload() {
	scene = this;

	scene.load.atlas("sprites", "assets/sprites.png", "assets/sprites.json");
	scene.load.atlas("minimap", "assets/minimap.png", "assets/minimap.json");
	scene.load.atlas("ui", "assets/ui.png", "assets/ui.json");
	scene.load.atlas("particles", "assets/particles.png", "assets/particles.json");
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
				for (i = this.length; i--;) {
					if (this[i] === val) removedItems.push(this.splice(i, 1));
				}
			} else {
				i = this.indexOf(val);
				if (i>-1) removedItems = this.splice(i, 1);
			}
			return removedItems;
		};
	}

	{ // Setup size
		game.width = phaser.canvas.width;
		game.height = phaser.canvas.height;
	}

	{ /// Setup game and groups
		game.mapLayers = [];

		game.bulletGroup = scene.physics.add.group();
		game.enemyBulletsGroup = scene.physics.add.group();
		game.baseGroup = scene.physics.add.group();
		game.enemyGroup = scene.physics.add.group();
		game.moneyGroup = scene.physics.add.group();

		game.minimapGroup = scene.add.group();
		game.hpGroup = scene.add.group();
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
		game.keyE = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

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

		scene.input.on("gameobjectdown", buttonPressed, this);
	}

	{ /// Setup map
		game.map = scene.make.tilemap({ key: "map1" });
		game.mapTiles = game.map.addTilesetImage("tilesheet", "tilesheet");
		scene.cameras.main.setBounds(0, 0, game.map.widthInPixels, game.map.heightInPixels);

		game.mapLayers[0] = game.map.createStaticLayer(0, game.mapTiles, 0, 0);
	}

	{ /// Setup minimap
		var mapScale = 0.04;
		game.minimap = scene.cameras.add(0, 0, game.map.widthInPixels * mapScale, game.map.heightInPixels * mapScale);
		game.minimap.y = game.height - game.minimap.height;
		game.minimap.setBounds(0, 0, game.map.widthInPixels, game.map.heightInPixels);
		game.minimap.scrollX = game.map.widthInPixels / 2 - game.minimap.width/2;
		game.minimap.scrollY = game.map.heightInPixels / 2 - game.minimap.height/2;
		game.minimap.zoom = mapScale;
		game.minimap.setBackgroundColor(0x002244);
		game.minimap.ignore(game.mapLayers[0]);
		game.minimap.roundPixels = true;
	}

	{ /// Setup bases
		for (baseData of game.map.getObjectLayer("bases").objects) {
			var spr = game.baseGroup.create(baseData.x + game.map.tileWidth/2, baseData.y + game.map.tileHeight/2, "sprites", "sprites/bases/base1");

			spr.userdata = {
				type: "base",
				maxHp: 10,
				hp: 10
			};

			addMinimapSprite(spr, "minimap/base1");
			var bar = addHpBar(spr);
			bar.userdata.alwaysShow = true;
		}
	}

	{ /// Setup player
		var spr = scene.physics.add.image(0, 0, "sprites", "sprites/player/player");
		scaleSpriteToSize(spr, 64, 64);
		spr.x = game.map.widthInPixels / 2;
		spr.y = game.map.heightInPixels / 2;
		spr.setDrag(5, 5);
		spr.setMaxVelocity(500, 500);

		addMinimapSprite(spr, "minimap/player");

		spr.userdata = {
			maxHp: 10,
			hp: 10
		};

		addHpBar(spr);
		game.player = spr;
	}

	{ /// Setup camera
		scene.cameras.main.startFollow(game.player);
		scene.cameras.main.roundPixels = true;
	}

	{ /// Setup collision
		scene.physics.world.addOverlap(game.bulletGroup, game.enemyGroup, bulletVEnemy);
		scene.physics.world.addOverlap(game.enemyBulletsGroup, game.player, bulletVPlayer);
		scene.physics.world.addOverlap(game.enemyGroup, game.player, enemyVPlayer);
		scene.physics.world.addOverlap(game.enemyBulletsGroup, game.baseGroup, bulletVBase);
		scene.physics.world.addOverlap(game.player, game.baseGroup, playerVBase);
		scene.physics.world.addOverlap(game.player, game.enemyGroup, playerVEnemy);
		scene.physics.world.addOverlap(game.player, game.moneyGroup, playerVMoney);
		scene.physics.world.addCollider(game.enemyGroup, game.player);
	}

	{ /// Setup shop
		{ /// Prompt
			var spr = scene.add.text(0, 0, "Press E to shop", {font: "32px Arial"});
			spr.setScrollFactor(0, 0);
			game.minimap.ignore(spr);

			game.shopPrompt = spr;
		}

		{ /// Buttons
			var cols = 3;
			var rows = 3;
			var pad = 10;

			for (var y = 0; y < cols; y++) {
				for (var x = 0; x < rows; x++) {
					var index = (x % cols) + (y * cols);
					var spr = scene.add.image(0, 0, "ui", "ui/shopButton");

					var totalW = (spr.width + pad) * cols;
					var totalH = (spr.height + pad) * rows;

					spr.x = x * (spr.width + pad) + (game.width/2 - totalW/2) + spr.width/2;
					spr.y = y * (spr.height + pad) + (game.height/2 - totalH/2) + spr.height/2;
					spr.setScrollFactor(0, 0);
					spr.setInteractive();
					game.shopSprites.push(spr);
					spr.setName(UPGRADES_NAMES[index]);

					var textPoint = spr.getTopLeft();
					var tf = scene.add.text(textPoint.x, textPoint.y, "none", {font: "16px Arial", wordWrap: {width: spr.width}});
					tf.setScrollFactor(0, 0);
					game.shopSprites.push(tf);
					game.shopButtonTexts.push(tf);
				}
			}
		}
	}

	{ /// Setup upgrades
		for (var i = 0; i < UPGRADES_NAMES.length; i++) game.upgrades.push(1);
	}

	{ /// Setup hud
		var tf = scene.add.text(0, 0, "Money: ????", {font: "32px Arial"});
		tf.setScrollFactor(0, 0);
		game.minimap.ignore(tf);

		game.moneyText = tf;
	}

	{ /// Setup level
		var level = game.level;

		if (level == 1) {
			timedMsg(1, "Wave incoming, top left!");
			timedCreateEnemy(2, ENEMY_BASIC_SHIP, 300, 400);
			timedCreateEnemy(2, ENEMY_VESSEL, 400, 400);
			timedCreateEnemy(2, ENEMY_BASIC_SHIP, 500, 400);

			timedMsg(20, "Wave incoming, bottom right!");
			timedCreateEnemy(20, ENEMY_BASIC_SHIP, 79 * game.map.tileWidth, 95 * game.map.tileHeight);
			timedCreateEnemy(20, ENEMY_VESSEL, 81 * game.map.tileWidth, 95 * game.map.tileHeight);
			timedCreateEnemy(20, ENEMY_BASIC_SHIP, 83 * game.map.tileWidth, 95 * game.map.tileHeight);
		} else if (level == 2) {
			timedCreateEnemy(8, ENEMY_BASIC_SHIP, 300, 400);
			timedCreateEnemy(8, ENEMY_BASIC_SHIP, 500, 400);
		} else if (level == 3) {
			createEnemy(ENEMY_BASIC_SHIP, 300, 400);
		} else if (level == 4) {
			createEnemy(ENEMY_BASIC_SHIP, 300, 400);
		} else if (level == 5) {
			createEnemy(ENEMY_BASIC_SHIP, 300, 400);
		}
	}

	game.inGame = true;
}

function update(delta) {
	if (!game.inGame) return;

	game.time = phaser.loop.time;

	var left = false;
	var right = false;
	var up = false;
	var down = false;
	var shoot = false;
	var shop = false;
	var levelToSwitchTo = 0;

	{ /// Update inputs
		if (game.keyW.isDown || game.keyUp.isDown) up = true;
		if (game.keyS.isDown || game.keyDown.isDown) down = true;
		if (game.keyA.isDown || game.keyLeft.isDown) left = true;
		if (game.keyD.isDown || game.keyRight.isDown) right = true;
		if (game.keySpace.isDown) shoot = true;
		if (game.key1.isDown) levelToSwitchTo = 1;
		if (game.key2.isDown) levelToSwitchTo = 2;
		if (game.key3.isDown) levelToSwitchTo = 3;
		if (game.key4.isDown) levelToSwitchTo = 4;
		if (game.key5.isDown) {
			emitMoney(10, game.player.x, game.player.y);
		}
		if (game.keyE.isDown) shop = true;
	}

	{ /// Might need to switch levels
		if (levelToSwitchTo != 0) {
			switchLevel(levelToSwitchTo);
			return;
		}
	}

	{ /// Update Player
		if (game.player.active) {
			game.player.setAcceleration(0, 0);
			var speed = getAcceleration();
			var breakPerc = getBrakePower();

			var turnSpeed = 5;
			if (up) game.player.setAcceleration(Math.cos((game.player.angle - 90)  * Math.PI/180) * speed, Math.sin((game.player.angle - 90) * Math.PI/180) * speed);
			if (left) game.player.angle -= turnSpeed;
			if (right) game.player.angle += turnSpeed;
			if (down) game.player.setVelocity(game.player.body.velocity.x * breakPerc, game.player.body.velocity.y * breakPerc);

			game.timeTillNextShot -= 1/60;
			if (shoot && game.timeTillNextShot <= 0) {
				game.timeTillNextShot = getFireRate();
				shootBullet(game.player, game.player.angle - 90, getBulletSpeed(), true);
			}

			if (game.time - game.lastPlayerHitTime < PLAYER_INVINCIBILITY_TIME * 1000) {
				game.player.alpha = Math.sin(game.time);
			} else {
				game.player.alpha = 1;
			}
		}
	}

	{ /// Update sceen edges
		var edgeSprites = []
		edgeSprites.push(...game.enemyGroup.getChildren());
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
						scene.physics.accelerateToObject(spr, target, spr.userdata.speed);
					} else {
						if (spr.userdata.timeTillNextShot <= 0) {
							spr.userdata.timeTillNextShot = spr.userdata.timePerShot;
							var bullet = shootBullet(spr, spr.angle - 90, 200, false);
							bullet.userdata.damage = spr.userdata.bulletDamage;
						}
					}
				}
			}

			if (spr.userdata.type == ENEMY_VESSEL) {
				scene.physics.accelerateToObject(spr, game.player, spr.userdata.speed);
			}

			if (spr.userdata.type == ENEMY_VESSEL_LING) {
				scene.physics.accelerateToObject(spr, game.player, spr.userdata.speed);
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

	{ /// Update minimap
		for (minimapSpr of game.minimapSprites) {
			if (!minimapSpr.userdata.parentSprite.active) {
				game.minimapSprites.remove(minimapSpr);
				minimapSpr.destroy();
				continue;
			}

			minimapSpr.cameraFilter = 0;
			minimapSpr.userdata.parentSprite.cameraFilter = 0;

			minimapSpr.x = minimapSpr.userdata.parentSprite.x;
			minimapSpr.y = minimapSpr.userdata.parentSprite.y;
			minimapSpr.rotation = minimapSpr.userdata.parentSprite.rotation;

			scene.cameras.main.ignore(minimapSpr);
			game.minimap.ignore(minimapSpr.userdata.parentSprite);
		}
	}

	{ /// Update shop
		if (game.overBase) {
			game.shopPrompt.visible = true;
			game.shopPrompt.x = game.width/2 - game.shopPrompt.width/2;
			game.shopPrompt.y = game.height - game.shopPrompt.height - 10;
			if (shop) game.inShop = true;
		} else {
			game.shopPrompt.visible = false;
			game.inShop = false;
		}

		for (spr of game.shopSprites) {
			spr.visible = game.inShop;
		}

		for (var i = 0; i < game.shopButtonTexts.length; i++) {
			var tf = game.shopButtonTexts[i];
			tf.setText(UPGRADES_NAMES[i] + "\nLevel: " + game.upgrades[i] + "\nPrice: " + getUpgradePrice(UPGRADES_NAMES[i]));
		}
	}

	{ /// Update hud
		game.moneyText.setText("Money: "+game.money);

		for (bar of game.hpGroup.getChildren()) {
			var spr = bar.userdata.parentSprite;
			if (!spr.active) {
				bar.destroy();
				game.hpGroup.remove(bar);
				continue;
			}
			bar.x = spr.x;
			bar.y = spr.y - spr.displayHeight/2 - bar.height - 5;
			bar.scaleX = spr.userdata.hp / spr.userdata.maxHp;

			if (bar.userdata.alwaysShow) {
				bar.alpha = 1;
			} else {
				var timeSinceHit = game.time - bar.userdata.lastHitTime;
				var barFadeTime = 3000;
				var barMinFade = 0.1;
				var perc = 1 - timeSinceHit/barFadeTime;
				if (perc < barMinFade) perc = barMinFade;
				bar.alpha = perc;
			}
		}
	}

	{ /// Update money particles
		for (spr of game.moneyGroup.getChildren()) {
			if (spr.alpha > 0) spr.alpha = 1 - ((game.time - spr.userdata.creationTime) / (MONEY_LIFETIME*1000));

			if (spr.alpha <= 0) {
				spr.destroy();
				game.moneyGroup.remove(spr);
			}
		}
	}

	{ /// Reset inputs
		game.mouseJustDown = false;
		game.mouseJustUp = false;

		game.overBase = false;
	}
}

function msg(str) {
	var text = scene.add.text(0, 0, str, {font: "64px Arial"});
	text.x = game.width/2 - text.width/2;
	text.y = -text.height;
	text.setScrollFactor(0, 0);
	if (game.minimap) game.minimap.ignore(text);

	scene.tweens.add({
		targets: text,
		y: { value: 30, duration: 500, ease: "Power1" },
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
}

function shootBullet(sourceSprite, angle, speed, isFriendly) {
	var spr = null;

	if (isFriendly) spr = game.bulletGroup.create(0, 0, "sprites", "sprites/bullets/bullet1");
	else spr = game.enemyBulletsGroup.create(0, 0, "sprites", "sprites/bullets/bullet1");

	spr.userdata = {
		damage: 1
	};

	if (isFriendly) spr.userdata.damage = getDamage();

	angle = angle * Math.PI/180;

	spr.x = sourceSprite.x + Math.cos(angle) * (sourceSprite.width/2);
	spr.y = sourceSprite.y + Math.sin(angle) * (sourceSprite.height/2);

	spr.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

	game.minimap.ignore(spr);
	return spr;
}

function bulletVEnemy(s1, s2) {
	var bullet = game.bulletGroup.contains(s1) ? s1 : s2;
	var enemy = bullet == s1 ? s2 : s1;

	var xpos = enemy.x;
	var ypos = enemy.y;
	enemy.userdata.hp -= bullet.userdata.damage;

	if (!enemy.userdata.penetrable) bullet.alpha = 0;

	if (enemy.userdata.type == ENEMY_BASIC_SHIP) {
		// Nothing
	}

	if (enemy.userdata.type == ENEMY_VESSEL) {
		for (var i = 0; i < bullet.userdata.damage; i++) createEnemy(ENEMY_VESSEL_LING, enemy.x, enemy.y);

		if (enemy.userdata.hp <= 0) {
			for (var i = 0; i < 5; i++) createEnemy(ENEMY_VESSEL_LING, enemy.x, enemy.y);
		}
	}

	if (enemy.userdata.type == ENEMY_VESSEL_LING) {
		// Nothing
	}

	if (enemy.userdata.hp <= 0) {
		enemy.destroy();
		game.enemyGroup.remove(enemy);
	}

	if (!enemy.active) {
		emitMoney(enemy.userdata.worth, xpos, ypos);
	}

	showHpBar(enemy);
}

function bulletVPlayer(s1, s2) {
	var player = s1 == game.player ? s1 : s2;
	var bullet = player == s1 ? s2 : s1;
	bullet.alpha = 0;

	hitPlayer(bullet.userdata.damage);
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

	base.userdata.hp -= bullet.userdata.damage;
	if (base.userdata.hp <= 0) {
		game.baseGroup.remove(base);
		base.destroy();

		msg("Base destroyed, "+game.baseGroup.countActive()+" left");
	}

	bullet.alpha = 0;
}

function playerVBase(s1, s2) {
	var player = s1 == game.player ? s1 : s2;
	var base = player == s1 ? s2 : s1;
	game.overBase = true;
}

function playerVEnemy(s1, s2) {
	var player = s1 == game.player ? s1 : s2;
	var enemy = player == s1 ? s2 : s1;

	hitPlayer(0.5);
}

function playerVMoney(s1, s2) {
	var player = s1 == game.player ? s1 : s2;
	var money = player == s1 ? s2 : s1;

	if (money.alpha <= 0) return;
	money.alpha = 0;
	game.money++;
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
	var spr;

	var userdata = {
		type: type,
		worth: 100,
		maxHp: 5,
		hp: 0,
		speed: 50,

		timePerShot: 3,
		timeTillNextShot: 0,
		bulletDamage: 1,
		penetrable: false,

		target: null
	};

	if (type == ENEMY_BASIC_SHIP) {
		spr = game.enemyGroup.create(0, 0, "sprites", "sprites/enemies/basicShip");
		scaleSpriteToSize(spr, 64, 64);

		userdata.speed = 60;
	}

	if (type == ENEMY_VESSEL) {
		spr = game.enemyGroup.create(0, 0, "sprites", "sprites/enemies/vessel");
		scaleSpriteToSize(spr, 128, 128);
		userdata.worth = 500;
		userdata.maxHp = 5;
		userdata.speed = 5;
	}

	if (type == ENEMY_VESSEL_LING) {
		spr = game.enemyGroup.create(0, 0, "sprites", "sprites/enemies/vesselLing");
		scaleSpriteToSize(spr, 32, 32);
		userdata.worth = 5;
		userdata.maxHp = 1;
		userdata.speed = 100;
		userdata.penetrable = true;

		spr.setVelocity(rnd(-100, 100), rnd(-100, 100));
	}

	userdata.timeTillNextShot = userdata.timePerShot;
	userdata.hp = userdata.maxHp;
	spr.userdata = userdata;

	spr.x = x;
	spr.y = y;

	addMinimapSprite(spr, "minimap/enemy");
	addHpBar(spr);

	return spr;
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

function addMinimapSprite(parentSprite, minimapImage) {
	var minimapSpr = game.minimapGroup.create(0, 0, "minimap", minimapImage);

	minimapSpr.userdata = {
		parentSprite: parentSprite
	};

	game.minimapSprites.push(minimapSpr);
}

function getUpgradePrice(upgradeName) {
	var index = UPGRADES_NAMES.indexOf(upgradeName);
	var upgradeLevel = game.upgrades[index];
	return upgradeLevel * 300;
}

function getDamage() {
	return game.upgrades[UPGRADES_NAMES.indexOf("Damage")];
}

function getBulletSpeed() {
	return game.upgrades[UPGRADES_NAMES.indexOf("Bullet Speed")] * 300;
}

function getFireRate() {
	return 1/game.upgrades[UPGRADES_NAMES.indexOf("Fire Rate")];
}

function getAcceleration() {
	return game.upgrades[UPGRADES_NAMES.indexOf("Acceleration")] * 300;
}

function getBrakePower() {
	var value = game.upgrades[UPGRADES_NAMES.indexOf("Brake Power")];
	if (value == 1) return 0.98;
	if (value == 2) return 0.97;
	if (value == 3) return 0.96;
	if (value == 4) return 0.95;
	if (value == 5) return 0.94;
	if (value > 5) return 0.93;
}

function buttonPressed(pointer, gameObject) {
	var name = gameObject.name;

	if (UPGRADES_NAMES.indexOf(name) != -1) {
		var index = UPGRADES_NAMES.indexOf(name);
		var price = getUpgradePrice(name);

		if (game.money < price) return;

		game.money -= price;
		game.upgrades[index]++;
	}
}

function addHpBar(parentSprite) {
	var bar = game.hpGroup.create(0, 0, "sprites", "sprites/hpBar");
	bar.userdata = {
		parentSprite: parentSprite,
		alwaysShow: false,
		lastHitTime: 0
	};

	parentSprite.userdata.hpBar = bar;
	game.minimap.ignore(bar);

	return bar;
}

function showHpBar(sprite) {
	var bar = sprite.userdata.hpBar;
	if (!bar) return;

	bar.userdata.lastHitTime = game.time;
}

function hitPlayer(amount) {
	if (game.time - game.lastPlayerHitTime < PLAYER_INVINCIBILITY_TIME * 1000) return;

	game.player.userdata.hp -= amount;
	game.lastPlayerHitTime = game.time;
	showHpBar(game.player);

	if (game.player.userdata.hp <= 0) {
		game.player.x = game.map.widthInPixels / 2;
		game.player.y = game.map.heightInPixels / 2;
		game.lastPlayerHitTime = game.time + 2000;
		game.player.userdata.hp = game.player.userdata.maxHp;
		game.money -= 1000;
	}
}

function emitMoney(amount, x, y) {
	for (var i = 0; i < amount; i++) {
		var spr = game.moneyGroup.create(x, y, "particles", "particles/money");
		spr.scaleX = spr.scaleY = rnd(0.1, 0.5);
		spr.blendMode = "ADD";

		spr.setVelocity(rnd(-50, 50), rnd(-50, 50));
		spr.setDrag(5, 5);

		spr.userdata = {
			creationTime: game.time
		}
	}
}
