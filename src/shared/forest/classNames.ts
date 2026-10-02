/** Joins the class names that are set: a component's own class plus the caller's `className`. */
export function classNames(...names: (string | false | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}
