export default class SpecialElementsTestScene extends Phaser.Scene {
  constructor() {
    super('SpecialElementsTestScene');
  }

  preload() {
    const base = 'assets/test/specials/';
    this.load.image('special_star_test', base + 'special_star.png?v=1');
    this.load.image('special_octopus_test', base + 'special_octopus.png?v=1');
    this.load.image('special_pearl_test', base + 'special_pearl_shell.png?v=1');
    this.load.image('special_vortex_test', base + 'special_vortex.png?v=1');
    this.load.image('special_seaweed_bubble_test', base + 'special_seaweed_bubble.png?v=1');
    this.load.image('special_air_bubble_test', base + 'special_air_bubble.png?v=1');

    this.load.atlas(
      'specials',
      'assets/atlas/specials/specials_atlas.png?v=20260921-special-test',
      'assets/atlas/specials/specials_atlas.json?v=20260921-special-test'
    );
  }

  create() {
    this.cameras.main.setBackgroundColor('#05283b');

    this.add.text(500, 28, 'Дары глубин · тест анимации спецэлементов', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    this.add.text(
      500,
      58,
      'У каждого элемента свой тип движения. Линза — только у пузырей.',
      {
        fontSize: '14px',
        color: '#a9dbea',
        fontFamily: 'Arial, sans-serif'
      }
    ).setOrigin(0.5);

    const positions = [
      [130, 210],
      [375, 210],
      [625, 210],
      [870, 210],
      [130, 505],
      [375, 505],
      [625, 505],
      [870, 505]
    ];

    const drawCard = (x, y, title, subtitle = '') => {
      const g = this.add.graphics();
      g.fillStyle(0x0a3a50, 0.46);
      g.lineStyle(1, 0x8bd8ea, 0.18);
      g.fillRoundedRect(x - 108, y - 118, 216, 236, 18);
      g.strokeRoundedRect(x - 108, y - 118, 216, 236, 18);

      this.add.text(x, y + 82, title, {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        align: 'center'
      }).setOrigin(0.5);

      if (subtitle) {
        this.add.text(x, y + 104, subtitle, {
          fontSize: '11px',
          color: '#9dd3df',
          fontFamily: 'Arial, sans-serif',
          align: 'center',
          wordWrap: { width: 190 }
        }).setOrigin(0.5);
      }
    };

    const randomFloat = (sprite, baseY, amount = 3, minDuration = 2200, maxDuration = 4200) => {
      const next = () => {
        this.tweens.add({
          targets: sprite,
          y: baseY + Phaser.Math.FloatBetween(-amount, amount),
          angle: Phaser.Math.FloatBetween(-0.7, 0.7),
          duration: Phaser.Math.Between(minDuration, maxDuration),
          ease: 'Sine.easeInOut',
          onComplete: () => this.time.delayedCall(Phaser.Math.Between(80, 500), next)
        });
      };
      this.time.delayedCall(Phaser.Math.Between(0, 900), next);
    };

    const addSparkles = (x, y, radius = 58, count = 5) => {
      const stars = [];
      for (let i = 0; i < count; i += 1) {
        const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const r = Phaser.Math.FloatBetween(radius * 0.62, radius);
        const s = this.add.circle(
          x + Math.cos(a) * r,
          y + Math.sin(a) * r,
          Phaser.Math.FloatBetween(1.4, 2.6),
          0xffffff,
          Phaser.Math.FloatBetween(0.12, 0.38)
        );
        s.setBlendMode(Phaser.BlendModes.ADD);
        stars.push(s);

        this.tweens.add({
          targets: s,
          alpha: Phaser.Math.FloatBetween(0.55, 0.95),
          scale: Phaser.Math.FloatBetween(1.4, 2.0),
          duration: Phaser.Math.Between(650, 1250),
          yoyo: true,
          repeat: -1,
          delay: Phaser.Math.Between(0, 1000),
          ease: 'Sine.easeInOut'
        });
      }
      return stars;
    };

    const addLensHighlight = (x, y, width = 74) => {
      const highlight = this.add.ellipse(x - 23, y - 34, width, 18, 0xffffff, 0.08);
      highlight.setBlendMode(Phaser.BlendModes.ADD);

      const move = () => {
        this.tweens.add({
          targets: highlight,
          x: x + Phaser.Math.FloatBetween(-30, 10),
          y: y + Phaser.Math.FloatBetween(-42, -24),
          alpha: Phaser.Math.FloatBetween(0.045, 0.12),
          scaleX: Phaser.Math.FloatBetween(0.85, 1.12),
          duration: Phaser.Math.Between(2400, 4200),
          ease: 'Sine.easeInOut',
          onComplete: () => this.time.delayedCall(Phaser.Math.Between(120, 600), move)
        });
      };
      move();
      return highlight;
    };

    const animateLens = (sprite, baseScale, strength = 0.022) => {
      const move = () => {
        const d = Phaser.Math.FloatBetween(-strength, strength);
        this.tweens.add({
          targets: sprite,
          scaleX: baseScale * (1 + d),
          scaleY: baseScale * (1 - d * 0.78),
          angle: Phaser.Math.FloatBetween(-0.42, 0.42),
          duration: Phaser.Math.Between(1900, 3300),
          ease: 'Sine.easeInOut',
          onComplete: () => this.time.delayedCall(Phaser.Math.Between(80, 480), move)
        });
      };
      this.time.delayedCall(Phaser.Math.Between(0, 1000), move);
    };

    // 1. STAR A — breathing light
    {
      const [x, y] = positions[0];
      drawCard(x, y, 'Звезда A', 'мягкое свечение');
      const aura = this.add.circle(x, y - 10, 72, 0xffcf45, 0.10);
      aura.setBlendMode(Phaser.BlendModes.ADD);
      const star = this.add.image(x, y - 10, 'special_star_test').setScale(0.42);

      this.tweens.add({
        targets: [star, aura],
        scaleX: '+=0.025',
        scaleY: '+=0.025',
        alpha: { from: 0.82, to: 1 },
        duration: 2100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      addSparkles(x, y - 10, 66, 4);
    }

    // 2. STAR B — gentle water shimmer / tilt
    {
      const [x, y] = positions[1];
      drawCard(x, y, 'Звезда B', 'легкий наклон + искры');
      const star = this.add.image(x, y - 10, 'special_star_test').setScale(0.42);
      this.tweens.add({
        targets: star,
        angle: { from: -1.2, to: 1.2 },
        scaleX: { from: 0.414, to: 0.428 },
        scaleY: { from: 0.428, to: 0.414 },
        duration: 2500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      addSparkles(x, y - 10, 68, 6);
    }

    // 3. OCTOPUS — soft body motion, no lens
    {
      const [x, y] = positions[2];
      drawCard(x, y, 'Осьминог', 'плавает и слегка "дышит"');
      const octo = this.add.image(x, y - 8, 'special_octopus_test').setScale(0.41);
      randomFloat(octo, y - 8, 3.6, 2200, 3900);

      this.tweens.add({
        targets: octo,
        scaleX: { from: 0.405, to: 0.418 },
        scaleY: { from: 0.416, to: 0.403 },
        duration: 1700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // 4. PEARL — shell stays calm, pearl light breathes
    {
      const [x, y] = positions[3];
      drawCard(x, y, 'Жемчужина', 'свет жемчужины + покачивание');

      const glow = this.add.circle(x, y - 4, 35, 0xfff2de, 0.12);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      const pearl = this.add.image(x, y - 8, 'special_pearl_test').setScale(0.43);
      randomFloat(pearl, y - 8, 2.4, 3000, 5000);

      this.tweens.add({
        targets: glow,
        alpha: { from: 0.06, to: 0.26 },
        scale: { from: 0.9, to: 1.22 },
        duration: 1900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      addSparkles(x, y - 4, 54, 3);
    }

    // 5. SEAWEED BUBBLE — this is the water-lens deformation
    {
      const [x, y] = positions[4];
      drawCard(x, y, 'Пузырь с водорослями', 'мягкая линза / перетягивание');
      const bubble = this.add.image(x, y - 9, 'special_seaweed_bubble_test').setScale(0.43);
      animateLens(bubble, 0.43, 0.026);
      addLensHighlight(x, y - 9, 72);
    }

    // 6. AIR BUBBLE — a little freer deformation than seaweed
    {
      const [x, y] = positions[5];
      drawCard(x, y, 'Воздушный пузырь', 'чуть более свободная линза');
      const bubble = this.add.image(x, y - 9, 'special_air_bubble_test').setScale(0.43);
      animateLens(bubble, 0.43, 0.034);
      addLensHighlight(x, y - 9, 82);
    }

    // 7. VORTEX — spin, pulse and water float
    {
      const [x, y] = positions[6];
      drawCard(x, y, 'Водоворот', 'медленное вращение + пульсация');
      const vortex = this.add.image(x, y - 9, 'special_vortex_test').setScale(0.43);

      this.tweens.add({
        targets: vortex,
        angle: 360,
        duration: 15000,
        repeat: -1,
        ease: 'Linear'
      });

      this.tweens.add({
        targets: vortex,
        scaleX: { from: 0.422, to: 0.438 },
        scaleY: { from: 0.438, to: 0.422 },
        duration: 2800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // 8. PUFFER — approved 5-stage animation
    {
      const [x, y] = positions[7];
      drawCard(x, y, 'Иглобрюх', 'утвержденные 5 стадий');
      const puffer = this.add.sprite(x, y - 9, 'specials', 'special_puffer_f01').setScale(0.39);

      const frames = [
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

      const cycle = () => {
        let i = 0;
        const next = () => {
          puffer.setFrame(frames[i]);
          i += 1;
          if (i < frames.length) {
            this.time.delayedCall(Phaser.Math.Between(320, 480), next);
          } else {
            this.time.delayedCall(Phaser.Math.Between(1000, 1800), cycle);
          }
        };
        next();
      };

      this.time.delayedCall(700, cycle);
      randomFloat(puffer, y - 9, 1.8, 3200, 5200);
    }
  }
}
