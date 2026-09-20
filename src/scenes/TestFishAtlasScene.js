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

    const scheduleFishIdle = (sprite, fishName) => {
      const twitch = () => {
        const altFrame = Phaser.Math.Between(0, 1) === 0
          ? `${fishName}_f02`
          : `${fishName}_f03`;

        sprite.setFrame(altFrame);

        this.time.delayedCall(120, () => {
          sprite.setFrame(`${fishName}_f01`);

          this.time.delayedCall(
            Phaser.Math.Between(1100, 2600),
            twitch
          );
        });
      };

      this.time.delayedCall(
        Phaser.Math.Between(500, 2200),
        twitch
      );
    };

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

        sprite.setOrigin(0.5, 0.5);
        sprite.setScale(0.28);

        if ((row + col) % 2 === 0) {
          sprite.setFlipX(true);
        }

        scheduleFishIdle(sprite, fishName);
      }
    }

    const puffer = this.add.sprite(
      860,
      280,
      'specials',
      'special_puffer_f01'
    );

    puffer.setOrigin(0.5, 0.5);
    puffer.setScale(0.42);

    const runPufferCycle = () => {
      puffer.setFrame('special_puffer_f02');

      this.time.delayedCall(260, () => {
        puffer.setFrame('special_puffer_f03');

        this.time.delayedCall(850, () => {
          puffer.setFrame('special_puffer_f02');

          this.time.delayedCall(260, () => {
            puffer.setFrame('special_puffer_f01');

            this.time.delayedCall(1300, runPufferCycle);
          });
        });
      });
    };

    this.time.delayedCall(900, runPufferCycle);

    this.add.text(770, 120, 'Puffer test', {
      fontSize: '24px',
      color: '#ffffff'
    });
  }
}
