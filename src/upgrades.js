var DAMAGE = "Damage";
var BULLET_SPEED = "Bullet Speed";
var FIRE_RATE = "Fire Rate";
var BULLET_SPREAD = "Bullet Spread";
var ACCELERATION = "Acceleration";
var BRAKE_POWER = "Brake Power";
var MAX_HP = "Max Hp";
var HP_REGEN = "Hp Regen";
var REPAIR_BASE = "Repair Base";
var NONE = "none";

var UPGRADES_NAMES = [
	DAMAGE, BULLET_SPEED, FIRE_RATE,
	BULLET_SPREAD, ACCELERATION, BRAKE_POWER,
	MAX_HP, HP_REGEN, NONE,
	NONE, NONE, REPAIR_BASE
];

function getUpgradePrice(upgradeName) {
	if (upgradeName == "Repair Base") {
		if (game.baseOver.userdata.hp <= 0) return 500;
		else return 200;
	}

	var index = UPGRADES_NAMES.indexOf(upgradeName);
	var upgradeLevel = game.upgrades[index];
	return upgradeLevel * 300;
}

function refreshUpgrades() {
	game.player.userdata.maxHp = game.upgrades[UPGRADES_NAMES.indexOf(MAX_HP)]*2 + 10;
	game.player.userdata.hpRegen = game.upgrades[UPGRADES_NAMES.indexOf(HP_REGEN)];
}

function getDamage() {
	return game.upgrades[UPGRADES_NAMES.indexOf(DAMAGE)];
}

function getBulletSpeed() {
	return game.upgrades[UPGRADES_NAMES.indexOf(BULLET_SPEED)] * 300;
}

function getBulletSpread() {
	return game.upgrades[UPGRADES_NAMES.indexOf(BULLET_SPREAD)];
}

function getFireRate() {
	return 1/game.upgrades[UPGRADES_NAMES.indexOf(FIRE_RATE)];
}

function getAcceleration() {
	return game.upgrades[UPGRADES_NAMES.indexOf(ACCELERATION)] * 300;
}

function getBrakePower() {
	var value = game.upgrades[UPGRADES_NAMES.indexOf(BRAKE_POWER)];
	if (value == 1) return 0.98;
	if (value == 2) return 0.97;
	if (value == 3) return 0.96;
	if (value == 4) return 0.95;
	if (value == 5) return 0.94;
	if (value > 5) return 0.93;
}

