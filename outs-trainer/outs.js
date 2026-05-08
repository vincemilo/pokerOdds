let currentHand = null;
let currentBoard = null;
let currentCorrectOuts = 0;
let streak = 0;
let waitingForNext = false;

// ----- Helper: check if a card is an overcard (strictly higher than all board cards) -----
function isOvercard(card, board) {
    let cardRankIdx = RANKS.indexOf(card.rank);
    for (let b of board) {
        if (cardRankIdx <= RANKS.indexOf(b.rank)) return false;
    }
    return true;
}

// ----- Flush draw: need at least 2 of a suit in hand, and at least 3 total -----
function flushOuts(hand, board) {
    for (let suit of SUITS) {
        let inHand = hand.filter(c => c.suit === suit).length;
        let onBoard = board.filter(c => c.suit === suit).length;
        let total = inHand + onBoard;
        
        // Case 1: 2 in hand + 1+ on board
        if (inHand >= 2 && total >= 3) {
            return total === 3 ? 10 : 9;
        }
        
        // Case 2: 1 in hand + 2 on board (you need 2 more)
        if (inHand === 1 && onBoard >= 2 && total >= 3) {
            return 10;
        }
    }
    return 0;
}

// ----- Straight draw (only open-ended or gutshot; Ace-low handled) -----
function straightOuts(hand, board) {
    let allRanks = [...hand.map(c => c.rank), ...board.map(c => c.rank)];
    let rankSet = new Set();
    for (let r of allRanks) rankSet.add(r);
    
    // Ace-low special: check for A,2,3,4,x or A,2,3,5,x etc. but simplest: check missing card for A-5 straight
    let hasA = rankSet.has('A');
    let has2 = rankSet.has('2');
    let has3 = rankSet.has('3');
    let has4 = rankSet.has('4');
    let has5 = rankSet.has('5');
    
    // Gutshot for wheel (A-5)
    if (hasA && has2 && has3 && has4 && !has5) return 4;
    if (hasA && has2 && has3 && has5 && !has4) return 4;
    if (hasA && has2 && has4 && has5 && !has3) return 4;
    if (hasA && has3 && has4 && has5 && !has2) return 4;
    
    // Convert ranks to indices for easier consecutive checks
    let indices = [];
    for (let r of rankSet) {
        let idx = RANKS.indexOf(r);
        if (idx !== -1) indices.push(idx);
    }
    indices.sort((a,b) => a-b);
    
    // Need at least 4 distinct ranks
    if (indices.length < 4) return 0;
    
    // Check for 4 consecutive ranks
    for (let i = 0; i <= indices.length - 4; i++) {
        if (indices[i+3] - indices[i] === 3) {
            // Open-ended: possible to complete on either end
            let low = indices[i] - 1;
            let high = indices[i+3] + 1;
            let outs = 0;
            if (low >= 0 && !indices.includes(low)) outs += 4;
            if (high <= 12 && !indices.includes(high)) outs += 4;
            if (outs > 0) return outs;
        }
    }
    
    // Check for gutshot (gap of 4 between first and last)
    for (let i = 0; i <= indices.length - 4; i++) {
        if (indices[i+3] - indices[i] === 4) {
            return 4;
        }
    }
    return 0;
}

// ----- Main outs calculation -----
function calculateOuts(hand, board) {
    // Skip made hands (pair on board, trips, etc.) - just return 0 and let generator skip
    let hasPairWithBoard = hand.some(h => board.some(b => b.rank === h.rank));
    if (hasPairWithBoard) return -1; // signal to skip
    
    let flush = flushOuts(hand, board);
    let straight = straightOuts(hand, board);
    let total = flush + straight;
    
    // Overcards only if no flush/straight already (to keep simple)
    if (total === 0) {
        let overcards = hand.filter(c => isOvercard(c, board)).length;
        if (overcards === 2) total = 6;
        else if (overcards === 1) total = 3;
    }
    
    return total;
}

// ----- Generate a clean draw (no made hands) -----
function generatePureDraw() {
    for (let attempt = 0; attempt < 100; attempt++) {
        let hand = [];
        while (hand.length < 2) {
            let c = { rank: RANKS[Math.floor(Math.random() * RANKS.length)], suit: SUITS[Math.floor(Math.random() * 4)] };
            if (!hand.some(h => h.rank === c.rank && h.suit === c.suit)) hand.push(c);
        }
        let board = [];
        while (board.length < 3) {
            let c = { rank: RANKS[Math.floor(Math.random() * RANKS.length)], suit: SUITS[Math.floor(Math.random() * 4)] };
            let inHand = hand.some(h => h.rank === c.rank && h.suit === c.suit);
            let onBoard = board.some(b => b.rank === c.rank && b.suit === c.suit);
            if (!inHand && !onBoard) board.push(c);
        }
        
        let outs = calculateOuts(hand, board);
        if (outs > 0 && outs !== -1 && [3,4,6,8,9,10].includes(outs)) {
            console.log("Valid draw:", hand.map(h=>h.rank+h.suit), board.map(b=>b.rank+b.suit), "outs=", outs);
            return { hand, board, outs };
        }
    }
    // Fallback (should never happen)
    return {
        hand: [{rank:'A',suit:'♥'},{rank:'K',suit:'♥'}],
        board: [{rank:'2',suit:'♥'},{rank:'9',suit:'♣'},{rank:'4',suit:'♦'}],
        outs: 10
    };
}

// ----- Explanation (for feedback) -----
function getExplanation(hand, board, outs) {
    let flush = flushOuts(hand, board);
    let straight = straightOuts(hand, board);
    if (flush) return `Flush draw: ${flush} outs`;
    if (straight === 8) return `Open-ended straight draw: 8 outs`;
    if (straight === 4) return `Gutshot straight draw: 4 outs`;
    let overcards = hand.filter(c => isOvercard(c, board)).length;
    if (overcards === 2) return `Two overcards: 6 outs`;
    if (overcards === 1) return `One overcard: 3 outs`;
    return `${outs} outs`;
}

// ----- Render cards (uses global renderCards from core) -----
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

// ----- Game flow -----
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
        document.getElementById('feedbackArea').innerHTML = '⚠️ Click NEXT HAND';
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
        document.querySelectorAll('.action-btn').forEach(btn => { btn.disabled = true; btn.style.opacity = '0.5'; });
    } else {
        streak = 0;
        updateStreakDisplay();
        document.getElementById('feedbackArea').innerHTML = `❌ WRONG. Answer: ${currentCorrectOuts} outs. ${explanation}<br>🔄 Streak reset.`;
        document.getElementById('feedbackArea').style.background = "#6b2e25";
    }
}

// ----- Attach events -----
document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => checkAnswer(parseInt(btn.getAttribute('data-outs'))));
});
document.getElementById('nextBtn').addEventListener('click', () => loadNewHand());

loadNewHand();
