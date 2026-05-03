let currentHand = null;
let currentBoard = null;
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

  // Check for open-ended (4 consecutive ranks)
  for (let i = 0; i <= sorted.length - 4; i++) {
    if (sorted[i + 3] - sorted[i] === 3) {
      // Found 4 consecutive
      let lowComplete = sorted[i] - 1;
      let highComplete = sorted[i + 3] + 1;
      let outs = 0;
      if (lowComplete >= 0 && !rankIndices.has(lowComplete)) outs += 4;
      if (highComplete <= 12 && !rankIndices.has(highComplete)) outs += 4;
      if (outs > 0) return outs;
    }
  }

  // Check for gutshot (4 cards with one missing internal card)
  // Example: A,K,Q,J (ranks 12,11,10,9) - no gap, that's open-ended already caught
  // Gutshot example: A,K,Q,10 (ranks 12,11,10,8) - missing the J (rank 9)
  for (let i = 0; i <= sorted.length - 4; i++) {
    let start = sorted[i];
    let end = sorted[i + 3];
    if (end - start === 4) {
      // There's exactly one rank missing in between
      return 4;
    }
  }
  return 0;
}

function calculateOuts(hand, board) {
    let flush = countFlushOuts(hand, board);
    let straight = getStraightOuts(hand, board);
    let total = flush + straight;
    
    // Add overcards
    let overcardCount = hand.filter(h => {
        let hIdx = RANKS.indexOf(h.rank);
        return board.every(b => hIdx > RANKS.indexOf(b.rank));
    }).length;
    
    if (overcardCount === 2) total += 6;
    else if (overcardCount === 1) total += 3;
    
    // Add pair improvement (to trips)
    let hasPair = hand.some(h => board.some(b => b.rank === h.rank));
    if (hasPair) {
        total += 2;  // Two remaining of that rank
    }
    
    // Adjust overlap (cards that complete multiple draws)
    if (flush > 0 && straight > 0) total = Math.max(total - 1, total);
    
    return Math.min(total, 21);
}

// SAFE GENERATION - explicitly separate hand and board
function generatePureDraw() {
  for (let attempts = 0; attempts < 50; attempts++) {
    // Generate 2 hand cards
    let hand = [];
    while (hand.length < 2) {
      let newCard = {
        rank: RANKS[Math.floor(Math.random() * RANKS.length)],
        suit: SUITS[Math.floor(Math.random() * 4)],
      };
      let duplicate = hand.some(
        (c) => c.rank === newCard.rank && c.suit === newCard.suit,
      );
      if (!duplicate) hand.push(newCard);
    }

    // Generate 3 board cards (different from hand)
    let board = [];
    while (board.length < 3) {
      let newCard = {
        rank: RANKS[Math.floor(Math.random() * RANKS.length)],
        suit: SUITS[Math.floor(Math.random() * 4)],
      };
      let inHand = hand.some(
        (c) => c.rank === newCard.rank && c.suit === newCard.suit,
      );
      let duplicate = board.some(
        (c) => c.rank === newCard.rank && c.suit === newCard.suit,
      );
      if (!inHand && !duplicate) board.push(newCard);
    }

    if (isMadeHand(hand, board)) continue;
    let outs = calculateOuts(hand, board);
    if ([2, 3, 4, 6, 8, 9, 10, 12, 14].includes(outs) && outs > 0) {
      return { hand, board, outs };
    }
  }

  // Fallback - explicit safe hand
  let hand = [
    { rank: "A", suit: "♥" },
    { rank: "K", suit: "♥" },
  ];
  let board = [
    { rank: "2", suit: "♥" },
    { rank: "9", suit: "♣" },
    { rank: "4", suit: "♦" },
  ];
  let outs = calculateOuts(hand, board);
  return { hand, board, outs };
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

function renderCards(hand, board) {
  const handContainer = document.getElementById("handCards");
  const boardContainer = document.getElementById("boardCards");
  handContainer.innerHTML = "";
  boardContainer.innerHTML = "";

  hand.forEach((c) => {
    let div = document.createElement("div");
    div.className = "poker-card";
    div.innerHTML = `<div class="card-rank">${c.rank}</div><div class="card-suit ${suitColor(c.suit)}">${c.suit}</div>`;
    handContainer.appendChild(div);
  });

  board.forEach((c) => {
    let div = document.createElement("div");
    div.className = "poker-card";
    div.innerHTML = `<div class="card-rank">${c.rank}</div><div class="card-suit ${suitColor(c.suit)}">${c.suit}</div>`;
    boardContainer.appendChild(div);
  });
}

function loadNewHand() {
  waitingForNext = false;
  let generated = generatePureDraw();
  currentHand = generated.hand;
  currentBoard = generated.board;
  currentCorrectOuts = generated.outs;

  renderCards(currentHand, currentBoard);

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

// Re-attach event listeners (they get lost if DOM changes)
document.querySelectorAll(".action-btn").forEach((btn) => {
  btn.removeEventListener("click", () => {});
  btn.addEventListener("click", () => {
    checkAnswer(parseInt(btn.getAttribute("data-outs")));
  });
});

document.getElementById("nextBtn").removeEventListener("click", loadNewHand);
document
  .getElementById("nextBtn")
  .addEventListener("click", () => loadNewHand());

loadNewHand();
