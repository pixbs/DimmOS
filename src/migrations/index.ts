import * as migration_20260427_110436 from './20260427_110436';
import * as migration_20260504_114330 from './20260504_114330';
import * as migration_20260511_104720 from './20260511_104720';
import * as migration_20260520_012914 from './20260520_012914';
import * as migration_20260526_072603 from './20260526_072603';
import * as migration_20260526_194439 from './20260526_194439';
import * as migration_20260528_001735 from './20260528_001735';
import * as migration_20260528_032135 from './20260528_032135';
import * as migration_20260528_175304 from './20260528_175304';
import * as migration_20260612_111535 from './20260612_111535';
import * as migration_20260616_130357_window_buttons from './20260616_130357_window_buttons';
import * as migration_20260620_212531_article_content_sections from './20260620_212531_article_content_sections';

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
    name: '20260520_012914',
  },
  {
    up: migration_20260526_072603.up,
    down: migration_20260526_072603.down,
    name: '20260526_072603',
  },
  {
    up: migration_20260526_194439.up,
    down: migration_20260526_194439.down,
    name: '20260526_194439',
  },
  {
    up: migration_20260528_001735.up,
    down: migration_20260528_001735.down,
    name: '20260528_001735',
  },
  {
    up: migration_20260528_032135.up,
    down: migration_20260528_032135.down,
    name: '20260528_032135',
  },
  {
    up: migration_20260528_175304.up,
    down: migration_20260528_175304.down,
    name: '20260528_175304',
  },
  {
    up: migration_20260612_111535.up,
    down: migration_20260612_111535.down,
    name: '20260612_111535',
  },
  {
    up: migration_20260616_130357_window_buttons.up,
    down: migration_20260616_130357_window_buttons.down,
    name: '20260616_130357_window_buttons',
  },
  {
    up: migration_20260620_212531_article_content_sections.up,
    down: migration_20260620_212531_article_content_sections.down,
    name: '20260620_212531_article_content_sections'
  },
];
