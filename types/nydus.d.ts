type NYDUS_PROTOCOL = {
  VERSION: number;
  TYPE_INFO: Array<[string, any[]]>;
  GAME_EVENT: [number, { [key: string]: any[] }];
  MESSAGE_EVENT: [number, { [key: string]: any[] }];
  TRACKER_EVENT: [number, { [key: string]: any[] }];
  REPLAY: number[];
};

type NYDUS_ATTRIBUTES = { [key: string]:number };
