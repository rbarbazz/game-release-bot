import fetch from 'node-fetch';

const apiUrl = 'https://api.rawg.io/api/games';

export const searchGames = async (gameTitle: string) => {
  const response = await fetch(`${apiUrl}?search=${gameTitle}&page_size=10`);
  const data: { results: SearchResult[] } = await response.json();
  const { results } = data;

  if (results.length > 0) {
    return results;
  } else {
    return [];
  }
};

export const getGameDetails = async (gameId: number) => {
  const response = await fetch(`${apiUrl}/${gameId}`);
  const data: GameDetail = await response.json();

  return data;
};
