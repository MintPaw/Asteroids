/*
TODO:
*/

let MenuScene = {
	key: "menu",
	create: menuCreate,
	update: menuUpdate
};

let GameScene = {
	key: "game",
	preload: preload,
	create: create,
	update: update
};

let config = {
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

let abs = Math.abs;
let log = console.log;
let phaser = new Phaser.Game(config);

let ENEMY_BASIC_SHIP = "basicShip";
let ENEMY_VESSEL = "vessel";
let ENEMY_VESSEL_LING = "vesselLing";
let ENEMY_SCANNER = "scanner";
let ENEMY_HIDER = "hider";

let WARNING_TIME = 2;
let PLAYER_INVINCIBILITY_TIME = 1;
let MONEY_LIFETIME = 10;

let game = {
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
	key6: null,
	key7: null,
	key8: null,
	key9: null,
	key0: null,
	keyE: null,
	keyF: null,

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
	shopButtons: [],

	upgrades: [],
	money: 0,
	moneyText: null,

	lastPlayerHitTime: 0,

	wave: 0,
	waveText: null,
	waveTime: 0,
	speedUpTimer: false,
};

let scene = null;

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
			let i, removedItems = [];
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
		game.key6 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SIX);
		game.key7 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SEVEN);
		game.key8 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.EIGHT);
		game.key9 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NINE);
		game.key0 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ZERO);
		game.keyE = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
		game.keyF = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

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
		let mapScale = 0.04;
		game.minimap = scene.cameras.add(0, 0, game.map.widthInPixels * mapScale, game.map.heightInPixels * mapScale);
		game.minimap.y = game.height - game.minimap.height;
		game.minimap.setBounds(0, 0, game.map.widthInPixels, game.map.heightInPixels);
		game.minimap.scrollX = game.map.widthInPixels / 2 - game.minimap.width/2;
		game.minimap.scrollY = game.map.heightInPixels / 2 - game.minimap.height/2;
		game.minimap.zoom = mapScale;
		game.minimap.setBackgroundColor(0x002244);
		game.minimap.ignore(game.mapLayers[0]);
		game.minimap.roundPixels = true;

		let horiLines = 4;
		let vertLines = 4;

		for (let i = 1; i < horiLines; i++) {
			let line = scene.add.graphics({ lineStyle: { width: 4, color: 0xFFFFFF } });
			line.strokeLineShape(new Phaser.Geom.Line(0, 0, game.map.widthInPixels, 0));
			line.y = game.map.heightInPixels/horiLines * i;
			scene.cameras.main.ignore(line);
		}

		for (let i = 1; i < vertLines; i++) {
			let line = scene.add.graphics({ lineStyle: { width: 4, color: 0xFFFFFF } });
			line.strokeLineShape(new Phaser.Geom.Line(0, 0, 0, game.map.heightInPixels));
			line.x = game.map.widthInPixels/vertLines * i;
			scene.cameras.main.ignore(line);
		}
	}

	{ /// Setup bases
		for (baseData of game.map.getObjectLayer("bases").objects) {
			let spr = game.baseGroup.create(baseData.x + game.map.tileWidth/2, baseData.y + game.map.tileHeight/2, "sprites", "sprites/bases/base1");

			spr.userdata = {
				type: "base",
				num: parseInt(baseData.type),
				enabled: false,
				maxHp: 30,
				hp: 30,
				turretSprite: null,
				timePerShot: 7,
				timeTillNextShot: 0
			};

			addMinimapSprite(spr, "minimap/base1");
			let bar = addHpBar(spr);
			bar.userdata.alwaysShow = true;
		}
	}

	{ /// Setup player
		let spr = scene.physics.add.image(0, 0, "sprites", "sprites/player/player");
		scaleSpriteToSize(spr, 64, 64);
		spr.x = game.map.widthInPixels/2;
		spr.y = game.map.heightInPixels/2;
		spr.angle -= 90;
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
		scene.physics.world.addCollider(game.enemyGroup, game.player, null, playerVEnemyProcess);
	}

	{ /// Setup shop
		{ /// Prompt
			let spr = scene.add.text(0, 0, "Press E to shop", {font: "32px Arial"});
			spr.setScrollFactor(0, 0);
			game.minimap.ignore(spr);

			game.shopPrompt = spr;
		}

		{ /// Buttons
			let cols = 3;
			let rows = 4;
			let pad = 10;

			for (let y = 0; y < rows; y++) {
				for (let x = 0; x < cols; x++) {
					let index = (x % cols) + (y * cols);
					let spr = scene.add.image(0, 0, "ui", "ui/shopButton");
					scaleSpriteToSize(spr, 128, 64);

					let totalW = (spr.displayWidth + pad) * cols;
					let totalH = (spr.displayHeight + pad) * rows;

					spr.x = x * (spr.displayWidth + pad) + (game.width/2 - totalW/2) + spr.displayWidth/2;
					spr.y = y * (spr.displayHeight + pad) + (game.height/2 - totalH/2) + spr.displayHeight/2;
					spr.setScrollFactor(0, 0);
					spr.setInteractive();
					spr.userdata = {
						tf: null
					};
					spr.setName(UPGRADES_NAMES[index]);
					game.shopButtons.push(spr);

					let textPoint = spr.getTopLeft();
					let tf = scene.add.text(textPoint.x, textPoint.y, "none", {font: "16px Arial", wordWrap: {width: spr.width}});
					tf.setScrollFactor(0, 0);

					spr.userdata.tf = tf;
				}
			}
		}
	}

	{ /// Setup upgrades
		for (let i = 0; i < UPGRADES_NAMES.length; i++) game.upgrades.push(1);
	}

	{ /// Setup hud
		{ /// Money text
			let tf = scene.add.text(0, 0, "Money: ????", {font: "32px Arial"});
			tf.setScrollFactor(0, 0);
			game.minimap.ignore(tf);

			game.moneyText = tf;
		}

		{ /// Wave text
			let tf = scene.add.text(0, 0, "Wave: ????\n00:00 till next wave\n(Click here to speed up)", {font: "32px Arial"});
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
		timedMsg(1, "Scanners and hiders incoming");
		timedCreateEnemy(2, ENEMY_HIDER, 5 * game.map.tileWidth, 52 * game.map.tileHeight);
		timedCreateEnemy(2, ENEMY_SCANNER, 92 * game.map.tileWidth, 52 * game.map.tileHeight);

		game.waveTime = 60;
	}

	if (game.wave == 2) {
		timedMsg(1, "Ships and vessles!");
		timedCreateEnemy(2, ENEMY_VESSEL, 5 * game.map.tileWidth, 52 * game.map.tileHeight);
		timedCreateEnemy(2, ENEMY_BASIC_SHIP, 92 * game.map.tileWidth, 52 * game.map.tileHeight);

		game.waveTime = 120;
	}

	if (game.wave == 3) {
		timedMsg(1, "A bunch of stuff!");
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

	let left = false;
	let right = false;
	let up = false;
	let down = false;
	let shoot = false;
	let shop = false;
	let speedUpWave = false;

	{ /// Update inputs
		if (game.keyW.isDown || game.keyUp.isDown) up = true;
		if (game.keyS.isDown || game.keyDown.isDown) down = true;
		if (game.keyA.isDown || game.keyLeft.isDown) left = true;
		if (game.keyD.isDown || game.keyRight.isDown) right = true;
		if (game.keySpace.isDown) shoot = true;
		if (game.keyE.isDown) shop = true;
		if (game.keyF.isDown) speedUpWave = true;

		if (game.key1.isDown) {
			emitMoney(10, game.player.x, game.player.y);
		}

		if (game.key0.timeUp) {
			game.key0.timeUp = 0;
			msg("Clearing wave");

			var enemies = [];
			for (enemy of game.enemyGroup.getChildren()) enemies.push(enemy);
			for (enemy of enemies) destroyEnemy(enemy);
			game.waveTime = 999999;
		}

		if (game.key9.timeUp) {
			game.key9.timeUp = 0;
			msg("Spawning basic ship");
			createEnemy(ENEMY_BASIC_SHIP, 48 * game.map.tileWidth, 2 * game.map.tileHeight);
		}

		if (game.key8.timeUp) {
			game.key8.timeUp = 0;
			msg("Spawning vessel");
			createEnemy(ENEMY_VESSEL, 48 * game.map.tileWidth, 2 * game.map.tileHeight);
		}

		if (game.key7.timeUp) {
			game.key7.timeUp = 0;
			msg("Spawning scanner");
			createEnemy(ENEMY_SCANNER, 48 * game.map.tileWidth, 2 * game.map.tileHeight);
		}

		if (game.key6.timeUp) {
			game.key6.timeUp = 0;
			msg("Spawning hider");
			createEnemy(ENEMY_HIDER, 48 * game.map.tileWidth, 2 * game.map.tileHeight);
		}
	}

	{ /// Update player
		if (game.player.active) {
			game.player.setAcceleration(0, 0);
			let speed = getUpgradeValue(ACCELERATION);
			let brakePerc = getUpgradeValue(BRAKE_POWER);

			let turnSpeed = 5;
			if (up) game.player.setAcceleration(Math.cos(game.player.angle * Math.PI/180) * speed, Math.sin(game.player.angle * Math.PI/180) * speed);
			if (left) game.player.angle -= turnSpeed;
			if (right) game.player.angle += turnSpeed;
			if (down) game.player.setVelocity(game.player.body.velocity.x * brakePerc, game.player.body.velocity.y * brakePerc);

			game.timeTillNextShot -= game.elapsed;
			if (shoot && game.timeTillNextShot <= 0) {
				game.timeTillNextShot = getUpgradeValue(FIRE_RATE);
				game.totalShots++;

				let spread = getUpgradeValue(BULLET_SPREAD);
				let bulletSpeed = getUpgradeValue(BULLET_SPEED);
				if (game.totalShots % 2) {
					if (spread == 1) {
						shootBullet(game.player, game.player.angle, bulletSpeed, true);
					} else if (spread == 2) {
						shootBullet(game.player, game.player.angle - 10, bulletSpeed, true);
						shootBullet(game.player, game.player.angle + 10, bulletSpeed, true);
					} else if (spread == 3) {
						shootBullet(game.player, game.player.angle, bulletSpeed, true);
						shootBullet(game.player, game.player.angle - 10, bulletSpeed, true);
						shootBullet(game.player, game.player.angle + 10, bulletSpeed, true);
					} else if (spread == 4) {
						shootBullet(game.player, game.player.angle, bulletSpeed, true);
						shootBullet(game.player, game.player.angle - 10, bulletSpeed, true);
						shootBullet(game.player, game.player.angle + 10, bulletSpeed, true);
					} else if (spread == 5) {
						shootBullet(game.player, game.player.angle - 20, bulletSpeed, true);
						shootBullet(game.player, game.player.angle - 10, bulletSpeed, true);
						shootBullet(game.player, game.player.angle + 10, bulletSpeed, true);
						shootBullet(game.player, game.player.angle + 20, bulletSpeed, true);
						shootBullet(game.player, game.player.angle, bulletSpeed, true);
					}
				} else {
					if (spread == 1) {
						shootBullet(game.player, game.player.angle, bulletSpeed, true);
					} else if (spread == 2) {
						shootBullet(game.player, game.player.angle, bulletSpeed, true);
					} else if (spread == 3) {
						shootBullet(game.player, game.player.angle + 10, bulletSpeed, true);
						shootBullet(game.player, game.player.angle - 10, bulletSpeed, true);
					} else if (spread == 4) {
						shootBullet(game.player, game.player.angle - 20, bulletSpeed, true);
						shootBullet(game.player, game.player.angle - 10, bulletSpeed, true);
						shootBullet(game.player, game.player.angle + 10, bulletSpeed, true);
						shootBullet(game.player, game.player.angle + 20, bulletSpeed, true);
					} else if (spread == 5) {
						shootBullet(game.player, game.player.angle - 20, bulletSpeed, true);
						shootBullet(game.player, game.player.angle - 10, bulletSpeed, true);
						shootBullet(game.player, game.player.angle + 10, bulletSpeed, true);
						shootBullet(game.player, game.player.angle + 20, bulletSpeed, true);
						shootBullet(game.player, game.player.angle, bulletSpeed, true);
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
		let edgeSprites = []
		edgeSprites.push(...game.enemyGroup.getChildren());
		if (game.player.active) edgeSprites.push(game.player);

		let minX = 0;
		let minY = 0;
		let edgeX = game.map.widthInPixels;
		let edgeY = game.map.heightInPixels;

		scene.cameras.main.setBounds(minX, minY, edgeX, edgeY);

		for (spr of edgeSprites) {
			let hit = false;

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
		let targets = [];
		targets.push(game.player);
		targets.push(...game.baseGroup.getChildren());

		for (enemySprite of game.enemyGroup.getChildren()) {
			if (enemySprite.userdata.type == ENEMY_BASIC_SHIP) {
				enemySprite.userdata.target = getClosestTarget(enemySprite, targets);

				if (enemySprite.userdata.target) {
					let target = enemySprite.userdata.target;

					enemySprite.angle = getAngleBetweenCoords(enemySprite.x, enemySprite.y, target.x, target.y);
					enemySprite.userdata.timeTillNextShot -= game.elapsed;
					enemySprite.setAcceleration();

					if (getDistanceBetween(enemySprite, target) > 200) {
						scene.physics.accelerateToObject(enemySprite, target, enemySprite.userdata.speed);
					} else {
						enemySprite.setVelocity(enemySprite.body.velocity.x * enemySprite.userdata.brakePerc, enemySprite.body.velocity.y * enemySprite.userdata.brakePerc);

						if (enemySprite.userdata.timeTillNextShot <= 0) {
							enemySprite.userdata.timeTillNextShot = enemySprite.userdata.timePerShot;
							let bullet = shootBullet(enemySprite, enemySprite.angle, 200, false);
							bullet.userdata.damage = enemySprite.userdata.bulletDamage;
						}
					}
				}
			}

			if (enemySprite.userdata.type == ENEMY_VESSEL) {
				scene.physics.accelerateToObject(enemySprite, game.player, enemySprite.userdata.speed);
			}

			if (enemySprite.userdata.type == ENEMY_VESSEL_LING) {
				scene.physics.accelerateToObject(enemySprite, game.player, enemySprite.userdata.speed);
			}

			if (enemySprite.userdata.type == ENEMY_SCANNER) {
				if (enemySprite.userdata.scanPerc >= 100) {
					enemySprite.userdata.scanningText.visible = true;
					enemySprite.userdata.scanningText.setText("Calling for backup");
					let retreatAngle = Math.atan2(game.map.heightInPixels/2 - enemySprite.y, game.map.widthInPixels/2 - enemySprite.x);
					enemySprite.setAcceleration(-Math.cos(retreatAngle) * enemySprite.userdata.speed, -Math.sin(retreatAngle) * enemySprite.userdata.speed);
				} else {
					let newTarget = getClosestTarget(enemySprite, game.baseGroup.getChildren(targets));
					if (enemySprite.userdata.target != newTarget) enemySprite.userdata.scanPerc = 0;
					enemySprite.userdata.target = newTarget;

					if (enemySprite.userdata.target) {
						let target = enemySprite.userdata.target;

						if (getDistanceBetween(enemySprite, target) > 200) {
							scene.physics.accelerateToObject(enemySprite, target, enemySprite.userdata.speed);
							enemySprite.userdata.scanningText.visible = false;
						} else {
							enemySprite.userdata.scanningText.visible = true;
							enemySprite.userdata.scanningText.setText("Scanning "+Math.round(enemySprite.userdata.scanPerc*10)/10+"%");
							enemySprite.userdata.scanPerc += 0.1;
							enemySprite.rotation += 0.1;
							enemySprite.setVelocity(enemySprite.body.velocity.x * enemySprite.userdata.brakePerc, enemySprite.body.velocity.y * enemySprite.userdata.brakePerc);
						}
					}
				}

				if (enemySprite.userdata.scanningText.visible) {
					enemySprite.userdata.scanningText.x = enemySprite.x - 100 / 2;
					enemySprite.userdata.scanningText.y = enemySprite.y + enemySprite.height;
				}
			}

			if (enemySprite.userdata.type == ENEMY_HIDER) {
				enemySprite.userdata.target = getClosestTarget(enemySprite, targets);
				let targetSprite = enemySprite.userdata.hidingTargetSprite;

				if (enemySprite.userdata.target) {
					let target = enemySprite.userdata.target;

					enemySprite.angle = getAngleBetweenCoords(enemySprite.x, enemySprite.y, target.x, target.y);
					enemySprite.userdata.timeTillNextShot -= game.elapsed;
					enemySprite.setAcceleration();

					if (enemySprite.userdata.hidingPerc > 0) {
						if (enemySprite.userdata.hidingPerc < 100) {
							enemySprite.userdata.hidingText.visible = true;
							enemySprite.userdata.hidingText.x = enemySprite.x - 100 / 2;
							enemySprite.userdata.hidingText.y = enemySprite.y + enemySprite.height;
							enemySprite.userdata.hidingText.setText("Hiding "+Math.round(enemySprite.userdata.hidingPerc)+"%");
							enemySprite.userdata.hidingPerc += 0.5;
							if (enemySprite.userdata.hidingPerc >= 100) {
								enemySprite.userdata.hidingText.visible = false;
								enemySprite.userdata.hidingTargetSprite.alpha = 1;
								enemySprite.alpha = 0.5;

								targetSprite.x = enemySprite.x + (rnd(200, 300) * (rndBool() ? -1 : 1));
								targetSprite.y = enemySprite.y + (rnd(200, 300) * (rndBool() ? -1 : 1));
							}
						}
					}

					if (enemySprite.userdata.hidingPerc >= 100) {
						var angle = degToRad(getAngleBetweenCoords(enemySprite.x, enemySprite.y, targetSprite.x, targetSprite.y));
						enemySprite.setAcceleration(0, 0);
						enemySprite.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100);

						if (getDistanceBetween(enemySprite, targetSprite) < 5) {
							enemySprite.setVelocity(0, 0);
							enemySprite.userdata.hidingPerc = 0;
							enemySprite.alpha = 1;
							targetSprite.alpha = 0;
						}
					}

					if (enemySprite.userdata.hidingPerc < 100) {
						if (getDistanceBetween(enemySprite, target) > 200) {
							scene.physics.accelerateToObject(enemySprite, target, enemySprite.userdata.speed);
						} else {
							enemySprite.setVelocity(enemySprite.body.velocity.x * enemySprite.userdata.brakePerc, enemySprite.body.velocity.y * enemySprite.userdata.brakePerc);

							if (enemySprite.userdata.timeTillNextShot <= 0) {
								enemySprite.userdata.timeTillNextShot = enemySprite.userdata.timePerShot;
								let bullet = shootBullet(enemySprite, enemySprite.angle, 200, false);
								bullet.userdata.damage = enemySprite.userdata.bulletDamage;
							}
						}
					}
				}
			}
		}
	}

	{ /// Update bullets
		let allBullets = [];
		allBullets.push(...game.bulletGroup.getChildren());
		allBullets.push(...game.enemyBulletsGroup.getChildren());

		for (spr of allBullets) {
			spr.alpha -= 0.005;
			spr.userdata.graphic.x = spr.x;
			spr.userdata.graphic.y = spr.y;
		}

		for (spr of game.bulletGroup.getChildren()) {
			if (spr.alpha <= 0) {
				spr.destroy();
				spr.userdata.graphic.destroy();
				game.bulletGroup.remove(spr);
			}
		}

		for (spr of game.enemyBulletsGroup.getChildren()) {
			if (spr.alpha <= 0) {
				spr.destroy();
				spr.userdata.graphic.destroy();
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
		game.shopPrompt.visible = game.isOverBase;

		if (game.isOverBase) {
			game.shopPrompt.x = game.width/2 - game.shopPrompt.width/2;
			game.shopPrompt.y = game.height - game.shopPrompt.height - 10;
			if (shop) {
				game.inShop = true;
				game.player.setVelocity(0, 0);
			}
		} else {
			game.inShop = false;
		}

		for (spr of game.shopButtons) {
			spr.visible = game.inShop;
			spr.userdata.tf.visible = game.inShop;
		}

		if (game.inShop) {
			for (btn of game.shopButtons) {
				let index = UPGRADES_NAMES.indexOf(btn.name);
				let price = getUpgradePrice(btn.name);
				let tf = btn.userdata.tf;
				let upgradeName = UPGRADES_NAMES[index];
				let enabled = true;

				if (upgradeName == REPAIR_BASE) {
					tf.setText(upgradeName + "\nPrice: " + price);
					if (game.baseOver.userdata.hp >= game.baseOver.userdata.maxHp) enabled = false;
				} else if (upgradeName == BUILD_TURRET) {
					tf.setText(upgradeName + "\nPrice: " + price);
					if (game.baseOver.userdata.turretSprite) enabled = false;
				} else {
					tf.setText(upgradeName + "\nLevel: " + game.upgrades[index] + "\nPrice: " + price);
				}
				if (game.money < price) enabled = false;

				if (enabled) {
					btn.alpha = btn.isJustDown ? 0.5 : 1;
				} else {
					btn.alpha = 0.5;
				}

				if (enabled && btn.isJustDown) {
					game.money -= price;

					if (upgradeName == REPAIR_BASE) {
						game.baseOver.userdata.hp = game.baseOver.userdata.maxHp;
					} else if (upgradeName == BUILD_TURRET) {
						let base = game.baseOver;
						let spr = scene.add.image(0, 0, "sprites", "sprites/bases/turret");
						scaleSpriteToSize(spr, 32, 32);
						spr.tint = 0x333333;
						spr.x = base.x;
						spr.y = base.y;
						base.userdata.turretSprite = spr;
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

		if (game.enemyGroup.countActive() > 0) {
			game.waveText.setText("Wave: "+game.wave+"\n"+Math.round(game.waveTime)+" till next");
		} else {
			game.waveText.setText("Wave: "+game.wave+"\n"+Math.round(game.waveTime)+" till next\nHold F to speed up");
			if (speedUpWave) game.waveTime -= game.elapsed * 9;
		}

		for (bar of game.hpGroup.getChildren()) {
			let spr = bar.userdata.parentSprite;
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

				if (bar.userdata.parentSprite.userdata.type == "base" && !bar.userdata.parentSprite.userdata.enabled) bar.alpha = 0;
			} else {
				let timeSinceHit = game.time - bar.userdata.lastHitTime;
				let barFadeTime = 3000;
				let barMinFade = 0.1;
				let perc = 1 - timeSinceHit/barFadeTime;
				if (perc < barMinFade) perc = barMinFade;
				bar.alpha = perc;
			}
		}
	}

	{ /// Update money particles
		for (spr of game.moneyGroup.getChildren()) {
			spr.setAcceleration(0, 0);
			if (getDistanceBetween(spr, game.player) < game.player.userdata.magnetRange) {
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
		if (game.waveTime <= 0) {
			game.wave++;
			startWave();
		}
	}

	{ /// Update bases
		for (base of game.baseGroup.getChildren()) {

			if (!base.userdata.enabled) {
				base.alpha = 0.1;
				base.userdata.minimapSprite.alpha = 0;
			} else if (base.userdata.hp <= 0) {
				base.alpha = 0.5;
				base.userdata.minimapSprite.alpha = 0.5;
			} else {
				base.alpha = 1;
				base.userdata.minimapSprite.alpha = 1;
			}

			let turret = base.userdata.turretSprite;
			if (turret) {
				let target = getClosestTarget(turret, game.enemyGroup.getChildren());
				if (target) {
					turret.angle = getAngleBetweenCoords(turret.x, turret.y, target.x, target.y);

					base.userdata.timeTillNextShot -= game.elapsed;
					if (getDistanceBetween(turret, target) < 1000 && base.userdata.timeTillNextShot <= 0) {
						base.userdata.timeTillNextShot = base.userdata.timePerShot;
						shootBullet(turret, turret.angle, 500, true);
					}
				}
			}
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
	let text = scene.add.text(0, 0, str, {font: "64px Arial"});
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
	let spr = null;

	// let line = scene.add.graphics({ lineStyle: { width: 4, color: 0xaa00aa } });
	// line.strokeLineShape(new Phaser.Geom.Line(0, 0, 500, 0));
	// line.x = sourceSprite.x;
	// line.y = sourceSprite.y;
	// line.rotation = angle * Math.PI/180;

	// scene.tweens.add({
	// 	targets: line,
	// 	alpha: { value: 0, duration: 5000, ease: "Power1" },
	// 	onComplete: function() {
	// 		line.destroy();
	// 	}
	// });

	if (isFriendly) spr = game.bulletGroup.create(0, 0, "sprites", "sprites/bullets/bullet1");
	else spr = game.enemyBulletsGroup.create(0, 0, "sprites", "sprites/bullets/bullet1");
	spr.visible = false;

	let graphic = scene.add.image(0, 0, "sprites", "sprites/bullets/bulletGraphic");
	graphic.blendMode = "ADD";

	spr.userdata = {
		damage: 1,
		graphic: graphic
	};

	if (isFriendly) spr.userdata.damage = getUpgradeValue(DAMAGE);

	angle = angle * Math.PI/180;

	spr.x = sourceSprite.x + Math.cos(angle) * (sourceSprite.width/2);
	spr.y = sourceSprite.y + Math.sin(angle) * (sourceSprite.height/2);

	let extraX = 0;
	let extraY = 0;
	if (sourceSprite.body) {
		extraX = sourceSprite.body.velocity.x;
		extraY = sourceSprite.body.velocity.y;
	}

	spr.setVelocity(Math.cos(angle) * speed + extraX, Math.sin(angle) * speed + extraY);

	game.minimap.ignore(spr);
	return spr;
}

function bulletVEnemy(s1, s2) {
	let bullet = game.bulletGroup.contains(s1) ? s1 : s2;
	let enemy = bullet == s1 ? s2 : s1;

	if (enemy.userdata.type == ENEMY_HIDER) {
		if (enemy.userdata.hidingPerc == 0) enemy.userdata.hidingPerc = 0.01;
		if (enemy.userdata.hidingPerc >= 100) return;
	}

	enemy.userdata.hp -= bullet.userdata.damage;

	if (!enemy.userdata.penetrable) bullet.alpha = 0;

	if (enemy.userdata.type == ENEMY_VESSEL) {
		for (let i = 0; i < bullet.userdata.damage; i++) createEnemy(ENEMY_VESSEL_LING, enemy.x, enemy.y);
	}

	if (enemy.userdata.hp <= 0) destroyEnemy(enemy);

	showHpBar(enemy);
}

function destroyEnemy(enemy) {
	let xpos = enemy.x;
	let ypos = enemy.y;

	enemy.destroy();
	game.enemyGroup.remove(enemy);

	if (enemy.userdata.type == ENEMY_VESSEL) {
		for (let i = 0; i < 5; i++) createEnemy(ENEMY_VESSEL_LING, enemy.x, enemy.y);
	}

	if (enemy.userdata.type == ENEMY_SCANNER) {
		enemy.userdata.scanningText.destroy();
	}

	if (enemy.userdata.type == ENEMY_HIDER) {
		enemy.userdata.hidingText.destroy();
		enemy.userdata.hidingTargetSprite.destroy();
	}

	emitMoney(enemy.userdata.worth, xpos, ypos);
}


function bulletVPlayer(s1, s2) {
	let player = s1 == game.player ? s1 : s2;
	let bullet = player == s1 ? s2 : s1;
	bullet.alpha = 0;

	hitPlayer(bullet.userdata.damage);
}

function enemyVPlayer(s1, s2) {
	let player = s1 == game.player ? s1 : s2;
	let enemy = player == s1 ? s2 : s1;

	/// This pushes players away, but we can just use phaser collision for now
	// let playerAngle = getAngleBetweenCoords(player.x, player.y, enemy.x, enemy.y);

	// let force = 10;
	// enemy.body.velocity.x += Math.cos(playerAngle) * force;
	// enemy.body.velocity.y += Math.sin(playerAngle) * force;

	// player.body.velocity.x += Math.cos(playerAngle-180) * force;
	// player.body.velocity.y += Math.sin(playerAngle-180) * force;
}

function bulletVBase(s1, s2) {
	let bullet = game.enemyBulletsGroup.contains(s1) ? s1 : s2;
	let base = bullet == s1 ? s2 : s1;

	if (base.userdata.hp <= 0 || !base.userdata.enabled) return;

	base.userdata.hp -= bullet.userdata.damage;
	if (base.userdata.hp <= 0) {
		let basesAlive = 0;

		for (base of game.baseGroup.getChildren())
			if (base.userdata.hp > 0)
				basesAlive++;

		msg("Base destroyed, "+basesAlive+" left");
	}

	bullet.alpha = 0;
}

function playerVBase(s1, s2) {
	let player = s1 == game.player ? s1 : s2;
	let base = player == s1 ? s2 : s1;

	if (!base.userdata.enabled) return;

	game.baseOver = base;
	game.isOverBase = true;
}

function playerVEnemy(s1, s2) {
	let player = s1 == game.player ? s1 : s2;
	let enemy = player == s1 ? s2 : s1;

	if (enemy.userdata.type == ENEMY_HIDER) {
		if (enemy.userdata.hidingPerc == 0) enemy.userdata.hidingPerc = 0.01;
		if (enemy.userdata.hidingPerc >= 100) return;
	}

	hitPlayer(0.5);
}

function playerVEnemyProcess(s1, s2) {
	let player = s1 == game.player ? s1 : s2;
	let enemy = player == s1 ? s2 : s1;

	if (enemy.userdata.type == ENEMY_HIDER) {
		if (enemy.userdata.hidingPerc >= 100) return false;
	}

	return true;
}

function playerVMoney(s1, s2) {
	let player = s1 == game.player ? s1 : s2;
	let money = player == s1 ? s2 : s1;

	if (money.alpha <= 0) return;
	money.alpha = 0;
	game.money++;
}

function warnEnemy(timeTill, type, x, y) {
	let spr = scene.add.image(0, 0, "sprites", "sprites/exclam");
	spr.x = x;
	spr.y = y;

	let loops = 5;

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
	let spr;

	let userdata = {
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

	if (type == ENEMY_HIDER) {
		spr = game.enemyGroup.create(0, 0, "sprites", "sprites/enemies/hider");
		scaleSpriteToSize(spr, 64, 64);

		userdata.speed = 40;
		userdata.hidingPerc = 0;
		userdata.hidingText = scene.add.text(0, 0, "Hiding...", {font: "16px Arial"});
		userdata.hidingText.visible = false;
		userdata.hidingTargetSprite = scene.add.image(0, 0, "sprites", "sprites/enemies/hidingTarget");
		userdata.hidingTargetSprite.alpha = 0;
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
	let warningTime = time - WARNING_TIME;
	if (warningTime < 0) warningTime = 0;

	scene.time.delayedCall(warningTime * 1000, warnEnemy.bind(null, time - warningTime, type, x, y));
	scene.time.delayedCall(time * 1000, createEnemy.bind(null, type, x, y));
}

function timedMsg(time, str) {
	scene.time.delayedCall(time * 1000, msg.bind(null, str));
}

function addMinimapSprite(parentSprite, minimapImage) {
	let minimapSpr = game.minimapGroup.create(0, 0, "minimap", minimapImage);

	minimapSpr.userdata = {
		parentSprite: parentSprite
	};

	if (!parentSprite.userdata) parentSprite.userdata = {};
	parentSprite.userdata.minimapSprite = minimapSpr;

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
	let bar = game.hpGroup.create(0, 0, "sprites", "sprites/hpBar");
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
	let bar = sprite.userdata.hpBar;
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
	for (let i = 0; i < amount; i++) {
		let spr = game.moneyGroup.create(x, y, "sprites", "sprites/money");
		spr.scaleX = spr.scaleY = rnd(0.1, 0.5);

		spr.setVelocity(rnd(-50, 50), rnd(-50, 50));
		spr.setDrag(5, 5);

		spr.userdata = {
			creationTime: game.time
		}
	}
}

function getClosestTarget(spr, others) {
	let closest = null;
	let closestDist = 9999999;

	for (other of others) {
		if (!other.active) continue;
		if (other.userdata.hp <= 0) continue;
		if (other.userdata.type == "base" && !other.userdata.enabled) continue;
		let otherDist = getDistanceBetween(spr, other);
		if (otherDist < closestDist) {
			closest = other;
			closestDist = otherDist;
		}
	}

	return closest;
}
