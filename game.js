// ===== ÁrPárbaj LIVE - Game Engine =====

const game = {
    kerdesSzam: 1,
    maxKerdes: 10,
    pont: 0,
    ido: 20,
    timer: null,

    nehezseg: 1,      // 1 = könnyű, 3 = közepes, 5 = nehéz
    szorzo: 1,         // 1x, 2x, 3x

    jatekVege: false,

    ujKor() {

        if (this.kerdesSzam > this.maxKerdes) {
            this.jatekVege = true;
            this.forduloVege();
            return;
        }

        this.sorsolNehezseg();

        document.getElementById("kerdesSzam").innerText =
            "Kérdés " + this.kerdesSzam + " / " + this.maxKerdes;

        this.inditIdo();
    },

    sorsolNehezseg() {

        const r = Math.random();

        if (r < 0.5) {
            this.nehezseg = 1;
            document.getElementById("nehezseg").innerText = "🟢 Könnyű";
        } else if (r < 0.😎 {
            this.nehezseg = 3;
            document.getElementById("nehezseg").innerText = "🟡 Közepes";
        } else {
            this.nehezseg = 5;
            document.getElementById("nehezseg").innerText = "🔴 Nehéz";
        }

    },

    inditIdo() {

        clearInterval(this.timer);

        this.ido = 20;

        document.getElementById("ido").innerText =
            "⏳ " + this.ido;

        this.timer = setInterval(() => {

            this.ido--;

            document.getElementById("ido").innerText =
                "⏳ " + this.ido;

            if (this.ido <= 0) {

                clearInterval(this.timer);

                this.kovetkezoKerdes();

            }

        },1000);

    },

    helyesValasz(helyezes){

        clearInterval(this.timer);

        let alapPont;

        switch(helyezes){

            case 1: alapPont = 10; break;
            case 2: alapPont = 9; break;
            case 3: alapPont = 8; break;
            case 4: alapPont = 7; break;
            case 5: alapPont = 6; break;
            case 6: alapPont = 5; break;
            case 7: alapPont = 4; break;
            case 8: alapPont = 3; break;
            case 9: alapPont = 2; break;

            default:
                alapPont = 1;

        }

        const szerzettPont =
            alapPont * this.nehezseg * this.szorzo;

        this.pont += szerzettPont;

        document.getElementById("pont").innerText =
            "🏆 Pont: " + this.pont;

        this.kovetkezoKerdes();

    },

    kovetkezoKerdes(){

        this.kerdesSzam++;

        setTimeout(() => {

            this.ujKor();

        },1500);

    },

    forduloVege(){

        alert(
            "Forduló vége!\n\nPontszámod: "
            + this.pont
        );

        this.kerdesSzam = 1;
        this.pont = 0;
        this.szorzo = 1;

        document.getElementById("pont").innerText =
            "🏆 Pont: 0";

        this.ujKor();

    }

};