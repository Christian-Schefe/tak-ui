import { createFileRoute } from '@tanstack/react-router';
import { ObservedGame } from '../../components/ObservedGame';

export const Route = createFileRoute('/_authenticated/spectate/$gameId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { gameId } = Route.useParams();
  return <ObservedGame gameId={gameId} />;
}
