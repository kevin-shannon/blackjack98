import "./PlayerHand.css";
import "98.css";
import { Deck } from "../../enums";
import PlayingCard from "./PlayingCard";

interface PlayerHandProps {
  hand: Deck[];
}

const PlayerHand = ({ hand }: PlayerHandProps) => {
  return (
    <div className="player-hands">
      {hand.map((hand, handIndex) => {
        const handOffset = handIndex * -100;
        return (
          <div className="player-hand" key={handIndex} style={{ transform: `translateX(${handOffset}px)`, marginBottom: "20px" }}>
            {hand.map((card, index) => {
              const xOffset = index * 20;
              const yOffset = index * -20;
              return (
                <PlayingCard
                  key={index}
                  card={card}
                  isFaceUp={true}
                  style={{
                    transform: `translate(${xOffset}px, ${card.isDoubled ? yOffset + 71 : yOffset}px) ${card.isDoubled ? "rotate(270deg)" : ""}`,
                    transformOrigin: card.isDoubled ? "0% 0%" : "50% 50%",
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default PlayerHand;
