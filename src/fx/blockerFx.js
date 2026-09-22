const DEPTH = 40;

function tweenDestroy(scene, target, config) {
  scene.tweens.add({
    targets: target,
    ...config,
    onComplete: () => {
      if (target && target.destroy) target.destroy();
    }
  });
}

function waterRing(scene, x, y, {
  color = 0xbfefff,
  alpha = 0.46,
  radius = 14,
  scaleX = 3.8,
  scaleY = 2.3,
  duration = 360,
  delay = 0,
  lineWidth = 3
} = {}) {
  const ring = scene.add.ellipse(x, y, radius * 2, radius * 1.2, 0x000000, 0)
    .setStrokeStyle(lineWidth, color, alpha)
    .setDepth(DEPTH);

  tweenDestroy(scene, ring, {
    scaleX,
    scaleY,
    alpha: 0,
    duration,
    delay,
    ease: 'Sine.easeOut'
  });
}

function softFlash(scene, x, y, {
  color = 0xe9fdff,
  alpha = 0.34,
  radius = 24,
  duration = 210,
  scale = 2.0
} = {}) {
  const flash = scene.add.ellipse(x, y, radius * 2, radius * 1.45, color, alpha)
    .setDepth(DEPTH - 1)
    .setBlendMode(Phaser.BlendModes.ADD);

  tweenDestroy(scene, flash, {
    scale,
    alpha: 0,
    duration,
    ease: 'Quad.easeOut'
  });
}

function bubbles(scene, x, y, {
  count = 5,
  tint = 0xe7fbff,
  minR = 2,
  maxR = 5,
  spreadX = 24,
  spreadY = 14,
  riseMin = 28,
  riseMax = 54,
  durationMin = 380,
  durationMax = 700
} = {}) {
  for (let i = 0; i < count; i += 1) {
    const r = Phaser.Math.FloatBetween(minR, maxR);
    const bubble = scene.add.circle(
      x + Phaser.Math.Between(-spreadX, spreadX),
      y + Phaser.Math.Between(-spreadY, spreadY),
      r,
      tint,
      0.16
    )
      .setStrokeStyle(Math.max(1, r * 0.35), tint, 0.58)
      .setDepth(DEPTH + 2);

    tweenDestroy(scene, bubble, {
      x: bubble.x + Phaser.Math.Between(-14, 14),
      y: bubble.y - Phaser.Math.Between(riseMin, riseMax),
      alpha: 0,
      scaleX: Phaser.Math.FloatBetween(0.7, 1.35),
      scaleY: Phaser.Math.FloatBetween(0.7, 1.35),
      duration: Phaser.Math.Between(durationMin, durationMax),
      ease: 'Sine.easeOut'
    });
  }
}

function dots(scene, x, y, {
  count = 8,
  palette = [0xffffff],
  minR = 1.8,
  maxR = 3.8,
  speedMin = 18,
  speedMax = 48,
  gravityY = 8,
  durationMin = 280,
  durationMax = 520,
  alpha = 0.9,
  depth = DEPTH + 3
} = {}) {
  for (let i = 0; i < count; i += 1) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const speed = Phaser.Math.FloatBetween(speedMin, speedMax);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const dot = scene.add.circle(
      x + Phaser.Math.Between(-4, 4),
      y + Phaser.Math.Between(-4, 4),
      Phaser.Math.FloatBetween(minR, maxR),
      Phaser.Utils.Array.GetRandom(palette),
      alpha
    ).setDepth(depth);

    const dur = Phaser.Math.Between(durationMin, durationMax);
    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: dur,
      ease: 'Quad.easeOut',
      onUpdate: tween => {
        const t = tween.getValue();
        dot.x = x + vx * t;
        dot.y = y + vy * t + gravityY * t * t;
        dot.alpha = alpha * (1 - t);
        dot.scale = 1 - t * 0.45;
      },
      onComplete: () => dot.destroy()
    });
  }
}

function fragments(scene, x, y, {
  count = 7,
  palette = [0xffffff],
  wMin = 4,
  wMax = 11,
  hMin = 2,
  hMax = 6,
  speedMin = 20,
  speedMax = 52,
  gravityY = 10,
  durationMin = 300,
  durationMax = 520,
  alpha = 0.95,
  upwardBias = 0
} = {}) {
  for (let i = 0; i < count; i += 1) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const speed = Phaser.Math.FloatBetween(speedMin, speedMax);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - upwardBias;

    const part = scene.add.rectangle(
      x + Phaser.Math.Between(-3, 3),
      y + Phaser.Math.Between(-3, 3),
      Phaser.Math.Between(wMin, wMax),
      Phaser.Math.Between(hMin, hMax),
      Phaser.Utils.Array.GetRandom(palette),
      alpha
    )
      .setRotation(Phaser.Math.FloatBetween(0, Math.PI))
      .setDepth(DEPTH + 3);

    const dur = Phaser.Math.Between(durationMin, durationMax);
    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: dur,
      ease: 'Quad.easeOut',
      onUpdate: tween => {
        const t = tween.getValue();
        part.x = x + vx * t;
        part.y = y + vy * t + gravityY * t * t;
        part.alpha = alpha * (1 - t);
        part.rotation += 0.14;
        part.scale = 1 - t * 0.36;
      },
      onComplete: () => part.destroy()
    });
  }
}

function iceShards(scene, x, y, finalHit) {
  const count = finalHit ? 10 : 4;
  const palette = [0xeaffff, 0xbfefff, 0xffffff, 0x8edfff];

  for (let i = 0; i < count; i += 1) {
    const size = Phaser.Math.Between(finalHit ? 7 : 5, finalHit ? 15 : 10);
    const shard = scene.add.triangle(
      x,
      y,
      0,
      size,
      size * 0.5,
      0,
      size,
      size,
      Phaser.Utils.Array.GetRandom(palette),
      0.84
    )
      .setDepth(DEPTH + 4)
      .setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const speed = Phaser.Math.FloatBetween(finalHit ? 28 : 18, finalHit ? 58 : 34);

    tweenDestroy(scene, shard, {
      x: x + Math.cos(angle) * speed,
      y: y + Math.sin(angle) * speed + Phaser.Math.Between(4, 18),
      rotation: shard.rotation + Phaser.Math.FloatBetween(-1.8, 1.8),
      alpha: 0,
      scale: 0.55,
      duration: Phaser.Math.Between(finalHit ? 380 : 260, finalHit ? 620 : 420),
      ease: 'Quad.easeOut'
    });
  }
}

function sandCloud(scene, x, y, finalHit) {
  const cloud = scene.add.ellipse(
    x,
    y + 5,
    finalHit ? 42 : 28,
    finalHit ? 24 : 16,
    0xe4c58a,
    finalHit ? 0.28 : 0.18
  ).setDepth(DEPTH + 1);

  tweenDestroy(scene, cloud, {
    scaleX: finalHit ? 2.5 : 1.8,
    scaleY: finalHit ? 1.9 : 1.45,
    y: y - (finalHit ? 5 : 2),
    alpha: 0,
    duration: finalHit ? 460 : 300,
    ease: 'Sine.easeOut'
  });
}

function netThreads(scene, x, y, finalHit) {
  fragments(scene, x, y, {
    count: finalHit ? 8 : 3,
    palette: [0xb68957, 0xd7b98a, 0xefd8b5],
    wMin: finalHit ? 10 : 8,
    wMax: finalHit ? 21 : 14,
    hMin: 2,
    hMax: 3,
    speedMin: finalHit ? 24 : 14,
    speedMax: finalHit ? 48 : 28,
    gravityY: 3,
    durationMin: 220,
    durationMax: finalHit ? 430 : 300,
    upwardBias: finalHit ? 5 : 2
  });
}

function pearlySpark(scene, x, y, finalHit) {
  const count = finalHit ? 5 : 2;
  for (let i = 0; i < count; i += 1) {
    const spark = scene.add.star(
      x + Phaser.Math.Between(-10, 10),
      y + Phaser.Math.Between(-8, 8),
      4,
      1.5,
      finalHit ? 5 : 3.5,
      0xfff4eb,
      0.9
    )
      .setDepth(DEPTH + 5)
      .setBlendMode(Phaser.BlendModes.ADD);

    tweenDestroy(scene, spark, {
      scale: finalHit ? 1.9 : 1.35,
      rotation: spark.rotation + 0.5,
      alpha: 0,
      duration: Phaser.Math.Between(220, finalHit ? 420 : 300),
      ease: 'Sine.easeOut'
    });
  }
}

export function playWaterImpactFX(scene, x, y, finalHit = false) {
  waterRing(scene, x, y, {
    alpha: finalHit ? 0.52 : 0.32,
    radius: finalHit ? 15 : 11,
    scaleX: finalHit ? 4.4 : 3.0,
    scaleY: finalHit ? 2.7 : 1.9,
    duration: finalHit ? 430 : 290,
    lineWidth: finalHit ? 3.5 : 2.5
  });

  if (finalHit) {
    waterRing(scene, x, y + 1, {
      color: 0x86dfff,
      alpha: 0.27,
      radius: 10,
      scaleX: 5.2,
      scaleY: 3.0,
      duration: 520,
      delay: 55,
      lineWidth: 2
    });
  }

  softFlash(scene, x, y, {
    alpha: finalHit ? 0.38 : 0.22,
    radius: finalHit ? 28 : 18,
    duration: finalHit ? 230 : 150,
    scale: finalHit ? 2.1 : 1.55
  });

  bubbles(scene, x, y, {
    count: finalHit ? 7 : 3,
    minR: 2,
    maxR: finalHit ? 5.5 : 4,
    riseMin: finalHit ? 32 : 22,
    riseMax: finalHit ? 62 : 40
  });
}

export function playBlockerDamageFX(scene, type, x, y) {
  playWaterImpactFX(scene, x, y, false);

  switch (type) {
    case 'seaweed':
      fragments(scene, x, y, {
        count: 4,
        palette: [0x49ba6d, 0x73d36d, 0xa5efbd],
        wMin: 4,
        wMax: 9,
        hMin: 2,
        hMax: 4,
        speedMin: 12,
        speedMax: 30,
        gravityY: -3,
        upwardBias: 9,
        durationMin: 260,
        durationMax: 400
      });
      break;

    case 'sand':
      sandCloud(scene, x, y, false);
      dots(scene, x, y, {
        count: 7,
        palette: [0xe7ca92, 0xd4b170, 0xf3e0b5],
        minR: 1.2,
        maxR: 2.8,
        speedMin: 10,
        speedMax: 28,
        gravityY: 8,
        durationMin: 220,
        durationMax: 360
      });
      break;

    case 'rock':
      fragments(scene, x, y, {
        count: 4,
        palette: [0x7f969f, 0xaebdc2, 0xc9d4d7],
        wMin: 4,
        wMax: 8,
        hMin: 4,
        hMax: 7,
        speedMin: 16,
        speedMax: 32,
        gravityY: 13,
        durationMin: 260,
        durationMax: 410
      });
      break;

    case 'shell':
      fragments(scene, x, y, {
        count: 4,
        palette: [0xf3d5c2, 0xffeadc, 0xe9bfa0],
        wMin: 4,
        wMax: 8,
        hMin: 3,
        hMax: 6,
        speedMin: 14,
        speedMax: 30,
        gravityY: 8,
        durationMin: 250,
        durationMax: 390
      });
      pearlySpark(scene, x, y, false);
      break;

    case 'net':
      netThreads(scene, x, y, false);
      break;

    case 'ice':
      iceShards(scene, x, y, false);
      softFlash(scene, x, y, {
        color: 0xdffaff,
        alpha: 0.34,
        radius: 19,
        duration: 170,
        scale: 1.7
      });
      break;
  }
}

export function playBlockerDestroyFX(scene, type, x, y) {
  playWaterImpactFX(scene, x, y, true);

  switch (type) {
    case 'seaweed':
      fragments(scene, x, y, {
        count: 9,
        palette: [0x46b969, 0x70d56f, 0xa7f4c0, 0x2e9f62],
        wMin: 5,
        wMax: 13,
        hMin: 2,
        hMax: 5,
        speedMin: 20,
        speedMax: 46,
        gravityY: -4,
        upwardBias: 14,
        durationMin: 340,
        durationMax: 580
      });
      bubbles(scene, x, y, { count: 6, tint: 0xdcfff0, riseMin: 34, riseMax: 66 });
      break;

    case 'sand':
      sandCloud(scene, x, y, true);
      dots(scene, x, y, {
        count: 14,
        palette: [0xe8ca91, 0xd2ad69, 0xf2ddb0, 0xc79a52],
        minR: 1.4,
        maxR: 3.4,
        speedMin: 16,
        speedMax: 42,
        gravityY: 11,
        durationMin: 280,
        durationMax: 500
      });
      break;

    case 'rock':
      fragments(scene, x, y, {
        count: 10,
        palette: [0x718993, 0x9cafb6, 0xc5d2d6, 0x5d747e],
        wMin: 5,
        wMax: 13,
        hMin: 5,
        hMax: 11,
        speedMin: 24,
        speedMax: 60,
        gravityY: 17,
        durationMin: 350,
        durationMax: 620
      });
      break;

    case 'shell':
      fragments(scene, x, y, {
        count: 9,
        palette: [0xf5d7c2, 0xffeee3, 0xe7b993, 0xffdfcc],
        wMin: 5,
        wMax: 12,
        hMin: 4,
        hMax: 9,
        speedMin: 20,
        speedMax: 50,
        gravityY: 11,
        durationMin: 330,
        durationMax: 560
      });
      pearlySpark(scene, x, y, true);
      softFlash(scene, x, y, {
        color: 0xffeee5,
        alpha: 0.38,
        radius: 24,
        duration: 240,
        scale: 2.1
      });
      break;

    case 'net':
      netThreads(scene, x, y, true);
      break;

    case 'ice':
      iceShards(scene, x, y, true);
      softFlash(scene, x, y, {
        color: 0xe9fdff,
        alpha: 0.46,
        radius: 30,
        duration: 250,
        scale: 2.2
      });
      break;
  }
}
