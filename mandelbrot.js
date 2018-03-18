var colorScale = 4;
var x = -2;
var y = -1;
var width = 3;
var pixelSize = 0;
var aspectRatio = 0;
var i = 0x100;
var drawing = false;
var cancelDrawing = false;
var quality = 5;
var renderQueue = [];
var scaleWarning = true;

$(function(){
	c = $("#canvas")[0];
	ctx = c.getContext("2d");
	ctx.canvas.width = $("#canvas").width();
	ctx.canvas.height = $("#canvas").height();
	aspectRatio = $("#canvas").height() / $("#canvas").width();
	pixelSize = width / $("#canvas").width();
	$("#canvas").on("mousedown", function(e){
		if (e.button == 0){
			cancel();
			$("#canvas").data("startX", e.clientX)
				.data("startY", e.clientY)
				.data("image", ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height))
				.data("dragging", true);
		}
	});
	$("#canvas").on("mouseup", function(e){
		if ($("#canvas").data("dragging")){
			$("#canvas").data("dragging", false);
			if (e.clientX - $("#canvas").data("startX") == 0 && e.clientY - $("#canvas").data("startY") == 0){
				var centerX = ctx.canvas.width / 2;
				var centerY = ctx.canvas.height / 2;
				var deltaX = centerX - e.clientX;
				var deltaY = centerY - e.clientY;
				ctx.putImageData($("#canvas").data("image"),deltaX,deltaY);
			} else {
				var deltaX = e.clientX - $("#canvas").data("startX");
				var deltaY = e.clientY - $("#canvas").data("startY");
			}
			x -= deltaX * pixelSize;
			y -= deltaY * pixelSize;
			translateQueue(deltaX, deltaY);
			if (deltaX < 0 && deltaY == 0){
				renderQueue.push([ctx.canvas.width + deltaX, 0, ctx.canvas.width, ctx.canvas.height, quality, true]);
			} else if (deltaX > 0 && deltaY == 0){
				renderQueue.push([0, 0, deltaX, ctx.canvas.height, quality, true]);
			} else if (deltaX == 0 && deltaY < 0){
				renderQueue.push([0, ctx.canvas.height + deltaY, ctx.canvas.width, ctx.canvas.height, quality, true]);
			} else if (deltaX == 0 && deltaY > 0){
				renderQueue.push([0, 0, ctx.canvas.width, deltaY, quality, true]);
			} else if (deltaX < 0 && deltaY < 0){
				renderQueue.push([ctx.canvas.width + deltaX, 0, ctx.canvas.width, ctx.canvas.height, quality, true]);
				renderQueue.push([0, ctx.canvas.height + deltaY, ctx.canvas.width + deltaX, ctx.canvas.height, quality, true]);
			} else if (deltaX < 0 && deltaY > 0){
				renderQueue.push([ctx.canvas.width + deltaX, 0, ctx.canvas.width, ctx.canvas.height, quality, true]);
				renderQueue.push([0, 0, ctx.canvas.width + deltaX, deltaY, quality, true]);
			} else if (deltaX > 0 && deltaY < 0){
				renderQueue.push([0, 0, deltaX, ctx.canvas.height, quality, true]);
				renderQueue.push([deltaX, ctx.canvas.height + deltaY, ctx.canvas.width, ctx.canvas.height, quality, true]);
			} else if (deltaX > 0 && deltaY > 0){
				renderQueue.push([0, 0, deltaX, ctx.canvas.height, quality, true]);
				renderQueue.push([deltaX, 0, ctx.canvas.width, deltaY, quality, true]);
			}
			render();
		}
	});
	$("#canvas").on("mousemove", function(e){
		if ($("#canvas").data("dragging")){
			ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
			ctx.putImageData($("#canvas").data("image"),
				e.clientX - $("#canvas").data("startX"),
				e.clientY - $("#canvas").data("startY"));
		}
	});
	$("#zoomIn").on("click", function(){
		cancelDrawing = true;
		whenNotDrawing(function(){
			cancelDrawing = false;
			x += width * 0.25;
			y += width * aspectRatio * 0.25;
			width *= 0.5;
			pixelSize = width / $("#canvas").width();
			renderQueue.push([0, 0, ctx.canvas.width, ctx.canvas.height, quality, false]);
			render();
		});
	});
	$("#zoomOut").on("click", function(){
		cancelDrawing = true;
		whenNotDrawing(function(){
			cancelDrawing = false;
			width /= 0.5;
			x -= width * 0.25;
			y -= width * aspectRatio * 0.25;
			pixelSize = width / $("#canvas").width();
			renderQueue.push([0, 0, ctx.canvas.width, ctx.canvas.height, quality, false]);
			render();
		});
	});
	$("#rerender").on("click", function(){
		cancelDrawing = true;
		whenNotDrawing(function(){
			cancelDrawing = false;
			var image = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.canvas.width = $("#canvas").width();
			ctx.canvas.height = $("#canvas").height();
			ctx.putImageData(image, 0, 0);
			aspectRatio = $("#canvas").height() / $("#canvas").width();
			pixelSize = width / $("#canvas").width();
			renderQueue.push([0, 0, ctx.canvas.width, ctx.canvas.height, quality, true]);
			render();
		});
	});
	$("#rerenderHQ").on("click", function(){
		cancelDrawing = true;
		whenNotDrawing(function(){
			cancelDrawing = false;
			var image = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.canvas.width = $("#canvas").width();
			ctx.canvas.height = $("#canvas").height();
			ctx.putImageData(image, 0, 0);
			aspectRatio = $("#canvas").height() / $("#canvas").width();
			pixelSize = width / $("#canvas").width();
			renderQueue.push([0, 0, ctx.canvas.width, ctx.canvas.height, 1, false]);
			render();
		});
	});
	$("#moreI").on("click", function(){
		cancelDrawing = true;
		whenNotDrawing(function(){
			cancelDrawing = false;
			i *= 2;
			renderQueue.push([0, 0, ctx.canvas.width, ctx.canvas.height, quality, false]);
			render();
		});
	});
	$("#lessI").on("click", function(){
		cancelDrawing = true;
		whenNotDrawing(function(){
			cancelDrawing = false;
			i /= 2;
			renderQueue.push([0, 0, ctx.canvas.width, ctx.canvas.height, quality, false]);
			render();
		});
	});
	$("#stop").on("click", function(){
		cancel(function(){
            renderQueue = [];
        });
	});
	$("#saveLoadSettings").on("click", function(){
		var oldSettings = [x,y,width,i,quality];
		var oldSettingsStr = JSON.stringify(oldSettings);
		var newSettingsStr = prompt("Settings:", oldSettingsStr);
		var newSettings = JSON.parse(newSettingsStr);
		if (oldSettingsStr != newSettingsStr){
			x = newSettings[0];
			y = newSettings[1];
			width = newSettings[2];
			i = newSettings[3];
			quality = newSettings[4];
			renderQueue.push([0, 0, ctx.canvas.width, ctx.canvas.height, quality, true]);
			render();
		}
	});
	$("#scaledScreenshot").on("click", function(){
		cancelDrawing = true;
		whenNotDrawing(function(){
			cancelDrawing = false;
			var scale = parseFloat(prompt("Scale:", "1"));
			if (scaleWarning && scale > 2){
				alert("Scales higher than 2 can cause crashes");
                scaleWarning = false;
				return;
			}
			ctx.canvas.width *= scale;
			ctx.canvas.height = ctx.canvas.width * aspectRatio;
			drawPart(0, 0, ctx.canvas.width, ctx.canvas.height, 1, function(){
				/*popup(c.toDataURL());
				ctx.canvas.width = $("#canvas").width();
				ctx.canvas.height = $("#canvas").height();
				aspectRatio = $("#canvas").height() / $("#canvas").width();
				pixelSize = width / $("#canvas").width();
				renderQueue.push([0, 0, ctx.canvas.width, ctx.canvas.height, quality, false]);
				render();*/
			});
		});
	});
	$("#screenshot").on("click", function(){
		//$("<a>").attr("href", c.toDataURL()).attr("target", "_blank")[0].click();
        popup(c.toDataURL());
	});
	renderQueue.push([0, 0, ctx.canvas.width, ctx.canvas.height, quality, true]);
	render();
});
function popup(url){
    var string = url;
    var iframe = "<style>body{margin:0;}</style><iframe style='width:100%;height:100%;border:none' src='" + string + "'></iframe>"
    var x = window.open();
    x.document.open();
    x.document.write(iframe);
    x.document.close();
}
function translateQueue(deltaX, deltaY){
	for (var z = 0; z < renderQueue.length; z++){
		renderQueue[z][0] = Math.max(Math.min(renderQueue[z][0] + deltaX, ctx.canvas.width), 0);
		renderQueue[z][1] = Math.max(Math.min(renderQueue[z][1] + deltaY, ctx.canvas.height), 0);
		renderQueue[z][2] = Math.max(Math.min(renderQueue[z][2] + deltaX, ctx.canvas.width), 0);
		renderQueue[z][3] = Math.max(Math.min(renderQueue[z][3] + deltaY, ctx.canvas.height), 0);
	}
}
function scale(min, max, newmin, newmax, index){
	var size = max - min;
	var realindex = index - min;
	var amplitude = realindex / size;
	var newsize = newmax - newmin;
	var newrealindex = amplitude * newsize;
	return newrealindex + newmin;
}
function imageSetPixel(image, x, y, r, g, b, a){
	a = a || 255;
	var width = image.width;
	var height = image.height;
	var index = (y * width + x) * 4;
	image.data[index] = r;
	image.data[index+1] = g;
	image.data[index+2] = b;
	image.data[index+3] = a;
	return image;
}
function mandelbrot2(re, im, i){
	var zre = 0;
	var zim = 0;
	for (var x = 0; x < i; x ++){
		var zre2 = zre*zre + zim*zim*-1 + re;
		var zim2 = zre*zim + zim*zre + im;
		zre = zre2;
		zim = zim2;
		if (Math.pow(zre, 2) + Math.pow(zim, 2) > 4){
			return x;
		}
	}
	return -1;
}
function render(){
	if (renderQueue.length > 0){
		var part = renderQueue.pop();
		drawPart(part[0], part[1], part[2], part[3], part[4], render, part[5]);
	}
}
function drawPart(startX, startY, endX, endY, thickness, callback, preserve){
	if (preserve == undefined) preserve = true;
	callback = callback || function(){};
	drawing = true;
	thickness = thickness || 1;
	if (endX-startX > endY-startY){
		drawPartRow(startX, startY, endX, endY, startY, thickness, callback, preserve);
	} else {
		drawPartColumn(startX, startY, endX, endY, startX, thickness, callback, preserve);
	}
}
function drawPartRow(blockX, blockY, blockXMax, blockYMax, Y, thickness, callback, preserve){
	if (cancelDrawing){
		if (preserve) renderQueue.push([blockX, Y, blockXMax, blockYMax, thickness]);
		drawing = false;
		return;
	}
	var _width = ctx.canvas.width;
	var _height = ctx.canvas.height;
	var realy = scale(0, _height-1, y, y+width*aspectRatio, Y);
	for (var _x = blockX; _x < blockXMax; _x += thickness){
		var realx = scale(0, _width-1, x, x+width, _x);
		var mandel = Math.max(mandelbrot2(realx, realy, i),0);
		var shade = mandel * colorScale;
		var rgb = numberToRGB(shade);
		var r = rgb[0];
		var g = rgb[1];
		var b = rgb[2];
		ctx.fillStyle = "rgb(" + [r,g,b].join(",") + ")";
		ctx.fillRect(_x, Y, thickness, thickness);
	}
	if (Y < blockYMax){
		setTimeout(function(){
			drawPartRow(blockX, blockY, blockXMax, blockYMax, Y + thickness, thickness, callback, preserve);
		}, 0);
	} else {
		drawing = false;
		callback();
	}
}
function drawPartColumn(blockX, blockY, blockXMax, blockYMax, X, thickness, callback, preserve){
	if (cancelDrawing){
		if (preserve) renderQueue.push([X, blockY, blockXMax, blockYMax, thickness]);
		drawing = false;
		return;
	}
	var _width = ctx.canvas.width;
	var _height = ctx.canvas.height;
	var realx = scale(0, _width-1, x, x+width, X);
	for (var _y = blockY; _y < blockYMax; _y += thickness){
		var realy = scale(0, _height-1, y, y+width*aspectRatio, _y);
		var mandel = Math.max(mandelbrot2(realx, realy, i),0);
		var shade = mandel * colorScale;
		var rgb = numberToRGB(shade);
		var r = rgb[0];
		var g = rgb[1];
		var b = rgb[2];
		ctx.fillStyle = "rgb(" + [r,g,b].join(",") + ")";
		ctx.fillRect(X, _y, thickness, thickness);
	}
	if (X < blockXMax){
		setTimeout(function(){
			drawPartColumn(blockX, blockY, blockXMax, blockYMax, X + thickness, thickness, callback, preserve);
		}, 0);
	} else {
		drawing = false;
		callback();
	}
}
function numberToRGB(num){
	var bnum = num % 256;
	num = num % (256 * 6);
	if (num < 256 * 1){
		return [bnum, 0, 0];
	} else if (num < 256 * 2){
		return [255, bnum, 0];
	} else if (num < 256 * 3){
		return [255 - bnum, 255, 0];
	} else if (num < 256 * 4){
		return [0, 255, bnum];
	} else if (num < 256 * 5){
		return [0, 255 - bnum, 255];
	} else if (num < 256 * 6){
		return [0, 0, 255-bnum];
	}
}
function whenNotDrawing(callback){
	function check(){
		if (!drawing){
			callback();
		} else {
			setTimeout(check, 10);
		}
	}
	check();
}
function cancel(callback){
	callback = callback || function(){};
	cancelDrawing = true;
	whenNotDrawing(function(){
		cancelDrawing = false;
		callback();
	});
}