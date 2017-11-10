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
    constructor(x, y, hexClass) {
        this.x = x;
        this.y = y;
        this.hexClass = hexClass;
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
        this.player = player;
        this.id = unitid;
        this.currentmoves = this.type.moves;
    }
}

/*
Ha en tabell over unittypes, med info om hvor mange tiles de kan gå, om de kan gå over fjell/vann,
kanskje liv, attack, defence
*/

let playerid = 0;

let terrainTypes = ["gress", "gress", "gress", "ørken", "ørken", "fjell", "sjø"];

window.ondragstart = function () { return false; }

let screenXPos = 0;
let screenYPos = 0;

function setup() {
    let main = document.getElementById("main");

    border.addEventListener("mousemove", flytt);
    function flytt(e) {
        if (e.buttons === 1) {
            screenXPos = screenXPos + 2 * e.movementX;
            screenYPos = screenYPos + 2 * e.movementY;
            main.style.left = screenXPos + "px";
            main.style.top = screenYPos + "px";
            for (let hex of manyHexInfo) {
                if (hex.deployed) {
                    if ((hex.x + screenXPos) < -130 || (hex.x + screenXPos) > 920 || (hex.y + screenYPos) < -140 || (hex.y + screenYPos) > 620) {
                        for (let hexDiv of manyHexDiv) {
                            if (parseFloat(hexDiv.style.left) === hex.x && parseFloat(hexDiv.style.top) === hex.y) {
                                hex.deployed = false;
                                hexDiv.remove();
                                manyHexDiv.splice(manyHexDiv.indexOf(hexDiv), 1);
                            }
                        }
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
            divHex.className = hex.hexClass;
            let divHexTop = document.createElement("div");
            divHexTop.className = "hexTop";
            let divHexBot = document.createElement("div");
            divHexBot.className = "hexBottom";
            main.appendChild(divHex);
            divHex.appendChild(divHexTop);
            divHex.appendChild(divHexBot);
            divHex.style.left = hex.x + "px";
            divHex.style.top = hex.y + "px";
            manyHexDiv.push(divHex);
        }
    }

    let manyHexInfo = [];
    let manyHexDiv = [];

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

        let newHexInfo = new hexInfo(xpos, ypos, "sjø");
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

    function splashtiles(xlocation, ylocation, radius, className) {
        for (let hex of manyHexInfo) {
            if (distance(hex.x, hex.y, xlocation, ylocation, 50, 58) <= radius) {
                hex.hexClass = className;
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

    let settlerUnit = { //bør lage disse i en database eller tabell på en måte
        stringType: "settler",
        moves: 2,
        life: 100,
        cantWalkOn: ["sjø", "fjell"]
    }
    let scoutUnit = {
        stringType: "scout",
        moves: 3,
        life: 50,
        cantWalkOn: ["sjø"]
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
    //kanskje forandre måten det fungerer på delvis, skrive det igjen mer ryddig
    //gjøre slik at en kan bevege seg bare 1 tile, og trekke det ifra movement, og så blir movement reset på turn end
    //skog og fjell etc koster 2 moves istedenfor 1.
    function selectUnit(e) {
        let div = e.path[0];
        if (div.classList.contains("unit")) {
            for (let n of units) {
                if (parseFloat(div.id) === n.id) {
                    n.div.style.opacity = 0.5;
                    focusunit = n;
                    let searchingTiles = [];
                    let newSearchingTiles = [];
                    for (let hex of manyHexDiv) {
                        if (n.x === parseFloat(hex.style.left) && n.y === parseFloat(hex.style.top)) {
                            searchingTiles.push(hex);
                            focustile = hex;
                        }
                    }
                    for (let i = 1; i <= n.currentmoves; i++) {
                        for (let hex of manyHexDiv) {
                            for (let searchTile of searchingTiles) {
                                if (distance(parseFloat(searchTile.style.left), parseFloat(searchTile.style.top), parseFloat(hex.style.left), parseFloat(hex.style.top), 0, 0) <= 100) {
                                    for (let hexInfo of manyHexInfo) {
                                        if (hexInfo.deployed && hexInfo.canBeWalkedBy[n.id] === undefined && hexInfo.x === parseFloat(hex.style.left) && hexInfo.y === parseFloat(hex.style.top)) {
                                            let canWalkOnTile = true;
                                            for (let i = 0; i < n.type.cantWalkOn.length; i++) {
                                                if (n.type.cantWalkOn[i] === hex.className) {
                                                    canWalkOnTile = false;
                                                }
                                            }
                                            if(canWalkOnTile) {
                                                hexInfo.canBeWalkedBy[n.id] = i;
                                            }
                                        }
                                    }
                                    let canWalkOnTile = true;
                                    for (let i = 0; i < n.type.cantWalkOn.length; i++) {
                                        if (n.type.cantWalkOn[i] === hex.className) {
                                            canWalkOnTile = false;
                                        }
                                    }
                                    if (searchingTiles.indexOf(hex) === -1 && canWalkOnTile) {
                                        newSearchingTiles.push(hex);
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
                    for (let j of searchingTiles) {
                        j.style.opacity = 0.5;
                    }
                }
            }
        } else {
            if (focusunit != undefined) {
                for (let hex of manyHexInfo) {
                    hex.canBeWalkedBy[focusunit.id] = undefined;
                }
                focusunit.div.style.opacity = 1;
                focusunit = undefined;
                focustile = undefined;
                for (let hex of manyHexDiv) { //burde gjøre slik at dette bare sjer med de tiles som faktisk var lyst opp på grunn av movement, ikke alle tiles på hele brettet
                    hex.style.opacity = 1;
                }
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
        if (focusunit != undefined) {
            for (let hexClicked of manyHexInfo) {
                if (hexClicked.deployed && hexClicked.canBeWalkedBy[focusunit.id] <= focusunit.currentmoves) {
                    if (hexClicked.x === parseFloat(div.style.left) && hexClicked.y === parseFloat(div.style.top) && !hexClicked.occupied) {
                        focusunit.x = parseFloat(div.style.left);
                        focusunit.y = parseFloat(div.style.top);
                        focusunit.div.style.left = div.style.left;
                        focusunit.div.style.top = div.style.top;
                        //reducing currentmoves based on distance traveled
                        focusunit.currentmoves -= hexClicked.canBeWalkedBy[focusunit.id];

                        for (let hex of manyHexInfo) {
                            if (distance(focusunit.x, focusunit.y, hex.x, hex.y, 0, 0) <= (focusunit.type.moves + 1) * 100) {
                                hex.discovererd[playerid] = true;
                                createHexTiles(hex);
                            }
                            if (hex.x === parseFloat(focustile.style.left) && hex.y === parseFloat(focustile.style.top)) {
                                hex.occupied = false;
                            }
                            if (hex.x === parseFloat(div.style.left) && hex.y === parseFloat(div.style.top)) {
                                hex.occupied = true;
                            }
                        }
                    }
                }
            }
            for (let hex of manyHexInfo) {
                hex.canBeWalkedBy[focusunit.id] = undefined;
            }
            focusunit.div.style.opacity = 1;
            focusunit = undefined;
            focustile = undefined;
            for (let hex of manyHexDiv) { //burde gjøre slik at dette bare sjer med de tiles som faktisk var lyst opp på grunn av movement, ikke alle tiles på hele brettet
                hex.style.opacity = 1;
            }
        }
    }
    createUnit(settlerUnit, 300, 172, playerid);
    createUnit(scoutUnit, 400, 172, playerid);
    border.addEventListener("click", selectUnit);
}