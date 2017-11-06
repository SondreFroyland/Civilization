class Sprite {
    constructor(div, x, y) {
        this.div = div;
        this.x = x;
        this.y = y;
    }
}

window.ondragstart = function () { return false; }

function setup() {

    let mainX = 0;
    let mainY = 0;
    let main = document.getElementById("main");

    addEventListener("mousemove", flytt);
    function flytt(e) {
        if (e.buttons === 1) {
            mainX = mainX + e.movementX;
            mainY = mainY + e.movementY;
            main.style.left = mainX + "px";
            main.style.top = mainY + "px";
        }
    }

    setInterval(gameEngine, 50);

    let manyHex = [];

    function createTile(i, j) {
        let divHex = document.createElement("div");
        divHex.className = "sjø";
        let divHexTop = document.createElement("div");
        divHexTop.className = "hexTop";
        let divHexBot = document.createElement("div");
        divHexBot.className = "hexBottom";
        document.getElementById("main").appendChild(divHex);
        divHex.appendChild(divHexTop);
        divHex.appendChild(divHexBot);

        let xpos = 0;
        let ypos = 0;

        ypos = i * 86;
        if (i / 2 === Math.ceil(i / 2)) {
            xpos = j * 100;
        } else {
            xpos = j * 100 + 50;
        }

        let hexSprite = new Sprite(divHex, xpos, ypos);

        divHex.style.left = xpos + "px";
        divHex.style.top = ypos + "px";

        manyHex.push(hexSprite);
    }

    for (let i = -12; i < 17; i++) {
        for (let j = -14; j < 35; j++) {
            createTile(i, j);
        }
    }
    generateWorld();

    function distance(ax, ay, bx, by, xscew, yscew) {
        let dist = Math.sqrt((ax - bx + xscew) * (ax - bx + xscew) + (ay - by + yscew) * (ay - by + yscew));
        return dist;
    }

    function splashtiles(xlocation, ylocation, radius, className) {
        //function splashtiles(xlocation, ylocation, radius, roughness, xlocation2, ylocation2) {
        /*
        beskrivelse av parametere:
        x/ylocation: xpos og ypos å sjekke rundt
        radius: radius til sirkel rundt punktet
        roughness: hvor jevn sirkelen skal være, roughness = 0 betyr perfekt sirkel, 
        mens mer roughness sier hvor mye tilfeldighet det er for å sjekke om en tile er innenfor eller ikke
        (genererer nye tall for hver tile for å sjekke om den skal være med eller ikke(dette kan 
        lede til at det blir "øyer" som har vært heldige, mens andre tiles rundt ikke har det,
        kanskje det finnes bedre model for dette(tenker muligens definere en sirkel med roughness,
        så si at alle tiles innenfor sirkelen skal forandres)))
        x/ylocation2: om en skal lage en sti, for eksempel en elv fra ett punkt til et annet
        her vil roughnessen være et mål på hvor mye radiusen kan variere, og hvor svingete elva er.
        kan separere dette i to parametere, kan også ha splashtiles og linjesplash som to forskjellige
        funksjoner.
        */
        for (let hex of manyHex) {
            if (distance(hex.x, hex.y, xlocation, ylocation, 50, 58) <= radius) {
                hex.div.className = className;
            }
        }
    }
    function splashline(startX, startY, endX, endY, startRadius, midRadius, endRadius, className) {
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
    }

    function generateWorld() {
        for (let i = 0; i <= 20; i++) {
            console.log(i);
            let randTileClass = "";
            switch (Math.floor(Math.random() * 3)) {
                case 0:
                    randTileClass = "gress";
                    break;
                case 1:
                    randTileClass = "ørken";
                    break;
                case 2:
                    randTileClass = "fjell";
                    break;
            }
            let randXPos = Math.ceil(Math.random() * 3000) - 1000;
            let randYPos = Math.ceil(Math.random() * 3000) - 1000;
            let randRadius = Math.ceil(Math.random() * 600) + 100;
            splashtiles(randXPos, randYPos, randRadius, randTileClass);
        }
        /*splashtiles(600, 500, 200, "gress");
        splashtiles(-200, 700, 300, "ørken");
        splashtiles(0, 500, 200, "fjell");
        splashtiles(1200, -400, 600, "gress");
        splashtiles(1000, -350, 300, "fjell");
        splashtiles(1150, -500, 200, "ørken");*/
    }

    function gameEngine() {

    }
}