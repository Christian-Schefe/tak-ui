import { ui } from '../../packages/tak-core';
import type { GameUI } from '../../packages/tak-core/ui';

export function Piece({ id, game }: { id: number; game: GameUI }) {
  const size = ui.boardSize(game);
  const data = game.pieces.get(id)!;
  const height = data.isFloating ? data.height + 2 : data.height;
  const isWhite = data.player === 'white';

  const animationSetting = '150ms ease-in-out';

  const whiteColor = 'bg-gray-100';
  const blackColor = 'bg-gray-600';
  const whiteOutline = 'outline-gray-600';
  const blackOutline = 'outline-gray-100';

  const radiusStr =
    data.variant === 'standing'
      ? '10% 25%'
      : data.variant === 'capstone'
        ? '100%'
        : '10%';

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: `${100 / size}%`,
        height: `${100 / size}%`,
        transform: `translate(${data.pos.x * 100}%, ${(size - 1 - data.pos.y) * 100 - height * 7}%)`,
        zIndex: height,
        transition: `transform ${animationSetting}`,
      }}
    >
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          animation: 'scaleIn 150ms ease-out forwards',
        }}
      >
        <div
          className={`${isWhite ? whiteColor : blackColor} outline ${isWhite ? whiteOutline : blackOutline}`}
          style={{
            width: '50%',
            height: data.variant === 'standing' ? '20%' : '50%',
            borderBottomLeftRadius: radiusStr,
            borderBottomRightRadius: radiusStr,
            borderTopLeftRadius: radiusStr,
            borderTopRightRadius: radiusStr,
            transform: data.variant === 'standing' ? 'rotate(-45deg)' : '',
            transition: `width ${animationSetting}, height ${animationSetting}, transform ${animationSetting}`,
          }}
        ></div>
      </div>
    </div>
  );
}
