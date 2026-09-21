export function includesService(selected, service) {
  return selected.includes('Full journey') || selected.includes(service);
}
export function briefEntries(entries) {
  const result = new Map();
  for (const [key, value] of entries) {
    if (key.startsWith('_') || key === 'message' || !String(value).trim()) continue;
    result.set(key, result.has(key) ? `${result.get(key)}, ${value}` : String(value));
  }
  return [...result];
}
export function briefSummary(entries) {
  return briefEntries(entries).map(([key, value]) => `${key}:\n${value}`).join('\n\n');
}
