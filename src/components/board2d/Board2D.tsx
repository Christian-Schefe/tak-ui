import { useEffect, useState } from 'react';
import { ui, type Move, type Player } from '../../packages/tak-core/';
import { coordToString } from '../../packages/tak-core/coord';
import { Tile } from './Tile';
import { Piece } from './Piece';
import type { GameUI } from '../../packages/tak-core/ui';

export function Board2D({
  game,
  interactive,
  onMove,
}: {
  game: GameUI;
  interactive: boolean;
  onMove?: (player: Player, move: Move) => void;
}) {
  const [_updateTrigger, setUpdateTrigger] = useState<number>(0);

  useEffect(() => {
    game.onUpdate = () => {
      setUpdateTrigger((prev) => prev + 1);
    };
    game.onMove = onMove;
  }, [game]);

  const size = ui.boardSize(game);
  const tileCoords = [];
  const pieceIds = Array.from(game.pieces.keys());
  pieceIds.sort((a, b) => a - b);

  for (let y = size - 1; y >= 0; y--) {
    for (let x = 0; x < size; x++) {
      tileCoords.push({ x, y });
    }
  }

  return (
    <div
      className="grid relative select-none touch-none justify-start items-start w-full aspect-square max-w-4xl mx-auto"
      style={{
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gridTemplateRows: `repeat(${size}, 1fr)`,
      }}
    >
      {tileCoords.map((pos) => (
        <Tile
          key={coordToString(pos)}
          pos={pos}
          game={game}
          onClick={() => {
            if (!interactive) return;
            ui.tryPlaceOrAddToPartialMove(game, pos, 'flat');
          }}
        />
      ))}
      {pieceIds.map((id) => (
        <Piece key={id} id={id} game={game} />
      ))}
    </div>
  );
}
