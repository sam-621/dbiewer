import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useCreateWorkspace } from '@/lib/workspace/hooks/use-create-workspace';

import { useUpdateUserProfile } from '../../hooks/use-update-user-profile';

const WORKSPACE_NAME = 'My workspace';

export const useOnboardingForm = () => {
  const navigate = useNavigate();
  const { updateUserProfile, isLoading: isUpdatingProfile } = useUpdateUserProfile();
  const { createWorkspace, isLoading: isCreatingWorkspace } = useCreateWorkspace();

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { name: '' }
  });

  const onSubmit = async ({ name }: FormValues) => {
    const profileResult = await updateUserProfile({ name });
    if (!profileResult.isSuccess) return form.setError('root', { message: profileResult.error });

    const workspaceResult = await createWorkspace({ name: WORKSPACE_NAME });
    if (!workspaceResult.isSuccess) {
      return form.setError('root', { message: workspaceResult.error });
    }

    await navigate('/', { replace: true });
  };

  return {
    form,
    isLoading: isUpdatingProfile || isCreatingWorkspace,
    onSubmit: form.handleSubmit(onSubmit)
  };
};

const Schema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(50, 'Name must be 50 characters or less')
});

type FormValues = z.infer<typeof Schema>;
