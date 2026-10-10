/** Clear only Matchdesk's known cache; keep other browser storage intact. */
export function clearWorkspaceCache(storage) {
  for (const key of ["matchdesk-workspace-v1", "matchdesk-workspace-v2"]) {
    try { storage?.removeItem(key); } catch { /* private browsing may deny storage */ }
  }
}
