import { useState } from 'react';
import { ui, type Coord, type PieceVariant } from '../../packages/tak-core/';
import { coordToString } from '../../packages/tak-core/coord';
import { Tile } from './Tile';
import { Piece } from './Piece';
import type { BoardProps } from '../board';

export function Board2D({
  game,
  setGame,
  playerInfo,
  interactive,
}: BoardProps) {
  const [variant, setVariant] = useState<PieceVariant>('flat');

  const size = ui.boardSize(game);
  const tileCoords = [];
  const pieceIds = Array.from(game.pieces.keys());
  pieceIds.sort((a, b) => a - b);

  for (let y = size - 1; y >= 0; y--) {
    for (let x = 0; x < size; x++) {
      tileCoords.push({ x, y });
    }
  }

  const onClickTile = (pos: Coord) => {
    if (!interactive) return;
    setGame((draft) => ui.tryPlaceOrAddToPartialMove(draft, pos, variant));
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="w-full flex p-2 gap-2 justify-between">
        <div className="flex gap-2">
          <p
            className={`font-bold ${game.actualGame.currentPlayer === 'white' ? 'text-primary-500' : ''}`}
          >
            {playerInfo['white']?.username}
          </p>{' '}
          ({playerInfo['white']?.rating})
        </div>
        <div className="flex gap-2">
          <p
            className={`font-bold ${game.actualGame.currentPlayer === 'black' ? 'text-primary-500' : ''}`}
          >
            {playerInfo['black']?.username}
          </p>{' '}
          ({playerInfo['black']?.rating})
        </div>
      </div>
      <div
        className="grid relative select-none touch-none justify-start items-start w-full aspect-square"
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
            interactive={interactive}
            onClick={() => onClickTile(pos)}
          />
        ))}
        {pieceIds.map((id) => (
          <Piece key={id} id={id} game={game} />
        ))}
      </div>
      {interactive && (
        <div className="w-full flex p-2 gap-2">
          <button
            className={`grow w-0 bg-surface-500 hover:bg-surface-550 active:bg-surface-600 p-2 rounded-md outline-primary-500 ${variant === 'flat' ? 'outline-2' : ''}`}
            onClick={() => setVariant('flat')}
          >
            Flat
          </button>
          <button
            className={`grow w-0 bg-surface-500 hover:bg-surface-550 active:bg-surface-600 p-2 rounded-md outline-primary-500 ${variant === 'standing' ? 'outline-2' : ''}`}
            onClick={() => setVariant('standing')}
          >
            Wall
          </button>
          <button
            className={`grow w-0 bg-surface-500 hover:bg-surface-550 active:bg-surface-600 p-2 rounded-md outline-primary-500 ${variant === 'capstone' ? 'outline-2' : ''}`}
            onClick={() => setVariant('capstone')}
          >
            Capstone
          </button>
        </div>
      )}
    </div>
  );
}
