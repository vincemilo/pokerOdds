let currentHand = null;
let currentCorrectOuts = 0;
let streak = 0;
let waitingForNext = false;

function isMadeHand(hand, board) {
  let suitCount = { "♥": 0, "♦": 0, "♣": 0, "♠": 0 };
  [...hand, ...board].forEach((c) => suitCount[c.suit]++);
  if (Object.values(suitCount).some((c) => c >= 5)) return true;

  let rankCount = {};
  [...hand.map((c) => c.rank), ...board.map((c) => c.rank)].forEach(
    (r) => (rankCount[r] = (rankCount[r] || 0) + 1),
  );
  if (Object.values(rankCount).some((c) => c >= 3)) return true;

  return hand.some((h) => board.some((b) => b.rank === h.rank));
}

function countFlushOuts(hand, board) {
  let suitCount = { "♥": 0, "♦": 0, "♣": 0, "♠": 0 };
  [...hand, ...board].forEach((c) => suitCount[c.suit]++);
  for (let suit in suitCount) {
    let count = suitCount[suit];
    if (count === 4) return 9;
    if (count === 3) return 10;
  }
  return 0;
}

function getStraightOuts(hand, board) {
  let allCards = [...hand, ...board];
  let rankIndices = new Set();
  allCards.forEach((c) => rankIndices.add(RANKS.indexOf(c.rank)));
  let sorted = [...rankIndices].sort((a, b) => a - b);
  if (sorted.length < 4) return 0;

  for (let i = 0; i <= sorted.length - 4; i++) {
    if (sorted[i + 3] - sorted[i] === 3) {
      let lowOut = sorted[i] - 1;
      let highOut = sorted[i + 3] + 1;
      let outs = 0;
      if (lowOut >= 0 && !rankIndices.has(lowOut)) outs += 4;
      if (highOut <= 12 && !rankIndices.has(highOut)) outs += 4;
      if (outs === 8) return 8;
    }
  }
  for (let i = 0; i <= sorted.length - 4; i++) {
    if (sorted[i + 3] - sorted[i] === 4) return 4;
  }
  return 0;
}

function calculateOuts(hand, board) {
  let flush = countFlushOuts(hand, board);
  let straight = getStraightOuts(hand, board);
  let total = flush + straight;

  if (total === 0) {
    let hasPair = hand.some((h) => board.some((b) => b.rank === h.rank));
    if (hasPair) return 2;

    let overcardCount = hand.filter((h) => {
      let hIdx = RANKS.indexOf(h.rank);
      return board.every((b) => hIdx > RANKS.indexOf(b.rank));
    }).length;

    if (overcardCount === 2) total = 6;
    else if (overcardCount === 1) total = 3;
    else total = 0;
  }
  return total;
}

function generatePureDraw() {
  for (let attempts = 0; attempts < 50; attempts++) {
    let hand = generateUniqueCards(2);
    let board = generateUniqueCards(3, hand);
    if (isMadeHand(hand, board)) continue;
    let outs = calculateOuts(hand, board);
    if ([2, 3, 4, 6, 8, 9, 10, 12, 14].includes(outs) && outs > 0) {
      return { hand, board, outs };
    }
  }
  let hand = generateUniqueCards(2);
  let board = generateUniqueCards(3, hand);
  return { hand, board, outs: calculateOuts(hand, board) };
}

function getExplanation(outs) {
  const explanations = {
    2: "Pair on board - 2 outs to make trips",
    3: "One overcard - 3 outs",
    4: "Gutshot straight - 4 outs",
    6: "Two overcards - 6 outs",
    8: "Open-ended straight - 8 outs",
    9: "Flush draw (2 hand + 2 board) - 9 outs",
    10: "Flush draw (2 hand + 1 board) - 10 outs",
    12: "Combo draw (flush + straight) - 12 outs",
    14: "Combo draw + overcards - 14 outs",
  };
  return explanations[outs] || `${outs} outs`;
}

function loadNewHand() {
  waitingForNext = false;
  currentHand = generatePureDraw();
  renderCards(currentHand.hand, currentHand.board, "handCards", "boardCards");
  currentCorrectOuts = currentHand.outs;

  document.getElementById("questionText").innerHTML =
    "How many OUTS do you have?";
  document.getElementById("feedbackArea").innerHTML =
    "👆 Click a number above to answer";
  document.getElementById("feedbackArea").style.background = "#0e1a12";

  document.querySelectorAll(".action-btn").forEach((btn) => {
    btn.disabled = false;
    btn.style.opacity = "1";
  });
}

function updateStreakDisplay() {
  document.getElementById("streakCount").innerText = streak;
}

function checkAnswer(selectedOuts) {
  if (waitingForNext) {
    document.getElementById("feedbackArea").innerHTML =
      "⚠️ Click NEXT HAND for a new question";
    return;
  }

  let isCorrect = selectedOuts === currentCorrectOuts;
  let explanation = getExplanation(currentCorrectOuts);

  if (isCorrect) {
    streak++;
    updateStreakDisplay();
    document.getElementById("feedbackArea").innerHTML =
      `✅ CORRECT! ${currentCorrectOuts} outs. ${explanation}<br>🔥 Streak: ${streak}`;
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
      `❌ WRONG. Answer: ${currentCorrectOuts} outs. ${explanation}<br>🔄 Streak reset.`;
    document.getElementById("feedbackArea").style.background = "#6b2e25";
  }
}

document.querySelectorAll(".action-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    checkAnswer(parseInt(btn.getAttribute("data-outs")));
  });
});

document
  .getElementById("nextBtn")
  .addEventListener("click", () => loadNewHand());
loadNewHand();
