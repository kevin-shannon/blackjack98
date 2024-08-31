import { Suit, Rank, Card, Deck, Action, hiddenCard } from "./enums";

/** Functions for building and shuffling the shoe */

function createDeck(): Deck {
  const suits: Suit[] = [Suit.HEART, Suit.DIAMOND, Suit.CLUB, Suit.SPADE];
  const ranks: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

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

  dealCard(participant: Player | Dealer): Card {
    if (this.shoe.length === 0) {
      throw new Error("No more cards in the shoe!");
    }

    const card = this.shoe.pop()!;
    participant.addCard(card);
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

  getPlayerHand(): Deck {
    return this.player.getHand();
  }

  getDealerHand(): Deck {
    return this.dealer.getHand();
  }

  // Method to handle the player's turn
  public async playPlayerTurn(): Promise<void> {
    let action: Action;
    while (!this.player.isBusted()) {
      action = await waitForPlayerAction();
      console.log(this.player.getHand());
      if (action === Action.HIT) {
        this.dealCard(this.player);
      }
      if (action === Action.STAND) {
        break;
      }
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

    if (!hitButton || !standButton) {
      resolve(Action.STAND);
      return;
    }

    const handleClick = (action: Action) => {
      resolve(action);
      hitButton.removeEventListener("click", handleHitClick);
      standButton.removeEventListener("click", handleStandClick);
    };

    const handleHitClick = () => handleClick(Action.HIT);
    const handleStandClick = () => handleClick(Action.STAND);

    hitButton.addEventListener("click", handleHitClick);
    standButton.addEventListener("click", handleStandClick);
  });
};

class Participant {
  protected hand: Deck = [];

  addCard(card: Card): void {
    this.hand.push(card);
  }

  getHand(): Deck {
    return this.hand;
  }

  getValue(): number {
    return calculateHandValue(this.hand);
  }

  checkIfNatural(): Boolean {
    return this.getValue() === 21 && this.hand.length === 2;
  }

  isBusted(): Boolean {
    return this.getValue() > 21;
  }

  toss(): void {
    this.hand = [];
  }
}

class Player extends Participant {}

class Dealer extends Participant {
  private isFirstCardRevealed: boolean = false;

  revealHiddenCard() {
    this.isFirstCardRevealed = true;
  }

  getHand(): Deck {
    let hand = this.hand.slice();
    if (!this.isFirstCardRevealed && hand.length != 0) {
      hand[0] = hiddenCard;
    }
    return hand;
  }

  toss(): void {
    this.hand = [];
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
