import type { PieceVariant } from '../../packages/tak-core';
import { useSettings } from '../../settings';

export function VariantSelector({
  variant,
  setVariant,
}: {
  variant: PieceVariant;
  setVariant: (variant: PieceVariant) => void;
}) {
  const { themeParams } = useSettings();

  const pieceVariants: PieceVariant[] = ['flat', 'standing', 'capstone'];

  return (
    <div className="w-full flex p-2 gap-2">
      {pieceVariants.map((v) => (
        <button
          key={v}
          className="relative grow w-0 h-12 rounded-md"
          onClick={() => {
            setVariant(v);
          }}
          style={{ backgroundColor: themeParams.board1 }}
        >
          <div
            style={{
              backgroundColor: themeParams.hover,
              transition: 'opacity 150ms ease-in-out',
            }}
            className="absolute inset-0 rounded-md opacity-0 hover:opacity-100"
          ></div>
          <div
            className="absolute inset-0 rounded-md pointer-events-none"
            style={{
              backgroundColor: themeParams.highlight,
              opacity: variant === v ? 1 : 0,
              transition: 'opacity 150ms ease-in-out',
            }}
          ></div>
          <p className="absolute flex items-center justify-center inset-0 pointer-events-none">
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </p>
        </button>
      ))}
    </div>
  );
}
