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

    const addLivingFish = (x, y, fishName, flipX) => {
      const sprite = this.add.sprite(
        x,
        y,
        'fish',
        `${fishName}_f01`
      );

      sprite.setOrigin(0.5, 0.5);
      sprite.setScale(0.28);
      sprite.setFlipX(flipX);

      // Use a single art frame for idle.
      // The current f02/f03 images are shape variations, not true in-betweens,
      // so switching them creates visible jumps. Idle motion is code-only.
      const baseScale = 0.28;
      const breathAmount = Phaser.Math.FloatBetween(0.002, 0.004);
      const yAmount = Phaser.Math.FloatBetween(0.35, 0.8);
      const angleAmount = Phaser.Math.FloatBetween(0.18, 0.42);
      const duration = Phaser.Math.Between(1900, 3000);

      this.tweens.add({
        targets: sprite,
        scaleX: baseScale + breathAmount,
        scaleY: baseScale - breathAmount * 0.55,
        duration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 900)
      });

      this.tweens.add({
        targets: sprite,
        y: y + yAmount,
        angle: flipX ? -angleAmount : angleAmount,
        duration: duration + Phaser.Math.Between(250, 700),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 1200)
      });

      return sprite;
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

        addLivingFish(
          x,
          y,
          fishName,
          (row + col) % 2 === 0
        );
      }
    }

    // Puffer stages are shown statically here.
    // This lets us evaluate the drawings themselves without frame-switch flashing.
    const pufferY = 275;
    const pufferXs = [790, 865, 945];
    const pufferFrames = [
      'special_puffer_f01',
      'special_puffer_f02',
      'special_puffer_f03'
    ];
    const pufferScales = [0.30, 0.30, 0.30];

    pufferFrames.forEach((frame, index) => {
      const puffer = this.add.sprite(
        pufferXs[index],
        pufferY,
        'specials',
        frame
      );

      puffer
        .setOrigin(0.5, 0.5)
        .setScale(pufferScales[index]);
    });

    this.add.text(770, 120, 'Puffer stages', {
      fontSize: '24px',
      color: '#ffffff'
    });

    this.add.text(760, 430, 'Idle: code-only motion, no frame swapping', {
      fontSize: '18px',
      color: '#bfefff'
    });
  }
}
