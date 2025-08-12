import { doMove, newGame } from './game';
import * as readline from 'node:readline';
import { moveFromString } from './move';
import { toPositionString } from './board';

const game = newGame(5, 2);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> ',
});

rl.prompt();

rl.on('line', (input) => {
  try {
    const move = moveFromString(input);
    doMove(game, move);
    console.log(toPositionString(game.board));
  } catch (error) {
    console.error('Error', error);
  }
  rl.prompt();
}).on('close', () => {
  console.log('Exiting...');
  process.exit(0);
});
