import { BLOCKERS, BLOCKER_ORDER } from '../config/blockers.js?v=20260922-blockers-v2';
import {
  playBlockerDamageFX,
  playBlockerDestroyFX
} from '../fx/blockerFx.js?v=20260922-blocker-fx-v1';

export default class BlockerTestScene extends Phaser.Scene {
  constructor() {
    super('BlockerTestScene');
  }

  preload() {
    this.load.atlas(
      'fish',
      'assets/atlas/fish/fish_atlas.png?v=20260921-static-sway-v3',
      'assets/atlas/fish/fish_atlas.json?v=20260921-static-sway-v3'
    );

    this.load.atlas(
      'blockers_all',
      'assets/atlas/blockers/blockers_all_atlas.png?v=20260922-blockers-v2',
      'assets/atlas/blockers/blockers_all_atlas.json?v=20260922-blockers-v2'
    );
  }

  create() {
    this.cameras.main.setBackgroundColor('#052b3d');

    this.add.text(500, 27, 'Дары глубин · препятствия + FX', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(500, 55, 'Клик: повреждение · последний клик: яркий водный FX разрушения', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#a9dbea'
    }).setOrigin(0.5);

    const cellSize = 82;
    const cols = 8;
    const rows = 6;
    const startX = 210;
    const startY = 142;

    const fishNames = [
      'fish_01_goldfish',
      'fish_02_blue_tang',
      'fish_03_moorish_idol',
      'fish_04_white_angelfish',
      'fish_05_yellow_tang',
      'fish_06_clownfish'
    ];

    const grid = this.add.graphics();
    grid.fillStyle(0x0b5871, 0.28);
    grid.lineStyle(1, 0x9fefff, 0.18);

    const fishSprites = [];

    const startFishIdle = (fish, x, y, flipX) => {
      this.tweens.killTweensOf(fish);
      fish.setPosition(x, y);
      fish.setAngle(0);
      fish.setData('frozenByBlocker', false);

      const move = () => {
        if (!fish.active || fish.getData('frozenByBlocker')) return;

        const targetY = y + Phaser.Math.FloatBetween(-3.8, 3.8);
        const rawAngle = Phaser.Math.FloatBetween(-1.1, 1.1);

        this.tweens.add({
          targets: fish,
          y: targetY,
          angle: flipX ? -rawAngle : rawAngle,
          duration: Phaser.Math.Between(2700, 4300),
          ease: 'Sine.easeInOut',
          onComplete: () => {
            if (!fish.active || fish.getData('frozenByBlocker')) return;
            this.time.delayedCall(Phaser.Math.Between(120, 620), move);
          }
        });
      };

      this.time.delayedCall(Phaser.Math.Between(0, 900), move);
    };

    const freezeFish = (fish, x, y) => {
      fish.setData('frozenByBlocker', true);
      this.tweens.killTweensOf(fish);
      fish.setPosition(x, y);
      fish.setAngle(0);
    };

    for (let row = 0; row < rows; row += 1) {
      fishSprites[row] = [];

      for (let col = 0; col < cols; col += 1) {
        const x = startX + col * cellSize;
        const y = startY + row * cellSize;

        grid.fillRoundedRect(
          x - cellSize / 2 + 2,
          y - cellSize / 2 + 2,
          cellSize - 4,
          cellSize - 4,
          12
        );

        grid.strokeRoundedRect(
          x - cellSize / 2 + 2,
          y - cellSize / 2 + 2,
          cellSize - 4,
          cellSize - 4,
          12
        );

        const fishName = fishNames[(row * 3 + col) % fishNames.length];
        const flipX = (row + col) % 2 === 0;
        const fish = this.add.sprite(x, y, 'fish', fishName + '_f01');

        fish.setScale(0.225);
        fish.setFlipX(flipX);
        fish.setAlpha(0.96);
        fish.setData('fishName', fishName);
        fish.setData('flipXBase', flipX);

        fishSprites[row][col] = fish;
        startFishIdle(fish, x, y, flipX);
      }
    }

    const placements = [
      { type: 'seaweed', row: 0, col: 1 },
      { type: 'sand', row: 1, col: 5 },
      { type: 'rock', row: 2, col: 2 },
      { type: 'shell', row: 3, col: 6 },
      { type: 'net', row: 4, col: 3 },
      { type: 'ice', row: 5, col: 6 }
    ];

    const addBlocker = ({ type, row, col }) => {
      const cfg = BLOCKERS[type];
      const x = startX + col * cellSize;
      const y = startY + row * cellSize;
      const fish = fishSprites[row][col];

      if (cfg.layer === 'solid') {
        this.tweens.killTweensOf(fish);
        fish.setVisible(false);
      } else {
        // Approved rule: all fish under overlay blockers are visually frozen.
        freezeFish(fish, x, y);
      }

      const sprite = this.add.sprite(x, y, cfg.atlas, cfg.frames[0]);

      const blockerScale = {
        seaweed: 0.205,
        sand: 0.215,
        rock: 0.205,
        shell: 0.205,
        net: 0.19,
        ice: 0.215
      };

      sprite.setScale(blockerScale[type] || 0.205);
      sprite.setInteractive({ useHandCursor: true });
      sprite.setDepth(12);

      if (type === 'sand') sprite.setAlpha(0.84);
      if (type === 'ice') sprite.setAlpha(0.88);
      if (type === 'net') sprite.setAlpha(0.94);

      if (type === 'seaweed') {
        this.tweens.add({
          targets: sprite,
          angle: { from: -1.2, to: 1.2 },
          scaleX: {
            from: sprite.scaleX * 0.985,
            to: sprite.scaleX * 1.015
          },
          duration: 2600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      let stage = 0;

      const status = this.add.text(x, y + 31, String(stage + 1) + '/' + cfg.stages, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#ffffff',
        backgroundColor: '#073449aa',
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5).setDepth(24);

      sprite.on('pointerdown', () => {
        const finalHit = stage + 1 >= cfg.frames.length;

        if (finalHit) {
          playBlockerDestroyFX(this, type, x, y);
        } else {
          playBlockerDamageFX(this, type, x, y);
        }

        this.tweens.add({
          targets: sprite,
          scaleX: sprite.scaleX * 0.91,
          scaleY: sprite.scaleY * 0.91,
          duration: 85,
          yoyo: true,
          ease: 'Quad.easeOut'
        });

        stage += 1;

        if (stage >= cfg.frames.length) {
          sprite.disableInteractive();

          this.tweens.add({
            targets: [sprite, status],
            alpha: 0,
            duration: 240,
            delay: 45,
            onComplete: () => {
              sprite.destroy();
              status.destroy();

              if (cfg.layer === 'solid') {
                fish.setVisible(true);
                fish.setAlpha(0);

                this.tweens.add({
                  targets: fish,
                  alpha: 0.96,
                  duration: 330,
                  ease: 'Sine.easeOut',
                  onComplete: () => {
                    startFishIdle(fish, x, y, fish.getData('flipXBase'));
                  }
                });
              } else {
                startFishIdle(fish, x, y, fish.getData('flipXBase'));
              }
            }
          });

          return;
        }

        sprite.setFrame(cfg.frames[stage]);
        status.setText(String(stage + 1) + '/' + cfg.stages);
      });
    };

    placements.forEach(addBlocker);

    const labelY = 650;
    const labelStartX = 150;

    BLOCKER_ORDER.forEach((type, i) => {
      const names = {
        seaweed: 'Водоросли',
        sand: 'Песок',
        rock: 'Камень',
        shell: 'Ракушка',
        net: 'Сеть',
        ice: 'Лёд'
      };

      this.add.text(labelStartX + i * 142, labelY, names[type], {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#d7f6ff'
      }).setOrigin(0.5);
    });

    this.add.text(
      500,
      690,
      'FX v1: водная волна + пузырьки + материал препятствия · overlay-рыба застывает',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#8ccbd9'
      }
    ).setOrigin(0.5);
  }
}
