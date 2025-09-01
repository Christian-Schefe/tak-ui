import { createFileRoute } from '@tanstack/react-router';
import { MainPage } from '.';

export const Route = createFileRoute('/register')({
  component: RouteComponent,
});

function RouteComponent() {
  return <MainPage register />;
}
