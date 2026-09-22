import { BLOCKERS, BLOCKER_ORDER } from '../config/blockers.js?v=20260922-blockers-v1';

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
      'assets/atlas/blockers/blockers_all_atlas.png?v=20260922-blockers-v1',
      'assets/atlas/blockers/blockers_all_atlas.json?v=20260922-blockers-v1'
    );
  }

  create() {
    this.cameras.main.setBackgroundColor('#052b3d');

    this.add.text(500, 27, 'Дары глубин · препятствия v1', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(500, 55, 'Нажимай на препятствие — следующий удар / стадия разрушения', {
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
        const fish = this.add.sprite(x, y, 'fish', fishName + '_f01');
        fish.setScale(0.225);
        fish.setFlipX((row + col) % 2 === 0);
        fish.setAlpha(0.96);
        fishSprites[row][col] = fish;

        if (!['fish_01_goldfish', 'fish_06_clownfish'].includes(fishName)) {
          this.tweens.add({
            targets: fish,
            y: y + Phaser.Math.FloatBetween(-3.8, 3.8),
            angle: Phaser.Math.FloatBetween(-1.1, 1.1),
            duration: Phaser.Math.Between(2700, 4300),
            yoyo: true,
            repeat: -1,
            delay: Phaser.Math.Between(0, 1600),
            ease: 'Sine.easeInOut'
          });
        }
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

    const makeHitFx = (x, y, type) => {
      const colors = {
        seaweed: 0x75d36b,
        sand: 0xf1d09b,
        rock: 0xb7c4c9,
        shell: 0xffd1a6,
        net: 0xd9b07c,
        ice: 0xbcefff
      };

      for (let i = 0; i < 7; i += 1) {
        const dot = this.add.circle(
          x + Phaser.Math.Between(-10, 10),
          y + Phaser.Math.Between(-10, 10),
          Phaser.Math.FloatBetween(1.5, 3.2),
          colors[type],
          0.72
        );
        this.tweens.add({
          targets: dot,
          x: dot.x + Phaser.Math.Between(-28, 28),
          y: dot.y + Phaser.Math.Between(-32, 18),
          alpha: 0,
          scale: 0.3,
          duration: Phaser.Math.Between(380, 700),
          ease: 'Quad.easeOut',
          onComplete: () => dot.destroy()
        });
      }
    };

    const addBlocker = ({ type, row, col }) => {
      const cfg = BLOCKERS[type];
      const x = startX + col * cellSize;
      const y = startY + row * cellSize;
      const fish = fishSprites[row][col];

      if (cfg.layer === 'solid') {
        fish.setVisible(false);
      }

      const sprite = this.add.sprite(x, y, cfg.atlas, cfg.frames[0]);
      sprite.setScale(type === 'sand' ? 0.205 : type === 'net' ? 0.19 : 0.205);
      sprite.setInteractive({ useHandCursor: true });

      if (type === 'sand') sprite.setAlpha(0.82);
      if (type === 'ice') sprite.setAlpha(0.88);
      if (type === 'net') sprite.setAlpha(0.94);

      if (type === 'seaweed') {
        this.tweens.add({
          targets: sprite,
          angle: { from: -1.2, to: 1.2 },
          scaleX: { from: sprite.scaleX * 0.985, to: sprite.scaleX * 1.015 },
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
      }).setOrigin(0.5).setDepth(20);

      sprite.on('pointerdown', () => {
        makeHitFx(x, y, type);

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
            duration: 260,
            onComplete: () => {
              sprite.destroy();
              status.destroy();
              if (cfg.layer === 'solid') {
                fish.setVisible(true);
                fish.setAlpha(0);
                this.tweens.add({
                  targets: fish,
                  alpha: 0.96,
                  duration: 320
                });
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

    this.add.text(500, 690, 'Тест: масштаб · читаемость · стадии · overlay/solid · визуальный удар', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#8ccbd9'
    }).setOrigin(0.5);
  }
}
