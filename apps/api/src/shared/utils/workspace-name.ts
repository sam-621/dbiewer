export type WorkspaceOwner = {
  id: string;
  name: string;
};

export const getInitialWorkspaceName = (userName: string) => {
  const name = userName.trim();

  return name ? `${name}'s workspace` : 'My workspace';
};

export const getInitialWorkspaceValues = (user: WorkspaceOwner) => ({
  ownerUserId: user.id,
  name: getInitialWorkspaceName(user.name)
});
