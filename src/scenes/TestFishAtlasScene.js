export default class TestFishAtlasScene extends Phaser.Scene {
  constructor() {
    super('TestFishAtlasScene');
  }

  preload() {
    this.load.atlas(
      'fish',
      'assets/atlas/fish/fish_atlas.png',
      'assets/atlas/fish/fish_atlas.json'
    );

    this.load.atlas(
      'specials',
      'assets/atlas/specials/specials_atlas.png',
      'assets/atlas/specials/specials_atlas.json'
    );
  }

  create() {
    const fishTypes = [
      'fish_01_goldfish',
      'fish_02_blue_tang',
      'fish_03_moorish_idol',
      'fish_04_white_angelfish',
      'fish_05_yellow_tang',
      'fish_06_clownfish'
    ];

    fishTypes.forEach((name) => {
      if (!this.anims.exists(`${name}_idle`)) {
        this.anims.create({
          key: `${name}_idle`,
          frames: [
            { key: 'fish', frame: `${name}_f01` },
            { key: 'fish', frame: `${name}_f02` },
            { key: 'fish', frame: `${name}_f01` },
            { key: 'fish', frame: `${name}_f03` }
          ],
          frameRate: 3,
          repeat: -1
        });
      }
    });

    if (!this.anims.exists('puffer_inflate')) {
      this.anims.create({
        key: 'puffer_inflate',
        frames: [
          { key: 'specials', frame: 'special_puffer_f01' },
          { key: 'specials', frame: 'special_puffer_f02' },
          { key: 'specials', frame: 'special_puffer_f03' }
        ],
        frameRate: 5,
        repeat: 0
      });
    }

    if (!this.anims.exists('puffer_deflate')) {
      this.anims.create({
        key: 'puffer_deflate',
        frames: [
          { key: 'specials', frame: 'special_puffer_f03' },
          { key: 'specials', frame: 'special_puffer_f02' },
          { key: 'specials', frame: 'special_puffer_f01' }
        ],
        frameRate: 5,
        repeat: 0
      });
    }

    const cellSize = 96;
    const cols = 6;
    const rows = 6;
    const startX = 140;
    const startY = 120;

    const layout = [
      [0, 1, 2, 3, 4, 5],
      [1, 2, 3, 4, 5, 0],
      [2, 3, 4, 5, 0, 1],
      [3, 4, 5, 0, 1, 2],
      [4, 5, 0, 1, 2, 3],
      [5, 0, 1, 2, 3, 4]
    ];

    const grid = this.add.graphics();
    grid.lineStyle(1, 0xffffff, 0.15);

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const x = startX + col * cellSize;
        const y = startY + row * cellSize;

        grid.strokeRect(
          x - cellSize / 2,
          y - cellSize / 2,
          cellSize,
          cellSize
        );

        const typeIndex = layout[row][col];
        const fishName = fishTypes[typeIndex];

        const sprite = this.add.sprite(
          x,
          y,
          'fish',
          `${fishName}_f01`
        );

        // 352 px virtual source frame -> about 99 px on screen.
        sprite.setScale(0.28);
        sprite.play(`${fishName}_idle`);

        this.tweens.add({
          targets: sprite,
          y: y + Phaser.Math.Between(-2, 2),
          angle: Phaser.Math.Between(-1, 1),
          duration: 1200 + Phaser.Math.Between(0, 600),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        // Direction test. A second set of PNGs is not required.
        if ((row + col) % 2 === 0) {
          sprite.setFlipX(true);
        }
      }
    }

    const puffer = this.add.sprite(
      860,
      280,
      'specials',
      'special_puffer_f01'
    );

    puffer.setScale(0.42);

    this.time.addEvent({
      delay: 1800,
      loop: true,
      callback: () => {
        puffer.play('puffer_inflate');

        this.tweens.add({
          targets: puffer,
          scaleX: 0.46,
          scaleY: 0.46,
          duration: 250,
          yoyo: true,
          ease: 'Back.easeOut'
        });

        this.time.delayedCall(900, () => {
          puffer.play('puffer_deflate');
        });
      }
    });

    this.add.text(770, 120, 'Puffer test', {
      fontSize: '24px',
      color: '#ffffff'
    });
  }
}
