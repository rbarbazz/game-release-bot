interface SearchResult {
  id: number;
  name: string;
  released: string;
  tba: boolean;
}

interface GameDetail extends SearchResult {
  description_raw: string;
  slug: string;
}
