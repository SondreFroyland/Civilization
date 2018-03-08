// @ts-check
function setup() {

    class Racket {
        constructor(st, k, stiv, s, ant, sd, erf) {
            this.spillertype = st;
            this.klasse = k;
            this.strenge = s;
            this.antall = ant;
            this.singledoubble = sd;
            this.erfaring = erf;
        }
    }

    let racketList = {
        Offansiv: {
            S: "Yonex Duora Z - strike",
            M: "Yonex Voltric Z - Force II",
            F: "Fz Forza 988 F"
        },
        Defansiv: {
            S: "Yonex Duora 10",
            M: "Yonex Voltric GlanZ",
            F: "Victor Jetspeed 12"
        },
        Allround: {
            S: "Yonex Nanoray 900",
            M: "Yonex Voltric 80 E - Tune",
            F: "Victor Thruster K 9900"
        }
    }
    let strengeList = [
        {
            typ: "BG80"
        },
        {
            typ: "BG80P"
        },
        {
            typ: "BG65"
        },
        {
            typ: "BG65ti"
        },
        {
            typ: "Aerosonic"
        }
    ]


    let divVis = document.getElementById("vis");


    let quiz = [
        {
            q: "Hvilken spillertype er du",
            a: ["Offansiv", "Defansiv", "AllRound"]
        },

        {
            q: "Hvilken klasse spiller du i",
            a: ["E", "A", "B", "C", "D", "U19", "U17", "U15"]
        },

        {
            q: "Hvor stiv racket liker du",
            a: ["S", "M", "F"]
        },

        {
            q: "Har du noe imot å strenge ofte",
            a: ["Ja", "Nei"]
        },

        {
            q: "Hvor mange ganger i uken spiller du",
            a: ["1", "2", "3", "4", "5", "6", "7+"]
        },

        {
            q: "Spiller du mest single eller double",
            a: ["Single", "Double"]
        }
    ];
    let divQuiz = document.getElementById("quiz");
    let idx = 0;
    for (let qu of quiz) {
        let question = document.createElement('div');
        let select = `<select id="${idx}">`;
        for (let opts of qu.a) {
            select += `<option>${opts}</option>`
        }
        question.innerHTML = `${qu.q} ${select}`;
        divQuiz.appendChild(question);
        document.getElementById(String(idx)).addEventListener("change", velgRacket);
        idx++;
    }
    let stil, flex;
    function velgRacket() {
        if (this.id === "0") {
            stil = this.value;
        }
        if (this.id === "2") {
            flex = this.value;
        }
        if (flex !== undefined && stil !== undefined) {
            let myracket = racketList[stil][flex];
            divVis.innerHTML = "Du bør kjøpe " + myracket;
        }
    }

}