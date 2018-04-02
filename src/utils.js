let Vector2 = Phaser.Math.Vector2;

function scaleSpriteToSize(spr, newWidth, newHeight) {
	spr.scaleX = newWidth/spr.width;
	spr.scaleY = newHeight/spr.height;
}

function rnd(min, max) {
	return Math.random() * (max - min) + min;
}

function getAngleBetween(x1, y1, x2, y2) {
	let angle = Math.atan2(y2 - y1, x2 - x1);
	angle = angle * (180/Math.PI);
	return angle;
}

function getDistanceBetween(spr1, spr2) {
	return spr1.getCenter().distance(spr2.getCenter());
}
