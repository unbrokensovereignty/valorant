/**
 * Ranked play on each map: how often each agent's team won its games there, and how many games
 * that is, and the share of rounds each side wins. The engine counts an agent's win rate on a map
 * only as far as it differs from their win rate on the others by more than chance would (MAP_WIN
 * in engine/weights.ts): most of the difference between maps is chance, even with thousands of games.
 *
 * Source: metabot.gg, competitive games at all ranks, regions and platforms, each map as of the date
 * given (`on`). `games` are the agent's games on the map. Icebox had no games there. The two sides'
 * rates come as the source gives them and don't quite add up to 100, so they're read as shares of
 * their sum (sideShare).
 */
export interface MapWins {
  on: string;
  /** Rounds won by each side, in percent. */
  attack: number;
  defense: number;
  /** Agent id: [win rate in percent, games]. */
  agents: Record<string, readonly [win: number, games: number]>;
}

export const MAP_WINS: Record<string, MapWins> = {
  abyss: {
    on: '2026-10-29', attack: 51.4, defense: 49.7,
    agents: {
      astra: [47.1, 1275], breach: [58.0, 50], brimstone: [53.8, 52], chamber: [51.4, 5184],
      clove: [54.8, 5384], cypher: [52.7, 695], deadlock: [48.6, 181], fade: [41.9, 62], gekko: [53.3, 75],
      harbor: [47.3, 129], hush: [44.8, 29], iso: [53.2, 816], jett: [51.7, 6026], kayo: [50.8, 195],
      killjoy: [70.0, 10], miks: [41.0, 39], neon: [52.8, 1221], omen: [45.0, 809], phoenix: [53.2, 348],
      raze: [36.4, 107], reyna: [50.1, 2485], sage: [55.1, 156], skye: [45.8, 72], sova: [52.3, 6340],
      tejo: [50.7, 227], veto: [51.5, 557], viper: [35.7, 28], vyse: [53.1, 721], waylay: [51.2, 2867],
      yoru: [48.8, 2498]
    },
  },
  ascent: {
    on: '2026-10-29', attack: 46.1, defense: 54.5,
    agents: {
      astra: [43.8, 48], breach: [43.9, 41], brimstone: [45.2, 93], chamber: [47.6, 2015],
      clove: [53.4, 5295], cypher: [51.2, 1788], deadlock: [47.0, 185], fade: [48.7, 113], gekko: [48.1, 54],
      harbor: [28.6, 35], iso: [50.2, 231], jett: [49.5, 6975], kayo: [49.0, 390], killjoy: [50.3, 2362],
      miks: [48.5, 231], neon: [50.1, 906], omen: [48.0, 1756], phoenix: [50.4, 3359], raze: [49.2, 240],
      reyna: [46.9, 2618], sage: [57.0, 302], skye: [35.9, 131], sova: [51.0, 6191], tejo: [46.4, 69],
      veto: [52.9, 85], viper: [47.4, 19], vyse: [47.6, 489], waylay: [47.1, 660], yoru: [49.6, 413]
    },
  },
  bind: {
    on: '2026-10-30', attack: 46.9, defense: 54.1,
    agents: {
      astra: [47.3, 55], breach: [41.2, 34], brimstone: [50.0, 1031], chamber: [51.2, 3951],
      clove: [53.0, 5265], cypher: [51.5, 948], deadlock: [51.7, 656], fade: [53.1, 2288], gekko: [46.9, 96],
      harbor: [28.2, 39], hush: [60.0, 25], iso: [47.3, 241], jett: [50.5, 2720], kayo: [54.9, 51],
      killjoy: [58.9, 56], miks: [48.0, 319], neon: [50.9, 1390], omen: [46.2, 93], phoenix: [52.9, 463],
      raze: [51.6, 2962], reyna: [51.3, 2105], sage: [46.5, 185], skye: [52.9, 2853], sova: [49.4, 267],
      tejo: [52.9, 263], veto: [49.8, 219], viper: [53.9, 751], vyse: [67.2, 64], waylay: [50.7, 1891],
      yoru: [50.8, 2098]
    },
  },
  breeze: {
    on: '2026-10-15', attack: 49.9, defense: 51.0,
    agents: {
      astra: [47.2, 2006], breach: [36.4, 33], brimstone: [43.5, 108], chamber: [51.2, 8457],
      clove: [52.3, 3530], cypher: [54.9, 510], deadlock: [56.1, 57], fade: [45.5, 55], gekko: [41.0, 61],
      harbor: [51.3, 939], iso: [48.2, 745], jett: [51.5, 9962], kayo: [39.4, 284], killjoy: [43.8, 16],
      miks: [53.2, 361], neon: [51.0, 2931], omen: [48.7, 550], phoenix: [51.7, 619], raze: [48.5, 97],
      reyna: [50.3, 4580], sage: [50.2, 251], skye: [52.3, 176], sova: [51.9, 8937], tejo: [50.0, 70],
      veto: [48.7, 154], viper: [50.9, 5230], vyse: [56.3, 80], waylay: [48.2, 695], yoru: [49.3, 2641]
    },
  },
  corrode: {
    on: '2026-10-30', attack: 49.6, defense: 51.6,
    agents: {
      astra: [43.0, 93], breach: [53.3, 45], brimstone: [47.5, 40], chamber: [50.8, 2996],
      clove: [53.1, 4935], cypher: [54.8, 259], deadlock: [50.4, 357], fade: [51.8, 4075], gekko: [33.3, 24],
      harbor: [48.7, 39], hush: [54.5, 22], iso: [46.3, 298], jett: [51.4, 2169], kayo: [43.1, 144],
      killjoy: [38.9, 18], miks: [42.9, 7], neon: [54.4, 1859], omen: [51.2, 724], phoenix: [47.9, 405],
      raze: [54.8, 177], reyna: [50.2, 2005], sage: [54.3, 245], skye: [57.1, 105], sova: [52.6, 576],
      tejo: [51.9, 133], veto: [53.4, 339], viper: [51.5, 396], vyse: [54.5, 1173], waylay: [50.2, 3117],
      yoru: [50.8, 1745]
    },
  },
  fracture: {
    on: '2026-10-04', attack: 48.2, defense: 51.5,
    agents: {
      astra: [31.1, 61], breach: [46.1, 1001], brimstone: [49.9, 1115], chamber: [47.6, 2351],
      clove: [51.1, 1719], cypher: [51.6, 639], deadlock: [37.5, 64], fade: [56.0, 464], gekko: [58.8, 17],
      harbor: [17.9, 28], iso: [47.6, 269], jett: [49.2, 2631], kayo: [34.4, 61], killjoy: [46.6, 406],
      miks: [45.8, 651], neon: [50.9, 1218], omen: [36.1, 61], phoenix: [56.6, 814], raze: [52.4, 813],
      reyna: [49.0, 1388], sage: [47.7, 107], skye: [51.0, 206], sova: [44.2, 43], tejo: [50.2, 1709],
      veto: [48.5, 99], viper: [36.7, 30], vyse: [51.0, 143], waylay: [49.2, 721], yoru: [37.8, 82]
    },
  },
  haven: {
    on: '2026-10-30', attack: 48.7, defense: 52.0,
    agents: {
      astra: [46.8, 124], breach: [48.0, 246], brimstone: [53.2, 126], chamber: [48.7, 5224],
      clove: [52.6, 10481], cypher: [51.8, 3548], deadlock: [53.8, 119], fade: [51.5, 231], gekko: [50.6, 89],
      harbor: [34.8, 66], hush: [43.5, 23], iso: [47.5, 864], jett: [49.9, 11173], kayo: [43.5, 131],
      killjoy: [53.4, 3342], miks: [48.7, 538], neon: [52.8, 4409], omen: [48.9, 2602], phoenix: [53.2, 4153],
      raze: [52.3, 400], reyna: [50.2, 4997], sage: [48.6, 391], skye: [48.0, 346], sova: [51.9, 11459],
      tejo: [50.4, 113], veto: [47.0, 200], viper: [50.5, 208], vyse: [50.0, 94], waylay: [48.4, 1313],
      yoru: [51.7, 2206]
    },
  },
  lotus: {
    on: '2026-10-28', attack: 50.7, defense: 49.6,
    agents: {
      astra: [47.1, 68], breach: [47.2, 398], brimstone: [47.8, 92], chamber: [50.2, 5098],
      clove: [52.0, 6090], cypher: [55.2, 464], deadlock: [54.3, 197], fade: [51.3, 6061], gekko: [47.3, 184],
      harbor: [35.0, 40], iso: [50.3, 910], jett: [49.6, 5005], kayo: [43.8, 73], killjoy: [51.3, 517],
      miks: [47.3, 636], neon: [50.9, 3214], omen: [46.0, 1728], phoenix: [51.4, 1047], raze: [48.4, 3715],
      reyna: [50.0, 2844], sage: [53.1, 260], skye: [42.0, 455], sova: [47.7, 260], tejo: [52.7, 237],
      veto: [51.1, 182], viper: [51.6, 353], vyse: [51.9, 1694], waylay: [52.7, 1286], yoru: [47.6, 466]
    },
  },
  pearl: {
    on: '2026-10-25', attack: 48.0, defense: 52.9,
    agents: {
      astra: [49.4, 1689], breach: [43.3, 30], brimstone: [39.6, 91], chamber: [50.8, 5836],
      clove: [53.2, 6549], cypher: [50.9, 342], deadlock: [51.5, 97], fade: [51.0, 6281], gekko: [43.2, 95],
      harbor: [39.1, 110], iso: [47.4, 492], jett: [50.5, 6015], kayo: [49.7, 189], killjoy: [52.0, 1477],
      miks: [49.9, 519], neon: [51.3, 2605], omen: [46.5, 185], phoenix: [51.5, 2306], raze: [53.0, 200],
      reyna: [50.0, 3069], sage: [45.6, 193], skye: [47.1, 189], sova: [52.5, 853], tejo: [51.3, 409],
      veto: [47.7, 214], viper: [56.1, 57], vyse: [49.7, 662], waylay: [50.8, 2075], yoru: [50.3, 2160]
    },
  },
  split: {
    on: '2026-10-27', attack: 47.9, defense: 53.0,
    agents: {
      astra: [48.0, 271], breach: [46.2, 407], brimstone: [50.0, 128], chamber: [50.0, 4866],
      clove: [52.6, 10690], cypher: [51.6, 3422], deadlock: [49.1, 521], fade: [53.0, 3340],
      gekko: [38.0, 92], harbor: [37.5, 48], iso: [43.2, 572], jett: [49.0, 7472], kayo: [48.1, 133],
      killjoy: [54.6, 315], miks: [47.8, 621], neon: [54.4, 2868], omen: [48.3, 2021], phoenix: [50.5, 1397],
      raze: [51.3, 5664], reyna: [48.9, 4686], sage: [53.0, 3021], skye: [51.3, 6558], sova: [51.2, 207],
      tejo: [48.1, 617], veto: [47.0, 481], viper: [50.4, 1517], vyse: [46.9, 458], waylay: [49.1, 2772],
      yoru: [50.1, 1926]
    },
  },
  summit: {
    on: '2026-10-29', attack: 47.6, defense: 52.7,
    agents: {
      astra: [47.9, 163], breach: [40.4, 57], brimstone: [50.6, 85], chamber: [46.2, 2362],
      clove: [51.6, 3783], cypher: [50.5, 1415], deadlock: [53.7, 175], fade: [51.3, 3012],
      gekko: [51.5, 103], harbor: [53.3, 135], hush: [47.8, 23], iso: [49.1, 271], jett: [50.7, 3176],
      kayo: [46.9, 98], killjoy: [52.6, 116], miks: [51.9, 108], neon: [50.7, 1910], omen: [47.1, 635],
      phoenix: [51.1, 1375], raze: [49.2, 325], reyna: [51.0, 2120], sage: [53.8, 725], skye: [48.2, 272],
      sova: [47.7, 640], tejo: [49.4, 180], veto: [46.0, 150], viper: [51.9, 79], vyse: [55.0, 302],
      waylay: [46.8, 910], yoru: [51.4, 442]
    },
  },
  sunset: {
    on: '2026-10-29', attack: 48.4, defense: 52.0,
    agents: {
      astra: [40.0, 25], breach: [44.9, 136], brimstone: [59.2, 49], chamber: [47.6, 2173],
      clove: [52.0, 3885], cypher: [52.9, 1475], deadlock: [51.2, 256], fade: [52.6, 508], gekko: [52.4, 191],
      harbor: [40.0, 20], hush: [65.2, 23], iso: [50.7, 294], jett: [49.1, 2564], kayo: [46.7, 75],
      killjoy: [54.3, 35], miks: [45.5, 132], neon: [51.8, 2378], omen: [48.5, 722], phoenix: [52.5, 1418],
      raze: [47.9, 962], reyna: [51.3, 1777], sage: [46.5, 325], skye: [49.3, 150], sova: [52.5, 3349],
      tejo: [47.1, 70], veto: [47.2, 178], viper: [51.9, 27], vyse: [51.5, 458], waylay: [49.1, 552],
      yoru: [52.5, 425]
    },
  },
};

/** The share of rounds a side wins on a map, 0 to 1 (undefined without numbers). */
export function sideShare(map: string, side: 'attack' | 'defense'): number | undefined {
  const m = MAP_WINS[map];
  return m && m[side] / (m.attack + m.defense);
}
