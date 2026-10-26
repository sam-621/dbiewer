import { WorkspaceAlreadyExistsError } from '@/errors/workspace-errors';
import type { UowContext } from '@/persistence/unit-of-work';
import { slugify } from '@/shared/utils/slugify';

type CreateWorkspaceForUserInput = {
  ownerUserId: string;
  name: string;
};

const SLUG_SUFFIX_LENGTH = 6;

export class WorkspaceForUserCreator {
  constructor(private readonly ctx: UowContext) {}

  async execute(input: CreateWorkspaceForUserInput) {
    const existing = await this.ctx.repositories.workspace.findByOwnerUserId(input.ownerUserId);

    if (existing) throw new WorkspaceAlreadyExistsError(input.ownerUserId);

    const slug = await this.getAvailableSlug(input.name);

    return this.ctx.repositories.workspace.create({ ...input, slug });
  }

  private async getAvailableSlug(name: string) {
    const slug = slugify(name);
    const isTaken = await this.ctx.repositories.workspace.existsBySlug(slug);

    return isTaken ? `${slug}-${this.getSlugSuffix()}` : slug;
  }

  private getSlugSuffix() {
    return crypto.randomUUID().replace(/-/g, '').slice(0, SLUG_SUFFIX_LENGTH);
  }
}
