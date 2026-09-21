export default class SpecialElementsTestScene extends Phaser.Scene {
  constructor() {
    super('SpecialElementsTestScene');
  }

  preload() {
    const base = 'assets/test/specials/';
    this.load.image('special_star_test', base + 'special_star.png?v=2');
    this.load.image('special_octopus_test', base + 'special_octopus.png?v=2');
    this.load.image('special_pearl_test', base + 'special_pearl_shell.png?v=2');
    this.load.image('special_seaweed_bubble_test', base + 'special_seaweed_bubble.png?v=2');

    this.load.atlas(
      'specials',
      'assets/atlas/specials/specials_atlas.png?v=20260921-special-test-v2',
      'assets/atlas/specials/specials_atlas.json?v=20260921-special-test-v2'
    );
  }

  create() {
    this.cameras.main.setBackgroundColor('#05283b');

    this.add.text(500, 26, 'Дары глубин · тест анимации спецэлементов', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    this.add.text(
      500,
      56,
      'Сейчас это именно тест — ничего нового здесь не фиксируем до просмотра.',
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
      g.fillStyle(0x0a3145, 0.34);
      g.lineStyle(1, 0xffffff, 0.07);
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

    const randomFloat = (
      sprite,
      baseY,
      amount = 3,
      angleAmount = 0.8,
      minDuration = 2200,
      maxDuration = 4200
    ) => {
      const next = () => {
        this.tweens.add({
          targets: sprite,
          y: baseY + Phaser.Math.FloatBetween(-amount, amount),
          angle: Phaser.Math.FloatBetween(-angleAmount, angleAmount),
          duration: Phaser.Math.Between(minDuration, maxDuration),
          ease: 'Sine.easeInOut',
          onComplete: () => this.time.delayedCall(Phaser.Math.Between(80, 500), next)
        });
      };
      this.time.delayedCall(Phaser.Math.Between(0, 900), next);
    };

    const addSparkles = (x, y, radius = 58, count = 5) => {
      for (let i = 0; i < count; i += 1) {
        const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const r = Phaser.Math.FloatBetween(radius * 0.62, radius);
        const s = this.add.circle(
          x + Math.cos(a) * r,
          y + Math.sin(a) * r,
          Phaser.Math.FloatBetween(1.2, 2.2),
          0xffffff,
          Phaser.Math.FloatBetween(0.08, 0.26)
        );
        s.setBlendMode(Phaser.BlendModes.ADD);

        this.tweens.add({
          targets: s,
          alpha: Phaser.Math.FloatBetween(0.35, 0.75),
          scale: Phaser.Math.FloatBetween(1.2, 1.7),
          duration: Phaser.Math.Between(750, 1450),
          yoyo: true,
          repeat: -1,
          delay: Phaser.Math.Between(0, 1100),
          ease: 'Sine.easeInOut'
        });
      }
    };

    const addGradientAura = (x, y, radius, color) => {
      const aura = this.add.container(x, y);
      const layers = 9;

      for (let i = layers; i >= 1; i -= 1) {
        const t = i / layers;
        const circle = this.add.circle(
          0,
          0,
          radius * t,
          color,
          0.008 + (1 - t) * 0.022
        );
        circle.setBlendMode(Phaser.BlendModes.ADD);
        aura.add(circle);
      }

      this.tweens.add({
        targets: aura,
        scale: { from: 0.94, to: 1.06 },
        alpha: { from: 0.72, to: 1.0 },
        duration: 2300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      return aura;
    };

    // Code-only bubble outline with local quadrant deformation.
    // Four radial values are smoothly interpolated around the circumference.
    const createSoftBubble = (
      x,
      y,
      radius,
      {
        deformation = 5,
        fillAlpha = 0.018,
        lineAlpha = 0.72,
        lineWidth = 1.7,
        phaseDelay = 0
      } = {}
    ) => {
      const outline = this.add.graphics();
      const highlight = this.add.graphics();
      const state = {
        q0: 0,
        q1: 0,
        q2: 0,
        q3: 0
      };

      const values = () => [state.q0, state.q1, state.q2, state.q3];

      const smooth = (t) => t * t * (3 - 2 * t);

      const radiusOffset = (angle) => {
        const normalized = ((angle + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2);
        const p = normalized * 4;
        const i = Math.floor(p) % 4;
        const j = (i + 1) % 4;
        const t = smooth(p - Math.floor(p));
        const q = values();
        return Phaser.Math.Linear(q[i], q[j], t);
      };

      const redraw = () => {
        outline.clear();
        outline.fillStyle(0xbcefff, fillAlpha);
        outline.lineStyle(lineWidth, 0xe8fbff, lineAlpha);
        outline.beginPath();

        const segments = 72;
        for (let i = 0; i <= segments; i += 1) {
          const a = (i / segments) * Math.PI * 2;
          const rr = radius + radiusOffset(a);
          const px = x + Math.cos(a) * rr;
          const py = y + Math.sin(a) * rr;
          if (i === 0) outline.moveTo(px, py);
          else outline.lineTo(px, py);
        }
        outline.closePath();
        outline.fillPath();
        outline.strokePath();

        // Only a partial white reflection, not a second coloured boundary.
        highlight.clear();
        highlight.lineStyle(4.2, 0xffffff, 0.12);
        highlight.beginPath();
        const start = Math.PI * 1.10;
        const end = Math.PI * 1.48;
        for (let i = 0; i <= 16; i += 1) {
          const a = Phaser.Math.Linear(start, end, i / 16);
          const rr = radius - 5 + radiusOffset(a) * 0.7;
          const px = x + Math.cos(a) * rr;
          const py = y + Math.sin(a) * rr;
          if (i === 0) highlight.moveTo(px, py);
          else highlight.lineTo(px, py);
        }
        highlight.strokePath();
      };

      const morph = () => {
        this.tweens.add({
          targets: state,
          q0: Phaser.Math.FloatBetween(-deformation, deformation),
          q1: Phaser.Math.FloatBetween(-deformation, deformation),
          q2: Phaser.Math.FloatBetween(-deformation, deformation),
          q3: Phaser.Math.FloatBetween(-deformation, deformation),
          duration: Phaser.Math.Between(2300, 3900),
          ease: 'Sine.easeInOut',
          onUpdate: redraw,
          onComplete: () => {
            this.time.delayedCall(Phaser.Math.Between(150, 650), morph);
          }
        });
      };

      redraw();
      this.time.delayedCall(phaseDelay + Phaser.Math.Between(0, 900), morph);

      return { outline, highlight, state };
    };

    const createVortex = (x, y) => {
      const container = this.add.container(x, y);
      const g = this.add.graphics();

      // Dark central depth gives a clear "funnel" instead of a bubble.
      const holeOuter = this.add.ellipse(0, 0, 46, 32, 0x06384d, 0.48);
      const holeInner = this.add.ellipse(0, 0, 23, 15, 0x01141d, 0.88);

      const drawArm = (offset, color, alpha, width, radialOffset = 0) => {
        g.lineStyle(width, color, alpha);
        g.beginPath();

        const turns = Math.PI * 3.7;
        const steps = 92;

        for (let i = 0; i <= steps; i += 1) {
          const t = i / steps;
          const a = offset + t * turns;
          const r = Phaser.Math.Linear(72 + radialOffset, 7, t);
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r * 0.72;
          if (i === 0) g.moveTo(px, py);
          else g.lineTo(px, py);
        }

        g.strokePath();
      };

      drawArm(0.0, 0xbdf8ff, 0.82, 5.0);
      drawArm(Math.PI * 0.67, 0x57dff2, 0.60, 4.0, -3);
      drawArm(Math.PI * 1.34, 0xffffff, 0.48, 2.4, 4);
      drawArm(Math.PI * 0.20, 0x31a8d4, 0.38, 7.0, 6);

      container.add([g, holeOuter, holeInner]);

      // A few orbiting droplets — no enclosing circle.
      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * Math.PI * 2;
        const r = 56 + (i % 2) * 10;
        const drop = this.add.circle(
          Math.cos(a) * r,
          Math.sin(a) * r * 0.72,
          2.0 + (i % 3) * 0.55,
          0xd9fbff,
          0.55
        );
        drop.setBlendMode(Phaser.BlendModes.ADD);
        container.add(drop);
      }

      this.tweens.add({
        targets: container,
        angle: 360,
        duration: 11500,
        repeat: -1,
        ease: 'Linear'
      });

      this.tweens.add({
        targets: [g, holeOuter],
        scaleX: { from: 0.97, to: 1.035 },
        scaleY: { from: 1.03, to: 0.975 },
        duration: 2600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      return container;
    };

    // 1. STAR A — softer gradient aura
    {
      const [x, y] = positions[0];
      drawCard(x, y, 'Звезда A', 'градиентное свечение');
      const aura = addGradientAura(x, y - 10, 74, 0xffc94d);
      const star = this.add.image(x, y - 10, 'special_star_test').setScale(0.42);

      this.tweens.add({
        targets: star,
        scaleX: { from: 0.414, to: 0.427 },
        scaleY: { from: 0.414, to: 0.427 },
        duration: 2200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      addSparkles(x, y - 10, 66, 4);
      aura.setDepth(star.depth - 1);
    }

    // 2. STAR B — simple motion
    {
      const [x, y] = positions[1];
      drawCard(x, y, 'Звезда B', 'наклон + искры');
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

    // 3. OCTOPUS — soft body motion, no bubble
    {
      const [x, y] = positions[2];
      drawCard(x, y, 'Осьминог', 'плавает и слегка "дышит"');
      const octo = this.add.image(x, y - 8, 'special_octopus_test').setScale(0.41);
      randomFloat(octo, y - 8, 4.2, 1.1, 2100, 3700);

      this.tweens.add({
        targets: octo,
        scaleX: { from: 0.402, to: 0.420 },
        scaleY: { from: 0.419, to: 0.402 },
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // 4. PEARL — movement made deliberately visible for this test
    {
      const [x, y] = positions[3];
      drawCard(x, y, 'Жемчужина', 'покачивание + дыхание света');

      const glow = addGradientAura(x, y - 4, 49, 0xfff3dc);
      glow.setAlpha(0.72);

      const pearl = this.add.image(x, y - 8, 'special_pearl_test').setScale(0.45);
      randomFloat(pearl, y - 8, 5.0, 1.35, 2300, 3900);

      this.tweens.add({
        targets: pearl,
        scaleX: { from: 0.444, to: 0.456 },
        scaleY: { from: 0.448, to: 0.455 },
        duration: 2200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      addSparkles(x, y - 4, 52, 3);
    }

    // 5. SEAWEED BUBBLE — large, with a locally deforming CODE-DRAWN edge
    {
      const [x, y] = positions[4];
      drawCard(x, y, 'Пузырь с водорослями', 'край гуляет локально примерно на 5 px');

      const content = this.add.image(x, y - 13, 'special_seaweed_bubble_test').setScale(0.69);

      // Hide the original outer blue shell; keep only the seaweed/water contents.
      const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
      maskShape.fillStyle(0xffffff);
      maskShape.fillCircle(x, y - 13, 69);
      content.setMask(maskShape.createGeometryMask());

      createSoftBubble(x, y - 13, 82, {
        deformation: 5.4,
        fillAlpha: 0.010,
        lineAlpha: 0.76,
        lineWidth: 1.65,
        phaseDelay: 180
      });

      // The contents move less than the edge: slight water refraction feeling.
      this.tweens.add({
        targets: content,
        x: { from: x - 1.2, to: x + 1.2 },
        y: { from: y - 14.2, to: y - 11.8 },
        scaleX: { from: 0.683, to: 0.697 },
        scaleY: { from: 0.697, to: 0.683 },
        duration: 3400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // 6. AIR BUBBLE — pure bubble, no blue/cyan outer ring asset
    {
      const [x, y] = positions[5];
      drawCard(x, y, 'Воздушный пузырь', 'только прозрачная оболочка');

      createSoftBubble(x, y - 13, 82, {
        deformation: 5.8,
        fillAlpha: 0.008,
        lineAlpha: 0.70,
        lineWidth: 1.55,
        phaseDelay: 620
      });

      // Small interior highlights only, not another circular boundary.
      const glint1 = this.add.ellipse(x - 31, y - 48, 29, 9, 0xffffff, 0.16).setAngle(-28);
      const glint2 = this.add.circle(x + 33, y + 21, 3.4, 0xffffff, 0.17);
      glint1.setBlendMode(Phaser.BlendModes.ADD);
      glint2.setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: [glint1, glint2],
        alpha: { from: 0.08, to: 0.23 },
        duration: 1700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // 7. VORTEX — actual funnel, no bubble shell
    {
      const [x, y] = positions[6];
      drawCard(x, y, 'Водоворот', 'воронка без пузыря');
      createVortex(x, y - 10);
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
      randomFloat(puffer, y - 9, 1.8, 0.4, 3200, 5200);
    }
  }
}
