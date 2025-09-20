import { createFileRoute } from '@tanstack/react-router';
import { MainPage } from '.';

export const Route = createFileRoute('/reset-password')({
  component: RouteComponent,
});

function RouteComponent() {
  return <MainPage mode={{ type: 'resetPassword' }} />;
}
