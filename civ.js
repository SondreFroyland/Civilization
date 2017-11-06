class hexInfo {
    constructor(x, y, hexClass) {
        this.x = x;
        this.y = y;
        this.hexClass = hexClass;
        this.deployed = false;
    }
}

window.ondragstart = function () { return false; }

let screenXPos = 0;
let screenYPos = 0;

function setup() {
    let main = document.getElementById("main");

    border.addEventListener("mousemove", flytt);
    function flytt(e) {
        if (e.buttons === 1) {
            screenXPos = screenXPos + e.movementX;
            screenYPos = screenYPos + e.movementY;
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
                if ((hex.x + screenXPos) > -150 && (hex.x + screenXPos) < 940 && (hex.y + screenYPos) > -160 && (hex.y + screenYPos) < 640 && !hex.deployed) {
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
        }
    }

    let manyHexInfo = [];
    let manyHexDiv = [];

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
        for (let i = 0; i <= 30; i++) {
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
            let randRadius = Math.ceil(Math.random() * 500) + 100;
            splashtiles(randXPos, randYPos, randRadius, randTileClass);

        }
        for (let hex of manyHexInfo) {
            if ((hex.x + screenXPos) > -150 && (hex.x + screenXPos) < 940 && (hex.y + screenYPos) > -160 && (hex.y + screenYPos) < 640 && !hex.deployed) {
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
    }
}