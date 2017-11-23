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
        this.cityBuilt; //ha id til city
        this.ownedByCity; //have id of city which owns tile, to mark it and have it availble to be worked
        this.workedByCity = false; //if you assign a citizen to work tile, its stats will be added during turn end
        this.canBeClaimed; //give cityid as value
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
        this.skipturn = false;
    }
}

class city {
    constructor(div, x, y, player, cityid, isNearWater, tile, cityName) {
        this.div = div;
        this.x = x;
        this.y = y;
        this.player = player;
        this.id = cityid;
        this.pop = 1;
        this.unnasigned = 1;
        this.buildingsBuilt = []; //adde ting i denne arrayen ettersom ting blir bygget
        this.isNearWater = isNearWater
        this.currentlyProducing;
        this.production = 0;
        this.food = 0;
        this.gold = 0;
        this.science = 0;
        this.storedProduction = 0;
        this.storedFood = 0;
        this.turnsLeft;
        this.tile = tile;
        this.tileexpand = 0;
        this.cityName = cityName;
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

//^^helt enig -sondre




//har visst mye ovenfor utenfor setup funksjonen, kan sikkert flytte noe inn, har flytta det, får se om det gjør noe

function setup() {

    /*setInterval(playsound, 1000);

    let soundcount = 0;
    function playsound() {
        soundcount++;
        if (soundcount === 1) {
            var audio = new Audio("backgroundMusic.mp3");
            audio.volume = 0.2;
            audio.play();
        }
        if (soundcount === 220) {
            soundcount = 0;
        }
    }*/

    let playerid = 0;
    let playerGold = 60;
    let playerScience = 0;

    let hexØrken = {
        class: "ørken",
        penalty: 1, //desimaltall eller 0 fungerer ikke
        miniMapColor: "#F9D90F",
        food: 0,
        production: 1,
        gold: 0,  //if there are recources on tile, add the recources' stats to tile when calcultationg turn end
        science: 0
    }
    let hexSjø = {
        class: "sjø",
        penalty: 1,
        miniMapColor: "#1D77A5",
        food: 1,
        production: 0,
        gold: 0,
        science: 0
    }
    let hexGress = {
        class: "gress",
        penalty: 1,
        miniMapColor: "#54DD23",
        food: 2,
        production: 0,
        gold: 0,
        science: 0
    }
    let hexFjell = {
        class: "fjell",
        penalty: 3,
        miniMapColor: "#795D41",
        food: 0,
        production: 2,
        gold: 0,
        science: 1
    }
    let hexSkog = {
        class: "skog",
        penalty: 2,
        miniMapColor: "#0B6611",
        food: 1,
        production: 1,
        gold: 0,
        science: 0
    }

    let terrainTypes = [hexGress, hexGress, hexGress, hexSkog, hexØrken, hexØrken, hexFjell, hexSjø];

    window.ondragstart = function () { return false; }

    let playField = document.getElementById("playField");
    let screenXPos = 0;
    let screenYPos = 0;
    //for at forsjellige spillere skal ha forsjellig startposisjon, er det bare å forandre disse
    //vil sansyneligvis generere en settler for hver spiller på en landtile, discovere området rundt, så si at screenX og screenY skal være sentrert på settleren
    playField.style.left = screenXPos + "px";
    playField.style.top = screenYPos + "px";

    let focusunit = undefined;
    let focustile = undefined;
    let focuscity = undefined;

    let intervalXDirection = "";
    let intervalYDirection = "";

    let border = document.getElementById("border");
    border.addEventListener("mousemove", flytt);

    function flytt(e) {
        moveMiniMapBorder();
        if (e.buttons === 1) {
            screenXPos = screenXPos + 2 * e.movementX;
            screenYPos = screenYPos + 2 * e.movementY;
            playField.style.left = screenXPos + "px";
            playField.style.top = screenYPos + "px";
            for (let hex of manyHexInfo) {
                if (hex.deployed) {
                    if ((hex.x + screenXPos) < -330 || (hex.x + screenXPos) > 1120 || (hex.y + screenYPos) < -340 || (hex.y + screenYPos) > 820) {
                        hex.deployed = false;
                        hex.div.remove();
                    }
                }
                createHexTiles(hex);
            }
        }

        if (e.clientX < 100 + 50) {
            if (intervalXDirection !== "left") {
                moveLeft = setInterval(moveMap, 30, "left");
                intervalXDirection = "left";
            }
        } else {
            if (intervalXDirection === "left") {
                clearInterval(moveLeft);
                intervalXDirection = "";
            }
        }

        if (e.clientX > 900 - 50) {
            if (intervalXDirection !== "right") {
                moveRight = setInterval(moveMap, 30, "right");
                intervalXDirection = "right";
            }
        } else {
            if (intervalXDirection === "right") {
                clearInterval(moveRight);
                intervalXDirection = "";
            }
        }

        if (e.clientY < 20 + 50) {
            if (intervalYDirection !== "up") {
                moveUp = setInterval(moveMap, 30, "up");
                intervalYDirection = "up";
            }
        } else {
            if (intervalYDirection === "up") {
                clearInterval(moveUp);
                intervalYDirection = "";
            }
        }

        if (e.clientY > 570 - 50) {
            if (intervalYDirection !== "down") {
                moveDown = setInterval(moveMap, 30, "down");
                intervalYDirection = "down";
            }
        } else {
            if (intervalYDirection === "down") {
                clearInterval(moveDown);
                intervalYDirection = "";
            }
        }
    }


    //need to prevent screen from scrolling when taking mouse out of border, if i need to select anything in UI
    function moveMap(param) {
        switch (param) {
            case "left":
                screenXPos += 16;
                break;
            case "right":
                screenXPos -= 16;
                break;
            case "up":
                screenYPos += 16;
                break;
            case "down":
                screenYPos -= 16;
                break;
        }
        playField.style.left = screenXPos + "px";
        playField.style.top = screenYPos + "px";
        for (let hex of manyHexInfo) {
            if (hex.deployed) {
                if ((hex.x + screenXPos) < -330 || (hex.x + screenXPos) > 1120 || (hex.y + screenYPos) < -340 || (hex.y + screenYPos) > 820) {
                    hex.deployed = false;
                    hex.div.remove();
                }
            }
            createHexTiles(hex);
        }
        moveMiniMapBorder();
    }

    let main = document.getElementById("main");
    main.addEventListener("mousemove", outOfPlayField);

    function outOfPlayField(e) {
        if (e.clientX > 900 || e.clientX < 100 || e.clientY < 20 || e.clientY > 570) {
            if (intervalXDirection === "right") {
                clearInterval(moveRight);
                intervalXDirection = "";
            }
            if (intervalXDirection === "left") {
                clearInterval(moveLeft);
                intervalXDirection = "";
            }
            if (intervalYDirection === "up") {
                clearInterval(moveUp);
                intervalYDirection = "";
            }
            if (intervalYDirection === "down") {
                clearInterval(moveDown);
                intervalYDirection = "";
            }
        }
    }

    function createHexTiles(hex) {
        if ((hex.x + screenXPos) > -350 && (hex.x + screenXPos) < 1140 && (hex.y + screenYPos) > -360 && (hex.y + screenYPos) < 840 && !hex.deployed && hex.discovererd[playerid]) {
            hex.deployed = true;
            let divHex = document.createElement("div");
            divHex.className = hex.hexType.class + " tile";
            let divHexTop = document.createElement("div");
            divHexTop.className = "hexTop tile";
            let divHexBot = document.createElement("div");
            divHexBot.className = "hexBottom tile";
            playField.appendChild(divHex);
            divHex.appendChild(divHexTop);
            divHex.appendChild(divHexBot);
            divHex.style.left = hex.x + "px";
            divHex.style.top = hex.y + "px";
            hex.div = divHex;
            if (focusunit !== undefined && hex.canBeWalkedBy[focusunit.id] >= 0) {
                hex.div.style.opacity = 0.5; //problemet her er at tilesa ikke finnes før du drar, kan prøve med større load radius rundt skjerm, dette tar å fikser problemet med å unloade så loade tiles som en kan gå på da
            }
            if (focuscity !== undefined && !hex.cityBuilt) {
                if (hex.ownedByCity === focuscity.id) {
                    if (hex.workedByCity) {
                        hex.div.style.filter = "hue-rotate(180deg)";
                    } else {
                        hex.div.style.opacity = 0.5;
                    }
                }
                if (hex.canBeClaimed === focuscity.id) {
                    hex.div.style.filter = "invert(30%)";
                }
            }
        }
    }

    let manyHexInfo = [];

    let units = [];

    let cities = [];

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
        cantWalkOn: ["sjø", "fjell"],
        productionCost: 40,
        needsWaterTile: false,
        uiimg: "Diverse/Settler_(Civ5).png"
    }
    let scoutUnit = {
        stringType: "scout",
        moves: 3,
        vision: 4,
        life: 50,
        cantWalkOn: ["sjø"],
        productionCost: 20,
        needsWaterTile: false,
        uiimg: "Diverse/Scout_(Civ5).png"
    }
    let boatUnit = {
        stringType: "boat",
        moves: 4,
        vision: 4,
        life: 50,
        cantWalkOn: ["gress", "fjell", "ørken"],
        productionCost: 60,
        needsWaterTile: true,
        uiimg: "Diverse/Work_boat_(Civ5).png"
    }
    let testUnit = {
        stringType: "test",
        moves: 6,
        vision: 5,
        life: 50,
        cantWalkOn: [],
        productionCost: 40,
        needsWaterTile: false,
        uiimg: "Diverse/Trireme_(Civ5).png"
    }

    let unitTypes = [settlerUnit, scoutUnit, boatUnit, testUnit];

    let unitid = 0;
    function createUnit(type, x, y, player) {
        let newUnitDiv = document.createElement("div");
        newUnitDiv.id = unitid;
        newUnitDiv.className = type.stringType + " unit";
        newUnitDiv.style.left = x + "px";
        newUnitDiv.style.top = y + "px";
        playField.appendChild(newUnitDiv);
        let newUnit = new unit(newUnitDiv, x, y, type, player, unitid);
        unitid++;
        units.push(newUnit);
        for (let hex of manyHexInfo) {
            if (x === hex.x && y === hex.y) {
                hex.occupied = true;
            }
        }
    }
    let cityNames = ["Hong Kong", "Oslo", "Haraldstøttå", "Statane", "Capital"];
    let cityid = 0;
    function createCity() {
        //check if there are any cities nearby
        for (let city of cities) {
            if (distance(focustile.x, focustile.y, city.x, city.y, 0, 0) <= 400) {
                insertDialogue("Can't build that close to another city (Min 5 tiles apart)")
                return;
            }
        }
        let newCityDiv = document.createElement("div");
        newCityDiv.id = cityid;
        cityid++;
        newCityDiv.className = "city";
        let x = focusunit.x;
        let y = focusunit.y;
        let isNearWater = false;
        for (let hex of manyHexInfo) {
            if (distance(x, y, hex.x, hex.y, 0, 0) <= 100) {
                if (hex.ownedByCity === undefined) {
                    hex.ownedByCity = cityid;
                }
                if (hex.hexType.class === "sjø") {
                    isNearWater = true;
                }
            }
        }
        newCityName = cityNames[Math.floor(Math.random() * cityNames.length)];
        focustile.cityBuilt = cityid;
        newCityDiv.style.left = x + "px";
        newCityDiv.style.top = y + "px";
        playField.appendChild(newCityDiv);
        let newCity = new city(newCityDiv, x, y, playerid, cityid, isNearWater, focustile, newCityName);
        cities.push(newCity);

        for (let hex of manyHexInfo) {
            if (hex.canBeWalkedBy[focusunit.id] >= 0) {
                hex.canBeWalkedBy[focusunit.id] = undefined;
                hex.div.style.opacity = 1;
            }
        }
        focustile.occupied = false;
        focusunit.div.remove();
        units.splice(units.indexOf(focusunit), 1);
        focusunit = undefined;
        focustile = undefined;
        changeUI();
    }

    let dialogue = document.getElementById("dialoguebox");

    function insertDialogue(a) {
        dialogue.innerHTML = a;
        timeoutIsGoing = false;
        clearTimeout(dialogueTimeout);
        changeUI();
    }

    document.getElementById("endturn").addEventListener("click", endturn);

    let turncounter = 0;

    //deselect all units & cities
    function endturn() {
        deselectTiles();
        focusunit = undefined;
        focustile = undefined;
        focuscity = undefined;

        //check if cities and units players control have anything unfinished

        for (let city of cities) {
            if (city.player === playerid) {
                if (city.currentlyProducing === undefined) {
                    insertDialogue("You need to choose something for the city to produce"); //kanskje ha i infobox hvor mange idle citizens
                    selectUnit(city.div);
                    return;
                }
                if (city.tileexpand > 0) {
                    insertDialogue("You need to expand the city's border"); //kanskje ha i infobox hvor mange idle citizens
                    selectUnit(city.div);
                    return;
                }
                if (city.unnasigned > 0) {
                    insertDialogue("You need to assign all of the city's citizens to work on tiles"); //kanskje ha i infobox hvor mange idle citizens
                    selectUnit(city.div);
                    return;
                }
            }
        }
        for (let u of units) {
            if (u.player === playerid) {
                if (u.currentmoves > 0 && u.skipturn === false) {
                    insertDialogue("You need to move your unit or skip its turn");
                    selectUnit(u.div);
                    return;
                }
            }
        }
        //make all deselections and ui changes nessecary (don't think any calculations need to have focusunits, tiles or cities, because it should be general, so therefore can do deselections before checks and calculations)
        //require players to select something to produce in cities before ending
        //require players to select something to research
        //check for units that still have movement left (and have not been assigned to skip turn) before ending

        //actual end turn calculations

        
        turncounter++;
        document.getElementById("endturnCount").innerHTML = "Turn: " + turncounter;

        let endturnDialogue = "Turn ended";
        for (let u of units) {
            u.currentmoves = u.type.moves;
            u.skipturn = false;
        }
        for (let city of cities) {
            city.production = city.pop; //give production equal to population
            city.food = - city.pop; //eat food, 1 per pop
            city.gold = 0;
            city.science = 0;
            for (let hex of manyHexInfo) {
                if (hex.ownedByCity === city.id) {
                    if (hex.workedByCity || hex.cityBuilt === city.id) {
                        city.production += hex.hexType.production;
                        city.food += hex.hexType.food;
                        city.gold += hex.hexType.gold;
                        city.science += hex.hexType.science;
                    }
                }
            }
            for (let building of city.buildingsBuilt) {
                city.production += building.productionBonus;
                city.food += building.foodBonus;
                city.gold += building.goldBonus;
                city.science += building.scienceBonus;
            }
            city.storedProduction += city.production;
            city.storedFood += city.food;
            city.science += city.pop * 2;

            if (city.storedFood >= city.pop * 4) { //litt buggy med flere byer som er nær hverandre, må gjøre slik at byer ikke kan ha felles tiles, limite hvor nær hverandre byer kan lages
                city.storedFood -= city.pop * 4;
                city.pop++;
                city.unnasigned++;
                city.tileexpand++;
                endturnDialogue += ", " + city.cityName + " grew and its population is now " + city.pop + ".";
                //also make a way to expand border, 1 for each additional population
            }

            playerScience += city.science;
            playerGold += city.gold;

            if (city.currentlyProducing !== undefined && city.storedProduction >= city.currentlyProducing.productionCost) {
                if (city.currentlyProducing.vision !== undefined) {
                    //have created a unit, need to check if tile is occupied
                    if (!city.tile.occupied) {
                        createUnit(city.currentlyProducing, city.x, city.y, city.player);
                        city.storedProduction -= city.currentlyProducing.productionCost;
                        city.currentlyProducing = undefined;
                    } else {
                        insertDialogue("The tile is occupied");
                    }
                } else {
                    //have built a building
                    city.buildingsBuilt.push(city.currentlyProducing);
                    city.storedProduction -= city.currentlyProducing.productionCost;
                    city.currentlyProducing = undefined;
                }
            }
            if (city.currentlyProducing !== undefined) {
                city.turnsLeft = Math.ceil((city.currentlyProducing.productionCost - city.storedProduction) / city.production);
            }
        }
        insertDialogue(endturnDialogue);
        //when turn ends, calculate how much gold, science, city growth etc, will happen accros all cities
    }

    function deselectTiles() {
        if (focusunit !== undefined) {
            focusunit.div.style.opacity = 1;
            for (let hex of manyHexInfo) {
                if (hex.canBeWalkedBy[focusunit.id] >= 0) {
                    hex.canBeWalkedBy[focusunit.id] = undefined;
                    hex.div.style.opacity = 1;
                }
            }
        }
        if (focuscity !== undefined) {
            focuscity.div.style.opacity = 1;
            for (let hex of manyHexInfo) {
                if (hex.ownedByCity === focuscity.id) {
                    hex.div.style.opacity = 1;
                    hex.div.style.filter = "hue-rotate(0deg)";
                }
                if (hex.canBeClaimed === focuscity.id) {
                    if (hex.div !== undefined) {
                        hex.div.style.filter = "invert(0%)";
                    }
                    hex.canBeClaimed = undefined;
                }
            }
        }
    }

    //kanskje legge til at du kan dra uten å fjerne selection av tiles
    //masse for loops lager mye lag, kanskje det kan kuttes ned på dem på en eller annen måte...
    border.addEventListener("click", selectUnit);

    function selectUnit(e) { // in some way use this function to make UI for different units
        let div; //should start by deselecting (graphically) all tiles that could possivly be selected, have own function for that, deselectTiles() and also use that other places, like after end turn or right click
        if (e.path !== undefined) {
            div = e.path[0];
        } else {
            div = e;
        }
        deselectTiles();
        focustile = undefined;
        if (div.classList.contains("unit")) {
            for (let n of units) {
                if (div === n.div) {
                    div.style.opacity = 0.5;
                    focusunit = n;
                    screenXPos = -focusunit.x + 800 / 2 - 100 / 2;
                    screenYPos = -focusunit.y + 550 / 2 - 120 / 2;
                    playField.style.left = screenXPos + "px";
                    playField.style.top = screenYPos + "px";
                    let searchingTiles = [];
                    for (let hex of manyHexInfo) {
                        if (n.x === hex.x && n.y === hex.y) {
                            hex.canBeWalkedBy[n.id] = 0;
                            searchingTiles.push(hex);
                            focustile = hex;
                        }
                        createHexTiles(hex);
                    }
                    for (let i = 1; i <= n.currentmoves; i++) {
                        for (let hex of manyHexInfo) {
                            if (hex.deployed) { //hvis denne bare leter i de som er deployed, kan noen paths ikke vises, om dette blir et problem øker en bare antall tiles rundt sjermen som er deployed, kanskje 4-5 utenfor istedenfor 1-2
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
                                                searchingTiles.push(hex);
                                            }
                                        }
                                    }
                                }
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
                focusunit.div.style.opacity = 1;
                focusunit = undefined;
            }
            /*if (div.classList.contains("unit")) {
                selectUnit(e);
            }*/
        }
        if (div.classList.contains("city")) { // når du velger en city, hvis do har ledige tileexpands(får en hver pop growth), lyser alle tiles rundt de byen eier, som ikke er eid av noen by allerede, og om du høyreklikker på en av disse, mister du en tilegrowth og får tilen(lyse i lilla ser jeg for meg)
            div.style.opacity = 0.8;
            for (let n of cities) {
                if (n.div === div) {
                    focuscity = n;
                    screenXPos = -focuscity.x + 800 / 2 - 100 / 2;
                    screenYPos = -focuscity.y + 550 / 2 - 120 / 2;
                    playField.style.left = screenXPos + "px";
                    playField.style.top = screenYPos + "px";
                }
            }
            for (let hex of manyHexInfo) {
                if (focuscity.x === hex.x && focuscity.y === hex.y) {
                    focustile = hex;
                }
                createHexTiles(hex);
                if (hex.ownedByCity === focuscity.id) {
                    for (let hexlookfor of manyHexInfo) {
                        if (focuscity.tileexpand > 0 && hexlookfor.ownedByCity === undefined && distance(hexlookfor.x, hexlookfor.y, hex.x, hex.y, 0, 0) <= 100 && distance(hexlookfor.x, hexlookfor.y, focuscity.x, focuscity.y, 0, 0) <= (1 + Math.floor(Math.sqrt(focuscity.pop))) * 100) {
                            if (hexlookfor.div !== undefined) {
                                hexlookfor.div.style.filter = "invert(20%)"; //this style means they can be claimed by city, need to right click on them to claim 
                            }
                            hexlookfor.canBeClaimed = focuscity.id;
                        }
                    }
                    if (hex.cityBuilt !== focuscity.id) {
                        hex.div.style.opacity = 0.5;
                        if (hex.workedByCity) {
                            hex.div.style.filter = "hue-rotate(180deg)"; //ha en anen type style her, for eksempel grønnfarge
                        }
                    }
                }
            }
        } else {
            if (focuscity !== undefined) {
                focuscity = undefined;
                //focustile = undefined; //om vi sier focustile skal bli undefined, vil den alltid bli undefined, enten i cityselect eller i unitselect. Må heller ha det slik at focustile blir undefined til å begynne med, og så uansett hva du selecter blir den defined etter det
            }
        }
        moveMiniMapBorder();
        changeUI(div);
    }

    let uibutton1 = document.getElementById("button1");
    uibutton1.addEventListener("click", button1Click);
    let uibutton2 = document.getElementById("button2");
    uibutton2.addEventListener("click", button2Click);
    let uibutton3 = document.getElementById("button3");
    //uibutton3.addEventListener("click", button3Click);
    let uibutton4 = document.getElementById("button4");
    //uibutton4.addEventListener("click", button4Click);
    let cityui = document.getElementById("cityui");

    //bør ha egen UI under minimap for hva som kan gjøres i byene, kjøpe units etc
    //ha en array med units og bygninger som kan bli kjøpt, og pushe inn i denne arrayen etterhvert som nye ting blir researcha

    let aqueduct = {
        stringType: "Aqueduct",
        productionCost: 30,
        foodBonus: 2,
        productionBonus: 0,
        goldBonus: 0,
        scienceBonus: 0,
        uiimg: "Diverse/Aqueduct.png"
    }
    let univerity = {
        stringType: "University",
        productionCost: 40,
        foodBonus: 0,
        productionBonus: 0,
        goldBonus: 0,
        scienceBonus: 3,
        uiimg: "Diverse/University_civ.png"
    }
    let garden = {
        stringType: "Garden",
        productionCost: 50,
        foodBonus: 3,
        productionBonus: 0,
        goldBonus: 0,
        scienceBonus: 0,
        uiimg: "Diverse/Garden.png"
    }
    let barracks = {
        stringType: "Barracks",
        productionCost: 55,
        foodBonus: 0,
        productionBonus: 0,
        goldBonus: 0,
        scienceBonus: 0,
        uiimg: "Diverse/Barracks.png"
    }
    let hospital = {
        stringType: "Hospital",
        productionCost: 55,
        foodBonus: 6,
        productionBonus: 0,
        goldBonus: 0,
        scienceBonus: 0,
        uiimg: "Diverse/Hospital.png"
    }
    let library = {
        stringType: "Library",
        productionCost: 55,
        foodBonus: 0,
        productionBonus: 0,
        goldBonus: 0,
        scienceBonus: 2,
        uiimg: "Diverse/Library.png"
    }
    let walls = {
        stringType: "Walls",
        productionCost: 55,
        foodBonus: 0,
        productionBonus: 0,
        goldBonus: 0,
        scienceBonus: 2,
        uiimg: "Diverse/Walls.png"
    }
    let buildingsAvailible = [aqueduct, univerity, garden, barracks, hospital, library, walls];

    let currentlyBuilding = document.getElementById("currentlybuilding");

    let goldProductionToggle = document.getElementById("purchaseswitch");
    goldProductionToggle.addEventListener("click", togglePurchaseMethod);

    let purchaseMethod = "production";
    function togglePurchaseMethod() {
        if (purchaseMethod === "production") {
            purchaseMethod = "gold";
            goldProductionToggle.innerHTML = "Buy With Production";
        } else {
            purchaseMethod = "production";
            goldProductionToggle.innerHTML = "Buy With Gold";
        }
        changeUI(focuscity.div);
    }

    let uiSelected = "";

    let unitPurchaseDiv = document.getElementById("units");
    let unitHeaderDiv = document.getElementById("unitheader");

    let buildingPurchaseDiv = document.getElementById("buildings");
    let buildingHeaderDiv = document.getElementById("buildingheader");

    let selectInfo = document.getElementById("selectedinfo");

    let goldDiv = document.getElementById("gold");
    let scienceDiv = document.getElementById("science");

    let timeoutIsGoing = false;
    let dialogueTimeout;

    function changeUI(div) { //add so that when i hover over in cityui, something that has unitbuyoption or buildingbuyoption, a div gets created with some information: description, moves, vision, attack, hp etc. Since i dont have much room in UI this might be a good way to show more info
        goldDiv.innerHTML = "Gold: " + playerGold;
        scienceDiv.innerHTML = "Science: " + playerScience;
        uibutton1.style.visibility = "hidden";
        uibutton2.style.visibility = "hidden";
        uibutton3.style.visibility = "hidden";
        uibutton4.style.visibility = "hidden";
        cityui.style.visibility = "hidden";
        selectInfo.style.visibility = "hidden";
        uiSelected = "";
        if (dialogue.innerHTML !== "" && !timeoutIsGoing) {
            timeoutIsGoing = true;
            dialogueTimeout = setTimeout(function () {
                dialogue.innerHTML = "";
                timeoutIsGoing = false;
            }, 3500);
        }
        if (focuscity !== undefined) {
            div = focuscity.div;
        }
        if (focusunit !== undefined) {
            div = focusunit.div;
        }
        if (div === undefined) {
            return;
        }
        if (div.classList.contains("settler")) {
            //just selected a settler
            uiSelected = "settler";
            button2.innerHTML = "Found City";
            uibutton2.style.visibility = "visible";

        }
        if (div.classList.contains("unit")) {
            button1.innerHTML = "Skip Turn";
            button1.style.visibility = "visible";
            selectInfo.style.visibility = "visible";
            selectInfo.innerHTML = "Moves Left: " + focusunit.currentmoves; //maybe also display health, attack etc. here
        }
        if (div.classList.contains("city")) {
            //just selected a city
            uiSelected = "city";
            selectInfo.style.visibility = "visible";
            selectInfo.innerHTML = "Stored Production: " + focuscity.storedProduction + "<br> Population: " + focuscity.pop + "<br> Stored Food: " + focuscity.storedFood;

            while (unitPurchaseDiv.lastChild !== unitHeaderDiv) {
                unitPurchaseDiv.removeChild(unitPurchaseDiv.lastChild);
            }
            while (buildingPurchaseDiv.lastChild !== buildingHeaderDiv) {
                buildingPurchaseDiv.removeChild(buildingPurchaseDiv.lastChild);
            }

            cityui.style.visibility = "visible";
            focuscity.production = focuscity.pop;
            for (let hex of manyHexInfo) {
                if (hex.ownedByCity === focuscity.id) {
                    if (hex.workedByCity || hex.cityBuilt === focuscity.id) {
                        focuscity.production += hex.hexType.production;
                    }
                }
            }

            for (let u of unitTypes) {
                if (u.needsWaterTile) {
                    if (!focuscity.isNearWater) {
                        continue; //prevents boats from being made in landcities
                    }
                }
                newPurchaseOption = document.createElement("div");
                newPurchaseOption.className = "unitbuyoption";
                newPurchaseOption.id = u.stringType;
                unitPurchaseDiv.appendChild(newPurchaseOption);
                if (purchaseMethod === "gold") {
                    newPurchaseOption.innerHTML = u.stringType + ": Costs " + u.productionCost + " Gold <img class='builduiimg' src=" + u.uiimg + ">";
                } else {
                    newPurchaseOption.innerHTML = u.stringType + ": Takes " + Math.ceil(u.productionCost / focuscity.production) + " turns to build <img class='builduiimg' src=" + u.uiimg + ">";
                }
            }
            for (let b of buildingsAvailible) {
                if (focuscity.buildingsBuilt.indexOf(b) === -1) { //kanskje legge til en sjekk om byen ligger med vann her og, om noen bygninger trenger det
                    newPurchaseOption = document.createElement("div");
                    newPurchaseOption.className = "buildingbuyoption";
                    newPurchaseOption.id = b.stringType;
                    buildingPurchaseDiv.appendChild(newPurchaseOption);
                    if (purchaseMethod === "gold") {
                        newPurchaseOption.innerHTML = b.stringType + ": Costs " + b.productionCost + " Gold <img class='builduiimg' src=" + b.uiimg + ">";
                    } else {
                        newPurchaseOption.innerHTML = b.stringType + ": Takes " + Math.ceil(b.productionCost / focuscity.production) + " turns to build <img class='builduiimg' src=" + b.uiimg + ">";
                    }
                }
            }
            if (focuscity.currentlyProducing !== undefined) {
                focuscity.turnsLeft = Math.ceil((focuscity.currentlyProducing.productionCost - focuscity.storedProduction) / focuscity.production);
                currentlyBuilding.innerHTML = "Building " + focuscity.currentlyProducing.stringType + ", " + focuscity.turnsLeft + " turns left";
            } else {
                currentlyBuilding.innerHTML = "Choose Something To Build";
            }
        }
    }

    function button1Click() {
        focusunit.skipturn = true;
        insertDialogue("Unit is skipping its moves this turn");
        //endturn(); //maybe not always good idea to run this, but ill try and see if there are any complaints
        //i didnt like it
    }

    function button2Click() {
        if (uiSelected === "settler") {
            if (focusunit.currentmoves > 0) {
                createCity();
            } else {
                insertDialogue("You need to wait a turn first");
            }
        }
        /*if (uiSelected === "city") {
            if (!focustile.occupied) {
                createUnit(scoutUnit, focuscity.x, focuscity.y, playerid);
            } else {
                console.log("you have to move a unit away from your city");
            } //har en egen UI for city functions
        }*/
    }

    let cityUiBorder = document.getElementById("scrollable");
    cityUiBorder.addEventListener("click", cityPurchase);

    function cityPurchase(e) {
        let div = e.path[0];
        if (div.classList.contains("unitbuyoption") || div.classList.contains("buildingbuyoption")) {
            let tofind;
            for (let i of buildingsAvailible) {
                if (i.stringType === div.id) {
                    tofind = i;
                }
            }
            for (let i of unitTypes) {
                if (i.stringType === div.id) {
                    tofind = i;
                }
            }
            if (purchaseMethod === "production") {
                focuscity.currentlyProducing = tofind;

                focuscity.production = focuscity.pop;
                for (let hex of manyHexInfo) {
                    if (hex.ownedByCity === focuscity.id) {
                        if (hex.workedByCity || hex.cityBuilt === focuscity.id) {
                            focuscity.production += hex.hexType.production;
                        }
                    }
                }

                focuscity.turnsLeft = Math.ceil((tofind.productionCost - focuscity.storedProduction) / focuscity.production);
                currentlyBuilding.innerHTML = "Building " + focuscity.currentlyProducing.stringType + ", " + focuscity.turnsLeft + " turns left";
            } else {
                //purchasing with gold instead
                if (playerGold >= tofind.productionCost) {
                    if (div.classList.contains("unitbuyoption")) {
                        if (!focustile.occupied) {
                            createUnit(tofind, focuscity.x, focuscity.y, playerid);
                            playerGold -= tofind.productionCost;
                        } else {
                            insertDialogue("The tile is occupied");
                        }
                    } else {
                        //buying a building for gold
                    }
                } else {
                    insertDialogue("You do not have enough money to buy this");
                }
            }
        }
        changeUI(focuscity.div);
    }


    border.addEventListener("contextmenu", rightClick);
    function rightClick(e) {
        let div = e.path[0];
        if (div.classList.contains("hexTop") || div.classList.contains("hexBottom")) {
            div = e.path[1];
        }
        e.preventDefault();
        let justrightclicked;
        for (let hex of manyHexInfo) {
            if (hex.deployed && hex.x === parseFloat(div.style.left) && hex.y === parseFloat(div.style.top)) {
                justrightclicked = hex;
            }
        }
        if (focusunit !== undefined && justrightclicked !== undefined) {
            if (justrightclicked.canBeWalkedBy[focusunit.id] <= focusunit.currentmoves) {
                if (!justrightclicked.occupied) {
                    justrightclicked.occupied = true;
                    focusunit.x = parseFloat(div.style.left);
                    focusunit.y = parseFloat(div.style.top);
                    focusunit.div.style.left = focusunit.x + "px";
                    focusunit.div.style.top = focusunit.y + "px";
                    //reducing currentmoves based on distance traveled
                    focusunit.currentmoves -= justrightclicked.canBeWalkedBy[focusunit.id];

                    for (let hexDiscover of manyHexInfo) {
                        if (!hexDiscover.deployed && distance(focusunit.x, focusunit.y, hexDiscover.x, hexDiscover.y, 0, 0) <= (focusunit.type.vision) * 100) {
                            hexDiscover.discovererd[playerid] = true;
                            createHexTiles(hexDiscover);
                        }
                        if (hexDiscover.x === focustile.x && hexDiscover.y === focustile.y) {
                            hexDiscover.occupied = false;
                        }
                    }
                    drawMiniMap();
                } else {
                    insertDialogue("That tile is occupied"); //you also get this message if clicking on the tile you stand on
                }
            } else {
                insertDialogue("Unit does not have enough moves left"); //also get this message when walking on water etc, tiles unit cant walk on
            }

            deselectTiles();
            focusunit = undefined;
            focustile = undefined;
        }
        if (focuscity !== undefined && justrightclicked !== undefined) {
            if (justrightclicked.ownedByCity === focuscity.id && justrightclicked.cityBuilt !== focuscity.id) { //right clicked a tile city owns
                if (justrightclicked.workedByCity) { //means tile was already worked, disable it
                    justrightclicked.workedByCity = false;
                    justrightclicked.div.style.filter = "hue-rotate(0deg)"
                    focuscity.unnasigned++;
                } else {
                    if (focuscity.unnasigned > 0) {
                        justrightclicked.workedByCity = true;
                        justrightclicked.div.style.filter = "hue-rotate(180deg)";
                        focuscity.unnasigned--;
                    } else {
                        insertDialogue("No Citizens Left")
                    }
                }
            } else {
                if (justrightclicked.canBeClaimed === focuscity.id && focuscity.tileexpand > 0) {
                    justrightclicked.canBeClaimed = undefined;
                    justrightclicked.div.style.filter = "invert(0%)";
                    justrightclicked.div.style.opacity = 0.5;
                    justrightclicked.ownedByCity = focuscity.id;
                    focuscity.tileexpand--;
                    if (focuscity.tileexpand > 0) {
                        for (let hex of manyHexInfo) {
                            if (hex.ownedByCity === focuscity.id) {
                                for (let hexlookfor of manyHexInfo) {
                                    if (focuscity.tileexpand > 0 && hexlookfor.ownedByCity === undefined && distance(hexlookfor.x, hexlookfor.y, hex.x, hex.y, 0, 0) <= 100 && distance(hexlookfor.x, hexlookfor.y, focuscity.x, focuscity.y, 0, 0) <= (1 + Math.floor(Math.sqrt(focuscity.pop))) * 100) {
                                        if (hexlookfor.div !== undefined) {
                                            hexlookfor.div.style.filter = "invert(30%)";
                                        }
                                        hexlookfor.canBeClaimed = focuscity.id;
                                    }
                                }
                            }
                        }
                    } else {
                        for (let hex of manyHexInfo) {
                            if (hex.canBeClaimed === focuscity.id) {
                                hex.canBeClaimed = undefined;
                                if (hex.div !== undefined) {
                                    hex.div.style.filter = "invert(0%)";
                                }
                            }
                        }
                    }
                } else {
                    deselectTiles();
                    /*focuscity.div.style.opacity = 1;
                    for (let hex of manyHexInfo) {
                        if (hex.ownedByCity === focuscity.id) {
                            hex.div.style.opacity = 1;
                            hex.div.style.filter = "hue-rotate(0deg)"
                        }
                        if (hex.canBeClaimed === focuscity.id) {
                            if (hex.div !== undefined) {
                                hex.div.style.filter = "invert(0%)";
                            }
                            hex.canBeClaimed = undefined;
                        }
                    }*/
                    focuscity = undefined;
                }
            }
        }
        changeUI();
    }
    createUnit(settlerUnit, 300, 172, playerid);
    /*createUnit(scoutUnit, 400, 172, playerid);
    createUnit(boatUnit, 200, 172, playerid);
    createUnit(testUnit, 500, 172, playerid);*/

    //using canvas to create minimap
    let canvas = document.getElementById("minimap");
    let ctx = canvas.getContext("2d");

    let canvasTiles = [];

    let canvasDrawDir = "x";

    let minX;
    let maxX;
    let minY;
    let maxY;

    let canW;
    let canH;

    let xHeight;
    let xReferenceLine;

    let yHeight;
    let yReferenceLine;

    let antallTilesX;
    let antallTilesY;

    function drawMiniMap() {
        canvasTiles = [];
        for (let hex of manyHexInfo) {
            if (hex.discovererd[playerid]) {
                canvasTiles.push(hex);
            }
        }
        minX = undefined;
        maxX = undefined;
        minY = undefined;
        maxY = undefined;

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
        /*let canW = maxX - minX;
        let canH = maxY - minY;
        let antallTilesX = canW / 100 + 1;
        let antallTilesY = canH / 100 + 1;

        let yHeight = Math.ceil(300 * canH / canW);
        let yReferenceLine = (300 - yHeight) / 2;

        let xHeight = Math.ceil(300 * canW / canH); // old version before variables in this and bordermove merge
        let xReferenceLine = (300 - xHeight) / 2;*/

        canW = maxX - minX + 100;
        canH = maxY - minY + 100;
        antallTilesX = canW / 100;
        antallTilesY = canH / 100;

        xHeight = Math.ceil(300 * canW / canH);
        xReferenceLine = (300 - xHeight) / 2;

        yHeight = Math.ceil(300 * canH / canW);
        yReferenceLine = (300 - yHeight) / 2;

        ctx.clearRect(0, 0, 300, 300);
        if (Math.max(canW, canH) === canW) {
            //filldir = x
            canvasDrawDir = "x";
            for (let tile of canvasTiles) {
                let width = Math.ceil(300 / antallTilesX);
                let x = (tile.x - minX) * 300 / canW + (width / 2);
                let y = (tile.y - minY) * yHeight / canH + yReferenceLine + (width / 2);
                let drawColor = tile.hexType.miniMapColor;
                drawHex(x, y, width, drawColor);
            }
        } else {
            //filldir = y
            canvasDrawDir = "y";
            for (let tile of canvasTiles) {
                let width = Math.ceil(300 / antallTilesY);
                let x = (tile.x - minX) * xHeight / canW + xReferenceLine + (width / 2);
                let y = (tile.y - minY) * 300 / canH + (width / 2);
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
        moveMiniMapBorder();
    }

    let winLoc = document.getElementById("minimapborder");

    function moveMiniMapBorder() {
        if (focuscity !== undefined) {
        }

        let windowWidth;
        let windowHeight;

        /*bør kanskje flytte variablene som er felles for drawminimap og moveminimapborder utforbi, slik at de slipper å bli 
        kalkulert hver gang sjermen flyttes, men istedenfor bare når kartet tegnes */

        if (canvasDrawDir === "x") {
            let tileWidth = 300 / antallTilesX;
            windowWidth = 8 * tileWidth;
            windowHeight = 5.3 * tileWidth;
            winLoc.style.left = -(screenXPos + minX) / canW * 300 + "px";
            winLoc.style.top = -(screenYPos + minY) / canH * yHeight + yReferenceLine + "px";

        } else {
            let tileWidth = 300 / antallTilesY;
            windowWidth = 7.8 * tileWidth;
            windowHeight = 5.5 * tileWidth;
            winLoc.style.left = -(screenXPos + minX) / canW * xHeight + xReferenceLine + Math.floor(2 * antallTilesY / antallTilesX) + "px";
            winLoc.style.top = -(screenYPos + minY) / canH * 300 + "px";
        }

        winLoc.style.width = windowWidth + "px";
        winLoc.style.height = windowHeight + "px";

        //its not very pretty, but it works
    }
    drawMiniMap();
    moveMiniMapBorder();
    changeUI();
}