let currentPot = 0;
let currentBet = 0;
let currentCorrectPercent = 0;
let streak = 0;
let waitingForNext = false;

function generatePotOddsQuestion() {
  // Common bet sizes relative to pot
  const betFractions = [0.25, 0.33, 0.4, 0.5, 0.66, 0.75, 1.0];
  const fraction =
    betFractions[Math.floor(Math.random() * betFractions.length)];

  // Base pot between 500 and 2000
  let pot = Math.floor(Math.random() * 1500) + 500;
  let bet = Math.round(pot * fraction);

  // Round to nice numbers
  bet = Math.round(bet / 10) * 10;
  pot = Math.round(pot / 10) * 10;

  let requiredPercent = (bet / (pot + bet)) * 100;
  requiredPercent = Math.round(requiredPercent);

  return { pot, bet, requiredPercent };
}

function generateOptions(correctPercent) {
  let options = new Set();
  options.add(correctPercent);

  // Common wrong answers based on common mistakes
  let commonValues = [20, 25, 30, 33, 35, 40, 43, 45, 50, 55, 60];

  while (options.size < 4) {
    let candidate =
      commonValues[Math.floor(Math.random() * commonValues.length)];
    if (candidate !== correctPercent) options.add(candidate);
  }

  return shuffleArray([...options]);
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderButtons() {
  let options = generateOptions(currentCorrectPercent);
  const buttonGrid = document.getElementById("buttonGrid");
  buttonGrid.innerHTML = "";

  options.forEach((percent) => {
    let btn = document.createElement("button");
    btn.className = "action-btn";
    btn.innerText = `${percent}%`;
    btn.setAttribute("data-percent", percent);
    btn.addEventListener("click", () => checkAnswer(percent));
    buttonGrid.appendChild(btn);
  });
}

function loadNewHand() {
  waitingForNext = false;

  let question = generatePotOddsQuestion();
  currentPot = question.pot;
  currentBet = question.bet;
  currentCorrectPercent = question.requiredPercent;

  document.getElementById("potDisplay").innerHTML = `💰 POT: $${currentPot}`;
  document.getElementById("betDisplay").innerHTML = `⚡ BET: $${currentBet}`;
  document.getElementById("questionText").innerHTML =
    `What % equity do you need to call?`;
  document.getElementById("feedbackArea").innerHTML =
    "👆 Click the correct percentage";
  document.getElementById("feedbackArea").style.background = "#0e1a12";

  renderButtons();

  document.querySelectorAll(".action-btn").forEach((btn) => {
    btn.disabled = false;
    btn.style.opacity = "1";
  });
}

function updateStreakDisplay() {
  document.getElementById("streakCount").innerText = streak;
}

function checkAnswer(selectedPercent) {
  if (waitingForNext) {
    document.getElementById("feedbackArea").innerHTML =
      "⚠️ Click NEXT HAND for a new question";
    return;
  }

  let isCorrect = selectedPercent === currentCorrectPercent;

  if (isCorrect) {
    streak++;
    updateStreakDisplay();
    document.getElementById("feedbackArea").innerHTML =
      `✅ CORRECT! $${currentBet} into $${currentPot} needs ${currentCorrectPercent}% equity.<br>🔥 Streak: ${streak}`;
    document.getElementById("feedbackArea").style.background = "#1f543e";
    waitingForNext = true;
    document.querySelectorAll(".action-btn").forEach((btn) => {
      btn.disabled = true;
      btn.style.opacity = "0.5";
    });
  } else {
    streak = 0;
    updateStreakDisplay();
    document.getElementById("feedbackArea").innerHTML =
      `❌ WRONG. $${currentBet} into $${currentPot} needs ${currentCorrectPercent}% equity, not ${selectedPercent}%.<br>🔄 Streak reset.`;
    document.getElementById("feedbackArea").style.background = "#6b2e25";
  }
}

document
  .getElementById("nextBtn")
  .addEventListener("click", () => loadNewHand());
loadNewHand();
