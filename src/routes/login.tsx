import { createFileRoute, redirect } from '@tanstack/react-router';
import { MainPage } from '.';

export const Route = createFileRoute('/login')({
  validateSearch: (search) => ({
    redirect: (search.redirect as string) || '/',
  }),
  beforeLoad: ({ context, search }) => {
    // Redirect if already authenticated
    if (context.auth.isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: search.redirect });
    }
  },
  component: LoginComponent,
});

function LoginComponent() {
  const { redirect } = Route.useSearch();

  return <MainPage mode={{ type: 'login', redirect }} />;
}
