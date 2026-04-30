// Shared card data and utilities
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
const SUITS = ["♥", "♦", "♣", "♠"];

function suitColor(suit) {
  return suit === "♥" || suit === "♦" ? "suit-red" : "suit-black";
}

function isEqual(c1, c2) {
  return c1.rank === c2.rank && c1.suit === c2.suit;
}

function generateUniqueCards(count, excludeCards = []) {
  const cards = [];
  while (cards.length < count) {
    const newCard = {
      rank: RANKS[Math.floor(Math.random() * RANKS.length)],
      suit: SUITS[Math.floor(Math.random() * 4)],
    };
    const isDuplicate = [...excludeCards, ...cards].some((c) =>
      isEqual(c, newCard),
    );
    if (!isDuplicate) cards.push(newCard);
  }
  return cards;
}

function renderCards(hand, board, handContainerId, boardContainerId) {
  const handContainer = document.getElementById(handContainerId);
  const boardContainer = document.getElementById(boardContainerId);
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
