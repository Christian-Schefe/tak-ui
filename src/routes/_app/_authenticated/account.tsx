import { Button, Group, PasswordInput, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '../../../authHooks';

export const Route = createFileRoute('/_app/_authenticated/account')({
  component: RouteComponent,
});

function RouteComponent() {
  const { changePassword } = useAuth();

  const changePasswordForm = useForm({
    initialValues: {
      oldPassword: '',
      newPassword: '',
      retypePassword: '',
    },
    validate: {
      retypePassword: (value, values) =>
        value !== values.newPassword ? 'Passwords did not match' : null,
      oldPassword: (value) => (!value ? 'Old Password cannot be empty' : null),
      newPassword: (value) => (!value ? 'New Password cannot be empty' : null),
    },
  });
  return (
    <div className="w-full flex flex-col items-center">
      <h1 className="mt-4 font-bold text-lg">Change Password</h1>
      <form
        className="w-full max-w-sm"
        onSubmit={changePasswordForm.onSubmit((values) => {
          changePassword(values.oldPassword, values.newPassword);
          changePasswordForm.reset();
        })}
      >
        <Stack w="100%" p="md">
          <PasswordInput
            placeholder="Old Password"
            label="Old Password"
            key="oldPassword"
            autoComplete="current-password"
            {...changePasswordForm.getInputProps('oldPassword')}
          />
          <PasswordInput
            placeholder="New Password"
            label="New Password"
            key="newPassword"
            autoComplete="new-password"
            {...changePasswordForm.getInputProps('newPassword')}
          />
          <PasswordInput
            placeholder="Confirm New Password"
            label="Confirm New Password"
            key="retypePassword"
            autoComplete="new-password"
            {...changePasswordForm.getInputProps('retypePassword')}
          />
          <Group justify="end">
            <Button type="submit">Change Password</Button>
          </Group>
        </Stack>
      </form>
    </div>
  );
}
