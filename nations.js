class Nation {
    constructor(navn, leder, tittel, hovedstad) {
        this.navn = navn;
        this.leder = leder;
        this.tittel = tittel;
        this.hovedstad = hovedstad;
    }
}

class Player {
    constructor(navn, nation) {
        this.navn = navn;
        this.nation = nation;
        //this.playerid = playerid;
    }
}

let norge = new Nation("Norge", "Harald", "FagerHår", "Avaldsnes");
let frankrike = new Nation("Frankrike", "Napoleon", "the Great", "Parí");
let sverige = new Nation("Sverige", "Karl", "Johan", "Malmø");

let per = new Player("per", norge);
let kåre = new Player("kåre", frankrike);
let olaconny = new Player("olaconny", sverige);

let playerlist = [per, kåre, olaconny];

for(let player of playerlist) {
    console.log(player.navn + " spiller som " + player.nation.navn + " som er ledet av " + player.nation.leder + " " + player.nation.tittel);
}