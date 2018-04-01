function scaleSpriteToSize(spr, newWidth, newHeight) {
	spr.scaleX = newWidth/spr.width;
	spr.scaleY = newHeight/spr.height;
}

function rnd(min, max) {
	return Math.random() * (max - min) + min;
}

function getAngleBetween(x1, y1, x2, y2) {
	var angle = Math.atan2(y2 - y1, x2 - x1);
	angle = angle * (180/Math.PI);
	return angle;
}

function getDistanceBetween(x1, y1, x2, y2) {
	var a = x1 - x2;
	var b = y1 - y2;

	return Math.sqrt(a*a + b*b);
}
