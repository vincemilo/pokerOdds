const ranks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const suits = ['♥', '♦', '♣', '♠'];

let currentHand = null;
let currentCorrectOuts = 0;
let streak = 0;
let waitingForNext = false;

function suitColor(suit) {
    return (suit === '♥' || suit === '♦') ? 'suit-red' : 'suit-black';
}

function isEqual(c1, c2) {
    return c1.rank === c2.rank && c1.suit === c2.suit;
}

function generateUniqueCards(count, excludeCards = []) {
    const cards = [];
    while (cards.length < count) {
        const newCard = {
            rank: ranks[Math.floor(Math.random() * ranks.length)],
            suit: suits[Math.floor(Math.random() * 4)]
        };
        const isDuplicate = [...excludeCards, ...cards].some(c => isEqual(c, newCard));
        if (!isDuplicate) cards.push(newCard);
    }
    return cards;
}

// ----- HAND STRENGTH DETECTION -----
function isMadeHand(hand, board) {
    // Check for flush
    let suitCount = { '♥':0, '♦':0, '♣':0, '♠':0 };
    [...hand, ...board].forEach(c => suitCount[c.suit]++);
    if (Object.values(suitCount).some(c => c >= 5)) return true;
    
    // Check for trips+
    let rankCount = {};
    [...hand.map(c => c.rank), ...board.map(c => c.rank)].forEach(r => rankCount[r] = (rankCount[r] || 0) + 1);
    if (Object.values(rankCount).some(c => c >= 3)) return true;
    
    // Check for pair with board
    let hasPair = hand.some(h => board.some(b => b.rank === h.rank));
    if (hasPair) return true;
    
    return false;
}

// ----- OUTS CALCULATION -----
function countFlushOuts(hand, board) {
    let suitCount = { '♥':0, '♦':0, '♣':0, '♠':0 };
    [...hand, ...board].forEach(c => suitCount[c.suit]++);
    
    for (let suit in suitCount) {
        let count = suitCount[suit];
        if (count === 4) return 9;   // 4 of suit, need 1 more
        if (count === 3) return 10;  // 3 of suit, need 2 more
    }
    return 0;
}

function getStraightOuts(hand, board) {
    let allCards = [...hand, ...board];
    let rankIndices = new Set();
    allCards.forEach(c => rankIndices.add(ranks.indexOf(c.rank)));
    let sorted = [...rankIndices].sort((a,b) => a-b);
    
    if (sorted.length < 4) return 0;
    
    // Open-ended
    for (let i = 0; i <= sorted.length - 4; i++) {
        if (sorted[i+3] - sorted[i] === 3) {
            let lowOut = sorted[i] - 1;
            let highOut = sorted[i+3] + 1;
            let outs = 0;
            if (lowOut >= 0 && !rankIndices.has(lowOut)) outs += 4;
            if (highOut <= 12 && !rankIndices.has(highOut)) outs += 4;
            if (outs === 8) return 8;
        }
    }
    
    // Gutshot
    for (let i = 0; i <= sorted.length - 4; i++) {
        if (sorted[i+3] - sorted[i] === 4) return 4;
    }
    return 0;
}

function calculateOuts(hand, board) {
    let flush = countFlushOuts(hand, board);
    let straight = getStraightOuts(hand, board);
    let total = flush + straight;
    
    if (total === 0) {
        let overcardCount = hand.filter(h => {
            let hIdx = ranks.indexOf(h.rank);
            return board.every(b => hIdx > ranks.indexOf(b.rank));
        }).length;
        
        if (overcardCount === 2) total = 6;
        else if (overcardCount === 1) total = 3;
        else total = 0;
    }
    return total;
}

// ----- GENERATE PURE DRAW -----
function generatePureDraw() {
    for (let attempts = 0; attempts < 40; attempts++) {
        let hand = generateUniqueCards(2);
        let board = generateUniqueCards(3, hand);
        
        if (isMadeHand(hand, board)) continue;
        
        let outs = calculateOuts(hand, board);
        if (outs >= 3 && outs <= 14 && outs !== 5 && outs !== 7 && outs !== 11 && outs !== 13) {
            let validOuts = [3,4,6,8,9,10,12,14];
            if (validOuts.includes(outs)) {
                return { hand, board, outs };
            }
        }
    }
    // Fallback
    let hand = generateUniqueCards(2);
    let board = generateUniqueCards(3, hand);
    let outs = calculateOuts(hand, board);
    return { hand, board, outs };
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

function updateStreakDisplay() {
    document.getElementById('streakCount').innerText = streak;
}

function showFeedback(isCorrect, correctOuts, explanation) {
    const feedbackDiv = document.getElementById('feedbackArea');
    if (isCorrect) {
        feedbackDiv.innerHTML = `✅ CORRECT! ${correctOuts} outs. ${explanation}<br>🔥 Streak: ${streak}`;
        feedbackDiv.style.background = "#1f543e";
    } else {
        feedbackDiv.innerHTML = `❌ WRONG. Correct answer: ${correctOuts} outs. ${explanation}<br>🔄 Streak reset. Try again!`;
        feedbackDiv.style.background = "#6b2e25";
    }
}

function getExplanation(hand, board, outs) {
    let flush = countFlushOuts(hand, board);
    let straight = getStraightOuts(hand, board);
    
    if (flush === 10) return "Flush draw: 2 in hand + 1 on board = 10 outs";
    if (flush === 9) return "Flush draw: 2 in hand + 2 on board = 9 outs";
    if (straight === 8) return "Open-ended straight draw = 8 outs";
    if (straight === 4) return "Gutshot straight draw = 4 outs";
    
    let overcardCount = hand.filter(h => {
        let hIdx = ranks.indexOf(h.rank);
        return board.every(b => hIdx > ranks.indexOf(b.rank));
    }).length;
    
    if (overcardCount === 2) return "Two overcards = 6 outs";
    if (overcardCount === 1) return "One overcard = 3 outs";
    
    return "Mixed or combo draw";
}

function loadNewHand() {
    waitingForNext = false;
    currentHand = generatePureDraw();
    renderCards(currentHand.hand, currentHand.board);
    currentCorrectOuts = currentHand.outs;
    
    // Hide warning if visible
    document.getElementById('madeHandWarning').style.display = 'none';
    document.getElementById('questionText').innerHTML = 'How many OUTS do you have?';
    document.getElementById('feedbackArea').innerHTML = '👆 Click a number above to answer';
    document.getElementById('feedbackArea').style.background = "#0e1a12";
    
    // Re-enable buttons
    document.querySelectorAll('.outs-btn').forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
    });
}

function checkAnswer(selectedOuts) {
    if (waitingForNext) {
        document.getElementById('feedbackArea').innerHTML = '⚠️ Click NEXT HAND for a new question';
        return;
    }
    
    let isCorrect = (selectedOuts === currentCorrectOuts);
    let explanation = getExplanation(currentHand.hand, currentHand.board, currentCorrectOuts);
    
    if (isCorrect) {
        streak++;
        updateStreakDisplay();
        showFeedback(true, currentCorrectOuts, explanation);
        waitingForNext = true;
        // Disable buttons until next hand
        document.querySelectorAll('.outs-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        });
    } else {
        streak = 0;
        updateStreakDisplay();
        showFeedback(false, currentCorrectOuts, explanation);
        // Don't disable buttons - let them try again
    }
}

// ----- EVENT LISTENERS -----
document.querySelectorAll('.outs-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        let outs = parseInt(btn.getAttribute('data-outs'));
        checkAnswer(outs);
    });
});

document.getElementById('nextBtn').addEventListener('click', () => {
    loadNewHand();
});

// ----- INITIALIZE -----
loadNewHand();
