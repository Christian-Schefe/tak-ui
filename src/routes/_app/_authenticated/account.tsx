import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_authenticated/account')({
  component: DashboardComponent,
});

function DashboardComponent() {
  const { auth } = Route.useRouteContext();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Account</h1>
        <button
          onClick={auth.logout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>

      <div className="bg-surface-500 p-6 rounded-lg">
        <p>
          Hello, <strong>{auth.user?.username}</strong>! You are successfully
          authenticated.
        </p>
      </div>
    </div>
  );
}
