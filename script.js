// ----- Card Data -----
const ranks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const suits = ['♥', '♦', '♣', '♠'];

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
function getHandStrength(hand, board) {
    let allRanks = [...hand.map(c => c.rank), ...board.map(c => c.rank)];
    let rankCount = {};
    allRanks.forEach(r => rankCount[r] = (rankCount[r] || 0) + 1);
    
    let hasTrips = Object.values(rankCount).some(c => c === 3);
    let hasPair = Object.values(rankCount).some(c => c === 2);
    let handRanks = hand.map(c => c.rank);
    let hasPairWithBoard = hand.some(h => board.some(b => b.rank === h.rank));
    
    if (hasTrips) return { type: 'trips', message: '⚠️ TRIPS - Quiz not designed for this. Hit NEW HAND.' };
    if (hasPair && hasPairWithBoard && !hasTrips) return { type: 'pair', message: '⚠️ PAIR - Quiz works best for pure draws. Hit NEW HAND.' };
    if (!hasPairWithBoard) return { type: 'draw', message: '🎯 PURE DRAW - Good for outs quiz!' };
    return { type: 'other', message: '⚠️ MADE HAND - Hit NEW HAND for draw practice.' };
}

// ----- OUTS DETECTION -----
function countFlushOuts(hand, board) {
    let all = [...hand, ...board];
    let suitCount = { '♥':0, '♦':0, '♣':0, '♠':0 };
    all.forEach(c => suitCount[c.suit]++);
    
    for (let suit in suitCount) {
        let count = suitCount[suit];
        if (count >= 3) {
            return 13 - count;
        }
    }
    return 0;
}

function getStraightOuts(hand, board) {
    let allCards = [...hand, ...board];
    let rankSet = new Set();
    allCards.forEach(c => rankSet.add(ranks.indexOf(c.rank)));
    let sorted = [...rankSet].sort((a,b) => a-b);
    
    if (sorted.length < 4) return 0;
    
    for (let i = 0; i <= sorted.length - 4; i++) {
        if (sorted[i+3] - sorted[i] === 3) {
            let lowComplete = sorted[i] - 1;
            let highComplete = sorted[i+3] + 1;
            let outs = 0;
            if (lowComplete >= 0 && !rankSet.has(lowComplete)) outs += 4;
            if (highComplete <= 12 && !rankSet.has(highComplete)) outs += 4;
            if (outs === 8) return 8;
        }
    }
    
    for (let i = 0; i <= sorted.length - 4; i++) {
        let totalGap = sorted[i+3] - sorted[i];
        if (totalGap === 4) {
            for (let k = sorted[i] + 1; k < sorted[i+3]; k++) {
                if (!rankSet.has(k)) return 4;
            }
        }
    }
    return 0;
}

function calculateOuts(hand, board) {
    // Only for pure draws - if there's a pair/trips, return 0 as signal
    let handRanks = hand.map(c => c.rank);
    let hasPairWithBoard = hand.some(h => board.some(b => b.rank === h.rank));
    
    if (hasPairWithBoard) return 0; // Signal that quiz should be skipped
    
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

// ----- EXPLANATION FUNCTION -----
function explainOuts(hand, board, outs) {
    let all = [...hand, ...board];
    let suitCount = { '♥':0, '♦':0, '♣':0, '♠':0 };
    all.forEach(c => suitCount[c.suit]++);
    
    let flushOuts = 0;
    let flushSuit = null;
    let visibleFlush = 0;
    
    for (let suit in suitCount) {
        if (suitCount[suit] >= 3) {
            flushOuts = 13 - suitCount[suit];
            flushSuit = suit;
            visibleFlush = suitCount[suit];
            break;
        }
    }
    
    let straightOuts = getStraightOuts(hand, board);
    let overcardCount = hand.filter(h => {
        let hIdx = ranks.indexOf(h.rank);
        return board.every(b => hIdx > ranks.indexOf(b.rank));
    }).length;
    
    let explanation = [];
    
    if (flushOuts > 0) {
        explanation.push(`♣️ Flush draw: ${flushOuts} outs (${visibleFlush} ${flushSuit} visible, ${13 - visibleFlush} remain)`);
    }
    
    if (straightOuts === 8) {
        explanation.push(`📏 Open-ended straight: 8 outs`);
    } else if (straightOuts === 4) {
        explanation.push(`📏 Gutshot straight: 4 outs`);
    }
    
    if (overcardCount === 2 && flushOuts === 0 && straightOuts === 0) {
        explanation.push(`⬆️ Two overcards: 6 outs`);
    } else if (overcardCount === 1 && flushOuts === 0 && straightOuts === 0) {
        explanation.push(`⬆️ One overcard: 3 outs`);
    } else if (flushOuts === 0 && straightOuts === 0 && overcardCount === 0) {
        explanation.push(`⚠️ No draw - 0 outs`);
    }
    
    if (explanation.length === 0 && outs > 0) {
        explanation.push(`🎯 Mixed draw: ${outs} total outs`);
    }
    
    return explanation.join(' · ');
}

// ----- RENDER & GAME LOGIC -----
let currentHand = null;
let currentStep = 1;
let correctOuts = 0;
let correctEquity = 0;
let correctPotOdds = 0;
let currentExplanation = "";
let currentStrength = null;

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

function updateStrengthBadge() {
    const badge = document.getElementById('strengthBadge');
    if (!badge) return;
    
    if (currentStrength.type === 'draw') {
        badge.innerHTML = currentStrength.message;
        badge.style.background = "#2a6b45";
        badge.style.color = "#fff3cf";
        badge.style.display = "inline-block";
    } else {
        badge.innerHTML = currentStrength.message;
        badge.style.background = "#8b3a2a";
        badge.style.color = "#ffe0b3";
        badge.style.display = "inline-block";
    }
}

function generatePlayableScenario() {
    for (let attempts = 0; attempts < 30; attempts++) {
        let hand = generateUniqueCards(2);
        let board = generateUniqueCards(3, hand);
        let strength = getHandStrength(hand, board);
        
        // Only accept pure draws (no pair with board)
        if (strength.type === 'draw') {
            let outs = calculateOuts(hand, board);
            if (outs >= 4 && outs <= 14) {
                let pot = Math.floor(Math.random() * 1600) + 700;
                let betOptions = [0.35, 0.45, 0.6, 0.75, 0.9];
                let fraction = betOptions[Math.floor(Math.random() * betOptions.length)];
                let bet = Math.floor(pot * fraction);
                if (bet < 60) bet = 80;
                return { hand, board, outs, pot, bet, strength };
            }
        }
    }
    // Fallback - force a flush draw
    let suit = suits[Math.floor(Math.random() * 4)];
    let hand = [
        { rank: 'A', suit: suit },
        { rank: 'K', suit: suit }
    ];
    let board = [
        { rank: 'Q', suit: suit },
        { rank: 'J', suit: suits.find(s => s !== suit) },
        { rank: '2', suit: suits.find(s => s !== suit) }
    ];
    let outs = calculateOuts(hand, board);
    let pot = 1200, bet = 600;
    let strength = getHandStrength(hand, board);
    return { hand, board, outs, pot, bet, strength };
}

function updateStepUI() {
    document.getElementById('step1Label').classList.remove('active');
    document.getElementById('step2Label').classList.remove('active');
    document.getElementById('step3Label').classList.remove('active');
    if (currentStep === 1) document.getElementById('step1Label').classList.add('active');
    else if (currentStep === 2) document.getElementById('step2Label').classList.add('active');
    else document.getElementById('step3Label').classList.add('active');
}

function resetQuizToStep1() {
    currentStep = 1;
    updateStepUI();
    
    if (currentStrength.type !== 'draw') {
        // Disable quiz for made hands
        document.getElementById('questionText').innerHTML = `⛔ PURE DRAWS ONLY<br><span style="font-size:0.9rem;">${currentStrength.message}</span>`;
        document.getElementById('userAnswer').disabled = true;
        document.getElementById('submitBtn').disabled = true;
        document.getElementById('feedbackMsg').innerHTML = `🔁 Click NEW HAND for a pure draw (flush/straight/overcards) to practice outs.`;
        return;
    }
    
    // Enable quiz for pure draws
    document.getElementById('userAnswer').disabled = false;
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('questionText').innerHTML = `🔎 How many OUTS do you have?<br><span style="font-size:0.9rem;">(flush / straight draw, overcards)</span>`;
    document.getElementById('userAnswer').value = '';
    document.getElementById('feedbackMsg').innerHTML = `🤔 Count your outs.<br><span style="font-size:0.8rem; color:#dbb46a;">📖 ${currentExplanation}</span>`;
    document.getElementById('feedbackMsg').style.background = "#0e1a12";
}

function loadNewHand() {
    currentHand = generatePlayableScenario();
    renderCards(currentHand.hand, currentHand.board);
    document.getElementById('potDisplay').innerHTML = `$${currentHand.pot}`;
    document.getElementById('betDisplay').innerHTML = `$${currentHand.bet}`;
    
    currentStrength = currentHand.strength;
    updateStrengthBadge();
    
    correctOuts = currentHand.outs;
    correctEquity = Math.min(99, correctOuts * 4);
    let requiredOdds = (currentHand.bet / (currentHand.pot + currentHand.bet)) * 100;
    correctPotOdds = Math.round(requiredOdds * 10) / 10;
    
    currentExplanation = explainOuts(currentHand.hand, currentHand.board, correctOuts);
    resetQuizToStep1();
}

function handleSubmit() {
    if (currentStrength.type !== 'draw') {
        document.getElementById('feedbackMsg').innerHTML = '⚠️ This is not a pure draw. Click NEW HAND to practice outs.';
        return;
    }
    
    let inputVal = parseFloat(document.getElementById('userAnswer').value);
    if (isNaN(inputVal)) {
        document.getElementById('feedbackMsg').innerHTML = '❌ Please enter a number.';
        return;
    }
    
    const feedbackDiv = document.getElementById('feedbackMsg');
    
    if (currentStep === 1) {
        if (Math.abs(inputVal - correctOuts) < 0.1) {
            feedbackDiv.innerHTML = `✅ Correct! ${correctOuts} outs. ${currentExplanation}<br>📐 Now calculate EQUITY: ${correctOuts} × 4 = ?`;
            feedbackDiv.style.background = "#1f543e";
            currentStep = 2;
            updateStepUI();
            document.getElementById('questionText').innerHTML = `🧮 What is your EQUITY (%)?<br><span style="font-size:0.85rem;">(Rule of 4 on flop: outs × 4)</span>`;
            document.getElementById('userAnswer').value = '';
        } else {
            feedbackDiv.innerHTML = `❌ Wrong. ${currentExplanation}<br>You entered ${inputVal}. Correct outs: ${correctOuts}. Try again.`;
            feedbackDiv.style.background = "#6b2e25";
        }
    } else if (currentStep === 2) {
        if (Math.abs(inputVal - correctEquity) < 1.5) {
            feedbackDiv.innerHTML = `✅ Great! ${correctEquity}% equity. Now pot odds.`;
            feedbackDiv.style.background = "#1f543e";
            currentStep = 3;
            updateStepUI();
            document.getElementById('questionText').innerHTML = `🎲 Required pot odds = (bet) / (pot + bet) × 100<br><span style="font-size:1rem;">Bet $${currentHand.bet} into $${currentHand.pot}: what % do you need?</span>`;
            document.getElementById('userAnswer').value = '';
        } else {
            feedbackDiv.innerHTML = `❌ Equity = outs × 4 → ${correctOuts} × 4 = ${correctEquity}%. You put ${inputVal}%. Remember: Rule of 4 on flop!`;
            feedbackDiv.style.background = "#6b2e25";
        }
    } else if (currentStep === 3) {
        if (Math.abs(inputVal - correctPotOdds) < 1.2) {
            let decision = correctEquity >= correctPotOdds ? 'CALL' : 'FOLD';
            feedbackDiv.innerHTML = `🎉 Perfect! Required pot odds = ${correctPotOdds}%. Your equity ${correctEquity}% → ${decision}. Click NEW HAND.`;
            feedbackDiv.style.background = "#2a6b45";
            document.getElementById('submitBtn').disabled = true;
        } else {
            feedbackDiv.innerHTML = `❌ Pot odds = ${currentHand.bet} / (${currentHand.pot}+${currentHand.bet}) × 100 = ${correctPotOdds}%. You answered ${inputVal}%.`;
            feedbackDiv.style.background = "#6b2e25";
        }
    }
}

// ----- EVENT LISTENERS -----
document.getElementById('submitBtn').addEventListener('click', handleSubmit);
document.getElementById('nextBtn').addEventListener('click', () => loadNewHand());
document.getElementById('userAnswer').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSubmit();
});

// ----- INITIALIZE -----
loadNewHand();
