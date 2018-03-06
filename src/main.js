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
	playerDrag: 0.01
};

function preload() {
}

function create() {
	var scene = this;

	{ /// Section: Player
		var spr = scene.add.graphics(0, 0);
		spr.fillStyle(0x0000FF, 1);
		spr.fillCircle(0, 0, 30);

		game.playerSprite = spr;
		game.playerMaxVelo = new Point(5, 5);
	}
}

function update() {
	var scene = this;

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

	log(game.playerVelo);

}
