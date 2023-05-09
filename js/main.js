'use strict';

let myModalUserName = new bootstrap.Modal(document.getElementById("myModal"));
let rule = new bootstrap.Modal(document.getElementById("modalRule"));
let res = new bootstrap.Modal(document.getElementById("resModal"));
let rating = new bootstrap.Modal(document.getElementById("modalRating"));
let errorModal = new bootstrap.Modal(document.getElementById("errorModal"));

let tableRatingAnonim = $('#anonimTable').DataTable({columns: [
    { title: '№' },
    { title: 'Очки' },
],
searching: false, paging: false, info: false, "ordering": false,
"language": {
    "emptyTable": "Нет информации о игроках"
  }
});

let tableRating = $('#allTable').DataTable({columns: [
    { title: '№' },
    { title: 'Никнейм' },
    { title: 'Очки' },
],
searching: false, paging: false, info: false, "ordering": false,
"language": {
    "emptyTable": "Нет информации о игроках"
  }
});

let timeGame = 25;
document.getElementById("secondsVisual").textContent = timeGame;

let seconds = timeGame;
let interval = null; // main time
let currentFish = [];

$( document ).ready(
    $("#myModal").on('shown.bs.modal', function () {
        $('#userName').trigger('focus')
    }),
    $("#modalRule").on('shown.bs.modal', function () {
        $('#closeRule').trigger('focus')
    })
);

function initGame() {
    myModalUserName.show();
    document.getElementById("startGame").setAttribute("disabled","");
    document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
}

initGame();
document.getElementById("startGame").addEventListener("click", startGame);
document.getElementById("openRule").addEventListener("click", openRule);
document.getElementById("userName").addEventListener("input", validateUserName);

document.getElementById("closeRule").addEventListener("click", closeRule);
document.getElementById("closeRating").addEventListener("click", closeRating);

document.getElementById("userName").addEventListener("keyup", startGameEnter);
document.getElementById("setPause").addEventListener("click", pause);
document.getElementById("restartGame").addEventListener("click", () => {location.reload()});
document.getElementById("restartGameUser").addEventListener("click", restartUserGame);
document.getElementById("restartButton").addEventListener("click", () => {location.reload()});

document.body.addEventListener("keyup", pauseHotKey);

document.getElementById("openRating").addEventListener("click", getRating);
document.getElementById("openRatingFinish").addEventListener("click", getRating);
document.getElementById("openRatingMiddle").addEventListener("click", getRating);

async function getList() {
    let response = await fetch("./php/getList.php", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({"name": document.getElementById("userNameGame").textContent})
    })

    let result = Array();

    if (response.ok) {
        try {
            result = await response.json();
        } catch(error) {
            errorModal.show();
        }
    } 
    else {
        errorModal.show(); 
    }

    // ожидание выполнения промиса
    let countUsers = result.length >= 2 ? result.pop() : 0;
    document.getElementById("allCountUsers").textContent = `Всего игроков: ${countUsers}`;

    if (document.getElementById("userNameGame").textContent && (result.length != 0)) {

        tableRating.clear();
        tableRating.rows.add(result)
        tableRating.draw();
        document.getElementById("anonimTable").hidden = true;
        document.getElementById("allTable").hidden = false;

        let rowsTable = document.querySelectorAll("#allTable > tbody > tr");

        for (var i = 0; i < rowsTable.length; ++i) {
            if (rowsTable[i].children[1].textContent == document.getElementById("userNameGame").textContent) {
                rowsTable[i].children[0].classList.add("highlightPlace")
                rowsTable[i].children[1].classList.add("highlightPlace")
                rowsTable[i].children[2].classList.add("highlightPlace")
            }
        }

    }
    else {
        tableRatingAnonim.clear();
        tableRatingAnonim.rows.add(result)
        tableRatingAnonim.draw();
        document.getElementById("allTable").hidden = true;
        document.getElementById("anonimTable").hidden = false;
    }

    rating.show();
}

function getRating() {
    getList();
}

function closeRating() {
    rating.hide()
}

async function updateList(){
    let response = await fetch("./php/updateList.php", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({"name": document.getElementById("userNameGame").textContent, "points": +document.getElementById("points").textContent})
    });
}

function timer() {
    seconds--;
    document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");

    if (seconds === 0) {
        clearInterval(interval);
        for (let index = 0; index < currentFish.length; index++) {
            clearInterval(currentFish[index].inter);
        }
        document.getElementById("resinfo").textContent = document.getElementById("userNameGame").textContent + ", ваш счёт: " + document.getElementById("points").textContent
        rating.hide();
        res.show();
        updateList();
    }
}

function startGameEnter(event) {
    if (event.keyCode == 13 && document.getElementById("userName").classList.contains("is-valid")) {
        startGame();
    }
}

let library_img = {
    "middle": {
        "left": "./img/middle_fish_left.png",
        "right": "./img/middle_fish_right.png",
    },
    "big": {
        "left": "./img/big_fish_left.png",
        "right": "./img/big_fish_right.png",
    },
    "small": {
        "left": "./img/small_fish_left.png",
        "right": "./img/small_fish_right.png",
    },
}

let arrayDirection = ["left", "right"];
let arraySizeFish = ["small", "middle", "big"];

// Resize window
window.addEventListener("resize", displayWindowSize);

function displayWindowSize() {

    if (document.getElementById("setPause").value == "start" || (+document.getElementById("seconds").textContent) == 0) {
        let canvas = document.querySelector("#canvasWater");

        for (let index = 0; index < currentFish.length; index++) {
            moveFish(currentFish[index]);
        }
    }
}

function generateFish() {

    let aquarium = document.getElementById("canvasWater");

    let direct = arrayDirection[Math.floor(Math.random()*(arrayDirection.length))];

    let fish = {
        direction: direct,
        size: arraySizeFish[Math.floor(Math.random() * (arraySizeFish.length))],
        step: 4 + Math.floor(Math.random() * 4),
        time: 1 + Math.floor(Math.random() * 7),
        posX: (direct == "left" ? aquarium.offsetWidth - 128 : 0),
        posY: Math.floor(Math.random() * (aquarium.height - 128)),
        imgleft: new Image(),
        imgright: new Image(),
        imgcurrent: new Image(),
        maxTimes: 5 + Math.floor(Math.random() * 5),
        currentTimes: 0,
    }

    fish.imgleft.src = library_img[fish.size]["left"];
    fish.imgright.src = library_img[fish.size]["right"];

    fish.imgcurrent.src = library_img[fish.size][fish.direction];
    fish.imgcurrent.onload = function() {draw(fish)};

    return fish;
}

function restartUserGame() {

    let aquarium = document.querySelector(".gamePole");
    // delete all fish
    for (let index = 0; index < currentFish.length; index++) {
        // clearInterval(currentFish[index].inter)
        aquarium.removeChild(currentFish[index].canvas)
    }

    currentFish = [];

    res.hide();
    setParamsGame();
}

function startGame() {
    document.getElementById("userNameGame").textContent = document.getElementById("userName").value;
    myModalUserName.hide();

    setParamsGame();
}

function setParamsGame() {
    if (document.getElementById("userNameGame").textContent != "tester") {
        interval = setInterval(timer, 1000);
        seconds = timeGame;
        document.getElementById("points").textContent = 0;
        document.getElementById("seconds").textContent = seconds;
    }
    else {
        document.getElementById("seconds").textContent = "-";
        document.getElementById("minutes").textContent = "-";
        document.getElementById("userNameGame").classList.add("tester");
    }

    // Запуск рыбок
    for (let index = 0; index < 10; index++) {
        currentFish.push(generateFish());
    }
}


function removeFish(event) {
    if (document.getElementById("setPause").value == "pause") {
        let canvas = document.querySelector(".gamePole");

        let fish;

        for (let index = 0; index < currentFish.length; index++) {
            if (currentFish[index].canvas == event.target) {
                fish = currentFish[index];
            }
        }

        clearInterval(fish.inter)
        canvas.removeChild(fish.canvas)

        const index = currentFish.indexOf(fish);
        const x = currentFish.splice(index, 1);

        document.getElementById("points").textContent =  +document.getElementById("points").textContent + getPoints(fish["size"])

        setTimeout(function() {currentFish.push(generateFish())}, 1000 + Math.floor(Math.random()* 5000))
    }
}

function getPoints(size) {
    if (size == "small")
        return 30;

    if (size == "middle")
        return 20;
    
        return 10;
}

function changePos(step, dir, newimg, newdir, fish) {
    let canvas = fish.canvas
    let oldXPos = +(canvas.style[dir].split("px")[0])
    let newXPos = oldXPos + step;

    if (canvas.width + newXPos >= (document.getElementById("canvasWater").offsetWidth + 128)) {
            fish.currentTimes += 1;
            canvas.style[dir]= null;
            if (fish.currentTimes > fish.maxTimes && document.getElementById("setPause").value == "pause" && ((+document.getElementById("seconds").textContent) > 0 || document.getElementById("userNameGame").textContent == "tester")) {
                    let pole = document.querySelector(".gamePole");
                    pole.removeChild(canvas)
                    clearInterval(fish.inter)
                    const index = currentFish.indexOf(fish);
                    const x = currentFish.splice(index, 1);

                    setTimeout(function() {currentFish.push(generateFish())}, 1000 + Math.floor(Math.random()* 3000))
            }
            canvas.getContext("2d").clearRect(0,0,canvas.width, canvas.height);
            canvas.getContext("2d").drawImage(newimg, 0, 0)

            canvas.style[newdir]= "-128px";
    }
    else {
        canvas.style[dir] = String(newXPos) + "px";

        if (Math.floor(Math.random() * 50) == 2) {
            var arr = new Array(2, -2);
            var RandElement = arr[Math.floor(Math.random()*(arr.length))];

            canvas.style["top"] = String(+(canvas.style.top.split("px")[0]) + RandElement) + "px";
        }
    }
}

function moveFish(fish) {

    let canvas = fish.canvas;
    let step = fish.step;
    let dir;
    let newimg;
    let newdir;

    //console.log(canvas.style)
    if (canvas.style.right) {
        dir = "right";
        newimg = fish.imgright;
        newdir = "left";
    }
    else {
        dir = "left";
        newimg = fish.imgleft;
        newdir = "right";
    }

    changePos(step, dir, newimg, newdir, fish);
}

function draw(fish) {

    let aquarium = document.querySelector(".gamePole");
    let smallCanvas = document.createElement("canvas");
    smallCanvas.style.position = "absolute";
    smallCanvas.style.zIndex = 2;
    smallCanvas.addEventListener("click", removeFish);
    aquarium.appendChild(smallCanvas);

    smallCanvas.style.left = null;
    smallCanvas.style.right = null;

    if (fish.direction == "left") {
        smallCanvas.style.right = "-128px";
    }
    else {
        smallCanvas.style.left = "-128px";
    }
    smallCanvas.style["top"] = String(fish.posY) + "px";

    smallCanvas.width = fish.imgcurrent.width;
    smallCanvas.height = fish.imgcurrent.height;
    smallCanvas.getContext("2d").drawImage(fish.imgcurrent, 0, 0);

    fish.canvas = smallCanvas;

    //console.log((+document.getElementById("seconds").textContent) != 0 )
    if (document.getElementById("setPause").value == "pause" && ((+document.getElementById("seconds").textContent) != 0 || document.getElementById("userNameGame").textContent == "tester")) {
        fish.inter = setInterval(function() {moveFish(fish)}, fish.time)
        smallCanvas.hidden = false;
    }
    else {
        smallCanvas.hidden = true;
    }
}

function openRule() {
    rule.show();
}

function closeRule() {
    rule.hide();
}

function validateUserName(event) {

    let isValidUserName = /^[A-Za-z0-9а-яА-Я]{2,30}$/.test(event.target.value);
    if (isValidUserName) {
        document.getElementById("startGame").removeAttribute("disabled","");
        document.getElementById("userName").classList.remove("is-invalid");
        document.getElementById("userName").classList.add("is-valid");
    }
    else {
        document.getElementById("startGame").setAttribute("disabled","");
        document.getElementById("userName").classList.add("is-invalid");
        document.getElementById("userName").classList.remove("is-valid");
    }
}

function pause() {
    if (document.getElementById("setPause").value == "pause") {
        clearInterval(interval);
        document.getElementById("setPause").value = "start";
        document.getElementById("setPause").innerHTML = "<i class='fa-solid fa-play'></i>"
        for (let index = 0; index < currentFish.length; index++) {
            clearInterval(currentFish[index].inter);
        }
    }
    else {
        if (document.getElementById("userNameGame").textContent != "tester") {
            interval = setInterval(timer, 1000);
        }

        document.getElementById("setPause").value = "pause";
        document.getElementById("setPause").innerHTML = "<i class='fa-solid fa-pause'></i>"

        for (let index = 0; index < currentFish.length; index++) {
            let fish = currentFish[index];
            fish.inter = setInterval(function() {moveFish(fish)}, fish.time)
            fish.canvas.hidden = false;
        }
    }
}

function pauseHotKey(event) {
    if ((event.keyCode == 80 || event.keyCode == 32) && document.getElementById("userNameGame").textContent != "" && (+document.getElementById("seconds").textContent) != 0) {
        pause();
    }
}