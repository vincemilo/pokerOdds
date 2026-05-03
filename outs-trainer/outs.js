let currentHand = null;
let currentBoard = null;
let currentCorrectOuts = 0;
let streak = 0;
let waitingForNext = false;

// ----- VALIDATION -----
function validateNoOverlap(hand, board) {
    let handKeys = hand.map(c => c.rank + c.suit);
    let boardKeys = board.map(c => c.rank + c.suit);
    let overlap = handKeys.filter(k => boardKeys.includes(k));
    if (overlap.length > 0) {
        console.error("OVERLAP DETECTED:", overlap);
        return false;
    }
    return true;
}

// ----- FLUSH DRAW (FIXED) -----
function countFlushOuts(hand, board) {
    // Check each suit
    for (let suit of SUITS) {
        let handCount = hand.filter(c => c.suit === suit).length;
        let boardCount = board.filter(c => c.suit === suit).length;
        let totalCount = handCount + boardCount;
        
        // You need at least 2 of the suit in your hand to have a flush draw
        if (handCount >= 2 && totalCount >= 3) {
            if (totalCount === 3) return 10;  // Need 2 more
            if (totalCount === 4) return 9;   // Need 1 more
        }
    }
    return 0;
}

// ----- STRAIGHT DRAW (FIXED) -----
function getStraightOuts(hand, board) {
    let allCards = [...hand, ...board];
    let rankIndices = new Set();
    
    allCards.forEach(c => {
        let idx = RANKS.indexOf(c.rank);
        rankIndices.add(idx);
    });
    
    // Check for Ace-low straight possibilities
    let hasAce = [...allCards].some(c => c.rank === 'A');
    let has2 = [...allCards].some(c => c.rank === '2');
    let has3 = [...allCards].some(c => c.rank === '3');
    let has4 = [...allCards].some(c => c.rank === '4');
    let has5 = [...allCards].some(c => c.rank === '5');
    
    // Missing the 2
    if (hasAce && has3 && has4 && has5 && !has2) return 4;
    // Missing the 3
    if (hasAce && has2 && has4 && has5 && !has3) return 4;
    // Missing the 4
    if (hasAce && has2 && has3 && has5 && !has4) return 4;
    // Missing the 5
    if (hasAce && has2 && has3 && has4 && !has5) return 4;
    
    let sorted = [...rankIndices].sort((a,b) => a-b);
    if (sorted.length < 4) return 0;
    
    for (let i = 0; i <= sorted.length - 4; i++) {
        if (sorted[i+3] - sorted[i] === 3) {
            let lowOut = sorted[i] - 1;
            let highOut = sorted[i+3] + 1;
            let outs = 0;
            if (lowOut >= 0 && !rankIndices.has(lowOut)) outs += 4;
            if (highOut <= 12 && !rankIndices.has(highOut)) outs += 4;
            if (outs > 0) return outs;
        }
    }
    
    for (let i = 0; i <= sorted.length - 4; i++) {
        if (sorted[i+3] - sorted[i] === 4) return 4;
    }
    
    return 0;
}

// ----- MAIN OUTS CALCULATOR (FIXED) -----
function calculateOuts(hand, board) {
    // First, determine if this is a pure draw (no made hand)
    let hasPair = hand.some(h => board.some(b => b.rank === h.rank));
    let isPocketPair = hand[0].rank === hand[1].rank;
    let hasTrips = false;
    let rankCount = {};
    [...hand.map(c => c.rank), ...board.map(c => c.rank)].forEach(r => rankCount[r] = (rankCount[r] || 0) + 1);
    if (Object.values(rankCount).some(c => c >= 3)) hasTrips = true;
    
    // Skip made hands
    if (hasTrips || (hasPair && !isPocketPair)) {
        return -1; // Signal to skip this hand
    }
    
    let flush = countFlushOuts(hand, board);
    let straight = getStraightOuts(hand, board);
    let total = flush + straight;
    
    // Pocket pair: 2 outs to trips (not overcards!)
    if (isPocketPair) {
        total = 2;
        return total;
    }
    
    // Overcards (only if NOT a pocket pair)
    let overcardCount = hand.filter(h => {
        let hIdx = RANKS.indexOf(h.rank);
        return board.every(b => hIdx > RANKS.indexOf(b.rank));
    }).length;
    
    if (overcardCount === 2) total += 6;
    else if (overcardCount === 1) total += 3;
    
    // Pair improvement (if you have a pair but not a pocket pair)
    if (hasPair && !isPocketPair) {
        total += 2;
    }
    
    // Overlap adjustment for flush + straight
    if (flush > 0 && straight > 0) {
        total = Math.max(total - 1, total);
    }
    
    return Math.min(total, 21);
}

// ----- GENERATE PURE DRAW (SAFE) -----
function generatePureDraw() {
    for (let attempts = 0; attempts < 100; attempts++) {
        // Generate hand (2 cards)
        let hand = [];
        while (hand.length < 2) {
            let newCard = {
                rank: RANKS[Math.floor(Math.random() * RANKS.length)],
                suit: SUITS[Math.floor(Math.random() * 4)]
            };
            let duplicate = hand.some(c => c.rank === newCard.rank && c.suit === newCard.suit);
            if (!duplicate) hand.push(newCard);
        }
        
        // Generate board (3 cards, different from hand)
        let board = [];
        while (board.length < 3) {
            let newCard = {
                rank: RANKS[Math.floor(Math.random() * RANKS.length)],
                suit: SUITS[Math.floor(Math.random() * 4)]
            };
            let inHand = hand.some(c => c.rank === newCard.rank && c.suit === newCard.suit);
            let duplicate = board.some(c => c.rank === newCard.rank && c.suit === newCard.suit);
            if (!inHand && !duplicate) board.push(newCard);
        }
        
        // Validate no overlap
        if (!validateNoOverlap(hand, board)) continue;
        
        let outs = calculateOuts(hand, board);
        
        // Skip made hands (outs === -1)
        if (outs === -1) continue;
        
        // Accept common out values
        let validOuts = [2, 3, 4, 6, 8, 9, 10, 12, 14];
        if (validOuts.includes(outs) && outs > 0) {
            console.log("Generated - Hand:", hand.map(c => c.rank + c.suit), "Board:", board.map(c => c.rank + c.suit), "Outs:", outs);
            return { hand, board, outs };
        }
    }
    
    // Fallback - safe overcard hand
    let hand = [
        { rank: 'A', suit: '♥' },
        { rank: 'K', suit: '♠' }
    ];
    let board = [
        { rank: '9', suit: '♣' },
        { rank: '4', suit: '♦' },
        { rank: '2', suit: '♥' }
    ];
    let outs = calculateOuts(hand, board);
    return { hand, board, outs };
}

// ----- EXPLANATION -----
function getExplanation(hand, board, outs) {
    let flush = countFlushOuts(hand, board);
    let straight = getStraightOuts(hand, board);
    let isPocketPair = hand[0].rank === hand[1].rank;
    let hasPair = hand.some(h => board.some(b => b.rank === h.rank));
    let overcardCount = hand.filter(h => {
        let hIdx = RANKS.indexOf(h.rank);
        return board.every(b => hIdx > RANKS.indexOf(b.rank));
    }).length;
    
    if (isPocketPair) return `Pocket pair (${hand[0].rank}${hand[0].rank}) - 2 outs to make trips`;
    if (flush === 10) return `Flush draw (2 in hand + 1 on board) - 10 outs`;
    if (flush === 9) return `Flush draw (2 in hand + 2 on board) - 9 outs`;
    if (straight === 8) return `Open-ended straight draw - 8 outs`;
    if (straight === 4) return `Gutshot straight draw - 4 outs`;
    if (overcardCount === 2 && !hasPair) return `Two overcards - 6 outs`;
    if (overcardCount === 1 && !hasPair) return `One overcard - 3 outs`;
    if (hasPair && outs === 2) return `Pair on board - 2 outs to make trips`;
    if (flush > 0 && straight > 0) return `Combo draw (flush + straight) - ${outs} outs`;
    if (flush > 0 && overcardCount > 0) return `Flush draw + overcard(s) - ${outs} outs`;
    
    return `${outs} outs - check hand carefully`;
}

// ----- RENDER -----
function renderCards(hand, board) {
    const handContainer = document.getElementById('handCards');
    const boardContainer = document.getElementById('boardCards');
    handContainer.innerHTML = '';
    boardContainer.innerHTML = '';
    
    hand.forEach(c => {
        let div = document.createElement('div');
        div.className = 'poker-card';
        div.innerHTML = `<div class="card-rank">${c.rank}</div><div class="card-suit ${suitColor(c.suit)}">${c.suit}</div>`;
        handContainer.appendChild(div);
    });
    
    board.forEach(c => {
        let div = document.createElement('div');
        div.className = 'poker-card';
        div.innerHTML = `<div class="card-rank">${c.rank}</div><div class="card-suit ${suitColor(c.suit)}">${c.suit}</div>`;
        boardContainer.appendChild(div);
    });
}

// ----- GAME LOGIC -----
function loadNewHand() {
    waitingForNext = false;
    let generated = generatePureDraw();
    currentHand = generated.hand;
    currentBoard = generated.board;
    currentCorrectOuts = generated.outs;
    
    renderCards(currentHand, currentBoard);
    
    document.getElementById('questionText').innerHTML = 'How many OUTS do you have?';
    document.getElementById('feedbackArea').innerHTML = '👆 Click a number above to answer';
    document.getElementById('feedbackArea').style.background = "#0e1a12";
    
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
    });
}

function updateStreakDisplay() {
    document.getElementById('streakCount').innerText = streak;
}

function checkAnswer(selectedOuts) {
    if (waitingForNext) {
        document.getElementById('feedbackArea').innerHTML = '⚠️ Click NEXT HAND for a new question';
        return;
    }
    
    let isCorrect = (selectedOuts === currentCorrectOuts);
    let explanation = getExplanation(currentHand, currentBoard, currentCorrectOuts);
    
    if (isCorrect) {
        streak++;
        updateStreakDisplay();
        document.getElementById('feedbackArea').innerHTML = `✅ CORRECT! ${currentCorrectOuts} outs. ${explanation}<br>🔥 Streak: ${streak}`;
        document.getElementById('feedbackArea').style.background = "#1f543e";
        waitingForNext = true;
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        });
    } else {
        streak = 0;
        updateStreakDisplay();
        document.getElementById('feedbackArea').innerHTML = `❌ WRONG. Answer: ${currentCorrectOuts} outs. ${explanation}<br>🔄 Streak reset.`;
        document.getElementById('feedbackArea').style.background = "#6b2e25";
    }
}

// ----- EVENT LISTENERS -----
document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        checkAnswer(parseInt(btn.getAttribute('data-outs')));
    });
});

document.getElementById('nextBtn').addEventListener('click', () => loadNewHand());

// ----- INITIALIZE -----
loadNewHand();
