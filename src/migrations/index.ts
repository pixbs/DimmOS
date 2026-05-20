import * as migration_20260427_110436 from './20260427_110436';
import * as migration_20260504_114330 from './20260504_114330';
import * as migration_20260511_104720 from './20260511_104720';
import * as migration_20260520_012914 from './20260520_012914';

export const migrations = [
  {
    up: migration_20260427_110436.up,
    down: migration_20260427_110436.down,
    name: '20260427_110436',
  },
  {
    up: migration_20260504_114330.up,
    down: migration_20260504_114330.down,
    name: '20260504_114330',
  },
  {
    up: migration_20260511_104720.up,
    down: migration_20260511_104720.down,
    name: '20260511_104720',
  },
  {
    up: migration_20260520_012914.up,
    down: migration_20260520_012914.down,
    name: '20260520_012914'
  },
];
