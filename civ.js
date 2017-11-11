/*
How current map mechanics work:
manyHexInfo contains information about every tile, its location, look(class) and if it is "deployed" or not.
manyHexInfo gains its information through random "Tilesplashes".
When a tile is deployed, its information is used to create a div, which will then have the correct look and location.
A tile is created whenever it is on screen, and when it exits the screen it will be removed.
This makes it so that there aren't too many elements active at one moment.
I have no idea however, how this will work on multiplayer. It probably wont... 
FeelsBadMan
Maybe if i in some way can/set get the location of everyones camera, and then check if there are tiles in any of the players' window.
Other players don't need to see tiles that are not on their screen, but i guess they would have to be loaded for everyone
Need to see how firebase multiplayer works and work out a solution afterwards

How to make it more semi-random:

Definere noen punkter (øyer), kaste stein rundt dette i en viss radius, disse steinene vokser til fjell,
myr etc, og etterpå spawner players til høyre for fjell

TODO: Add canvas for map display based on what hextiles are discovered
*/


class hexInfo {
    constructor(x, y, hexType) {
        this.x = x;
        this.y = y;
        this.hexType = hexType;
        this.deployed = false;
        this.discovererd = []; //array containing information of what players have discovered the tile
        this.occupied = false;
        this.canBeWalkedBy = {};
    }
}

class unit {
    constructor(div, x, y, type, player, unitid) {
        this.div = div;
        this.x = x;
        this.y = y;
        this.type = type;
        //this.class = type.stringType; fjerner denne, ser om det sjer noen problemer
        this.player = player;
        this.id = unitid;
        this.currentmoves = this.type.moves;
    }
}

/* Om det trengs å holde track på player som har discovera tiles, player sin view av hvilke tiles som kan flyttes til(opacity):
Om det går an i firebase å velge hva for noe informasjon som skal sendes til andre, er det bare å ikke sende info om hvilke tiles de andre trykker på og får til å lyse opp, og hvilke tiles de har discovera, det trenger bare hver player å vite sin egen informasjon om
det som trengs å sendes(og holdes track på hvilken player det hører til) er byer, units og unitmovements, unitcreations etc.
*/

/*
Ha en tabell over unittypes, med info om hvor mange tiles de kan gå, om de kan gå over fjell/vann,
kanskje liv, attack, defence
*/

let playerid = 0;

let hexØrken = {
    class: "ørken",
    penalty: 1,
    miniMapColor: "yellow"
}
let hexSjø = {
    class: "sjø",
    penalty: 1,
    miniMapColor: "blue"
}
let hexGress = {
    class: "gress",
    penalty: 1,
    miniMapColor: "green"
}
let hexFjell = {
    class: "fjell",
    penalty: 5,
    miniMapColor: "grey"
}

let terrainTypes = [hexGress, hexGress, hexGress, hexØrken, hexØrken, hexFjell, hexSjø];

window.ondragstart = function () { return false; }

let screenXPos = 0;
let screenYPos = 0;

function setup() {
    let main = document.getElementById("main");

    border.addEventListener("mousemove", flytt);
    function flytt(e) {
        moveMiniMapBorder();
        drawMiniMap();
        if (e.buttons === 1) {
            screenXPos = screenXPos + 2 * e.movementX;
            screenYPos = screenYPos + 2 * e.movementY;
            main.style.left = screenXPos + "px";
            main.style.top = screenYPos + "px";
            for (let hex of manyHexInfo) {
                if (hex.deployed) {
                    if ((hex.x + screenXPos) < -130 || (hex.x + screenXPos) > 920 || (hex.y + screenYPos) < -140 || (hex.y + screenYPos) > 620) {
                        hex.deployed = false;
                        hex.div.remove();
                    }
                }
                createHexTiles(hex);
            }
        }
    }

    function createHexTiles(hex) {
        if ((hex.x + screenXPos) > -150 && (hex.x + screenXPos) < 940 && (hex.y + screenYPos) > -160 && (hex.y + screenYPos) < 640 && !hex.deployed && hex.discovererd[playerid]) {
            hex.deployed = true;
            let divHex = document.createElement("div");
            divHex.className = hex.hexType.class;
            let divHexTop = document.createElement("div");
            divHexTop.className = "hexTop";
            let divHexBot = document.createElement("div");
            divHexBot.className = "hexBottom";
            main.appendChild(divHex);
            divHex.appendChild(divHexTop);
            divHex.appendChild(divHexBot);
            divHex.style.left = hex.x + "px";
            divHex.style.top = hex.y + "px";
            hex.div = divHex;
        }
    }

    let manyHexInfo = [];

    let units = [];

    function createTile(i, j) {

        let xpos = 0;
        let ypos = 0;

        ypos = i * 86;
        if (i / 2 === Math.ceil(i / 2)) {
            xpos = j * 100;
        } else {
            xpos = j * 100 + 50;
        }

        let newHexInfo = new hexInfo(xpos, ypos, hexSjø);
        manyHexInfo.push(newHexInfo);
    }

    for (let i = -30; i < 40; i++) {
        for (let j = -30; j < 40; j++) {
            createTile(i, j);
        }
    }
    generateWorld();

    function distance(ax, ay, bx, by, xscew, yscew) {
        let dist = Math.sqrt((ax - bx + xscew) * (ax - bx + xscew) + (ay - by + yscew) * (ay - by + yscew));
        return dist;
    }

    function splashtiles(xlocation, ylocation, radius, hexType) {
        for (let hex of manyHexInfo) {
            if (distance(hex.x, hex.y, xlocation, ylocation, 50, 58) <= radius) {
                hex.hexType = hexType;
            }
        }
    }

    //bør kanskje bruke en mer psuedo random generation method
    function generateWorld() {
        for (let i = 0; i <= 100; i++) {
            let randTileClass = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
            let randXPos = Math.ceil(Math.random() * 4000) - 1000;
            let randYPos = Math.ceil(Math.random() * 3000) - 1000;
            let randRadius = Math.ceil(Math.random() * 300) + 100;
            splashtiles(randXPos, randYPos, randRadius, randTileClass);
            //kanskje legge til mer land, også etterpå legge tilbake vann i form av elver(splashlines)
        }
        for (let hex of manyHexInfo) {
            if (distance(hex.x, hex.y, 300, 172, 0, 0) <= 300) { //bør lage settler random sted først helt til den står et sted ved land, derreter fokusere dette området rundt settleren
                hex.discovererd[playerid] = true;
            }
            createHexTiles(hex);
        }
    }

    let settlerUnit = { //bør kanskje lage disse i en database eller tabell på en måte, eller definere en class constructor, selvom dette funker helt fint da..
        stringType: "settler",
        moves: 2,
        vision: 3,
        life: 100,
        cantWalkOn: ["sjø", "fjell"]
    }
    let scoutUnit = {
        stringType: "scout",
        moves: 10,
        vision: 4,
        life: 50,
        cantWalkOn: ["sjø"]
    }
    let boatUnit = {
        stringType: "boat",
        moves: 4,
        vision: 4,
        life: 50,
        cantWalkOn: ["gress", "fjell", "ørken"]
    }

    let unitid = 0;
    function createUnit(type, x, y, player) {
        let newUnitDiv = document.createElement("div");
        newUnitDiv.id = unitid;
        newUnitDiv.className = type.stringType + " unit";
        newUnitDiv.style.left = x + "px";
        newUnitDiv.style.top = y + "px";
        main.appendChild(newUnitDiv);
        let newUnit = new unit(newUnitDiv, x, y, type, player, unitid);
        unitid++;
        units.push(newUnit);
        for (let hex of manyHexInfo) {
            if (x === hex.x && y === hex.y) {
                hex.occupied = true;
            }
        }
    }

    let focusunit = undefined;
    let focustile = undefined;

    document.getElementById("endturn").addEventListener("click", endturn);
    function endturn() {
        for (let n of units) {
            //maybe check here for units that still have movement left before ending
            n.currentmoves = n.type.moves;
        }
    }

    //kanskje legge til at du kan dra uten å fjerne selection av tiles
    //masse for loops lager mye lag, kanskje det kan kuttes ned på dem på en eller annen måte...
    border.addEventListener("click", selectUnit);
    function selectUnit(e) {
        let div = e.path[0];
        if (div.classList.contains("unit") && focusunit === undefined) {
            for (let n of units) {
                if (div === n.div) {
                    div.style.opacity = 0.5;
                    focusunit = n;
                    console.log(n.currentmoves);
                    let searchingTiles = [];
                    let newSearchingTiles = [];
                    for (let hex of manyHexInfo) {
                        if (n.x === hex.x && n.y === hex.y) {
                            hex.canBeWalkedBy[n.id] = 0;
                            searchingTiles.push(hex);
                            focustile = hex;
                        }
                    }
                    for (let i = 1; i <= n.currentmoves; i++) {
                        for (let hex of manyHexInfo) {
                            if (hex.deployed) {
                                for (let searchTile of searchingTiles) {
                                    if (searchTile.canBeWalkedBy[n.id] === (i - 1) && distance(searchTile.x, searchTile.y, hex.x, hex.y, 0, 0) <= 100 && hex.canBeWalkedBy[n.id] === undefined) {
                                        let canWalkOnTile = true;
                                        for (let j = 0; j < n.type.cantWalkOn.length; j++) {
                                            if (n.type.cantWalkOn[j] === hex.hexType.class) {
                                                canWalkOnTile = false;
                                            }
                                        }
                                        if (canWalkOnTile) {
                                            hex.canBeWalkedBy[n.id] = searchTile.canBeWalkedBy[n.id] + hex.hexType.penalty;
                                            if (searchingTiles.indexOf(hex) === -1) {
                                                newSearchingTiles.push(hex);
                                            }
                                        }
                                    }
                                }

                            }

                        }
                        for (let newTile of newSearchingTiles) {
                            if (searchingTiles.indexOf(newTile) === -1) {
                                searchingTiles.push(newTile);
                            }
                        }
                    }
                    for (let searchTile of searchingTiles) {
                        if (searchTile.canBeWalkedBy[n.id] <= n.currentmoves) {
                            searchTile.div.style.opacity = 0.5;
                        }
                    }
                }
            }
        } else {
            if (focusunit !== undefined) {
                for (let hex of manyHexInfo) {
                    if (hex.canBeWalkedBy[focusunit.id] >= 0) {
                        hex.canBeWalkedBy[focusunit.id] = undefined;
                        hex.div.style.opacity = 1;
                    }
                    //burde gjøre slik at dette bare sjer med de tiles som faktisk var lyst opp på grunn av movement, ikke alle tiles på hele brettet
                }
                focusunit.div.style.opacity = 1;
                focusunit = undefined;
                focustile = undefined;
            }
            if (e.path[0].classList.contains("unit")) {
                selectUnit(e);
            }
        }
    }

    border.addEventListener("contextmenu", rightClick);
    function rightClick(e) {
        let div = e.path[0];
        if (div.className === "hexTop" || div.className === "hexBottom") {
            div = e.path[1];
        }
        e.preventDefault();
        if (focusunit !== undefined) {
            for (let hex of manyHexInfo) {
                if (hex.deployed) {
                    if (hex.canBeWalkedBy[focusunit.id] <= focusunit.currentmoves) {
                        if (hex.x === parseFloat(div.style.left) && hex.y === parseFloat(div.style.top)) {
                            if (!hex.occupied) { //why tf isnt this occupied shit working????
                                hex.occupied = true;
                                focusunit.x = parseFloat(div.style.left);
                                focusunit.y = parseFloat(div.style.top);
                                focusunit.div.style.left = focusunit.x + "px";
                                focusunit.div.style.top = focusunit.y + "px";
                                //reducing currentmoves based on distance traveled
                                focusunit.currentmoves -= hex.canBeWalkedBy[focusunit.id];

                                for (let hexDiscover of manyHexInfo) {
                                    if (!hexDiscover.deployed && distance(focusunit.x, focusunit.y, hexDiscover.x, hexDiscover.y, 0, 0) <= (focusunit.type.vision) * 100) {
                                        hexDiscover.discovererd[playerid] = true;
                                        createHexTiles(hexDiscover);
                                    }
                                    if (hexDiscover.x === focustile.x && hexDiscover.y === focustile.y) {
                                        hexDiscover.occupied = false;
                                    }
                                }

                            }
                        }
                    }
                }

            }
            for (let hex of manyHexInfo) {
                if (focusunit.player === playerid && hex.canBeWalkedBy[focusunit.id] >= 0) {
                    hex.canBeWalkedBy[focusunit.id] = undefined;
                    hex.div.style.opacity = 1;
                }
            }
            focusunit.div.style.opacity = 1;
            focusunit = undefined;
            focustile = undefined;
        }
    }
    createUnit(settlerUnit, 300, 172, playerid);
    createUnit(scoutUnit, 400, 172, playerid);
    createUnit(boatUnit, 200, 172, playerid);
    createUnit(boatUnit, 500, 172, playerid);

    //using canvas to create minimap
    let canvas = document.getElementById("minimap");
    let ctx = canvas.getContext("2d");

    let canvasTiles = [];

    let canvasDrawDir = "x";

    function drawMiniMap() {
        canvasTiles = [];
        for (let hex of manyHexInfo) {
            if (hex.discovererd[playerid]) {
                canvasTiles.push(hex);
            }
        }
        let minX;
        let maxX;
        let minY;
        let maxY;
        for (let tile of canvasTiles) {
            if (tile.x < minX || minX === undefined) {
                minX = tile.x;
            }
            if (tile.x > maxX || maxX === undefined) {
                maxX = tile.x;
            }
            if (tile.y < minY || minY === undefined) {
                minY = tile.y;
            }
            if (tile.y > maxY || maxY === undefined) {
                maxY = tile.y;
            }
        }
        let canW = maxX - minX;
        let canH = maxY - minY;
        let antallTilesX = canW / 100 + 1;
        let antallTilesY = canH / 100 + 1;

        let yHeight = Math.ceil(300 * canH / canW);
        let yReferenceLine = (300 - yHeight) / 2;

        let xHeight = Math.ceil(300 * canW / canH);
        let xReferenceLine = (300 - xHeight) / 2;

        ctx.clearRect(0, 0, 300, 300);
        if (Math.max(canW, canH) === canW) {
            //filldir = x;
            canvasDrawDir = "x";
            for (let tile of canvasTiles) {
                let width = Math.ceil(300 / antallTilesX);
                let x = (tile.x - minX) * (300 - width) / canW + (width / 2);
                let y = (tile.y - minY) * (yHeight - width) / canH + yReferenceLine + (width / 2);
                let drawColor = tile.hexType.miniMapColor;
                drawHex(x, y, width, drawColor);
            }

            //antall tiles i hver retning, vet også posisjonen til hver av tilesa
            //bare ha mapFillcolor som en property i hex.hexType, så blir den lett å hente frem og forandre
        } else {
            //filldir = y;
            canvasDrawDir = "y";
            for (let tile of canvasTiles) {
                let width = Math.ceil(300 / antallTilesY);
                let x = (tile.x - minX) * (xHeight - width) / canW + xReferenceLine + (width / 2);
                let y = (tile.y - minY) * (300 - width) / canH + (width / 2);
                let drawColor = tile.hexType.miniMapColor;
                drawHex(x, y, width, drawColor);
            }
        }
        function drawHex(x, y, width, fillColor) {
            ctx.beginPath();
            for (i = 0; i < 6; i++) {
                ctx.lineTo(x + width / 2 * Math.cos(Math.PI * (2 * i + 1) / 6), y + width / 2 * Math.sin(Math.PI * (2 * i + 1) / 6));
            }
            ctx.closePath();
            ctx.fillStyle = fillColor;
            ctx.fill();
        }
    }
    let winLoc = document.getElementById("minimapborder");
    function moveMiniMapBorder() {
        let minX;
        let maxX;
        let minY;
        let maxY;
        for (let tile of canvasTiles) {
            if (tile.x < minX || minX === undefined) {
                minX = tile.x;
            }
            if (tile.x > maxX || maxX === undefined) {
                maxX = tile.x;
            }
            if (tile.y < minY || minY === undefined) {
                minY = tile.y;
            }
            if (tile.y > maxY || maxY === undefined) {
                maxY = tile.y;
            }
        }
        console.log(maxY, minY);
        let canW = maxX - minX + 100;
        let canH = maxY - minY + 100;

        let yHeight = Math.ceil(300 * canH / canW);
        let yReferenceLine = (300 - yHeight) / 2;

        let xHeight = Math.ceil(300 * canW / canH);
        let xReferenceLine = (300 - xHeight) / 2;

        let windowWidth;
        let windowHeight;

        if (canvasDrawDir === "x") {
            windowWidth = 800 * 300 / canW;
            windowHeight = 550 * windowWidth / 800;
            winLoc.style.left = -(screenXPos + minX) * (300 / canW) + "px";
            winLoc.style.top = -(screenYPos + minY) * (270 / canW) + yReferenceLine + "px";

        } else {

            windowHeight = 550 * 300 / canH;
            windowWidth = 800 * windowHeight / 550;
            winLoc.style.left = -(screenXPos + minX) * (270 / canH) + xReferenceLine + "px";
            winLoc.style.top = -(screenYPos + minY) * (300 / canH) + "px";
        }
        
        winLoc.style.width = windowWidth + "px";
        winLoc.style.height = windowHeight + "px";

    }
    drawMiniMap();
}