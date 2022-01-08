/*
 *This flows the background color when searching for a game
 */
function init() {
  loadingLoop = setInterval(flowBgColor, 1000 / 100);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var redNum = 150;
var greenNum = 150;
var blueNum = 150;

optionList = [redNum, greenNum, blueNum];

var increase = true;
const color = ["#fc352b", "#f79811", "#f7e414", "#67e344", "#3e5df7", "4bc7f0", "#a447f5", "#f547f2"];
var pickNumber = getRandomInt(0, color.length - 1);
function changeBgColor() {
  document.getElementById("loading").style.backgroundColor = color[pickNumber];

  // if (optionList[number] == 255){
  // 	increase = false
  // }else if (optionList[number] == 150){
  // 	increase = true
  // }

  // if (increase){
  // 	if (optionList[number] < 255){
  // 		optionList[number] ++
  // 	}

  // 	if (optionList[number] == 255){
  // 		pickNumber = getRandomInt(0, 2)
  // 	}

  // }else{
  // 	if (optionList[number] > 150){
  // 		optionList[number] --
  // 	}

  // 	if (optionList[number] == 150){
  // 		pickNumber = getRandomInt(0, 2)
  // 	}
  // }
}

function flowBgColor() {
  changeBgColor();
}

window.onload = init();
