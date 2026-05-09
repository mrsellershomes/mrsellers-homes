export function toSlug(name) {
  return name.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function toPageSlug(name) {
  return `${toSlug(name)}-real-estate`;
}

export function toUrlPath(name) {
  return `/${toPageSlug(name)}/`;
}
