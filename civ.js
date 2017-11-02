class Sprite {
    constructor(div, x, y) {
        this.div = div;
        this.x = x;
        this.y = y;
    }
}





function setup() {

    addEventListener("mousemove", flytt);
    function flytt(e) {
        if (e.buttons === 1) {
            for (let hex of manyHex) {
                hex.x = hex.x + e.movementX;
                hex.y = hex.y + e.movementY;
                hex.div.style.left = hex.x + "px";
                hex.div.style.top = hex.y + "px";
            }
        }
    }

    setInterval(gameEngine, 50);

    let manyHex = [];

    function createTile(i, j) {
        let divHex = document.createElement("div");
        divHex.className = "hexagon";
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
        splashtiles(600, 500, 200);
        //dette gir ikke en sirkel, men en firkant istedenfor
    }

    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 12; j++) {
            createTile(i, j);
        }
    }

    function splashtiles(xlocation, ylocation, radius) {
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
        //add some other types of tiles, maybe this is a good way, check tiles between certain x and y coordinates and give them different style
        for (let hex of manyHex) {
            if (((hex.x + 50 - xlocation) * (hex.x + 50 - xlocation) + (hex.y + 58 - ylocation) * (hex.y + 58 - ylocation)) < (radius*radius)) {
                hex.div.style.visibility = "hidden"; //or give another class and remove old class
            }
        }
    }

    function gameEngine() {

    }
}