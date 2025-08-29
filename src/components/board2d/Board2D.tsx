import { useCallback, useState } from 'react';
import { ui, type Coord, type PieceVariant } from '../../packages/tak-core/';
import { coordToString } from '../../packages/tak-core/coord';
import { Tile } from './Tile';
import { Piece } from './Piece';
import type { BoardProps } from '../board';
import { useSettings } from '../../settings';
import { VariantSelector } from './VariantSelector';
import { PlayerInfoBar } from './PlayerInfoBar';
import { History } from './History';

export function Board2D({
  game,
  playerInfo,
  callbacks,
  mode,
  hasDrawOffer,
  hasUndoOffer,
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

  const areTilesInteractive =
    ((mode.type === 'remote' &&
      game.actualGame.currentPlayer === mode.localPlayer) ||
      mode.type === 'local') &&
    game.actualGame.gameState.type === 'ongoing';

  const onTimeout = useCallback(() => {
    callbacks.current.onTimeout();
  }, [callbacks]);

  const onClickTile = useCallback(
    (pos: Coord) => {
      callbacks.current.onClickTile(pos, variant);
    },
    [callbacks, variant],
  );

  return (
    <div
      className="w-full grow flex flex-col lg:justify-center"
      style={{ backgroundColor: themeParams.background }}
    >
      <div className="w-full flex flex-col max-w-4xl lg:max-w-6xl mx-auto lg:flex-row lg:items-center">
        <div className="grow">
          <PlayerInfoBar
            player="white"
            username={playerInfo.white.username}
            rating={playerInfo.white.rating}
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
                interactive={areTilesInteractive}
                onClick={onClickTile}
              />
            ))}
            {pieceIds.map((id) => (
              <Piece key={id} id={id} game={game} />
            ))}
          </div>
          {mode.type !== 'spectator' && (
            <VariantSelector
              variant={variant}
              setVariant={setVariant}
              game={game}
              player={
                mode.type === 'local'
                  ? game.actualGame.currentPlayer
                  : mode.localPlayer
              }
            />
          )}
          <PlayerInfoBar
            player="black"
            username={playerInfo.black.username}
            rating={playerInfo.black.rating}
            game={game}
            onTimeout={onTimeout}
          />
        </div>
        <History
          game={game}
          hasDrawOffer={hasDrawOffer}
          hasUndoOffer={hasUndoOffer}
          callbacks={callbacks}
          mode={mode}
        />
      </div>
    </div>
  );
}
