export const BLOCKERS = {
  seaweed: {
    atlas: 'blockers_all',
    frames: ['blocker_seaweed_01', 'blocker_seaweed_02', 'blocker_seaweed_03'],
    stages: 3,
    layer: 'overlay',
    damageRule: 'adjacent_match',
    blocksSwap: true,
    blocksFall: false,
    animatedByCode: true,
    fx: 'fx_seaweed_break'
  },
  sand: {
    atlas: 'blockers_all',
    frames: ['blocker_sand_01', 'blocker_sand_02'],
    stages: 2,
    layer: 'overlay',
    damageRule: 'match_on_cell',
    blocksSwap: false,
    blocksFall: false,
    animatedByCode: false,
    fx: 'fx_sand_clear'
  },
  rock: {
    atlas: 'blockers_all',
    frames: ['blocker_rock_01', 'blocker_rock_02'],
    stages: 2,
    layer: 'solid',
    damageRule: 'adjacent_match',
    blocksSwap: true,
    blocksFall: true,
    animatedByCode: false,
    fx: 'fx_rock_break'
  },
  shell: {
    atlas: 'blockers_all',
    frames: ['blocker_shell_01', 'blocker_shell_02', 'blocker_shell_03'],
    stages: 3,
    layer: 'solid',
    damageRule: 'adjacent_match',
    blocksSwap: true,
    blocksFall: true,
    animatedByCode: false,
    fx: 'fx_shell_break'
  },
  net: {
    atlas: 'blockers_all',
    frames: ['blocker_net_01', 'blocker_net_02'],
    stages: 2,
    layer: 'overlay',
    damageRule: 'match_captured_fish',
    blocksSwap: true,
    blocksFall: false,
    animatedByCode: false,
    fx: 'fx_net_break'
  },
  ice: {
    atlas: 'blockers_all',
    frames: ['blocker_ice_01', 'blocker_ice_02', 'blocker_ice_03'],
    stages: 3,
    layer: 'overlay',
    damageRule: 'match_on_cell_or_hit',
    blocksSwap: true,
    blocksFall: false,
    animatedByCode: false,
    fx: 'fx_ice_break'
  }
};

export const BLOCKER_ORDER = ['seaweed', 'sand', 'rock', 'shell', 'net', 'ice'];
