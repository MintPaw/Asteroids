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
var ENEMY_SCANNER = "scanner";

var WARNING_TIME = 2;
var PLAYER_INVINCIBILITY_TIME = 1;
var MONEY_LIFETIME = 10;

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
	totalShots: 0,

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

	inGame: false,

	map: null,
	mapTiles: null,
	mapLayers: [],

	minimap: null,
	minimapSprites: [],

	baseOver: null, 
	isOverBase: false,
	inShop: false,
	shopPrompt: null,
	shopSprites: [],
	shopButtons: [],
	shopButtonTexts: [],

	upgrades: [],
	money: 0,
	moneyText: null,

	lastPlayerHitTime: 0,

	wave: 0,
	waveText: null,
	waveTime: 0,
	speedUpTimer: false,
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

		scene.input.on("gameobjectdown", gameObjectDown, this);
		scene.input.on("gameobjectup", gameObjectUp, this);
		scene.input.on("gameobjectout", gameObjectOut, this);
	}

	{ /// Setup map
		game.map = scene.make.tilemap({ key: "map1" });
		game.mapTiles = game.map.addTilesetImage("tilesheet", "tilesheet");

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
				num: parseInt(baseData.type),
				enabled: false,
				maxHp: 30,
				hp: 30
			};

			addMinimapSprite(spr, "minimap/base1");
			var bar = addHpBar(spr);
			bar.userdata.alwaysShow = true;
		}
	}

	{ /// Setup player
		var spr = scene.physics.add.image(0, 0, "sprites", "sprites/player/player");
		scaleSpriteToSize(spr, 64, 64);
		spr.x = game.map.widthInPixels/2;
		spr.y = game.map.heightInPixels/2;
		spr.setDrag(5, 5);
		spr.setMaxVelocity(500, 500);

		addMinimapSprite(spr, "minimap/player");

		spr.userdata = {
			maxHp: 10,
			hp: 10,
			hpRegen: 1,
			magnetRange: 100,
			magnetPower: 100
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
			var rows = 4;
			var pad = 10;

			for (var y = 0; y < rows; y++) {
				for (var x = 0; x < cols; x++) {
					var index = (x % cols) + (y * cols);
					var spr = scene.add.image(0, 0, "ui", "ui/shopButton");
					scaleSpriteToSize(spr, 128, 64);

					var totalW = (spr.displayWidth + pad) * cols;
					var totalH = (spr.displayHeight + pad) * rows;

					spr.x = x * (spr.displayWidth + pad) + (game.width/2 - totalW/2) + spr.displayWidth/2;
					spr.y = y * (spr.displayHeight + pad) + (game.height/2 - totalH/2) + spr.displayHeight/2;
					spr.setScrollFactor(0, 0);
					spr.setInteractive();
					spr.userdata = {
						enabled: true
					};
					spr.setName(UPGRADES_NAMES[index]);
					game.shopSprites.push(spr);
					game.shopButtons.push(spr);

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
		{ /// Money text
			var tf = scene.add.text(0, 0, "Money: ????", {font: "32px Arial"});
			tf.setScrollFactor(0, 0);
			game.minimap.ignore(tf);

			game.moneyText = tf;
		}

		{ /// Wave text
			var tf = scene.add.text(0, 0, "Wave: ????\n00:00 till next wave\n(Click here to speed up)", {font: "32px Arial"});
			tf.y = game.height - game.minimap.height - tf.height;
			tf.setScrollFactor(0, 0);
			// tf.setInteractive();
			tf.setName("Wave Text");
			game.minimap.ignore(tf);

			game.waveText = tf;
		}
	}

	game.inGame = true;
}

function startWave() {
	function enableBase(baseNum) {
		for (base of game.baseGroup.getChildren())
			if (base.userdata.num == baseNum)
				base.userdata.enabled = true;
	}

	if (game.wave == 1) {
		enableBase(0);
		timedMsg(1, "Scanners incoming");
		timedCreateEnemy(2, ENEMY_SCANNER, 5 * game.map.tileWidth, 52 * game.map.tileHeight);
		timedCreateEnemy(2, ENEMY_SCANNER, 5 * game.map.tileWidth, 58 * game.map.tileHeight);
		timedCreateEnemy(2, ENEMY_SCANNER, 92 * game.map.tileWidth, 52 * game.map.tileHeight);
		timedCreateEnemy(2, ENEMY_SCANNER, 92 * game.map.tileWidth, 58 * game.map.tileHeight);

		game.waveTime = 60;
	}

	if (game.wave == 2) {
		timedMsg(1, "A bunch of stuff!");
		timedCreateEnemy(2, ENEMY_VESSEL, 5 * game.map.tileWidth, 52 * game.map.tileHeight);
		timedCreateEnemy(2, ENEMY_SCANNER, 5 * game.map.tileWidth, 58 * game.map.tileHeight);
		timedCreateEnemy(2, ENEMY_BASIC_SHIP, 92 * game.map.tileWidth, 52 * game.map.tileHeight);

		game.waveTime = 120;
	}

	if (game.wave == 3) {
		timedMsg(1, "A copy of the previous wave!");
		timedCreateEnemy(2, ENEMY_VESSEL, 5 * game.map.tileWidth, 52 * game.map.tileHeight);
		timedCreateEnemy(2, ENEMY_SCANNER, 5 * game.map.tileWidth, 58 * game.map.tileHeight);
		timedCreateEnemy(2, ENEMY_BASIC_SHIP, 92 * game.map.tileWidth, 52 * game.map.tileHeight);

		game.waveTime = 120;
	}

	if (game.wave == 4) {
		timedMsg(1, "No more waves");
		game.waveTime = 999999;
	}
}

function update(delta) {
	if (!game.inGame) return;

	game.time = phaser.loop.time;
	game.elapsed = phaser.loop.delta / 1000;

	var left = false;
	var right = false;
	var up = false;
	var down = false;
	var shoot = false;
	var shop = false;

	{ /// Update inputs
		if (game.keyW.isDown || game.keyUp.isDown) up = true;
		if (game.keyS.isDown || game.keyDown.isDown) down = true;
		if (game.keyA.isDown || game.keyLeft.isDown) left = true;
		if (game.keyD.isDown || game.keyRight.isDown) right = true;
		if (game.keySpace.isDown) shoot = true;
		if (game.key5.isDown) {
			emitMoney(10, game.player.x, game.player.y);
		}
		if (game.key4.isDown) {
			emitMoney(10, game.player.x, game.player.y - 200);
		}
		if (game.keyE.isDown) shop = true;
	}

	{ /// Update player
		if (game.player.active) {
			game.player.setAcceleration(0, 0);
			var speed = getAcceleration();
			var brakePerc = getBrakePower();

			var turnSpeed = 5;
			if (up) game.player.setAcceleration(Math.cos((game.player.angle - 90)  * Math.PI/180) * speed, Math.sin((game.player.angle - 90) * Math.PI/180) * speed);
			if (left) game.player.angle -= turnSpeed;
			if (right) game.player.angle += turnSpeed;
			if (down) game.player.setVelocity(game.player.body.velocity.x * brakePerc, game.player.body.velocity.y * brakePerc);

			game.timeTillNextShot -= game.elapsed;
			if (shoot && game.timeTillNextShot <= 0) {
				game.timeTillNextShot = getFireRate();
				game.totalShots++;

				var spread = getBulletSpread();
				if (game.totalShots % 2) {
					if (spread == 1) {
						shootBullet(game.player, game.player.angle - 90, getBulletSpeed(), true);
					} else if (spread == 2) {
						shootBullet(game.player, game.player.angle - 90 - 10, getBulletSpeed(), true);
						shootBullet(game.player, game.player.angle - 90 + 10, getBulletSpeed(), true);
					} else if (spread == 3) {
						shootBullet(game.player, game.player.angle - 90, getBulletSpeed(), true);
						shootBullet(game.player, game.player.angle - 90 - 10, getBulletSpeed(), true);
						shootBullet(game.player, game.player.angle - 90 + 10, getBulletSpeed(), true);
					} else if (spread == 4) {
						shootBullet(game.player, game.player.angle - 90, getBulletSpeed(), true);
						shootBullet(game.player, game.player.angle - 90 - 10, getBulletSpeed(), true);
						shootBullet(game.player, game.player.angle - 90 + 10, getBulletSpeed(), true);
					} else if (spread == 5) {
						shootBullet(game.player, game.player.angle - 90 - 20, getBulletSpeed(), true);
						shootBullet(game.player, game.player.angle - 90 - 10, getBulletSpeed(), true);
						shootBullet(game.player, game.player.angle - 90 + 10, getBulletSpeed(), true);
						shootBullet(game.player, game.player.angle - 90 + 20, getBulletSpeed(), true);
						shootBullet(game.player, game.player.angle - 90, getBulletSpeed(), true);
					}
				} else {
					if (spread == 1) {
						shootBullet(game.player, game.player.angle - 90, getBulletSpeed(), true);
					} else if (spread == 2) {
						shootBullet(game.player, game.player.angle - 90, getBulletSpeed(), true);
					} else if (spread == 3) {
						shootBullet(game.player, game.player.angle - 90 + 10, getBulletSpeed(), true);
						shootBullet(game.player, game.player.angle - 90 - 10, getBulletSpeed(), true);
					} else if (spread == 4) {
						shootBullet(game.player, game.player.angle - 90 - 20, getBulletSpeed(), true);
						shootBullet(game.player, game.player.angle - 90 - 10, getBulletSpeed(), true);
						shootBullet(game.player, game.player.angle - 90 + 10, getBulletSpeed(), true);
						shootBullet(game.player, game.player.angle - 90 + 20, getBulletSpeed(), true);
					} else if (spread == 5) {
						shootBullet(game.player, game.player.angle - 90 - 20, getBulletSpeed(), true);
						shootBullet(game.player, game.player.angle - 90 - 10, getBulletSpeed(), true);
						shootBullet(game.player, game.player.angle - 90 + 10, getBulletSpeed(), true);
						shootBullet(game.player, game.player.angle - 90 + 20, getBulletSpeed(), true);
						shootBullet(game.player, game.player.angle - 90, getBulletSpeed(), true);
					}
				}
			}

			if (game.time - game.lastPlayerHitTime < PLAYER_INVINCIBILITY_TIME * 1000) {
				game.player.alpha = Math.sin(game.time);
			} else {
				game.player.alpha = 1;
			}

			if (game.player.userdata.hp < game.player.userdata.maxHp) game.player.userdata.hp += game.player.userdata.hpRegen * 0.002;
		}
	}

	{ /// Update sceen edges
		var edgeSprites = []
		edgeSprites.push(...game.enemyGroup.getChildren());
		if (game.player.active) edgeSprites.push(game.player);

		var minX = 0;
		var minY = 0;
		var edgeX = game.map.widthInPixels;
		var edgeY = game.map.heightInPixels;

		scene.cameras.main.setBounds(minX, minY, edgeX, edgeY);

		for (spr of edgeSprites) {
			var hit = false;

			if (spr.x < minX) {
				hit = true;
				spr.x = minX;
				spr.setVelocityX(0);
			}

			if (spr.y < minY) {
				hit = true;
				spr.y = minY;
				spr.setVelocityY(0);
			}

			if (spr.x > edgeX) {
				hit = true;
				spr.x = edgeX;
				spr.setVelocityX(0);
			}

			if (spr.y > edgeY) {
				hit = true;
				spr.y = edgeY;
				spr.setVelocityY(0);
			}

			if (hit && spr.userdata.type == ENEMY_SCANNER && spr.userdata.scanPerc >= 100) {
				createEnemy(ENEMY_BASIC_SHIP, spr.x, spr.y);
				destroyEnemy(spr);
			}
		}
	}

	{ /// Update enemies
		for (spr of game.enemyGroup.getChildren()) {
			if (spr.userdata.type == ENEMY_BASIC_SHIP) {

				var targets = [];
				targets.push(game.player);
				targets.push(...game.baseGroup.getChildren());
				spr.userdata.target = getClosestTarget(spr, targets);

				if (spr.userdata.target) {
					var target = spr.userdata.target;

					spr.angle = getAngleBetween(spr.x, spr.y, target.x, target.y) + 90;
					spr.userdata.timeTillNextShot -= game.elapsed;
					spr.setAcceleration();

					var dist = spr.getCenter().distance(target.getCenter());
					if (dist > 200) {
						scene.physics.accelerateToObject(spr, target, spr.userdata.speed);
					} else {
						spr.setVelocity(spr.body.velocity.x * spr.userdata.brakePerc, spr.body.velocity.y * spr.userdata.brakePerc);

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

			if (spr.userdata.type == ENEMY_SCANNER) {

				if (spr.userdata.scanPerc >= 100) {
					spr.userdata.scanningText.visible = true;
					spr.userdata.scanningText.setText("Calling for backup");
					var retreatAngle = Math.atan2(game.map.heightInPixels/2 - spr.y, game.map.widthInPixels/2 - spr.x);
					spr.setAcceleration(-Math.cos(retreatAngle) * spr.userdata.speed, -Math.sin(retreatAngle) * spr.userdata.speed);
				} else {
					var newTarget = getClosestTarget(spr, game.baseGroup.getChildren(targets));
					if (spr.userdata.target != newTarget) spr.userdata.scanPerc = 0;
					spr.userdata.target = newTarget;

					if (spr.userdata.target) {
						var target = spr.userdata.target;

						var dist = spr.getCenter().distance(target.getCenter());
						if (dist > 200) {
							scene.physics.accelerateToObject(spr, target, spr.userdata.speed);
							spr.userdata.scanningText.visible = false;
						} else {
							spr.userdata.scanningText.visible = true;
							spr.userdata.scanningText.setText("Scanning "+Math.round(spr.userdata.scanPerc*10)/10+"%");
							spr.userdata.scanPerc += 0.1;
							spr.rotation += 0.1;
							spr.setVelocity(spr.body.velocity.x * spr.userdata.brakePerc, spr.body.velocity.y * spr.userdata.brakePerc);
						}
					}
				}

				if (spr.userdata.scanningText.visible) {
					spr.userdata.scanningText.x = spr.x - 100 / 2;
					spr.userdata.scanningText.y = spr.y + spr.height;
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
		if (game.isOverBase) {
			game.shopPrompt.visible = true;
			game.shopPrompt.x = game.width/2 - game.shopPrompt.width/2;
			game.shopPrompt.y = game.height - game.shopPrompt.height - 10;
			if (shop) {
				game.inShop = true;
				game.player.setVelocity(0, 0);
			}
		} else {
			game.shopPrompt.visible = false;
			game.inShop = false;
		}

		for (spr of game.shopSprites) {
			spr.visible = game.inShop;
		}

		if (game.inShop) {

			for (var i = 0; i < game.shopButtonTexts.length; i++) {
				var tf = game.shopButtonTexts[i];

				if (UPGRADES_NAMES[i] == REPAIR_BASE) {
					tf.setText(UPGRADES_NAMES[i] + "\nPrice: " + getUpgradePrice(UPGRADES_NAMES[i]));
					game.shopButtons[i].userdata.enabled = game.baseOver.userdata.hp != game.baseOver.userdata.maxHp;
				} else {
					tf.setText(UPGRADES_NAMES[i] + "\nLevel: " + game.upgrades[i] + "\nPrice: " + getUpgradePrice(UPGRADES_NAMES[i]));
				}
			}

			for (btn of game.shopButtons) {
				btn.alpha = btn.isJustDown ? 0.5 : 1;
				if (btn.isJustDown) {
					if (!btn.userdata.enabled) continue;
					var index = UPGRADES_NAMES.indexOf(btn.name);
					var price = getUpgradePrice(btn.name);

					if (game.money < price) continue;
					game.money -= price;

					if (name == "Repair Base") {
						game.baseOver.userdata.hp = game.baseOver.userdata.maxHp;
					} else {
						game.upgrades[index]++;
					}

					refreshUpgrades();
				}
			}
		}
	}

	{ /// Update hud
		game.moneyText.setText("Money: "+game.money);
		game.waveText.setText("Wave: "+game.wave+"\n"+Math.round(game.waveTime)+" till next");

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
			if (getDistanceBetween(spr.x, spr.y, game.player.x, game.player.y) < game.player.userdata.magnetRange) {
				scene.physics.accelerateToObject(spr, game.player, game.player.userdata.magnetPower);
			}

			if (spr.alpha > 0) spr.alpha = 1 - ((game.time - spr.userdata.creationTime) / (MONEY_LIFETIME*1000));

			if (spr.alpha <= 0) {
				spr.destroy();
				game.moneyGroup.remove(spr);
			}
		}
	}

	{ /// Update wave
		game.waveTime -= game.elapsed;
		// if (game.waveText.isDown) game.waveTime -= game.elapsed * 9;
		if (game.waveTime <= 0) {
			game.wave++;
			startWave();
		}
	}

	{ /// Reset inputs
		game.mouseJustDown = false;
		game.mouseJustUp = false;

		game.isOverBase = false;
		game.speedUpTimer = false;

		for (spr of scene.children.list) {
			spr.isJustDown = false;
		}
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

	enemy.userdata.hp -= bullet.userdata.damage;

	if (!enemy.userdata.penetrable) bullet.alpha = 0;

	if (enemy.userdata.type == ENEMY_VESSEL) {
		for (var i = 0; i < bullet.userdata.damage; i++) createEnemy(ENEMY_VESSEL_LING, enemy.x, enemy.y);
	}

	if (enemy.userdata.hp <= 0) destroyEnemy(enemy);

	showHpBar(enemy);
}

function destroyEnemy(enemy) {
	var xpos = enemy.x;
	var ypos = enemy.y;

	enemy.destroy();
	game.enemyGroup.remove(enemy);

	if (enemy.userdata.type == ENEMY_VESSEL) {
		for (var i = 0; i < 5; i++) createEnemy(ENEMY_VESSEL_LING, enemy.x, enemy.y);
	}

	if (enemy.userdata.type == ENEMY_SCANNER) {
		enemy.userdata.scanningText.destroy();
	}

	emitMoney(enemy.userdata.worth, xpos, ypos);
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

	if (base.userdata.hp <= 0) return;

	base.userdata.hp -= bullet.userdata.damage;
	if (base.userdata.hp <= 0) {
		var basesAlive = 0;
		for (base of game.baseGroup.getChildren())
			if (base.userdata.hp > 0)
				basesAlive++;
		msg("Base destroyed, "+basesAlive+" left");
	}

	bullet.alpha = 0;
}

function playerVBase(s1, s2) {
	var player = s1 == game.player ? s1 : s2;
	var base = player == s1 ? s2 : s1;
	game.baseOver = base;
	game.isOverBase = true;
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
		brakePerc: 0.99,

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

	if (type == ENEMY_SCANNER) {
		spr = game.enemyGroup.create(0, 0, "sprites", "sprites/enemies/scanner");
		scaleSpriteToSize(spr, 64, 64);
		userdata.worth = 100;
		userdata.maxHp = 3;
		userdata.speed = 40;
		userdata.brakePerc = 0.95;

		userdata.scanPerc = 0;
		userdata.scanningText = scene.add.text(0, 0, "Scanning...", {font: "16px Arial"});
		game.minimap.ignore(userdata.scanningText);
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

function gameObjectDown(pointer, gameObject) {
	gameObject.isDown = true;
	gameObject.isJustDown = true;
}

function gameObjectUp(pointer, gameObject) {
	gameObject.isDown = false;
}

function gameObjectOut(pointer, gameObject) {
	gameObject.isDown = false;
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

function getClosestTarget(spr, others) {
	var closest = null;
	var closestDist = 9999999;

	var sprCenter = spr.getCenter();
	for (other of others) {
		if (!other.active) continue;
		if (other.userdata.hp <= 0) continue;
		if (other.userdata.type == "base" && !other.userdata.enabled) continue;
		var otherDist = sprCenter.distance(other.getCenter());
		if (otherDist < closestDist) {
			closest = other;
			closestDist = otherDist;
		}
	}

	return closest;
}
