export interface SavedRecap {
  id: string;
  show: string;
  seasonNo: number;
  episodeNo: number;
  summary: string;
  generatedAt: string;
}

async function recapRequest(path: string, init?: RequestInit) {
  const response = await fetch(path, { ...init, credentials: 'include', headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not load your recaps.');
  return data;
}

export async function getSavedRecaps(): Promise<SavedRecap[]> {
  const data = await recapRequest('/api/recaps/history');
  return data.recaps as SavedRecap[];
}

export async function deleteRecap(id: string): Promise<void> {
  await recapRequest(`/api/recaps/history/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
