//  Common
interface BaseGameDetails {
  name: string;
  released?: string;
  tba: boolean;
}

// API response models
interface GameSearchResult extends BaseGameDetails {
  id: number;
}
interface GameDetail extends GameSearchResult {
  description_raw: string;
  slug: string;
}

// DB models
interface GameEntry extends BaseGameDetails {
  gameId: number;
}
interface UserEntry {
  userId: string;
  gameList: number[];
}
