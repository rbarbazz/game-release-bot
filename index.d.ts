interface SearchResult {
  id: number;
  name: string;
  released: string;
  background_image: string;
}

interface GameDetail extends SearchResult {
  description: string;
}
