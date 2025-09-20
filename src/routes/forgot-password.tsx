import { createFileRoute } from '@tanstack/react-router';
import { MainPage } from '.';

export const Route = createFileRoute('/forgot-password')({
  component: RouteComponent,
});

function RouteComponent() {
  return <MainPage mode={{ type: 'forgotPassword' }} />;
}
