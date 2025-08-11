import { createFileRoute } from '@tanstack/react-router';
import { BabylonApp } from '../components/BabylonApp';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <BabylonApp />
    </div>
  );
}
