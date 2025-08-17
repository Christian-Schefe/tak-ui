import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  useGameData,
  type GameListEntry,
  type SeekEntry,
} from '../../gameData';
import { useRatings } from '../../api/ratings';
import { useMemo } from 'react';
import { useWSAPI } from '../../auth';

export const Route = createFileRoute('/_authenticated/seeks')({
  component: RouteComponent,
});

function getDefaultPieces(
  boardSize: number,
): { pieces: number; capstones: number } | null {
  if (boardSize === 5) return { pieces: 21, capstones: 1 };
  if (boardSize === 6) return { pieces: 30, capstones: 1 };
  if (boardSize === 7) return { pieces: 40, capstones: 2 };
  return null;
}

function RouteComponent() {
  const { seeks, games } = useGameData();
  const nav = useNavigate();
  const { sendMessage } = useWSAPI();

  const tagClass = 'rounded-full bg-surface-600 px-2';

  function hasDefaultPieceCount(seekOrGame: SeekEntry | GameListEntry) {
    const defaultPieces = getDefaultPieces(seekOrGame.boardSize);
    return (
      defaultPieces &&
      defaultPieces.pieces === seekOrGame.pieces &&
      defaultPieces.capstones === seekOrGame.capstones
    );
  }
  const players = useMemo(() => {
    const playerArr = seeks
      .map((seek) => seek.creator)
      .concat(games.flatMap((game) => [game.white, game.black]));
    return playerArr.filter((p, i) => playerArr.indexOf(p) === i);
  }, [seeks, games]);

  const ratings = useRatings(players);
  const ratingByName = Object.fromEntries(
    ratings.data.flatMap((data) => (data ? [[data.name, data.rating]] : [])),
  );

  const onClickSpectate = (gameId: number) => {
    nav({
      to: '/spectate/$gameId',
      params: { gameId: gameId.toString() },
    });
  };

  const onClickJoin = (seekId: number) => {
    sendMessage(`Accept ${seekId}`);
    nav({ to: '/play' });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-2 w-full max-w-4xl mx-auto p-2">
      <div className="flex grow lg:w-0 flex-col items-stretch gap-2">
        <h1 className="text-lg font-semibold text-center">Seeks</h1>
        {seeks.map((seek) => (
          <div
            key={seek.id}
            className="flex p-2 rounded-lg bg-surface-500 items-center"
          >
            <div className="flex grow flex-col gap-1">
              <p className="min-w-36">
                <strong>{seek.creator}</strong> (
                {ratingByName[seek.creator] ?? '???'})
              </p>
              <div className="flex gap-2">
                <p className={tagClass}>
                  {seek.boardSize}x{seek.boardSize}
                </p>
                <p className={tagClass}>
                  {seek.timeContingent / 60}|{seek.timeIncrement}
                </p>
                {seek.komi !== 0 && (
                  <p className={tagClass}>Komi: {seek.komi / 2}</p>
                )}
                {!hasDefaultPieceCount(seek) && (
                  <p className={tagClass}>
                    {seek.pieces}/{seek.capstones}
                  </p>
                )}
              </div>
            </div>
            <button
              className="bg-primary-500 text-primary-text px-4 p-2 rounded-md h-10 min-w-16 hover:bg-primary-550 active:bg-primary-600"
              onClick={() => onClickJoin(seek.id)}
            >
              Join
            </button>
          </div>
        ))}
      </div>
      <div className="flex grow lg:w-0 flex-col items-stretch gap-2">
        <h1 className="text-lg font-semibold text-center">Games</h1>
        {games.map((game) => (
          <div
            key={game.id}
            className="flex p-2 rounded-lg bg-surface-500 items-center"
          >
            <div className="flex grow flex-col gap-1">
              <p className="min-w-36">
                <strong>{game.white}</strong> (
                {ratingByName[game.white] ?? '???'}) vs{' '}
                <strong>{game.black}</strong> (
                {ratingByName[game.black] ?? '???'})
              </p>
              <div className="flex gap-2">
                <p className={tagClass}>
                  {game.boardSize}x{game.boardSize}
                </p>
                <p className={tagClass}>
                  {game.timeContingent / 60}|{game.timeIncrement}
                </p>
                {game.komi !== 0 && (
                  <p className={tagClass}>Komi: {game.komi / 2}</p>
                )}
                {!hasDefaultPieceCount(game) && (
                  <p className={tagClass}>
                    {game.pieces}/{game.capstones}
                  </p>
                )}
              </div>
            </div>
            <button
              className="bg-primary-500 text-primary-text px-4 p-2 rounded-md h-10 min-w-16 hover:bg-primary-550 active:bg-primary-600"
              onClick={() => onClickSpectate(game.id)}
            >
              Spectate
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
