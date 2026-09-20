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

    const createSoftFishIdle = (x, y, fishName, flipX, seedDelay) => {
      const frameSequence = [
        `${fishName}_f01`,
        `${fishName}_f02`,
        `${fishName}_f01`,
        `${fishName}_f03`
      ];

      const a = this.add.sprite(x, y, 'fish', frameSequence[0]);
      const b = this.add.sprite(x, y, 'fish', frameSequence[0]);

      a.setOrigin(0.5, 0.5).setScale(0.28).setFlipX(flipX);
      b.setOrigin(0.5, 0.5).setScale(0.28).setFlipX(flipX).setAlpha(0);

      let current = a;
      let next = b;
      let index = 0;

      const changeFrame = () => {
        index = (index + 1) % frameSequence.length;
        next.setFrame(frameSequence[index]);
        next.setAlpha(0);

        this.tweens.add({
          targets: current,
          alpha: 0,
          duration: 170,
          ease: 'Sine.easeInOut'
        });

        this.tweens.add({
          targets: next,
          alpha: 1,
          duration: 170,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            const oldCurrent = current;
            current = next;
            next = oldCurrent;

            const dwell = index === 0 ? 650 : 420;
            this.time.delayedCall(dwell, changeFrame);
          }
        });
      };

      this.time.delayedCall(seedDelay, changeFrame);
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

        createSoftFishIdle(
          x,
          y,
          fishName,
          (row + col) % 2 === 0,
          Phaser.Math.Between(0, 900)
        );
      }
    }

    const pufferFrames = [
      'special_puffer_f01',
      'special_puffer_f02',
      'special_puffer_f03'
    ];

    const pufferA = this.add.sprite(860, 280, 'specials', pufferFrames[0]);
    const pufferB = this.add.sprite(860, 280, 'specials', pufferFrames[0]);

    pufferA.setOrigin(0.5, 0.5).setScale(0.42);
    pufferB.setOrigin(0.5, 0.5).setScale(0.42).setAlpha(0);

    let pufferCurrent = pufferA;
    let pufferNext = pufferB;

    const crossfadePuffer = (frame, scale, onDone) => {
      pufferNext.setFrame(frame);
      pufferNext.setScale(scale);
      pufferNext.setAlpha(0);

      this.tweens.add({
        targets: pufferCurrent,
        alpha: 0,
        duration: 190,
        ease: 'Sine.easeInOut'
      });

      this.tweens.add({
        targets: pufferNext,
        alpha: 1,
        duration: 190,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          const oldCurrent = pufferCurrent;
          pufferCurrent = pufferNext;
          pufferNext = oldCurrent;
          if (onDone) onDone();
        }
      });
    };

    const runPufferCycle = () => {
      crossfadePuffer(pufferFrames[1], 0.44, () => {
        this.time.delayedCall(220, () => {
          crossfadePuffer(pufferFrames[2], 0.46, () => {
            this.time.delayedCall(750, () => {
              crossfadePuffer(pufferFrames[1], 0.44, () => {
                this.time.delayedCall(220, () => {
                  crossfadePuffer(pufferFrames[0], 0.42, () => {
                    this.time.delayedCall(900, runPufferCycle);
                  });
                });
              });
            });
          });
        });
      });
    };

    this.time.delayedCall(700, runPufferCycle);

    this.add.text(770, 120, 'Puffer test', {
      fontSize: '24px',
      color: '#ffffff'
    });
  }
}
