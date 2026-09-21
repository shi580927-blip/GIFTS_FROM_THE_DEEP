export default class TestFishAtlasScene extends Phaser.Scene {
  constructor() {
    super('TestFishAtlasScene');
  }

  preload() {
    this.load.atlas(
      'fish',
      'assets/atlas/fish/fish_atlas.png?v=20260921-motion2',
      'assets/atlas/fish/fish_atlas.json?v=20260921-motion2'
    );

    this.load.atlas(
      'specials',
      'assets/atlas/specials/specials_atlas.png?v=20260921-motion2',
      'assets/atlas/specials/specials_atlas.json?v=20260921-motion2'
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

    // All fish get a very small, irregular water-holding motion.
    // It is deliberately recursive instead of yoyo/repeat so the rhythm never locks.
    const addIrregularWaterMotion = (
      sprite,
      baseX,
      baseY,
      flipX,
      {
        yMax = 0.65,
        angleMax = 0.28,
        xMax = 0.12,
        minDuration = 2100,
        maxDuration = 3900
      } = {}
    ) => {
      const move = () => {
        const targetY = baseY + Phaser.Math.FloatBetween(-yMax, yMax);
        const targetX = baseX + Phaser.Math.FloatBetween(-xMax, xMax);
        const rawAngle = Phaser.Math.FloatBetween(-angleMax, angleMax);
        const targetAngle = flipX ? -rawAngle : rawAngle;

        const tweenConfig = {
          targets: sprite,
          x: targetX,
          y: targetY,
          duration: Phaser.Math.Between(minDuration, maxDuration),
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this.time.delayedCall(
              Phaser.Math.Between(80, 520),
              move
            );
          }
        };

        if (angleMax > 0) {
          tweenConfig.angle = targetAngle;
        }

        this.tweens.add(tweenConfig);
      };

      this.time.delayedCall(
        Phaser.Math.Between(0, 1600),
        move
      );
    };

    // True frame animation only for goldfish and clownfish.
    // The pace is ~1.6-1.9x slower than the previous test and each instance
    // has its own timing, so no two fish breathe/swim in sync.
    const addIrregularFrameAnimation = (sprite, fishName, flipX) => {
      const frames = [
        `${fishName}_f01`,
        `${fishName}_f02`,
        `${fishName}_f03`,
        `${fishName}_f02`,
        `${fishName}_f01`
      ];

      const isGoldfish = fishName === 'fish_01_goldfish';
      const isClown = fishName === 'fish_06_clownfish';

      const runCycle = () => {
        let step = 0;

        const advance = () => {
          sprite.setFrame(frames[step]);

          // The clownfish gets a tiny extra "turn" while the tail bends.
          // This is intentionally subtle: a small angle + horizontal compression,
          // not a visible rotation of the whole tile.
          if (isClown) {
            if (step === 1) {
              this.tweens.add({
                targets: sprite,
                scaleX: 0.266,
                angle: flipX ? 0.32 : -0.32,
                duration: Phaser.Math.Between(420, 560),
                ease: 'Sine.easeInOut'
              });
            } else if (step === 2) {
              this.tweens.add({
                targets: sprite,
                scaleX: 0.264,
                angle: flipX ? 0.46 : -0.46,
                duration: Phaser.Math.Between(440, 620),
                ease: 'Sine.easeInOut'
              });
            } else if (step >= 3) {
              this.tweens.add({
                targets: sprite,
                scaleX: 0.27,
                angle: 0,
                duration: Phaser.Math.Between(430, 620),
                ease: 'Sine.easeInOut'
              });
            }
          }

          step += 1;

          if (step < frames.length) {
            const transitionDelay = isGoldfish
              ? Phaser.Math.Between(420, 650)
              : Phaser.Math.Between(380, 590);

            this.time.delayedCall(transitionDelay, advance);
          } else {
            const restDelay = isGoldfish
              ? Phaser.Math.Between(650, 1650)
              : Phaser.Math.Between(550, 1450);

            this.time.delayedCall(restDelay, runCycle);
          }
        };

        advance();
      };

      this.time.delayedCall(
        Phaser.Math.Between(0, 2200),
        runCycle
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

        addIrregularWaterMotion(
          sprite,
          x,
          y,
          flipX,
          animatedFish.has(fishName)
            ? {
                yMax: 0.48,
                angleMax: fishName === 'fish_06_clownfish' ? 0 : 0.18,
                xMax: 0.08,
                minDuration: 2400,
                maxDuration: 4300
              }
            : {
                yMax: 0.72,
                angleMax: 0.30,
                xMax: 0.10,
                minDuration: 2300,
                maxDuration: 4200
              }
        );

        if (animatedFish.has(fishName)) {
          addIrregularFrameAnimation(sprite, fishName, flipX);
        }
      }
    }

    // Puffer: keep eye size unchanged. Inflation is frame-based only.
    // Slower timings and irregular pauses make the 3 available stages read softer.
    const puffer = this.add.sprite(
      860,
      285,
      'specials',
      'special_puffer_f01'
    );

    puffer.setOrigin(0.5, 0.5);
    puffer.setScale(0.36);

    addIrregularWaterMotion(
      puffer,
      860,
      285,
      false,
      {
        yMax: 0.48,
        angleMax: 0.16,
        xMax: 0.06,
        minDuration: 2800,
        maxDuration: 4600
      }
    );

    const runPufferCycle = () => {
      puffer.setFrame('special_puffer_f01');

      this.time.delayedCall(
        Phaser.Math.Between(650, 980),
        () => {
          puffer.setFrame('special_puffer_f02');

          this.time.delayedCall(
            Phaser.Math.Between(620, 860),
            () => {
              puffer.setFrame('special_puffer_f03');

              this.time.delayedCall(
                Phaser.Math.Between(900, 1350),
                () => {
                  puffer.setFrame('special_puffer_f02');

                  this.time.delayedCall(
                    Phaser.Math.Between(620, 860),
                    () => {
                      puffer.setFrame('special_puffer_f01');

                      this.time.delayedCall(
                        Phaser.Math.Between(950, 1750),
                        runPufferCycle
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    };

    this.time.delayedCall(
      Phaser.Math.Between(700, 1500),
      runPufferCycle
    );

    this.add.text(735, 105, 'Puffer inflation', {
      fontSize: '23px',
      color: '#ffffff'
    });

    this.add.text(
      700,
      455,
      'Goldfish + clownfish: slower irregular frame animation\nOthers: subtle irregular water sway',
      {
        fontSize: '16px',
        color: '#bfefff',
        align: 'center'
      }
    );
  }
}
