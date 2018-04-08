let Vector2 = Phaser.Math.Vector2;

function scaleSpriteToSize(spr, newWidth, newHeight) {
	spr.scaleX = newWidth/spr.width;
	spr.scaleY = newHeight/spr.height;
}

function rnd(min, max) {
	return Math.random() * (max - min) + min;
}

function rndBool() {
	return Math.random() > 0.5;
}

function getAngleBetweenCoords(x1, y1, x2, y2) {
	let angle = Math.atan2(y2 - y1, x2 - x1);
	angle = angle * (180/Math.PI);
	return angle;
}

function getDistanceBetween(spr1, spr2) {
	return spr1.getCenter().distance(spr2.getCenter());
}

function degToRad(deg) {
	return deg * 0.0174533;
}

function radToDeg(rad) {
	return rad * 57.2958;
}
