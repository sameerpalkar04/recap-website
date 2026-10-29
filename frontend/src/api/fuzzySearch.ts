import type { TVShow } from './tmdb';

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function editDistance(left: string, right: string): number {
  const rows = left.length + 1;
  const columns = right.length + 1;
  const matrix = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => row === 0 ? column : column === 0 ? row : 0),
  );

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + substitutionCost,
      );

      if (row > 1 && column > 1 && left[row - 1] === right[column - 2] && left[row - 2] === right[column - 1]) {
        matrix[row][column] = Math.min(matrix[row][column], matrix[row - 2][column - 2] + 1);
      }
    }
  }

  return matrix[left.length][right.length];
}

function similarity(left: string, right: string): number {
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.94;
  return 1 - editDistance(left, right) / Math.max(left.length, right.length);
}

function scoreTitle(query: string, title: string): number {
  const normalizedQuery = normalize(query);
  const normalizedTitle = normalize(title);
  if (!normalizedQuery || !normalizedTitle) return 0;
  if (normalizedTitle === normalizedQuery) return 1;
  if (normalizedTitle.includes(normalizedQuery)) return 0.98;

  const queryWords = normalizedQuery.split(' ');
  const titleWords = normalizedTitle.split(' ');
  const wordScores = queryWords.map((word) => Math.max(...titleWords.map((titleWord) => similarity(word, titleWord))));
  const averageWordScore = wordScores.reduce((sum, score) => sum + score, 0) / wordScores.length;
  const matchedWords = wordScores.filter((score) => score >= 0.65).length / queryWords.length;
  const wholeTitleScore = similarity(normalizedQuery, normalizedTitle);

  return Math.max(wholeTitleScore, averageWordScore * 0.7 + matchedWords * 0.3);
}

export function rankShowsFuzzily(query: string, shows: TVShow[], minimumScore = 0): TVShow[] {
  return shows
    .map((show, index) => ({ show, index, score: scoreTitle(query, show.name) }))
    .filter((entry) => entry.score >= minimumScore)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ show }) => show);
}
