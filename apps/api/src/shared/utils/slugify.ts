import slugifyLibrary from 'slugify';

export const slugify = (text: string) =>
  slugifyLibrary(text.replace(/['’]/g, ''), { lower: true, strict: true, trim: true });
