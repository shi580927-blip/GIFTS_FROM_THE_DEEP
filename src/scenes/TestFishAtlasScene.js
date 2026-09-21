export default class TestFishAtlasScene extends Phaser.Scene {
  constructor() {
    super('TestFishAtlasScene');
  }

  preload() {
    this.load.atlas(
      'fish',
      'assets/atlas/fish/fish_atlas.png?v=20260921-final1',
      'assets/atlas/fish/fish_atlas.json?v=20260921-final1'
    );

    this.load.atlas(
      'specials',
      'assets/atlas/specials/specials_atlas.png?v=20260921-final1',
      'assets/atlas/specials/specials_atlas.json?v=20260921-final1'
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

    const animatedFish = new Set([
      'fish_01_goldfish',
      'fish_06_clownfish'
    ]);

    this.anims.create({
      key: 'goldfish_idle',
      frames: [
        { key: 'fish', frame: 'fish_01_goldfish_f01' },
        { key: 'fish', frame: 'fish_01_goldfish_f02' },
        { key: 'fish', frame: 'fish_01_goldfish_f03' },
        { key: 'fish', frame: 'fish_01_goldfish_f02' }
      ],
      frameRate: 4,
      repeat: -1
    });

    this.anims.create({
      key: 'clownfish_idle',
      frames: [
        { key: 'fish', frame: 'fish_06_clownfish_f01' },
        { key: 'fish', frame: 'fish_06_clownfish_f02' },
        { key: 'fish', frame: 'fish_06_clownfish_f03' },
        { key: 'fish', frame: 'fish_06_clownfish_f02' }
      ],
      frameRate: 4.5,
      repeat: -1
    });

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

    const addStaticLivingMotion = (sprite, x, y, flipX) => {
      const duration = Phaser.Math.Between(2400, 3600);
      const yShift = Phaser.Math.FloatBetween(0.35, 0.75);
      const angleShift = Phaser.Math.FloatBetween(0.18, 0.35);

      this.tweens.add({
        targets: sprite,
        y: y + yShift,
        angle: flipX ? -angleShift : angleShift,
        duration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 1400)
      });
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
        const flipX = (row + col) % 2 === 0;

        const sprite = this.add.sprite(
          x,
          y,
          'fish',
          `${fishName}_f01`
        );

        sprite.setOrigin(0.5, 0.5);
        sprite.setScale(0.27);
        sprite.setFlipX(flipX);

        if (animatedFish.has(fishName)) {
          const animKey = fishName === 'fish_01_goldfish'
            ? 'goldfish_idle'
            : 'clownfish_idle';

          this.time.delayedCall(
            Phaser.Math.Between(0, 900),
            () => sprite.play(animKey)
          );
        } else {
          addStaticLivingMotion(sprite, x, y, flipX);
        }
      }
    }

    const puffer = this.add.sprite(
      860,
      285,
      'specials',
      'special_puffer_f01'
    );

    puffer.setOrigin(0.5, 0.5);
    puffer.setScale(0.36);

    const runPufferCycle = () => {
      puffer.setFrame('special_puffer_f02');

      this.time.delayedCall(420, () => {
        puffer.setFrame('special_puffer_f03');

        this.time.delayedCall(700, () => {
          puffer.setFrame('special_puffer_f02');

          this.time.delayedCall(420, () => {
            puffer.setFrame('special_puffer_f01');

            this.time.delayedCall(850, runPufferCycle);
          });
        });
      });
    };

    this.time.delayedCall(800, runPufferCycle);

    this.add.text(735, 105, 'Puffer inflation', {
      fontSize: '23px',
      color: '#ffffff'
    });

    this.add.text(710, 455, 'Goldfish + clownfish: frame animation\nOthers: code-only motion', {
      fontSize: '17px',
      color: '#bfefff',
      align: 'center'
    });
  }
}
