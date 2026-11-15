export function getUserInitial(...names: unknown[]): string {
  const name = names.find(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );

  return name ? Array.from(name.trim())[0].toUpperCase() : "?";
}
