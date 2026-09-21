export default class SpecialElementsTestScene extends Phaser.Scene {
  constructor() {
    super('SpecialElementsTestScene');
  }

  preload() {
    const base = 'assets/test/specials/';
    this.load.image('special_star_test', base + 'special_star.png?v=3');
    this.load.image('special_octopus_test', base + 'special_octopus.png?v=3');
    this.load.image('special_pearl_test', base + 'special_pearl_shell.png?v=3');
    this.load.image('special_seaweed_bubble_test', base + 'special_seaweed_bubble.png?v=3');

    this.load.atlas(
      'specials',
      'assets/atlas/specials/specials_atlas.png?v=20260921-special-test-v3',
      'assets/atlas/specials/specials_atlas.json?v=20260921-special-test-v3'
    );
  }

  create() {
    this.cameras.main.setBackgroundColor('#05283b');

    this.add.text(500, 26, 'Дары глубин · тест спецэлементов v3', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    this.add.text(
      500,
      56,
      'Пузыри должны читаться как шары. Водоворот — круглая воронка. Ракушка — со скользящим бликом.',
      {
        fontSize: '13px',
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
      const layers = 12;

      for (let i = layers; i >= 1; i -= 1) {
        const t = i / layers;
        const alpha = 0.004 + Math.pow(1 - t, 2) * 0.028;
        const circle = this.add.circle(0, 0, radius * t, color, alpha);
        circle.setBlendMode(Phaser.BlendModes.ADD);
        aura.add(circle);
      }

      this.tweens.add({
        targets: aura,
        scale: { from: 0.96, to: 1.045 },
        alpha: { from: 0.76, to: 1.0 },
        duration: 2450,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      return aura;
    };

    const angleDistance = (a, b) => {
      let d = a - b;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      return d;
    };

    // True sphere -> local rim distortion -> true sphere again.
    // The whole object never stretches as an ellipse: only short arcs of the rim move.
    const createRoundBubble = (
      x,
      y,
      radius,
      {
        deformation = 5,
        lineAlpha = 0.88,
        fillAlpha = 0.028,
        phaseDelay = 0
      } = {}
    ) => {
      const outline = this.add.graphics();
      const highlight = this.add.graphics();

      // Eight local control zones around the rim.
      const state = {
        right: 0,
        lowerRight: 0,
        bottom: 0,
        lowerLeft: 0,
        left: 0,
        upperLeft: 0,
        top: 0,
        upperRight: 0
      };

      const centers = {
        right: 0,
        lowerRight: Math.PI * 0.25,
        bottom: Math.PI * 0.50,
        lowerLeft: Math.PI * 0.75,
        left: Math.PI,
        upperLeft: Math.PI * 1.25,
        top: Math.PI * 1.50,
        upperRight: Math.PI * 1.75
      };

      const angleDistance = (a, b) => {
        let d = a - b;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        return d;
      };

      const bump = (angle, center, amplitude, width = 0.19) => {
        if (Math.abs(amplitude) < 0.001) return 0;
        const d = angleDistance(angle, center);
        return amplitude * Math.exp(-(d * d) / (2 * width * width));
      };

      const offsetAt = (a) => {
        let offset = 0;
        for (const key of Object.keys(centers)) {
          offset += bump(a, centers[key], state[key]);
        }
        return offset;
      };

      const redraw = () => {
        outline.clear();
        outline.fillStyle(0xf2fdff, fillAlpha);
        outline.lineStyle(2.15, 0xf7feff, lineAlpha);
        outline.beginPath();

        const segments = 128;
        for (let i = 0; i <= segments; i += 1) {
          const a = (i / segments) * Math.PI * 2;
          const rr = radius + offsetAt(a);
          const px = x + Math.cos(a) * rr;
          const py = y + Math.sin(a) * rr;
          if (i === 0) outline.moveTo(px, py);
          else outline.lineTo(px, py);
        }

        outline.closePath();
        outline.fillPath();
        outline.strokePath();

        // One broken highlight: it follows the same changing rim,
        // so it still reads as one transparent bubble, not two borders.
        highlight.clear();
        highlight.lineStyle(5.2, 0xffffff, 0.19);
        highlight.beginPath();

        const arcStart = Math.PI * 1.08;
        const arcEnd = Math.PI * 1.37;
        for (let i = 0; i <= 24; i += 1) {
          const a = Phaser.Math.Linear(arcStart, arcEnd, i / 24);
          const rr = radius - 4 + offsetAt(a) * 0.62;
          const px = x + Math.cos(a) * rr;
          const py = y + Math.sin(a) * rr;
          if (i === 0) highlight.moveTo(px, py);
          else highlight.lineTo(px, py);
        }
        highlight.strokePath();
      };

      const zeroProfile = {
        right: 0,
        lowerRight: 0,
        bottom: 0,
        lowerLeft: 0,
        left: 0,
        upperLeft: 0,
        top: 0,
        upperRight: 0
      };

      // Hand-built profiles based on the user's sketch:
      // mostly circular, with only 2–3 local arcs displaced by ~5 px.
      const profiles = [
        {
          ...zeroProfile,
          upperLeft: deformation,
          top: -deformation * 0.52,
          left: -deformation * 0.24,
          bottom: deformation * 0.38
        },
        {
          ...zeroProfile,
          upperRight: deformation * 0.82,
          lowerLeft: deformation * 0.55,
          bottom: -deformation * 0.22,
          right: -deformation * 0.18
        },
        {
          ...zeroProfile,
          left: deformation * 0.72,
          upperLeft: -deformation * 0.34,
          lowerRight: deformation * 0.40
        }
      ];

      let profileIndex = 0;

      const tweenState = (target, duration, done) => {
        this.tweens.add({
          targets: state,
          ...target,
          duration,
          ease: 'Sine.easeInOut',
          onUpdate: redraw,
          onComplete: done
        });
      };

      const deformThenReturn = () => {
        const profile = profiles[profileIndex % profiles.length];
        profileIndex += 1;

        // Circle -> local deformation.
        tweenState(
          profile,
          Phaser.Math.Between(1500, 2100),
          () => {
            this.time.delayedCall(
              Phaser.Math.Between(180, 420),
              () => {
                // Local deformation -> exact circle.
                tweenState(
                  zeroProfile,
                  Phaser.Math.Between(1500, 2100),
                  () => {
                    this.time.delayedCall(
                      Phaser.Math.Between(650, 1250),
                      deformThenReturn
                    );
                  }
                );
              }
            );
          }
        );
      };

      redraw();
      this.time.delayedCall(phaseDelay + Phaser.Math.Between(200, 900), deformThenReturn);

      return { outline, highlight, state };
    };

    const addShellSweep = (x, y) => {
      const glint = this.add.container(x - 72, y - 7);

      const strip1 = this.add.rectangle(0, 0, 12, 104, 0xffffff, 0.00).setAngle(20);
      const strip2 = this.add.rectangle(-7, 0, 5, 104, 0xffffff, 0.00).setAngle(20);
      const strip3 = this.add.rectangle(8, 0, 5, 104, 0xffffff, 0.00).setAngle(20);

      strip1.setBlendMode(Phaser.BlendModes.ADD);
      strip2.setBlendMode(Phaser.BlendModes.ADD);
      strip3.setBlendMode(Phaser.BlendModes.ADD);
      glint.add([strip1, strip2, strip3]);

      const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
      maskShape.fillStyle(0xffffff);
      maskShape.fillEllipse(x, y - 8, 114, 98);
      glint.setMask(maskShape.createGeometryMask());

      const sweep = () => {
        glint.x = x - 74;
        glint.alpha = 0;

        strip1.setFillStyle(0xffffff, 0.22);
        strip2.setFillStyle(0xffffff, 0.10);
        strip3.setFillStyle(0xffffff, 0.08);

        this.tweens.add({
          targets: glint,
          x: x + 74,
          alpha: { from: 0, to: 1 },
          duration: 760,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this.tweens.add({
              targets: glint,
              alpha: 0,
              duration: 220,
              onComplete: () => {
                this.time.delayedCall(Phaser.Math.Between(2400, 4200), sweep);
              }
            });
          }
        });
      };

      this.time.delayedCall(1100, sweep);
    };

    // A circular top-down funnel. Fits comfortably inside a square cell.
    const createCircularVortex = (x, y) => {
      const container = this.add.container(x, y);
      const g = this.add.graphics();

      const drawArm = (offset, color, alpha, width, r0) => {
        g.lineStyle(width, color, alpha);
        g.beginPath();

        const turns = Math.PI * 4.1;
        const steps = 112;

        for (let i = 0; i <= steps; i += 1) {
          const t = i / steps;
          const a = offset + t * turns;
          const r = Phaser.Math.Linear(r0, 7, t);
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r; // deliberately circular, no Y squashing
          if (i === 0) g.moveTo(px, py);
          else g.lineTo(px, py);
        }

        g.strokePath();
      };

      drawArm(0.0, 0xcafcff, 0.78, 5.0, 70);
      drawArm(Math.PI * 0.66, 0x6ee4f4, 0.58, 4.2, 66);
      drawArm(Math.PI * 1.32, 0xffffff, 0.46, 2.6, 73);
      drawArm(Math.PI * 0.20, 0x269fca, 0.32, 7.5, 60);

      const holeOuter = this.add.circle(0, 0, 18, 0x063346, 0.72);
      const holeInner = this.add.circle(0, 0, 8, 0x010d13, 0.95);

      container.add([g, holeOuter, holeInner]);

      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * Math.PI * 2;
        const r = 58 + (i % 2) * 8;
        const drop = this.add.circle(
          Math.cos(a) * r,
          Math.sin(a) * r,
          1.8 + (i % 2) * 0.6,
          0xe4fdff,
          0.42
        );
        drop.setBlendMode(Phaser.BlendModes.ADD);
        container.add(drop);
      }

      this.tweens.add({
        targets: container,
        angle: 360,
        duration: 11200,
        repeat: -1,
        ease: 'Linear'
      });

      this.tweens.add({
        targets: g,
        scale: { from: 0.97, to: 1.025 },
        duration: 2700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      return container;
    };

    // 1. STAR A — current preferred direction
    {
      const [x, y] = positions[0];
      drawCard(x, y, 'Звезда A', 'свечение мягко растворяется');
      const aura = addGradientAura(x, y - 10, 76, 0xffc94d);
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

    // 2. STAR B — kept only for side-by-side comparison
    {
      const [x, y] = positions[1];
      drawCard(x, y, 'Звезда B', 'запасной вариант');
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

    // 3. OCTOPUS — unchanged, current version reads well
    {
      const [x, y] = positions[2];
      drawCard(x, y, 'Осьминог', 'оставлен как в удачном варианте');
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

    // 4. PEARL SHELL — periodic sliding glint across the pearl/interior
    {
      const [x, y] = positions[3];
      drawCard(x, y, 'Жемчужина', 'периодический скользящий блик');

      const glow = addGradientAura(x, y - 4, 48, 0xfff3dc);
      glow.setAlpha(0.60);

      const pearl = this.add.image(x, y - 8, 'special_pearl_test').setScale(0.45);
      randomFloat(pearl, y - 8, 3.2, 0.85, 2700, 4300);

      this.tweens.add({
        targets: pearl,
        scaleX: { from: 0.446, to: 0.454 },
        scaleY: { from: 0.447, to: 0.454 },
        duration: 2450,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      addShellSweep(x, y - 8);
    }

    // 5. SEAWEED BUBBLE — true sphere + local rim bends only
    {
      const [x, y] = positions[4];
      drawCard(x, y, 'Пузырь с водорослями', 'круглый шар, гуляет только часть кромки');

      const content = this.add.image(x, y - 12, 'special_seaweed_bubble_test').setScale(0.69);

      const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
      maskShape.fillStyle(0xffffff);
      maskShape.fillCircle(x, y - 12, 73);
      content.setMask(maskShape.createGeometryMask());

      createRoundBubble(x, y - 12, 82, {
        deformation: 5.0,
        lineAlpha: 0.92,
        fillAlpha: 0.036,
        phaseDelay: 100
      });

      // The seaweed itself stays almost unchanged.
      // The visible distortion belongs to the bubble rim, as in the sketch.
      this.tweens.add({
        targets: content,
        x: { from: x - 0.35, to: x + 0.35 },
        y: { from: y - 12.35, to: y - 11.65 },
        duration: 3900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // 6. AIR BUBBLE — also a true round sphere; no coloured enclosing ring
    {
      const [x, y] = positions[5];
      drawCard(x, y, 'Воздушный пузырь', 'круглый прозрачный шар');

      createRoundBubble(x, y - 12, 82, {
        deformation: 3.8,
        lineAlpha: 0.80,
        fillAlpha: 0.020,
        phaseDelay: 560
      });

      const glint1 = this.add.ellipse(x - 30, y - 48, 30, 9, 0xffffff, 0.18).setAngle(-28);
      const glint2 = this.add.circle(x + 33, y + 22, 3.2, 0xffffff, 0.16);
      glint1.setBlendMode(Phaser.BlendModes.ADD);
      glint2.setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: [glint1, glint2],
        alpha: { from: 0.08, to: 0.22 },
        duration: 1900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // 7. VORTEX — circular footprint, reads as a funnel inside a square cell
    {
      const [x, y] = positions[6];
      drawCard(x, y, 'Водоворот', 'круглая воронка в квадратной клетке');
      createCircularVortex(x, y - 10);
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
