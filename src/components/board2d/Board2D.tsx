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
import { usePieceIds } from '../../packages/tak-core/hooks';
import { Chat } from './Chat';
import { useEvent } from 'react-use';

export function Board2D({ game, playerInfo, callbacks, mode }: BoardProps) {
  const [variant, setVariant] = useState<PieceVariant>('flat');
  const { themeParams } = useSettings();

  const size = ui.boardSize(game);
  const tileCoords = [];
  const pieceIds = usePieceIds(game);

  for (let y = size - 1; y >= 0; y--) {
    for (let x = 0; x < size; x++) {
      tileCoords.push({ x, y });
    }
  }

  const areTilesInteractive =
    ((mode.type === 'remote' &&
      game.actualGame.currentPlayer === mode.localPlayer) ||
      (mode.type === 'local' && !mode.review)) &&
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

  useEvent('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      callbacks.current.onDeselect();
    }
  });

  return (
    <div
      className="w-full grow flex lg:justify-center"
      style={{ backgroundColor: themeParams.background }}
    >
      <div className="w-full flex flex-col mx-auto lg:flex-row items-center mt-12 lg:mt-0 justify-center lg:p-2">
        <div className="w-full lg:w-fit h-full flex flex-col justify-center">
          <History game={game} callbacks={callbacks} mode={mode} />
        </div>
        <div
          className="w-full lg:grow lg:w-0"
          style={{ maxWidth: 'calc(100dvh - 250px)' }}
        >
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
          {mode.type !== 'spectator' &&
            (mode.type !== 'local' || !mode.review) && (
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
        <Chat gameId={mode.type === 'local' ? undefined : mode.gameId} />
      </div>
    </div>
  );
}
