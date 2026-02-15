export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')    // Remove all non-word chars
    .replace(/--+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')        // Trim - from start of text
    .replace(/-+$/, '');       // Trim - from end of text
};

export const generateUniqueSlug = async (
  title: string,
  model: any,
  idField: string = 'id'
): Promise<string> => {
  let slug = slugify(title);
  let uniqueSlug = slug;
  let counter = 1;

  while (true) {
    const existing = await model.findUnique({ where: { slug: uniqueSlug } });
    if (!existing) break;
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
};
