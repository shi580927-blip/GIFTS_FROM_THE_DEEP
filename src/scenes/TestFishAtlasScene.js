export default class TestFishAtlasScene extends Phaser.Scene {
  constructor() {
    super('TestFishAtlasScene');
  }

  preload() {
    this.load.atlas(
      'fish',
      'assets/atlas/fish/fish_atlas.png?v=20260921-static-sway-v3',
      'assets/atlas/fish/fish_atlas.json?v=20260921-static-sway-v3'
    );

    this.load.atlas(
      'specials',
      'assets/atlas/specials/specials_atlas.png?v=20260921-static-sway-v3',
      'assets/atlas/specials/specials_atlas.json?v=20260921-static-sway-v3'
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

    const addIrregularWaterMotion = (
      sprite,
      baseX,
      baseY,
      flipX,
      {
        yMax = 0.42,
        angleMax = 0.10,
        minDuration = 3000,
        maxDuration = 5500
      } = {}
    ) => {
      const move = () => {
        const targetY = baseY + Phaser.Math.FloatBetween(-yMax, yMax);
        const rawAngle = Phaser.Math.FloatBetween(-angleMax, angleMax);

        this.tweens.add({
          targets: sprite,
          y: targetY,
          angle: flipX ? -rawAngle : rawAngle,
          duration: Phaser.Math.Between(minDuration, maxDuration),
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this.time.delayedCall(
              Phaser.Math.Between(120, 720),
              move
            );
          }
        });
      };

      this.time.delayedCall(
        Phaser.Math.Between(0, 2200),
        move
      );
    };

    const addRefinedFishAnimation = (sprite, fishName) => {
      const frames = Array.from(
        { length: 7 },
        (_, index) => `${fishName}_f${String(index + 1).padStart(2, '0')}`
      );

      const runCycle = () => {
        let step = 0;

        const advance = () => {
          sprite.setFrame(frames[step]);
          step += 1;

          if (step < frames.length) {
            const delay = fishName === 'fish_01_goldfish'
              ? Phaser.Math.Between(290, 430)
              : Phaser.Math.Between(300, 450);

            this.time.delayedCall(delay, advance);
          } else {
            this.time.delayedCall(
              Phaser.Math.Between(650, 1650),
              runCycle
            );
          }
        };

        advance();
      };

      this.time.delayedCall(
        Phaser.Math.Between(250, 2600),
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

        if (animatedFish.has(fishName)) {
          addIrregularWaterMotion(
            sprite,
            x,
            y,
            flipX,
            {
              yMax: 0.28,
              angleMax: 0.06,
              minDuration: 3400,
              maxDuration: 5600
            }
          );
          addRefinedFishAnimation(sprite, fishName);
        } else {
          addIrregularWaterMotion(
            sprite,
            x,
            y,
            flipX,
            {
              // These four fish use one visual frame, so the motion must be
              // visible enough to read on screen, but still feel like they
              // are holding position in a gentle underwater current.
              // 1000x720 scene is scaled down strongly on phones, so sub-pixel
              // scene movement was effectively invisible. Keep it gentle, but
              // make the amplitude survive mobile FIT scaling.
              yMax: Phaser.Math.FloatBetween(3.60, 5.20),
              angleMax: Phaser.Math.FloatBetween(1.05, 1.55),
              minDuration: 2600,
              maxDuration: 4400
            }
          );
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

    addIrregularWaterMotion(
      puffer,
      860,
      285,
      false,
      {
        yMax: 0.22,
        angleMax: 0.05,
        minDuration: 3800,
        maxDuration: 6200
      }
    );

    const pufferFrames = [
      'special_puffer_f01',
      'special_puffer_f02',
      'special_puffer_f03',
      'special_puffer_f04',
      'special_puffer_f05',
      'special_puffer_f04',
      'special_puffer_f03',
      'special_puffer_f02',
      'special_puffer_f01'
    ];

    const runPufferCycle = () => {
      let step = 0;

      const advance = () => {
        puffer.setFrame(pufferFrames[step]);
        step += 1;

        if (step < pufferFrames.length) {
          this.time.delayedCall(
            Phaser.Math.Between(300, 470),
            advance
          );
        } else {
          this.time.delayedCall(
            Phaser.Math.Between(900, 1750),
            runPufferCycle
          );
        }
      };

      advance();
    };

    this.time.delayedCall(
      Phaser.Math.Between(700, 1800),
      runPufferCycle
    );

    this.add.text(735, 105, 'Puffer inflation · 5 stages', {
      fontSize: '22px',
      color: '#ffffff'
    });

    this.add.text(
      680,
      455,
      'Goldfish + clownfish: 7 refined frames, irregular timing\nOthers: clearly visible gentle unsynchronised water sway',
      {
        fontSize: '16px',
        color: '#bfefff',
        align: 'center'
      }
    );
  }
}
