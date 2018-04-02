var DAMAGE = "Damage";
var BULLET_SPEED = "Bullet Speed";
var FIRE_RATE = "Fire Rate";
var BULLET_SPREAD = "Bullet Spread";
var ACCELERATION = "Acceleration";
var BRAKE_POWER = "Brake Power";
var MAX_HP = "Max Hp";
var HP_REGEN = "Hp Regen";
var MAGNET_RANGE = "Magnet Range";
var MAGNET_POWER = "Magnet Power";
var BUILD_TURRET = "Build Turret";
var REPAIR_BASE = "Repair Base";
var NONE = "none";

var UPGRADES_NAMES = [
	DAMAGE, BULLET_SPEED, FIRE_RATE,
	BULLET_SPREAD, ACCELERATION, BRAKE_POWER,
	MAX_HP, HP_REGEN, MAGNET_RANGE,
	MAGNET_POWER, BUILD_TURRET, REPAIR_BASE
];

function getUpgradePrice(upgradeName) {
	if (upgradeName == "Repair Base") {
		if (game.baseOver.userdata.hp <= 0) return 500;
		else return 200;
	}

	if (upgradeName == "Build Turret") {
		return 500;
	}

	var index = UPGRADES_NAMES.indexOf(upgradeName);
	var upgradeLevel = game.upgrades[index];
	return upgradeLevel * 300;
}

function refreshUpgrades() {
	game.player.userdata.maxHp = (game.upgrades[UPGRADES_NAMES.indexOf(MAX_HP)] - 1) * 2 + 10;
	game.player.userdata.hpRegen = game.upgrades[UPGRADES_NAMES.indexOf(HP_REGEN)];
	game.player.userdata.magnetRange = (game.upgrades[UPGRADES_NAMES.indexOf(MAGNET_RANGE)] - 1) * 50 + 100;
	game.player.userdata.magnetPower = (game.upgrades[UPGRADES_NAMES.indexOf(MAGNET_POWER)] - 1) * 100 + 100;
}

function getUpgradeValue(type) {
	if (type == DAMAGE) return game.upgrades[UPGRADES_NAMES.indexOf(DAMAGE)];
	if (type == BULLET_SPEED) return game.upgrades[UPGRADES_NAMES.indexOf(BULLET_SPEED)] * 300;
	if (type == BULLET_SPREAD) return game.upgrades[UPGRADES_NAMES.indexOf(BULLET_SPREAD)];
	if (type == FIRE_RATE) return 1/game.upgrades[UPGRADES_NAMES.indexOf(FIRE_RATE)];
	if (type == ACCELERATION) return game.upgrades[UPGRADES_NAMES.indexOf(ACCELERATION)] * 300;

	if (type == BRAKE_POWER) {
		var value = game.upgrades[UPGRADES_NAMES.indexOf(BRAKE_POWER)];
		if (value == 1) return 0.98;
		if (value == 2) return 0.97;
		if (value == 3) return 0.96;
		if (value == 4) return 0.95;
		if (value == 5) return 0.94;
		if (value > 5) return 0.93;
	}
}
