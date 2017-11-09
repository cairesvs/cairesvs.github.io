var pageLoaded = false;
window.onload = function () {
    pageLoaded = true;
    init();
};
window.onresize = init;

var mouseDown = false;
var scrolling = false;

var mouseDownX = 0;
var mouseDownY = 0;

var scrollX = 0;
var scrollY = 0;
var tileSize = 16;
var zoom = 2;

var mapWidth = 32;
var mapHeight = 32;

var imagesToLoad = 0;

var tileImage = loadImage("assets/tiles.png");

var level = new Array(mapWidth * mapHeight);
for (var y = 0; y < mapHeight; y++) {

    for (var x = 0; x < mapWidth; x++) {
        level[x + y * mapWidth] = {
            color: (Math.floor(Math.random() * 0x20) * 0x10101) + 0x808080,
            visible: 0,
            owned: false,
            land: 3 - Math.floor(Math.random() * Math.random() * 4),
        }
    }
}

function loadImage(path) {
    var image = new Image();
    imagesToLoad++;
    image.onload = function () {
        imagesToLoad--;
        if (imagesToLoad == 0) {
            init();
        }
    }
    image.src = path;
    return image;
}

function init() {
    if (!pageLoaded || imagesToLoad > 0) return;
    var mapCanvas = document.getElementById("map");
    mapCanvas.width = (window.innerWidth);
    mapCanvas.height = (window.innerHeight);

    mapCanvas.onmousedown = function (event) {
        event.preventDefault();
        mouseDown = true;
        scrolling = false;
        mouseDownX = event.clientX;
        mouseDownY = event.clientY;
    }

    window.onmouseup = function (event) {
        event.preventDefault();
        mouseDown = false;
        if (!scrolling) {
            var mapCanvas = document.getElementById("map");
            var xOffs = Math.floor(scrollX + (mapCanvas.width / zoom - mapWidth * tileSize) / 2);
            var yOffs = Math.floor(scrollY + (mapCanvas.height / zoom - mapHeight * tileSize) / 2);

            var xTile = Math.floor((event.clientX / zoom - xOffs) / tileSize);
            var yTile = Math.floor((event.clientY / zoom - yOffs) / tileSize);
            clickTile(xTile, yTile);
        }
    }

    window.onmousemove = function (event) {
        if (!mouseDown) return;
        event.preventDefault();
        var distX = event.clientX - mouseDownX;
        var distY = event.clientY - mouseDownY;

        var scrollDeadZone = 8;

        if (scrolling || distX * distX + distY * distY > scrollDeadZone * scrollDeadZone) {
            scrolling = true;
            scrollX += distX / zoom;
            scrollY += distY / zoom;
            mouseDownX = event.clientX;
            mouseDownY = event.clientY;
            renderMap();
        }
    }

    renderMap();
}

var selectedX = 0;
var selectedY = 0;

function clickTile(xTile, yTile) {
    if (xTile >= 0 && yTile >= 0 && xTile < mapWidth && yTile < mapHeight) {
        var tile = getTile(xTile, yTile);
        tile.owned = !tile.owned;
        /*
        if (level[xTile + yTile * mapWidth].owned) {
            level[xTile + yTile * mapWidth].owned = false;
            level[xTile + yTile * mapWidth].color = 0xff0000;
        } else {
            level[xTile + yTile * mapWidth].owned = true;
            level[xTile + yTile * mapWidth].color = 0xffff00;
        }
        */
        recalcVisibility();
    }
    selectedX = xTile;
    selectedY = yTile;
    renderMap();
}

function recalcVisibility() {
    for (var y = 0; y < mapHeight; y++) {
        for (var x = 0; x < mapWidth; x++) {
            level[x + y * mapWidth].visible &= 1;
        }
    }
    for (var y = 0; y < mapHeight; y++) {
        for (var x = 0; x < mapWidth; x++) {
            if (level[x + y * mapWidth].owned) {
                revealTile(x, y, 4);
            }
        }
    }
}

function revealTile(xTile, yTile, radius) {
    for (var y = yTile - radius; y <= yTile + radius; y++) {
        if (y < 0 || y >= mapHeight) continue;
        for (var x = xTile - radius; x <= xTile + radius; x++) {
            if (x < 0 || x >= mapWidth) continue;
            var xd = x - xTile;
            var yd = y - yTile;
            if (xd * xd + yd * yd <= radius * radius + 2) {
                level[x + y * mapWidth].visible = 3;
            }
        }
    }
}

function renderMap() {
    var mapCanvas = document.getElementById("map");

    var maxZoom = 300;
    var aspectRatio = 16 / 9;
    zoom = Math.max(Math.floor(mapCanvas.height / maxZoom + 1), mapCanvas.width / (maxZoom * aspectRatio) + 1);

    var xOverflow = Math.max(0, (mapWidth + 4) * tileSize - mapCanvas.width / zoom) / 2;
    var yOverflow = Math.max(0, (mapHeight + 4) * tileSize - mapCanvas.height / zoom) / 2;

    if (scrollX < -xOverflow) scrollX = -xOverflow;
    if (scrollY < -yOverflow) scrollY = -yOverflow;
    if (scrollX > xOverflow) scrollX = xOverflow;
    if (scrollY > yOverflow) scrollY = yOverflow;

    var map2d = mapCanvas.getContext("2d");
    map2d.imageSmoothingEnabled = false;
    map2d.setTransform(zoom, 0, 0, zoom, 0, 0);
    var xOffs = Math.floor(scrollX + (mapCanvas.width / zoom - mapWidth * tileSize) / 2);
    var yOffs = Math.floor(scrollY + (mapCanvas.height / zoom - mapHeight * tileSize) / 2);
    var x0 = Math.floor(-xOffs / tileSize);
    var y0 = Math.floor(-yOffs / tileSize);
    var x1 = Math.ceil((-xOffs + mapCanvas.width / zoom) / tileSize);
    var y1 = Math.ceil((-yOffs + mapCanvas.height / zoom) / tileSize);

    for (var y = y0; y < y1; y++) {
        for (var x = x0; x < x1; x++) {
            var tile = getTile(x, y);
            if (tile.land == 0) {
                map2d.drawImage(tileImage, 5 * 8, 0 * 8, 8, 8, x * tileSize + xOffs + 0, y * tileSize + yOffs + 0, 8, 8);
                map2d.drawImage(tileImage, 5 * 8, 0 * 8, 8, 8, x * tileSize + xOffs + 8, y * tileSize + yOffs + 0, 8, 8);
                map2d.drawImage(tileImage, 5 * 8, 0 * 8, 8, 8, x * tileSize + xOffs + 0, y * tileSize + yOffs + 8, 8, 8);
                map2d.drawImage(tileImage, 5 * 8, 0 * 8, 8, 8, x * tileSize + xOffs + 8, y * tileSize + yOffs + 8, 8, 8);
            } else {
                for (var i = 0; i < 4; i++) {
                    var xSide = (i % 2 * 2 - 1);
                    var ySide = ((i >> 1) * 2 - 1);
                    var t_u = getTile(x, y + ySide).land != tile.land;
                    var t_l = getTile(x + xSide, y).land != tile.land;
                    var t_ul = getTile(x + xSide, y + ySide).land != tile.land;

                    var xt = 1;
                    var yt = 1 + (tile.land - 1) * 3;

                    if (t_u) yt += ySide;
                    if (t_l) xt += xSide;
                    if (!t_u && !t_l && t_ul) {
                        xt += 3 - (i % 2);
                        yt -= (i >> 1);
                    }

                    map2d.drawImage(tileImage, xt * 8, yt * 8, 8, 8, x * tileSize + xOffs + i % 2 * 8, y * tileSize + yOffs + (i >> 1) * 8, 8, 8);
                }
            }
            if (tile.owned) {
                if (tile.land == 1) {
                    map2d.drawImage(tileImage, 0 * 8, 9 * 8, 16, 16, x * tileSize + xOffs, y * tileSize + yOffs, 16, 16);
                }
                if (tile.land == 3) {
                    map2d.drawImage(tileImage, 2 * 8, 9 * 8, 16, 16, x * tileSize + xOffs, y * tileSize + yOffs, 16, 16);
                }
            }
        }
    }

    for (var y = y0; y < y1; y++) {
        for (var x = x0; x < x1; x++) {
            var tile = getTile(x, y);
            if (tile.visible == 1) {
                map2d.drawImage(tileImage, 30 * 8, 2 * 8, 8, 8, x * tileSize + xOffs + 0, y * tileSize + yOffs + 0, 8, 8);
                map2d.drawImage(tileImage, 30 * 8, 2 * 8, 8, 8, x * tileSize + xOffs + 8, y * tileSize + yOffs + 0, 8, 8);
                map2d.drawImage(tileImage, 30 * 8, 2 * 8, 8, 8, x * tileSize + xOffs + 0, y * tileSize + yOffs + 8, 8, 8);
                map2d.drawImage(tileImage, 30 * 8, 2 * 8, 8, 8, x * tileSize + xOffs + 8, y * tileSize + yOffs + 8, 8, 8);
            } else {
                for (var i = 0; i < 4; i++) {
                    var xSide = (i % 2 * 2 - 1);
                    var ySide = ((i >> 1) * 2 - 1);
                    var t_u = getTile(x, y + ySide).visible != tile.visible;
                    var t_l = getTile(x + xSide, y).visible != tile.visible;
                    var t_ul = getTile(x + xSide, y + ySide).visible != tile.visible;

                    var xt = 1 + 32 - 5;
                    var yt = 1;
                    if (tile.visible == 3) yt += 3;

                    if (t_u) yt += ySide;
                    if (t_l) xt += xSide;
                    if (!t_u && !t_l && t_ul) {
                        xt += 3 - (i % 2);
                        yt -= (i >> 1);
                    }

                    map2d.drawImage(tileImage, xt * 8, yt * 8, 8, 8, x * tileSize + xOffs + i % 2 * 8, y * tileSize + yOffs + (i >> 1) * 8, 8, 8);
                }

                /*
                map2d.drawImage(tileImage, 1 * 8, 1 * 8, 8, 8, x * tileSize + xOffs + 8, y * tileSize + yOffs + 0, 8, 8);
                map2d.drawImage(tileImage, 1 * 8, 1 * 8, 8, 8, x * tileSize + xOffs + 0, y * tileSize + yOffs + 8, 8, 8);
                map2d.drawImage(tileImage, 1 * 8, 1 * 8, 8, 8, x * tileSize + xOffs + 8, y * tileSize + yOffs + 8, 8, 8);
                */
            }
        }
    }
    drawText("Money: 100", 4, 4 + 8 * 0);
    drawText("Food: 100", 4, 4 + 8 * 1);
    drawText("Energy: 100", 4, 4 + 8 * 2);
    drawText("Water: 100", 4, 4 + 8 * 3);

    for (var i = 0; i < 8; i++) {
        drawCard("water", 335 + 20, 0 + i * 20);
        drawCard("water", 335, 0 + i * 20);
    }
}

function getTile(x, y) {
    if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return level[0];
    else return level[x + y * mapWidth];
}

var tileCharacters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ      " +
    "0123456789.,!?'\":;()+-=*/\%     ";


function drawCard(text, x, y) {
    var mapCanvas = document.getElementById("map");
    var map2d = mapCanvas.getContext("2d");
    //map2d.drawImage(tileImage, 2 * 8, 9 * 8, 16, 16, x * tileSize + xOffs, y * tileSize + yOffs, 16, 16);
    map2d.drawImage(tileImage, 0 * 8, 16 * 8, 16, 16, x, y, 16, 16);
    /*map2d.drawImage(tileImage, 0 * 8, 21 * 8, 5 * 8, 7 * 8, x, y, 5 * 8, 7 * 8);
    drawTextSmall(text, x + 4, y + 3);
    drawTextSmall("water", x + 4, y + 27 + 0 * 6);
    drawTextSmall("resource", x + 4, y + 27 + 1 * 6);
    drawTextSmall("cost 10", x + 4, y + 29 + 3 * 6);
    */
}

function drawText(text, x, y) {
    text = text.toUpperCase();
    var mapCanvas = document.getElementById("map");
    var map2d = mapCanvas.getContext("2d");
    for (var i = 0; i < text.length; i++) {
        var index = tileCharacters.indexOf(text.charAt(i));
        var xt = 0 + index % 32;
        var yt = 30 + (index >> 5);
        map2d.drawImage(tileImage, xt * 8, yt * 8, 8, 8, x + i * 8, y, 8, 8);
    }
}

function drawTextSmall(text, x, y) {
    text = text.toUpperCase();
    var mapCanvas = document.getElementById("map");
    var map2d = mapCanvas.getContext("2d");
    for (var i = 0; i < text.length; i++) {
        var index = tileCharacters.indexOf(text.charAt(i));
        var xt = index % 32;
        var yt = (index >> 5);
        map2d.drawImage(tileImage, xt * 4, 28 * 8 + yt * 6, 4, 6, x + i * 4, y, 4, 6);
    }
}