// ----- RANGES DEFINITION -----
const RANGES = {
    UTG: {
        pairs: ['77', '88', '99', 'TT', 'JJ', 'QQ', 'KK', 'AA'],
        suited: ['AT', 'AJ', 'AQ', 'AK', 'KQ'],
        offsuit: ['AJ', 'AQ', 'AK']
    },
    MP: {
        pairs: ['55', '66', '77', '88', '99', 'TT', 'JJ', 'QQ', 'KK', 'AA'],
        suited: ['A9', 'AT', 'AJ', 'AQ', 'AK', 'KQ', 'KJ', 'QJ'],
        offsuit: ['AT', 'AJ', 'AQ', 'AK', 'KQ', 'KJ', 'QJ']
    },
    CO: {
        pairs: ['22', '33', '44', '55', '66', '77', '88', '99', 'TT', 'JJ', 'QQ', 'KK', 'AA'],
        suited: ['A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'AT', 'AJ', 'AQ', 'AK', 'K9', 'KT', 'KJ', 'KQ', 'Q9', 'QT', 'QJ', 'J9', 'JT', 'T9', '98', '87', '76', '65', '54'],
        offsuit: ['A9', 'AT', 'AJ', 'AQ', 'AK', 'K9', 'KT', 'KJ', 'KQ', 'Q9', 'QT', 'QJ', 'J9', 'JT', 'T9']
    },
    BTN: {
        pairs: ['22', '33', '44', '55', '66', '77', '88', '99', 'TT', 'JJ', 'QQ', 'KK', 'AA'],
        suited: ['A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'AT', 'AJ', 'AQ', 'AK', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'KT', 'KJ', 'KQ', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'QT', 'QJ', 'J7', 'J8', 'J9', 'JT', 'T7', 'T8', 'T9', '97', '98', '86', '87', '75', '76', '64', '65', '54'],
        offsuit: ['A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'AT', 'AJ', 'AQ', 'AK', 'K7', 'K8', 'K9', 'KT', 'KJ', 'KQ', 'Q8', 'Q9', 'QT', 'QJ', 'J8', 'J9', 'JT', 'T8', 'T9', '98']
    },
    SB: {
        pairs: ['22', '33', '44', '55', '66', '77', '88', '99', 'TT', 'JJ', 'QQ', 'KK', 'AA'],
        suited: ['A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'AT', 'AJ', 'AQ', 'AK', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'KT', 'KJ', 'KQ', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'QT', 'QJ', 'J7', 'J8', 'J9', 'JT', 'T7', 'T8', 'T9', '97', '98', '86', '87', '75', '76', '64', '65', '54'],
        offsuit: ['A7', 'A8', 'A9', 'AT', 'AJ', 'AQ', 'AK', 'K9', 'KT', 'KJ', 'KQ', 'Q9', 'QT', 'QJ', 'J9', 'JT', 'T9']
    },
    BB: {
        pairs: ['88', '99', 'TT', 'JJ', 'QQ', 'KK', 'AA'],
        suited: ['AT', 'AJ', 'AQ', 'AK', 'KQ'],
        offsuit: ['AQ', 'AK']
    }
};

function handToKey(hand) {
    let rank1 = hand[0].rank;
    let rank2 = hand[1].rank;
    let idx1 = RANKS.indexOf(rank1);
    let idx2 = RANKS.indexOf(rank2);
    let suited = hand[0].suit === hand[1].suit;
    
    let high = idx1 > idx2 ? rank1 : rank2;
    let low = idx1 > idx2 ? rank2 : rank1;
    
    if (high === low) return high + low;
    return suited ? high + low + 's' : high + low + 'o';
}

function isPlayable(hand, position) {
    let range = RANGES[position];
    if (!range) return false;
    
    let rank1 = hand[0].rank;
    let rank2 = hand[1].rank;
    let suited = hand[0].suit === hand[1].suit;
    let high = rank1 === rank2 ? rank1 : (RANKS.indexOf(rank1) > RANKS.indexOf(rank2) ? rank1 : rank2);
    let low = rank1 === rank2 ? rank1 : (RANKS.indexOf(rank1) > RANKS.indexOf(rank2) ? rank2 : rank1);
    
    if (rank1 === rank2) {
        return range.pairs.includes(high + low);
    }
    
    if (suited) {
        if (range.suited.includes(high + low)) return true;
    }
    
    if (range.offsuit.includes(high + low)) return true;
    
    return false;
}

// ----- GAME STATE -----
let currentHand = null;
let currentPosition = 'UTG';
let isMixedMode = false;
let currentCorrectAction = null;
let streak = 0;
let autoLoadTimer = null;
let buttonsEnabled = true;

function generateRandomHand() {
    let hand = [];
    while (hand.length < 2) {
        let card = {
            rank: RANKS[Math.floor(Math.random() * RANKS.length)],
            suit: SUITS[Math.floor(Math.random() * 4)]
        };
        if (!hand.some(c => c.rank === card.rank && c.suit === card.suit)) {
            hand.push(card);
        }
    }
    return hand;
}

function getRandomPosition() {
    let positions = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
    return positions[Math.floor(Math.random() * positions.length)];
}

function renderCards(hand) {
    const handContainer = document.getElementById('handCards');
    handContainer.innerHTML = '';
    
    hand.forEach(c => {
        let div = document.createElement('div');
        div.className = 'poker-card';
        div.innerHTML = `<div class="card-rank">${c.rank}</div><div class="card-suit ${suitColor(c.suit)}">${c.suit}</div>`;
        handContainer.appendChild(div);
    });
}

function highlightReference(position) {
    const positions = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
    positions.forEach(pos => {
        const el = document.getElementById(`ref${pos}`);
        if (el) {
            el.style.background = 'transparent';
            el.style.borderRadius = '0';
            el.style.padding = '4px 0';
        }
    });
    const currentEl = document.getElementById(`ref${position}`);
    if (currentEl) {
        currentEl.style.background = '#2a6b45';
        currentEl.style.borderRadius = '20px';
        currentEl.style.padding = '4px 8px';
    }
}

function updateStreakDisplay() {
    document.getElementById('streakCount').innerText = streak;
}

function loadNewHand() {
    // Clear any pending auto-load timer
    if (autoLoadTimer) clearTimeout(autoLoadTimer);
    
    // Re-enable buttons
    buttonsEnabled = true;
    document.getElementById('playBtn').disabled = false;
    document.getElementById('foldBtn').disabled = false;
    document.getElementById('playBtn').style.opacity = '1';
    document.getElementById('foldBtn').style.opacity = '1';
    
    // Determine position
    if (isMixedMode) {
        currentPosition = getRandomPosition();
    }
    
    // Generate random hand
    currentHand = generateRandomHand();
    
    // Determine correct action
    currentCorrectAction = isPlayable(currentHand, currentPosition) ? 'play' : 'fold';
    
    // Update UI
    renderCards(currentHand);
    document.getElementById('currentPosDisplay').innerHTML = `📍 Position: ${currentPosition}`;
    document.getElementById('feedbackArea').innerHTML = '👆 Click PLAY or FOLD';
    document.getElementById('feedbackArea').style.background = "#0e1a12";
    
    highlightReference(currentPosition);
}

function checkAnswer(action) {
    if (!buttonsEnabled) return;
    
    let isCorrect = (action === currentCorrectAction);
    let handKey = handToKey(currentHand);
    let actionText = currentCorrectAction === 'play' ? 'PLAY' : 'FOLD';
    
    // Disable buttons immediately to prevent double-click
    buttonsEnabled = false;
    document.getElementById('playBtn').disabled = true;
    document.getElementById('foldBtn').disabled = true;
    document.getElementById('playBtn').style.opacity = '0.5';
    document.getElementById('foldBtn').style.opacity = '0.5';
    
    if (isCorrect) {
        streak++;
        updateStreakDisplay();
        document.getElementById('feedbackArea').innerHTML = `✅ CORRECT! ${handKey} in ${currentPosition} = ${actionText}.<br>🔥 Streak: ${streak}`;
        document.getElementById('feedbackArea').style.background = "#1f543e";
    } else {
        streak = 0;
        updateStreakDisplay();
        document.getElementById('feedbackArea').innerHTML = `❌ WRONG. ${handKey} in ${currentPosition} = ${actionText}, not ${action.toUpperCase()}.<br>🔄 Streak reset.`;
        document.getElementById('feedbackArea').style.background = "#6b2e25";
    }
    
    // Auto-load next hand after 0.8 seconds
    autoLoadTimer = setTimeout(() => {
        loadNewHand();
    }, 800);
}

// ----- EVENT LISTENERS -----
document.getElementById('playBtn').addEventListener('click', () => checkAnswer('play'));
document.getElementById('foldBtn').addEventListener('click', () => checkAnswer('fold'));

// Mode toggles
document.getElementById('singleModeBtn').addEventListener('click', () => {
    isMixedMode = false;
    document.getElementById('singleModeBtn').classList.add('active');
    document.getElementById('mixedModeBtn').classList.remove('active');
    document.querySelectorAll('.pos-btn').forEach(btn => {
        btn.classList.remove('disabled');
    });
    loadNewHand();
});

document.getElementById('mixedModeBtn').addEventListener('click', () => {
    isMixedMode = true;
    document.getElementById('mixedModeBtn').classList.add('active');
    document.getElementById('singleModeBtn').classList.remove('active');
    document.querySelectorAll('.pos-btn').forEach(btn => {
        btn.classList.add('disabled');
    });
    loadNewHand();
});

// Position buttons (single mode)
document.querySelectorAll('.pos-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (isMixedMode) return;
        currentPosition = btn.getAttribute('data-pos');
        document.querySelectorAll('.pos-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadNewHand();
    });
});

// Set default active states
document.getElementById('singleModeBtn').classList.add('active');
document.querySelector('.pos-btn[data-pos="UTG"]').classList.add('active');

// ----- INIT -----
loadNewHand();
