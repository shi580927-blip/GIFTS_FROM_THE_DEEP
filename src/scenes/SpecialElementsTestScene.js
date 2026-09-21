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


    // Deforms the ORIGINAL bubble image itself. No extra ring is drawn around it.
    // The source image is split into narrow angular sectors and each sector is
    // moved radially by only a few source pixels, so the painted rim itself "floats".
    const createWarpedImageBubble = (
      x,
      y,
      sourceKey,
      runtimeKey,
      displayScale,
      {
        centerX = 192,
        centerY = 161,
        bubbleRadius = 108,
        deformation = 5
      } = {}
    ) => {
      if (this.textures.exists(runtimeKey)) {
        this.textures.remove(runtimeKey);
      }

      const source = this.textures.get(sourceKey).getSourceImage();
      const width = source.width;
      const height = source.height;
      const texture = this.textures.createCanvas(runtimeKey, width, height);
      const ctx = texture.context;

      const state = {
        upperLeft: 0,
        top: 0,
        lowerLeft: 0,
        bottom: 0,
        right: 0
      };

      const centers = {
        upperLeft: Math.PI * 1.25,
        top: Math.PI * 1.50,
        lowerLeft: Math.PI * 0.75,
        bottom: Math.PI * 0.50,
        right: 0
      };

      const angleDistance = (a, b) => {
        let d = a - b;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        return d;
      };

      const offsetAt = (a) => {
        let offset = 0;
        for (const key of Object.keys(centers)) {
          const d = angleDistance(a, centers[key]);
          const widthRad = key === 'top' ? 0.23 : 0.20;
          offset += state[key] * Math.exp(-(d * d) / (2 * widthRad * widthRad));
        }
        return offset;
      };

      let lastDraw = 0;

      const redraw = (force = false) => {
        const now = performance.now();
        if (!force && now - lastDraw < 42) return;
        lastDraw = now;

        ctx.clearRect(0, 0, width, height);

        const sectors = 56;
        const farRadius = Math.max(width, height) * 1.7;

        for (let i = 0; i < sectors; i += 1) {
          const a0 = (i / sectors) * Math.PI * 2;
          const a1 = ((i + 1) / sectors) * Math.PI * 2;
          const mid = (a0 + a1) * 0.5;
          const localOffset = offsetAt(mid);
          const radialScale = 1 + localOffset / bubbleRadius;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(
            centerX,
            centerY,
            farRadius,
            a0 - 0.002,
            a1 + 0.002
          );
          ctx.closePath();
          ctx.clip();

          ctx.translate(centerX, centerY);
          ctx.scale(radialScale, radialScale);
          ctx.drawImage(source, -centerX, -centerY, width, height);
          ctx.restore();
        }

        texture.refresh();
      };

      const profiles = [
        {
          upperLeft: deformation,
          top: -deformation * 0.50,
          lowerLeft: 0,
          bottom: deformation * 0.38,
          right: 0
        },
        {
          upperLeft: 0,
          top: deformation * 0.58,
          lowerLeft: -deformation * 0.32,
          bottom: deformation * 0.18,
          right: deformation * 0.42
        },
        {
          upperLeft: -deformation * 0.26,
          top: 0,
          lowerLeft: deformation * 0.62,
          bottom: -deformation * 0.30,
          right: deformation * 0.22
        }
      ];

      const zero = {
        upperLeft: 0,
        top: 0,
        lowerLeft: 0,
        bottom: 0,
        right: 0
      };

      let profileIndex = 0;

      const tweenProfile = (target, duration, done) => {
        this.tweens.add({
          targets: state,
          ...target,
          duration,
          ease: 'Sine.easeInOut',
          onUpdate: () => redraw(false),
          onComplete: done
        });
      };

      const cycle = () => {
        const profile = profiles[profileIndex % profiles.length];
        profileIndex += 1;

        tweenProfile(profile, Phaser.Math.Between(1600, 2200), () => {
          this.time.delayedCall(Phaser.Math.Between(180, 420), () => {
            tweenProfile(zero, Phaser.Math.Between(1600, 2200), () => {
              this.time.delayedCall(Phaser.Math.Between(650, 1200), cycle);
            });
          });
        });
      };

      redraw(true);
      const image = this.add.image(x, y, runtimeKey).setScale(displayScale);
      this.time.delayedCall(Phaser.Math.Between(300, 900), cycle);

      return image;
    };

    // A single code-drawn air bubble. Its soft edge IS the bubble; there is no
    // second blue/cyan ring around it.
    const createProceduralAirBubble = (x, y, radius = 82) => {
      const size = 210;
      const cx = size / 2;
      const cy = size / 2;
      const key = 'runtime_air_bubble_v4';

      if (this.textures.exists(key)) {
        this.textures.remove(key);
      }

      const texture = this.textures.createCanvas(key, size, size);
      const ctx = texture.context;

      const state = {
        upperLeft: 0,
        bottom: 0,
        right: 0
      };

      const angleDistance = (a, b) => {
        let d = a - b;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        return d;
      };

      const offsetAt = (a) => {
        const gaussian = (center, amp, w) => {
          const d = angleDistance(a, center);
          return amp * Math.exp(-(d * d) / (2 * w * w));
        };

        return (
          gaussian(Math.PI * 1.25, state.upperLeft, 0.21) +
          gaussian(Math.PI * 0.50, state.bottom, 0.22) +
          gaussian(0, state.right, 0.20)
        );
      };

      const makePath = () => {
        const p = new Path2D();
        const segments = 120;

        for (let i = 0; i <= segments; i += 1) {
          const a = (i / segments) * Math.PI * 2;
          const rr = radius + offsetAt(a);
          const px = cx + Math.cos(a) * rr;
          const py = cy + Math.sin(a) * rr;
          if (i === 0) p.moveTo(px, py);
          else p.lineTo(px, py);
        }

        p.closePath();
        return p;
      };

      let lastDraw = 0;

      const redraw = (force = false) => {
        const now = performance.now();
        if (!force && now - lastDraw < 42) return;
        lastDraw = now;

        ctx.clearRect(0, 0, size, size);
        const path = makePath();

        // Almost invisible water body.
        const fill = ctx.createRadialGradient(cx - 22, cy - 26, 5, cx, cy, radius);
        fill.addColorStop(0, 'rgba(255,255,255,0.030)');
        fill.addColorStop(0.60, 'rgba(180,235,250,0.010)');
        fill.addColorStop(1, 'rgba(230,250,255,0.032)');
        ctx.fillStyle = fill;
        ctx.fill(path);

        // One soft rim made of stacked strokes on the SAME path.
        ctx.strokeStyle = 'rgba(220,246,255,0.070)';
        ctx.lineWidth = 10;
        ctx.stroke(path);

        ctx.strokeStyle = 'rgba(240,252,255,0.145)';
        ctx.lineWidth = 5;
        ctx.stroke(path);

        ctx.strokeStyle = 'rgba(255,255,255,0.52)';
        ctx.lineWidth = 1.35;
        ctx.stroke(path);

        // Fading specular arc, not a second circular border.
        ctx.save();
        ctx.lineCap = 'round';
        const grad = ctx.createLinearGradient(cx - 58, cy - 58, cx - 4, cy - 18);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.35, 'rgba(255,255,255,0.24)');
        grad.addColorStop(0.70, 'rgba(255,255,255,0.15)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 7.5;
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 5, Math.PI * 1.09, Math.PI * 1.40);
        ctx.stroke();
        ctx.restore();

        texture.refresh();
      };

      const zero = { upperLeft: 0, bottom: 0, right: 0 };
      const profiles = [
        { upperLeft: 4.2, bottom: 2.4, right: -1.4 },
        { upperLeft: -2.6, bottom: 3.6, right: 2.2 },
        { upperLeft: 2.0, bottom: -2.8, right: 3.2 }
      ];

      let profileIndex = 0;

      const tweenState = (target, duration, done) => {
        this.tweens.add({
          targets: state,
          ...target,
          duration,
          ease: 'Sine.easeInOut',
          onUpdate: () => redraw(false),
          onComplete: done
        });
      };

      const cycle = () => {
        const p = profiles[profileIndex % profiles.length];
        profileIndex += 1;

        tweenState(p, Phaser.Math.Between(1650, 2300), () => {
          this.time.delayedCall(Phaser.Math.Between(180, 420), () => {
            tweenState(zero, Phaser.Math.Between(1650, 2300), () => {
              this.time.delayedCall(Phaser.Math.Between(650, 1200), cycle);
            });
          });
        });
      };

      redraw(true);
      const bubble = this.add.image(x, y, key);
      this.time.delayedCall(500, cycle);
      return bubble;
    };

    const addShellSweep = (x, y) => {
      const glint = this.add.container(x - 72, y - 7);

      const strip1 = this.add.rectangle(0, 0, 13, 112, 0xffffff, 0.20).setAngle(20);
      const strip2 = this.add.rectangle(-8, 0, 5, 112, 0xffffff, 0.09).setAngle(20);
      const strip3 = this.add.rectangle(8, 0, 5, 112, 0xffffff, 0.07).setAngle(20);
      glint.add([strip1, strip2, strip3]);

      // Exact alpha silhouette of the shell image: the glint cannot leave it.
      const maskSource = this.make.image({
        x,
        y,
        key: 'special_pearl_test',
        add: false
      }).setScale(0.45);

      const shellMask = maskSource.createBitmapMask();
      glint.setMask(shellMask);

      const sweep = () => {
        glint.x = x - 76;
        glint.alpha = 0;

        this.tweens.add({
          targets: glint,
          x: x + 76,
          alpha: { from: 0, to: 0.95 },
          duration: 790,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this.tweens.add({
              targets: glint,
              alpha: 0,
              duration: 180,
              onComplete: () => {
                this.time.delayedCall(Phaser.Math.Between(2500, 4300), sweep);
              }
            });
          }
        });
      };

      this.time.delayedCall(1100, sweep);
    };

    // Circular top-down funnel with broad misty strokes that fade and taper.
    const createCircularVortex = (x, y) => {
      const container = this.add.container(x, y);
      const g = this.add.graphics();

      const smoothstep = (t) => t * t * (3 - 2 * t);

      const drawTaperedSpiral = (
        offset,
        color,
        maxAlpha,
        maxWidth,
        r0,
        turns = Math.PI * 4.1
      ) => {
        const steps = 96;
        let prev = null;

        for (let i = 0; i <= steps; i += 1) {
          const t = i / steps;
          const a = offset + t * turns;
          const r = Phaser.Math.Linear(r0, 8, t);
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;

          if (prev) {
            // Broad and foggy near the middle, dissolving at both ends.
            const fadeIn = smoothstep(Math.min(1, t / 0.20));
            const fadeOut = smoothstep(Math.min(1, (1 - t) / 0.18));
            const envelope = Math.max(0, fadeIn * fadeOut);

            // Wide mist under-stroke.
            g.lineStyle(
              maxWidth * (1.75 - 0.85 * t),
              color,
              maxAlpha * 0.16 * envelope
            );
            g.beginPath();
            g.moveTo(prev.x, prev.y);
            g.lineTo(px, py);
            g.strokePath();

            // Main soft body.
            g.lineStyle(
              maxWidth * (1.10 - 0.50 * t),
              color,
              maxAlpha * 0.48 * envelope
            );
            g.beginPath();
            g.moveTo(prev.x, prev.y);
            g.lineTo(px, py);
            g.strokePath();

            // Narrow luminous core; it disappears sooner at the ends.
            const coreEnvelope = Math.pow(envelope, 1.35);
            g.lineStyle(
              Math.max(1.0, maxWidth * (0.44 - 0.16 * t)),
              0xffffff,
              maxAlpha * 0.42 * coreEnvelope
            );
            g.beginPath();
            g.moveTo(prev.x, prev.y);
            g.lineTo(px, py);
            g.strokePath();
          }

          prev = { x: px, y: py };
        }
      };

      drawTaperedSpiral(0.00, 0x8feaf5, 0.82, 8.2, 72);
      drawTaperedSpiral(Math.PI * 0.66, 0x52cfe4, 0.72, 7.2, 67);
      drawTaperedSpiral(Math.PI * 1.32, 0xb9f8ff, 0.58, 5.2, 74);
      drawTaperedSpiral(Math.PI * 0.20, 0x2c9fc6, 0.48, 9.4, 61);

      const holeGlow = this.add.circle(0, 0, 22, 0x174a5c, 0.28);
      const holeOuter = this.add.circle(0, 0, 15, 0x052b3b, 0.62);
      const holeInner = this.add.circle(0, 0, 7, 0x010d13, 0.94);

      container.add([g, holeGlow, holeOuter, holeInner]);

      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * Math.PI * 2;
        const r = 57 + (i % 2) * 8;
        const drop = this.add.circle(
          Math.cos(a) * r,
          Math.sin(a) * r,
          1.6 + (i % 2) * 0.6,
          0xe4fdff,
          0.28
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
        targets: [g, holeGlow],
        scale: { from: 0.975, to: 1.025 },
        duration: 2850,
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

    // 5. SEAWEED BUBBLE — deform the painted bubble itself, no ring around it
    {
      const [x, y] = positions[4];
      drawCard(x, y, 'Пузырь с водорослями', 'плывёт кромка самого изображения');

      createWarpedImageBubble(
        x,
        y - 12,
        'special_seaweed_bubble_test',
        'runtime_seaweed_bubble_v5',
        0.69,
        {
          centerX: 192,
          centerY: 161,
          bubbleRadius: 108,
          deformation: 5
        }
      );
    }

    // 6. AIR BUBBLE — one soft transparent bubble, edge deforms locally
    {
      const [x, y] = positions[5];
      drawCard(x, y, 'Воздушный пузырь', 'одна мягкая кромка, без второй рамки');
      createProceduralAirBubble(x, y - 12, 82);
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
