let DAMAGE = "Damage";
let BULLET_SPEED = "Bullet Speed";
let FIRE_RATE = "Fire Rate";
let BULLET_SPREAD = "Bullet Spread";
let ACCELERATION = "Acceleration";
let BRAKE_POWER = "Brake Power";
let MAX_HP = "Max Hp";
let HP_REGEN = "Hp Regen";
let MAGNET_RANGE = "Magnet Range";
let MAGNET_POWER = "Magnet Power";
let BUILD_TURRET = "Build Turret";
let REPAIR_BASE = "Repair Base";
let NONE = "none";

let UPGRADES_NAMES = [
	DAMAGE, NONE, FIRE_RATE,
	BULLET_SPREAD, ACCELERATION, BRAKE_POWER,
	MAX_HP, HP_REGEN, MAGNET_RANGE,
	MAGNET_POWER, BUILD_TURRET, REPAIR_BASE
];

function getUpgradePrice(upgradeName) {
	let index = UPGRADES_NAMES.indexOf(upgradeName);
	let upgradeLevel = game.upgrades[index];

	if (upgradeName == REPAIR_BASE) {
		if (game.baseOver.userdata.hp <= 0) return 500;
		else return 200;
	}

	if (upgradeName == BUILD_TURRET) {
		return 500;
	}

	if (upgradeName == DAMAGE) {
		return upgradeLevel * 500;
	}

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
	// if (type == BULLET_SPEED) return game.upgrades[UPGRADES_NAMES.indexOf(BULLET_SPEED)] * 300 + 600;
	if (type == BULLET_SPEED) return 1000;
	if (type == BULLET_SPREAD) return game.upgrades[UPGRADES_NAMES.indexOf(BULLET_SPREAD)];
	if (type == FIRE_RATE) return 1/game.upgrades[UPGRADES_NAMES.indexOf(FIRE_RATE)];
	if (type == ACCELERATION) return (game.upgrades[UPGRADES_NAMES.indexOf(ACCELERATION)] + 2) * 300;

	if (type == BRAKE_POWER) {
		let value = game.upgrades[UPGRADES_NAMES.indexOf(BRAKE_POWER)];
		if (value == 1) return 0.97;
		if (value == 2) return 0.96;
		if (value == 3) return 0.95;
		if (value == 4) return 0.94;
		if (value == 5) return 0.93;
		if (value > 5) return 0.92;
	}
}
