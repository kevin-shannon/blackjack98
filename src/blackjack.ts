import { Suit, Rank, Card, Deck, Action, hiddenCard } from "./enums";

/** Functions for building and shuffling the shoe */

function createDeck(): Deck {
  const suits: Suit[] = [Suit.HEART, Suit.DIAMOND, Suit.CLUB, Suit.SPADE];
  const ranks: Rank[] = ["4", "4", "4", "4", "4", "4", "4", "4", "4", "4", "4", "4", "A"];

  let deck: Deck = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }

  return deck;
}

function createShoe(numDecks: number): Deck {
  let shoe: Deck = [];

  for (let i = 0; i < numDecks; i++) {
    shoe = shoe.concat(createDeck());
  }

  return shuffleDeck(shoe);
}

function shuffleDeck(deck: Deck): Deck {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Blackjack Game Class */

type StateChangeListener = () => void;

export class BlackjackGame {
  private shoe: Deck;
  private player: Player;
  private dealer: Dealer;
  private isGameInProgress = false;
  private listeners: StateChangeListener[] = [];

  constructor(numDecks: number) {
    this.shoe = createShoe(numDecks);
    this.player = new Player();
    this.dealer = new Dealer();
  }

  onStateChange(listener: StateChangeListener) {
    this.listeners.push(listener);
  }

  offStateChange(listener: StateChangeListener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  private notifyStateChange() {
    this.listeners.forEach((listener) => listener());
  }

  dealCard(participant: Player | Dealer, handIndex: number = 0): Card {
    if (this.shoe.length === 0) {
      throw new Error("No more cards in the shoe!");
    }

    const card = this.shoe.pop()!;
    participant.addCard(card, handIndex);
    this.notifyStateChange();
    return card;
  }

  async startGame(): Promise<void> {
    if (this.isGameInProgress) {
      console.log("Game already in progress.");
      return;
    }

    this.isGameInProgress = true;

    try {
      this.scoop();
      this.dealPlayerHand();
      this.dealDealerHand();

      if (this.player.checkIfNatural() || this.dealer.checkIfNatural()) {
        if (this.dealer.checkIfNatural()) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          this.dealer.revealHiddenCard();
          this.notifyStateChange();
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
        this.scoop();
        return;
      }

      await this.playPlayerTurn();
      if (!this.player.isBusted()) {
        await this.playDealerTurn();
      }
    } finally {
      this.isGameInProgress = false;
    }
  }

  scoop(): void {
    this.player.toss();
    this.dealer.toss();
    this.notifyStateChange();
  }

  dealPlayerHand(): void {
    this.dealCard(this.player);
    this.dealCard(this.player);
  }

  dealDealerHand(): void {
    this.dealCard(this.dealer);
    this.dealCard(this.dealer);
  }

  getPlayerHand(): Deck[] {
    return this.player.getHands();
  }

  getDealerHand(): Deck {
    return this.dealer.getHand();
  }

  // Method to handle the player's turn
  public async playPlayerTurn(): Promise<void> {
    let action: Action;
    let handIndex = 0;

    // Loop through the hands dynamically
    while (handIndex < this.player.getNumberOfHands()) {
      // Keep playing the current hand until it's either busted or the player stands
      while (!this.player.isBusted(handIndex)) {
        console.log(this.player.getHands());
        action = await waitForPlayerAction();
        console.log(handIndex);
        if (action === Action.HIT) {
          this.dealCard(this.player, handIndex); // Deal card to the current hand
        }

        if (action === Action.STAND) {
          break; // Move on to the next hand
        }

        if (action === Action.SPLIT) {
          this.player.splitHand(handIndex); // Split the hand
        }
      }
      handIndex++; // Move to the next hand
    }
  }

  // Method to handle the dealer's turn
  private playDealerTurn(): void {
    this.dealer.revealHiddenCard();
    this.notifyStateChange();
    while (this.dealer.getValue() < 17) {
      this.dealCard(this.dealer);
      if (this.dealer.isBusted()) {
        break;
      }
    }
  }
}

const waitForPlayerAction = (): Promise<Action> => {
  return new Promise<Action>((resolve) => {
    const hitButton = document.getElementById("Hit-button");
    const standButton = document.getElementById("Stand-button");
    const splitButton = document.getElementById("Split-button");

    if (!hitButton || !standButton || !splitButton) {
      resolve(Action.STAND);
      return;
    }

    const handleClick = (action: Action) => {
      resolve(action);
      hitButton.removeEventListener("click", handleHitClick);
      standButton.removeEventListener("click", handleStandClick);
      splitButton.removeEventListener("click", handleSplitClick);
    };

    const handleHitClick = () => handleClick(Action.HIT);
    const handleStandClick = () => handleClick(Action.STAND);
    const handleSplitClick = () => handleClick(Action.SPLIT);

    hitButton.addEventListener("click", handleHitClick);
    standButton.addEventListener("click", handleStandClick);
    splitButton.addEventListener("click", handleSplitClick);
  });
};

class Participant {
  protected hand: Deck[] = [[]]; // Now an array of hands

  // Add a card to a specific hand
  addCard(card: Card, handIndex: number = 0): void {
    this.hand[handIndex].push(card);
  }

  // Get a specific hand
  getHand(handIndex: number = 0): Deck {
    return this.hand[handIndex];
  }

  // Get all hands
  getHands(): Deck[] {
    return this.hand;
  }

  // Get the value of a specific hand
  getValue(handIndex: number = 0): number {
    return calculateHandValue(this.hand[handIndex]);
  }

  // Check if a specific hand is a natural blackjack
  checkIfNatural(handIndex: number = 0): Boolean {
    return this.getValue(handIndex) === 21 && this.hand[handIndex].length === 2;
  }

  // Check if a specific hand is busted
  isBusted(handIndex: number = 0): Boolean {
    return this.getValue(handIndex) > 21;
  }

  // Clear all hands
  toss(): void {
    this.hand = [[]];
  }

  // Get the number of hands
  getNumberOfHands(): number {
    return this.hand.length;
  }
}

class Player extends Participant {
  // Split the hand at the given handIndex if the first two cards are of the same rank
  splitHand(handIndex: number): void {
    const currentHand = this.hand[handIndex];

    // Ensure the hand can be split (it has exactly 2 cards and the ranks match)
    if (currentHand.length === 2 && currentHand[0].rank === currentHand[1].rank) {
      const secondCard = currentHand.pop(); // Remove the second card from the current hand

      if (secondCard) {
        // Insert the new hand immediately after the current hand
        this.hand.splice(handIndex + 1, 0, [secondCard]);
      }
    }
  }
}
class Dealer extends Participant {
  private isFirstCardRevealed: boolean = false;

  // Reveal the hidden card
  revealHiddenCard() {
    this.isFirstCardRevealed = true;
  }

  // Get the first hand, hiding the first card if not revealed
  getHand(handIndex: number = 0): Deck {
    let hand = this.hand[handIndex].slice();
    if (!this.isFirstCardRevealed && hand.length !== 0) {
      hand[0] = hiddenCard;
    }
    return hand;
  }

  // Clear all hands and reset the first card reveal status
  toss(): void {
    this.hand = [[]];
    this.isFirstCardRevealed = false;
  }
}

/** Blackjack Utils */

// Calculate the value of the player's hand
export function calculateHandValue(hand: Deck): number {
  let value = 0;
  let aces = 0;

  for (const card of hand) {
    if (card.rank === "A") {
      aces += 1;
      value += 11; // Consider Ace as 11 initially
    } else if (["J", "Q", "K"].includes(card.rank)) {
      value += 10;
    } else {
      value += parseInt(card.rank);
    }
  }

  // Adjust for Aces if value exceeds 21
  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
  }

  return value;
}
