import type { UowContext } from '@/persistence/unit-of-work';
import { slugify } from '@/shared/utils/slugify';

type WorkspaceOwner = {
  id: string;
  name: string;
};

const SLUG_SUFFIX_LENGTH = 6;

export class WorkspaceForUserCreator {
  constructor(private readonly ctx: UowContext) {}

  async execute(user: WorkspaceOwner) {
    const name = this.getInitialName(user.name);
    const slug = await this.getAvailableSlug(name);

    return this.ctx.repositories.workspace.create({ ownerUserId: user.id, name, slug });
  }

  private async getAvailableSlug(name: string) {
    const slug = slugify(name);
    const isTaken = await this.ctx.repositories.workspace.existsBySlug(slug);

    return isTaken ? `${slug}-${this.getSlugSuffix()}` : slug;
  }

  private getInitialName(userName: string) {
    const name = userName.trim();

    return name ? `${name}'s workspace` : 'My workspace';
  }

  private getSlugSuffix() {
    return crypto.randomUUID().replace(/-/g, '').slice(0, SLUG_SUFFIX_LENGTH);
  }
}
