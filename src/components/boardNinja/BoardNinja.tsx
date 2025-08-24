import { useCallback, useEffect, useRef, useState } from 'react';
import type { BoardProps } from '../board';
import { moveFromString, moveToString } from '../../packages/tak-core/move';
import { useSettings } from '../../settings';
import { useEvent, useUpdate } from 'react-use';
import z from 'zod';

const NinjaMessageSchema = z.object({
  action: z.string(),
  value: z.any(),
});

const params =
  '&moveNumber=false&unplayedPieces=true&disableStoneCycling=true&showBoardPrefsBtn=false&disableNavigation=true&disablePTN=true&disableText=true&flatCounts=false&turnIndicator=false&showHeader=false&showEval=false&showRoads=false&stackCounts=false&notifyGame=false';
export function BoardNinja({ game, mode, onMakeMove, playerInfo }: BoardProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);
  const update = useUpdate();
  const setRef = (ref: HTMLIFrameElement | null) => {
    if (iframeRef.current !== null) return;
    iframeRef.current = ref;
    setIframe(ref);
    update();
  };

  const sendMessageToIframe = useCallback(
    (message: { action: string; value: unknown }) => {
      iframe?.contentWindow?.postMessage(message, '*');
    },
    [iframe],
  );

  const [plyIndex, setPlyIndex] = useState<number>(0);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  const {
    boardSettings: { boardNinja: ninjaSettings },
  } = useSettings();

  useEffect(() => {
    if (!hasLoaded) return;
    if (mode.type !== 'remote') return;
    sendMessageToIframe({
      action: 'SET_PLAYER',
      value: mode.localPlayer === 'white' ? 1 : 2,
    });
  }, [hasLoaded, sendMessageToIframe, mode]);

  useEffect(() => {
    if (!hasLoaded) return;
    sendMessageToIframe({
      action: 'SET_UI',
      value: {
        theme: ninjaSettings.colorTheme,
        axisLabels: ninjaSettings.axisLabels !== 'none',
        axisLabelsSmall: ninjaSettings.axisLabels === 'small',
      },
    });
  }, [
    hasLoaded,
    sendMessageToIframe,
    ninjaSettings.colorTheme,
    ninjaSettings.axisLabels,
  ]);

  const gameSettings = game.actualGame.settings;

  const onMessage = useCallback(
    (event: Event) => {
      if (event instanceof MessageEvent) {
        const parsed = NinjaMessageSchema.safeParse(event.data);
        if (!parsed.success) return;
        if (parsed.data.action === 'INSERT_PLY') {
          console.log('Move:', parsed.data.value);
          setPlyIndex((index) => index + 1);
          onMakeMove(moveFromString(parsed.data.value as string));
        } else if (parsed.data.action === 'GAME_STATE') {
          setHasLoaded(true);
        }
      }
    },
    [onMakeMove],
  );

  useEvent('message', onMessage, window);

  useEffect(() => {
    if (!hasLoaded) return;
    if (plyIndex === 0) {
      sendMessageToIframe({
        action: 'SET_CURRENT_PTN',
        value: `[Size "${gameSettings.boardSize.toString()}"][Komi "${(gameSettings.halfKomi / 2).toString()}"][Flats "${gameSettings.reserve.pieces.toString()}"][Caps "${gameSettings.reserve.capstones.toString()}"]`,
      });
    }
    if (plyIndex < game.actualGame.history.length) {
      for (let i = plyIndex; i < game.actualGame.history.length; i++) {
        console.log(
          'sending move to ninja:',
          moveToString(game.actualGame.history[i]),
        );
        sendMessageToIframe({
          action: 'APPEND_PLY',
          value: moveToString(game.actualGame.history[i]),
        });
      }
      setPlyIndex(game.actualGame.history.length);
    }
    if (plyIndex > game.actualGame.history.length) {
      setPlyIndex(0);
    }
  }, [hasLoaded, plyIndex, gameSettings, game, sendMessageToIframe]);

  return (
    <div className="w-full grow flex items-stretch">
      <div className="w-48">
        <p>{playerInfo.white.username}</p>
        <p>{playerInfo.black.username}</p>
      </div>
      <div className="grow flex flex-col">
        <iframe
          ref={setRef}
          className="w-full grow"
          src={`https://ptn.ninja/${params}${mode.type === 'spectator' ? '&disableBoard=true' : ''}`}
          title="Board Ninja"
        />
      </div>
    </div>
  );
}
