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
*/


class hexInfo {
    constructor(x, y, hexClass) {
        this.x = x;
        this.y = y;
        this.hexClass = hexClass;
        this.deployed = false;
        this.discovererd = []; //array containing information of what players have discovered the tile
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
    }
}

let playerid = 0;

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
    /*function splashline(startX, startY, endX, endY, startRadius, midRadius, endRadius, className) {
        let distance = distance(startX, startY, endX, endY, 0, 0);
        let focusX = startX;
        let focusY = startY;
        let currentRadius = startRadius;
        for (i = 0; i < (startRadius + midRadius) / 2;) {
            splashtiles(focusX, focusY, currentRadius, className);
            //increase currentRadius and focusX/Y and i in some way to get smooth transition
            //move along distance vector according to current radius, then increase radius according
            //to how far along the path between radi1 and radi2, for example halfway between it would have
            //the average radius.
        }
    }*/

    function generateWorld() {
        for (let i = 0; i <= 70; i++) {
            let randTileClass = "";
            switch (Math.floor(Math.random() * 4)) {
                case 0:
                    randTileClass = "gress";
                    break;
                case 1:
                    randTileClass = "gress";
                    break;
                case 2:
                    randTileClass = "ørken";
                    break;
                case 3:
                    randTileClass = "fjell";
                    break;
            }
            let randXPos = Math.ceil(Math.random() * 4000) - 1000;
            let randYPos = Math.ceil(Math.random() * 3000) - 1000;
            let randRadius = Math.ceil(Math.random() * 200) + 100;
            splashtiles(randXPos, randYPos, randRadius, randTileClass);
            //kanskje legge til mer land, også etterpå legge tilbake vann i form av elver

        }
        for (let hex of manyHexInfo) {
            if(distance(hex.x, hex.y, 350, 200, 0, 0) < 350) {
                hex.discovererd[playerid] = true;
            }
            createHexTiles(hex);
        }
    }

    let unitid = 0;
    function createUnit(type, x, y, player) {
        let newUnitDiv = document.createElement("div");
        newUnitDiv.id = unitid;
        newUnitDiv.className = type + " unit";
        newUnitDiv.style.left = x + "px";
        newUnitDiv.style.top = y + "px";
        main.appendChild(newUnitDiv);
        let newUnit = new unit(newUnitDiv, x, y, type, player, unitid);
        unitid++;
        units.push(newUnit);
    }

    let focusunit;
    function selectUnit(e) {
        let div = e.path[0];
        if (div.classList.contains("unit")) {
            for (let n of units) {
                if (parseFloat(div.id) === n.id) {
                    n.div.style.opacity = 0.5;
                    focusunit = n;
                    for (let hex of manyHexDiv) {
                        if (distance(n.x, n.y, parseFloat(hex.style.left), parseFloat(hex.style.top), 0, 0) < 250) {
                            hex.style.opacity = 0.5;
                        }
                    }
                }
            }
        } else {
            if (focusunit != undefined) {
                focusunit.div.style.opacity = 1;
                focusunit = undefined;
                for (let hex of manyHexDiv) {
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
            if (distance(focusunit.x, focusunit.y, parseFloat(div.style.left), parseFloat(div.style.top), 0, 0) < 250) {
                focusunit.x = parseFloat(div.style.left);
                focusunit.y = parseFloat(div.style.top);
                focusunit.div.style.left = div.style.left;
                focusunit.div.style.top = div.style.top;
                for (let hex of manyHexInfo) {
                    if (distance(focusunit.x, focusunit.y, hex.x, hex.y, 0, 0) < 320) {
                        hex.discovererd[playerid] = true;
                        createHexTiles(hex);
                    }
                }
            }

            focusunit.div.style.opacity = 1;
            focusunit = undefined;
            for (let hex of manyHexDiv) {
                hex.style.opacity = 1;
            }
        }
    }

    createUnit("settler", 350, 260, playerid);
    border.addEventListener("click", selectUnit);
}