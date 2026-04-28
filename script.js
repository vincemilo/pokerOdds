// ----- Card Data -----
const ranks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const suits = ['♥', '♦', '♣', '♠'];

function suitColor(suit) {
    return (suit === '♥' || suit === '♦') ? 'suit-red' : 'suit-black';
}

function randomCard() {
    return {
        rank: ranks[Math.floor(Math.random() * ranks.length)],
        suit: suits[Math.floor(Math.random() * 4)]
    };
}

function isEqual(c1, c2) {
    return c1.rank === c2.rank && c1.suit === c2.suit;
}

function uniqueCards(count, exclude = []) {
    let cards = [...exclude];
    while (cards.length < count) {
        let newCard = randomCard();
        let duplicate = cards.some(c => isEqual(c, newCard));
        if (!duplicate) cards.push(newCard);
    }
    return cards.slice(exclude.length);
}

// ----- OUTS DETECTION -----
function countFlushOuts(hand, board) {
    let all = [...hand, ...board];
    let suitCount = { '♥':0, '♦':0, '♣':0, '♠':0 };
    all.forEach(c => suitCount[c.suit]++);
    let maxSuit = Math.max(...Object.values(suitCount));
    return maxSuit === 4 ? 9 : 0;
}

function getStraightOuts(hand, board) {
    let allCards = [...hand, ...board];
    let rankIndices = new Set();
    allCards.forEach(c => {
        let idx = ranks.indexOf(c.rank);
        if (idx !== -1) rankIndices.add(idx);
    });
    let sorted = [...rankIndices].sort((a,b) => a - b);
    if (sorted.length < 4) return 0;
    
    // Open-ended straight draw
    for (let i = 0; i <= sorted.length - 4; i++) {
        if (sorted[i+3] - sorted[i] === 3) {
            let lowOut = sorted[i] - 1;
            let highOut = sorted[i+3] + 1;
            let outs = 0;
            if (lowOut >= 0 && !rankIndices.has(lowOut)) outs += 4;
            if (highOut <= 12 && !rankIndices.has(highOut)) outs += 4;
            if (outs >= 4) return 8;
        }
    }
    
    // Gutshot straight draw
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
        let hasPair = hand.some(h => board.some(b => b.rank === h.rank));
        total = hasPair ? 2 : 6; // overcards approx 6 outs
    }
    return Math.min(total, 15);
}

function generatePlayableScenario() {
    for (let attempts = 0; attempts < 20; attempts++) {
        let hand = uniqueCards(2);
        let board = uniqueCards(3, hand);
        let outs = calculateOuts(hand, board);
        
        if (outs >= 4 && outs <= 14) {
            let pot = Math.floor(Math.random() * 1600) + 700;
            let betOptions = [0.35, 0.45, 0.6, 0.75, 0.9];
            let fraction = betOptions[Math.floor(Math.random() * betOptions.length)];
            let bet = Math.floor(pot * fraction);
            if (bet < 60) bet = 80;
            return { hand, board, outs, pot, bet };
        }
    }
    // Fallback
    let hand = uniqueCards(2);
    let board = uniqueCards(3, hand);
    return {
        hand, board,
        outs: calculateOuts(hand, board),
        pot: 1200,
        bet: 600
    };
}

// ----- GAME STATE -----
let currentHand = null;
let currentStep = 1;
let correctOuts = 0;
let correctEquity = 0;
let correctPotOdds = 0;

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
    document.getElementById('questionText').innerHTML = `🔎 How many OUTS do you have?<br><span style="font-size:0.9rem;">(flush / straight draw, overcards)</span>`;
    document.getElementById('userAnswer').value = '';
    document.getElementById('feedbackMsg').innerHTML = '🤔 Count your outs from the hand + flop.';
    document.getElementById('feedbackMsg').style.background = "#0e1a12";
}

function loadNewHand() {
    currentHand = generatePlayableScenario();
    renderCards(currentHand.hand, currentHand.board);
    document.getElementById('potDisplay').innerHTML = `$${currentHand.pot}`;
    document.getElementById('betDisplay').innerHTML = `$${currentHand.bet}`;
    
    correctOuts = currentHand.outs;
    correctEquity = Math.min(99, correctOuts * 4);
    let requiredOdds = (currentHand.bet / (currentHand.pot + currentHand.bet)) * 100;
    correctPotOdds = Math.round(requiredOdds * 10) / 10;
    
    resetQuizToStep1();
    document.getElementById('submitBtn').disabled = false;
}

function handleSubmit() {
    let inputVal = parseFloat(document.getElementById('userAnswer').value);
    if (isNaN(inputVal)) {
        document.getElementById('feedbackMsg').innerHTML = '❌ Please enter a number.';
        return;
    }
    
    const feedbackDiv = document.getElementById('feedbackMsg');
    
    if (currentStep === 1) {
        if (Math.abs(inputVal - correctOuts) < 0.1) {
            feedbackDiv.innerHTML = `✅ Correct! ${correctOuts} outs. Now calculate EQUITY using Rule of 4: ${correctOuts} × 4 = ?`;
            feedbackDiv.style.background = "#1f543e";
            currentStep = 2;
            updateStepUI();
            document.getElementById('questionText').innerHTML = `🧮 What is your EQUITY (%)?<br><span style="font-size:0.85rem;">(Rule of 4 on flop: outs × 4)</span>`;
            document.getElementById('userAnswer').value = '';
        } else {
            feedbackDiv.innerHTML = `❌ Wrong. You have ${correctOuts} outs. Count flush draws (9) + straight draws (4 or 8). Try again.`;
            feedbackDiv.style.background = "#6b2e25";
        }
    }
    else if (currentStep === 2) {
        if (Math.abs(inputVal - correctEquity) < 1.5) {
            feedbackDiv.innerHTML = `✅ Great! ${correctEquity}% equity. Now last step: pot odds percentage to call.`;
            feedbackDiv.style.background = "#1f543e";
            currentStep = 3;
            updateStepUI();
            document.getElementById('questionText').innerHTML = `🎲 Required pot odds = (bet) / (pot + bet) × 100<br><span style="font-size:1rem;">Bet $${currentHand.bet} into $${currentHand.pot}: what % do you need?</span>`;
            document.getElementById('userAnswer').value = '';
        } else {
            feedbackDiv.innerHTML = `❌ Equity = outs × 4 → ${correctOuts} × 4 = ${correctEquity}%. You put ${inputVal}%. Remember rule of 4 on flop!`;
            feedbackDiv.style.background = "#6b2e25";
        }
    }
    else if (currentStep === 3) {
        if (Math.abs(inputVal - correctPotOdds) < 1.2) {
            let decision = correctEquity >= correctPotOdds ? 'CALL' : 'FOLD';
            feedbackDiv.innerHTML = `🎉 PERFECT! Required pot odds = ${correctPotOdds}%. Your equity ${correctEquity}% is ${correctEquity >= correctPotOdds ? '≥' : '<'} required → ${decision}. Click NEW HAND.`;
            feedbackDiv.style.background = "#2a6b45";
            document.getElementById('submitBtn').disabled = true;
        } else {
            feedbackDiv.innerHTML = `❌ Pot odds = bet ÷ (pot+bet) = ${currentHand.bet} / (${currentHand.pot}+${currentHand.bet}) = ${correctPotOdds}%. You answered ${inputVal}%. Formula: bet / (pot+bet) × 100.`;
            feedbackDiv.style.background = "#6b2e25";
        }
    }
}

// ----- Event Listeners -----
document.getElementById('submitBtn').addEventListener('click', handleSubmit);
document.getElementById('nextBtn').addEventListener('click', () => loadNewHand());
document.getElementById('userAnswer').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSubmit();
});

// ----- Initialize -----
loadNewHand();
