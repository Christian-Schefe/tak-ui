import { useState } from 'react';
import { ui, type Coord, type PieceVariant } from '../../packages/tak-core/';
import { coordToString } from '../../packages/tak-core/coord';
import { Tile } from './Tile';
import { Piece } from './Piece';
import type { BoardProps } from '../board';
import { useSettings } from '../../settings';
import { VariantSelector } from './VariantSelector';
import { PlayerInfoBar } from './PlayerInfoBar';

export function Board2D({
  game,
  setGame,
  playerInfo,
  interactive,
}: BoardProps) {
  const [variant, setVariant] = useState<PieceVariant>('flat');
  const { themeParams } = useSettings();

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
    setGame((draft) => {
      ui.tryPlaceOrAddToPartialMove(draft, pos, variant);
    });
  };

  const onTimeout = () => {
    setGame((draft) => {
      ui.checkTimeout(draft);
    });
  };

  return (
    <div
      className="w-full grow flex flex-col"
      style={{ backgroundColor: themeParams.background }}
    >
      <div className="w-full max-w-4xl mx-auto">
        <PlayerInfoBar
          player="white"
          username={playerInfo['white'].username}
          rating={playerInfo['white'].rating}
          game={game}
          onTimeout={onTimeout}
        />
        <div
          className="grid relative select-none touch-none justify-start items-start w-full aspect-square"
          style={{
            gridTemplateColumns: `repeat(${size.toString()}, 1fr)`,
            gridTemplateRows: `repeat(${size.toString()}, 1fr)`,
          }}
        >
          {tileCoords.map((pos) => (
            <Tile
              key={coordToString(pos)}
              pos={pos}
              game={game}
              interactive={interactive}
              onClick={() => {
                onClickTile(pos);
              }}
            />
          ))}
          {pieceIds.map((id) => (
            <Piece key={id} id={id} game={game} />
          ))}
        </div>
        <PlayerInfoBar
          player="black"
          username={playerInfo['black'].username}
          rating={playerInfo['black'].rating}
          game={game}
          onTimeout={onTimeout}
        />
        {interactive && (
          <VariantSelector
            game={game}
            player={game.actualGame.currentPlayer}
            variant={variant}
            setVariant={setVariant}
          />
        )}
      </div>
    </div>
  );
}
