//  Common
interface BaseGameDetails {
  name: string;
  released?: string;
  tba: boolean;
}

// Api response models
interface GameSearchResult extends BaseGameDetails {
  id: number;
}
interface GameDetail extends GameSearchResult {
  description_raw: string;
  slug: string;
}

// Db models
interface GameEntry extends BaseGameDetails {
  gameId: number;
}
interface UserEntry {
  gameList: number[];
}
