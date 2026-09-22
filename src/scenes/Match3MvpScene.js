const FISH_TYPES = [
  'fish_01_goldfish',
  'fish_02_blue_tang',
  'fish_03_moorish_idol',
  'fish_04_white_angelfish',
  'fish_05_yellow_tang',
  'fish_06_clownfish'
];

const GOLD_FISH = 'fish_01_goldfish';

const BASE_SCALE = 0.19;

export default class Match3MvpScene extends Phaser.Scene {
  constructor() {
    super('Match3MvpScene');
  }

  preload() {
    this.load.atlas(
      'fish',
      'assets/atlas/fish/fish_atlas.png?v=20260921-static-sway-v3',
      'assets/atlas/fish/fish_atlas.json?v=20260921-static-sway-v3'
    );
  }

  create() {
    this.cameras.main.setBackgroundColor('#052b3d');

    this.rows = 8;
    this.cols = 8;
    this.cellSize = 70;
    this.boardX = 170;
    this.boardY = 100;
    this.board = [];
    this.selected = null;
    this.busy = false;
    this.moves = 20;
    this.matchedTotal = 0;

    this.createBackdrop();
    this.createHud();
    this.createBoard();

    this.input.on('pointerdown', pointer => {
      if (this.busy) return;

      const cell = this.pointerToCell(pointer.x, pointer.y);
      if (!cell) {
        this.clearSelection();
        return;
      }

      const piece = this.board[cell.row]?.[cell.col];
      if (!piece) return;

      if (!this.selected) {
        this.selectCell(cell.row, cell.col);
        return;
      }

      const dr = Math.abs(this.selected.row - cell.row);
      const dc = Math.abs(this.selected.col - cell.col);

      if (dr + dc === 1) {
        const from = this.selected;
        this.clearSelection();
        this.trySwap(from.row, from.col, cell.row, cell.col);
      } else {
        this.selectCell(cell.row, cell.col);
      }
    });
  }

  createBackdrop() {
    const g = this.add.graphics();
    g.fillStyle(0x063c52, 1);
    g.fillRoundedRect(110, 55, 650, 610, 28);
    g.lineStyle(2, 0x85e7ff, 0.22);
    g.strokeRoundedRect(110, 55, 650, 610, 28);

    for (let i = 0; i < 14; i += 1) {
      const bubble = this.add.circle(
        Phaser.Math.Between(80, 920),
        Phaser.Math.Between(80, 690),
        Phaser.Math.Between(2, 6),
        0xc9f7ff,
        0.07
      ).setStrokeStyle(1, 0xc9f7ff, 0.18);

      this.tweens.add({
        targets: bubble,
        y: bubble.y - Phaser.Math.Between(30, 90),
        alpha: { from: 0.03, to: 0.16 },
        duration: Phaser.Math.Between(3200, 6200),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1800),
        ease: 'Sine.easeInOut'
      });
    }
  }

  createHud() {
    this.add.text(805, 92, 'ДАРЫ ГЛУБИН', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#e6fbff'
    }).setOrigin(0.5);

    this.add.text(805, 124, 'PLAYABLE MVP · ANIMATION v2', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#87d8ea'
    }).setOrigin(0.5);

    const panel = this.add.graphics();
    panel.fillStyle(0x073449, 0.82);
    panel.fillRoundedRect(775, 165, 190, 210, 18);
    panel.lineStyle(1, 0xa7efff, 0.22);
    panel.strokeRoundedRect(775, 165, 190, 210, 18);

    this.add.text(805, 194, 'ХОДЫ', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#94cad8'
    }).setOrigin(0.5);

    this.movesText = this.add.text(805, 226, String(this.moves), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(805, 278, 'СОБРАНО РЫБ', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#94cad8'
    }).setOrigin(0.5);

    this.scoreText = this.add.text(805, 310, '0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.statusText = this.add.text(805, 408, 'Поменяй местами\nдве соседние рыбы', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#caedf5',
      align: 'center',
      lineSpacing: 5
    }).setOrigin(0.5);

    const resetBg = this.add.graphics();
    resetBg.fillStyle(0x1182a2, 0.85);
    resetBg.fillRoundedRect(735, 510, 140, 44, 13);

    this.resetHit = this.add.zone(805, 532, 140, 44)
      .setInteractive({ useHandCursor: true });

    this.add.text(805, 532, 'ЗАНОВО', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.resetHit.on('pointerdown', () => {
      this.scene.restart();
    });

    this.add.text(
      805,
      592,
      'Тест: тихий idle · нырок при swap\nстайка + пузыри при совпадении',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#75aebd',
        align: 'center',
        lineSpacing: 4
      }
    ).setOrigin(0.5);
  }

  createBoard() {
    const boardBg = this.add.graphics();

    for (let row = 0; row < this.rows; row += 1) {
      this.board[row] = [];

      for (let col = 0; col < this.cols; col += 1) {
        const { x, y } = this.cellCenter(row, col);

        boardBg.fillStyle((row + col) % 2 === 0 ? 0x0d6078 : 0x0b5870, 0.27);
        boardBg.fillRoundedRect(
          x - this.cellSize / 2 + 2,
          y - this.cellSize / 2 + 2,
          this.cellSize - 4,
          this.cellSize - 4,
          12
        );

        boardBg.lineStyle(1, 0xbbefff, 0.10);
        boardBg.strokeRoundedRect(
          x - this.cellSize / 2 + 2,
          y - this.cellSize / 2 + 2,
          this.cellSize - 4,
          this.cellSize - 4,
          12
        );

        const type = this.pickTypeWithoutImmediateMatch(row, col);
        this.board[row][col] = this.makePiece(
          row,
          col,
          type,
          y - Phaser.Math.Between(0, 18)
        );
      }
    }

    this.selectionRing = this.add.circle(0, 0, 28, 0x000000, 0)
      .setStrokeStyle(3, 0xe7fbff, 0.9)
      .setDepth(30)
      .setVisible(false);
  }

  pickTypeWithoutImmediateMatch(row, col) {
    let candidates = [...FISH_TYPES];

    const left1 = col >= 1 ? this.board[row]?.[col - 1]?.type : null;
    const left2 = col >= 2 ? this.board[row]?.[col - 2]?.type : null;

    if (left1 && left1 === left2) {
      candidates = candidates.filter(type => type !== left1);
    }

    const up1 = row >= 1 ? this.board[row - 1]?.[col]?.type : null;
    const up2 = row >= 2 ? this.board[row - 2]?.[col]?.type : null;

    if (up1 && up1 === up2) {
      candidates = candidates.filter(type => type !== up1);
    }

    return Phaser.Utils.Array.GetRandom(candidates);
  }

  makePiece(row, col, type, spawnY = null) {
    const { x, y } = this.cellCenter(row, col);

    const sprite = this.add.sprite(
      x,
      spawnY ?? y,
      'fish',
      type + '_f01'
    )
      .setScale(BASE_SCALE)
      .setDepth(10)
      .setFlipX(Phaser.Math.Between(0, 1) === 1);

    const piece = {
      type,
      sprite,
      row,
      col,
      idleTimer: null,
      tailTimer: null,
      tailPose: 0
    };

    if (spawnY !== null && spawnY !== y) {
      this.tweens.add({
        targets: sprite,
        y,
        duration: 280,
        ease: 'Sine.easeOut',
        onComplete: () => {
          this.startIdle(piece);
        }
      });
    } else {
      this.startIdle(piece);
    }

    this.startTailMicroAnimation(piece);
    return piece;
  }

  startIdle(piece) {
    const sprite = piece?.sprite;
    if (!sprite?.active) return;

    this.stopIdle(piece, false);

    const { x, y } = this.cellCenter(piece.row, piece.col);
    sprite.setPosition(x, y);
    sprite.setAngle(0);
    sprite.setAlpha(0.96);
    sprite.setScale(BASE_SCALE);

    const yMax = Phaser.Math.FloatBetween(1.8, 3.2);
    const angleMax = Phaser.Math.FloatBetween(0.45, 0.90);
    const minDuration = Phaser.Math.Between(3200, 3900);
    const maxDuration = Phaser.Math.Between(4700, 5600);

    const cycle = () => {
      if (!sprite.active || this.busy) return;

      const flip = sprite.flipX ? -1 : 1;
      const targetY = y + Phaser.Math.FloatBetween(-yMax, yMax);
      const targetAngle = flip * Phaser.Math.FloatBetween(-angleMax, angleMax);

      this.tweens.add({
        targets: sprite,
        y: targetY,
        angle: targetAngle,
        duration: Phaser.Math.Between(minDuration, maxDuration),
        ease: 'Sine.easeInOut',
        onComplete: () => {
          if (!sprite.active || this.busy) return;

          piece.idleTimer = this.time.delayedCall(
            Phaser.Math.Between(260, 900),
            () => {
              if (!sprite.active || this.busy) return;

              this.tweens.add({
                targets: sprite,
                y,
                angle: 0,
                duration: Phaser.Math.Between(2800, 4300),
                ease: 'Sine.easeInOut',
                onComplete: () => {
                  if (!sprite.active || this.busy) return;
                  piece.idleTimer = this.time.delayedCall(
                    Phaser.Math.Between(220, 850),
                    cycle
                  );
                }
              });
            }
          );
        }
      });
    };

    piece.idleTimer = this.time.delayedCall(
      Phaser.Math.Between(0, 1800),
      cycle
    );
  }

  stopIdle(piece, snapToCell = true) {
    if (!piece?.sprite) return;

    if (piece.idleTimer) {
      piece.idleTimer.remove(false);
      piece.idleTimer = null;
    }

    this.tweens.killTweensOf(piece.sprite);

    if (snapToCell) {
      const { x, y } = this.cellCenter(piece.row, piece.col);
      piece.sprite.setPosition(x, y);
      piece.sprite.setAngle(0);
      piece.sprite.setScale(BASE_SCALE);
      piece.sprite.setAlpha(0.96);
    }
  }

  startTailMicroAnimation(piece) {
    // Clownfish has no frame animation; it only shares the gentle water sway.
    if (piece.type !== GOLD_FISH) return;
    if (!piece?.sprite?.active) return;

    const sprite = piece.sprite;
    const baseFrame = GOLD_FISH + '_f01';
    const tailFrames = [
      GOLD_FISH + '_f02',
      GOLD_FISH + '_f03',
      GOLD_FISH + '_f04',
      GOLD_FISH + '_f05',
      GOLD_FISH + '_f06',
      GOLD_FISH + '_f07'
    ];

    let lastTailFrame = null;

    const scheduleBase = () => {
      if (!sprite.active) return;

      if (piece.tailTimer) {
        piece.tailTimer.remove(false);
      }

      piece.tailTimer = this.time.delayedCall(
        Phaser.Math.Between(1100, 1900),
        () => {
          if (!sprite.active) return;

          let nextFrame = Phaser.Utils.Array.GetRandom(tailFrames);
          if (tailFrames.length > 1 && nextFrame === lastTailFrame) {
            const alternatives = tailFrames.filter(frame => frame !== lastTailFrame);
            nextFrame = Phaser.Utils.Array.GetRandom(alternatives);
          }
          lastTailFrame = nextFrame;

          this.tweens.add({
            targets: sprite,
            alpha: 0.90,
            duration: 180,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onYoyo: () => {
              if (sprite.active) sprite.setFrame(nextFrame);
            },
            onComplete: () => {
              if (!sprite.active) return;

              piece.tailTimer = this.time.delayedCall(
                Phaser.Math.Between(850, 1450),
                () => {
                  if (!sprite.active) return;

                  this.tweens.add({
                    targets: sprite,
                    alpha: 0.91,
                    duration: 170,
                    yoyo: true,
                    ease: 'Sine.easeInOut',
                    onYoyo: () => {
                      if (sprite.active) sprite.setFrame(baseFrame);
                    },
                    onComplete: () => {
                      if (sprite.active) {
                        sprite.setAlpha(0.96);
                        scheduleBase();
                      }
                    }
                  });
                }
              );
            }
          });
        }
      );
    };

    sprite.setFrame(baseFrame);
    sprite.setAlpha(0.96);
    scheduleBase();
  }

  pointerToCell(x, y) {
    const col = Math.floor(
      (x - (this.boardX - this.cellSize / 2)) / this.cellSize
    );
    const row = Math.floor(
      (y - (this.boardY - this.cellSize / 2)) / this.cellSize
    );

    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return null;
    }

    const center = this.cellCenter(row, col);

    if (
      Math.abs(x - center.x) > this.cellSize / 2 ||
      Math.abs(y - center.y) > this.cellSize / 2
    ) {
      return null;
    }

    return { row, col };
  }

  selectCell(row, col) {
    this.selected = { row, col };

    const { x, y } = this.cellCenter(row, col);
    this.selectionRing.setPosition(x, y).setVisible(true);

    this.tweens.killTweensOf(this.selectionRing);
    this.selectionRing.setScale(1).setAlpha(1);

    this.tweens.add({
      targets: this.selectionRing,
      scale: 1.12,
      alpha: 0.5,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  clearSelection() {
    this.selected = null;

    if (!this.selectionRing) return;

    this.tweens.killTweensOf(this.selectionRing);
    this.selectionRing
      .setVisible(false)
      .setAlpha(1)
      .setScale(1);
  }

  async trySwap(r1, c1, r2, c2) {
    if (this.busy || this.moves <= 0) return;

    this.busy = true;
    this.stopAllIdle();

    await this.animateSwapDive(r1, c1, r2, c2);

    const matches = this.findMatches();

    if (matches.size === 0) {
      await this.animateSwapDive(r1, c1, r2, c2);
      this.statusText.setText('Совпадения нет');
      this.busy = false;
      this.restartAllIdle();
      return;
    }

    this.moves -= 1;
    this.movesText.setText(String(this.moves));
    this.statusText.setText('Отлично!');

    await this.resolveCascade(matches);

    if (this.moves <= 0) {
      this.statusText.setText('Тест завершён\nНажми «Заново»');
    } else {
      this.statusText.setText('Продолжай');
    }

    this.busy = false;
    this.restartAllIdle();
  }

  animateSwapDive(r1, c1, r2, c2) {
    return new Promise(resolve => {
      const a = this.board[r1][c1];
      const b = this.board[r2][c2];

      if (!a || !b) {
        resolve();
        return;
      }

      const aStart = { x: a.sprite.x, y: a.sprite.y };
      const bStart = { x: b.sprite.x, y: b.sprite.y };
      const aOriginalFlip = a.sprite.flipX;
      const bOriginalFlip = b.sprite.flipX;

      this.board[r1][c1] = b;
      this.board[r2][c2] = a;

      a.row = r2;
      a.col = c2;
      b.row = r1;
      b.col = c1;

      const aEnd = this.cellCenter(a.row, a.col);
      const bEnd = this.cellCenter(b.row, b.col);

      const horizontal = r1 === r2;
      const arc = Phaser.Math.Between(7, 12);

      const aControl = horizontal
        ? { x: (aStart.x + aEnd.x) / 2, y: (aStart.y + aEnd.y) / 2 + arc }
        : { x: (aStart.x + aEnd.x) / 2 + arc, y: (aStart.y + aEnd.y) / 2 };

      const bControl = horizontal
        ? { x: (bStart.x + bEnd.x) / 2, y: (bStart.y + bEnd.y) / 2 - arc }
        : { x: (bStart.x + bEnd.x) / 2 - arc, y: (bStart.y + bEnd.y) / 2 };

      let done = 0;

      const finish = (piece, end, originalFlip, dx, dy) => {
        const sprite = piece.sprite;

        this.tweens.add({
          targets: sprite,
          angle: 0,
          scaleX: BASE_SCALE,
          scaleY: BASE_SCALE,
          duration: 95,
          ease: 'Sine.easeOut',
          onComplete: () => {
            sprite.setPosition(end.x, end.y);
            sprite.setAlpha(0.96);

            if (Math.abs(dx) > Math.abs(dy)) {
              sprite.setFlipX(dx < 0);
            } else {
              sprite.setFlipX(originalFlip);
            }

            done += 1;
            if (done === 2) resolve();
          }
        });
      };

      const swim = (piece, start, control, end, originalFlip) => {
        const sprite = piece.sprite;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const heading = Phaser.Math.RadToDeg(Math.atan2(dy, dx));

        // During the move the fish really turns toward its destination.
        sprite.setFlipX(false);

        this.tweens.add({
          targets: sprite,
          angle: heading,
          scaleX: BASE_SCALE * 0.98,
          scaleY: BASE_SCALE * 0.98,
          duration: 75,
          ease: 'Sine.easeOut',
          onComplete: () => {
            this.playSwapTrail(start.x, start.y);

            this.tweens.addCounter({
              from: 0,
              to: 1,
              duration: 260,
              ease: 'Sine.easeInOut',
              onUpdate: tween => {
                const t = tween.getValue();
                const inv = 1 - t;

                sprite.x =
                  inv * inv * start.x +
                  2 * inv * t * control.x +
                  t * t * end.x;

                sprite.y =
                  inv * inv * start.y +
                  2 * inv * t * control.y +
                  t * t * end.y;

                const swimPulse = Math.sin(Math.PI * t);
                sprite.setScale(
                  BASE_SCALE * (0.98 - swimPulse * 0.045)
                );

                if (t > 0.38 && t < 0.52 && !piece.midTrailPlayed) {
                  piece.midTrailPlayed = true;
                  this.playSwapTrail(sprite.x, sprite.y);
                }
              },
              onComplete: () => {
                piece.midTrailPlayed = false;
                finish(piece, end, originalFlip, dx, dy);
              }
            });
          }
        });
      };

      swim(a, aStart, aControl, aEnd, aOriginalFlip);
      swim(b, bStart, bControl, bEnd, bOriginalFlip);
    });
  }

  playSwapTrail(x, y) {
    for (let i = 0; i < 2; i += 1) {
      const bubble = this.add.circle(
        x + Phaser.Math.Between(-5, 5),
        y + Phaser.Math.Between(-4, 5),
        Phaser.Math.FloatBetween(1.3, 2.7),
        0xdffaff,
        0.14
      )
        .setStrokeStyle(1, 0xdffaff, 0.48)
        .setDepth(28);

      this.tweens.add({
        targets: bubble,
        x: bubble.x + Phaser.Math.Between(-5, 5),
        y: bubble.y - Phaser.Math.Between(12, 24),
        alpha: 0,
        duration: Phaser.Math.Between(260, 420),
        ease: 'Sine.easeOut',
        onComplete: () => bubble.destroy()
      });
    }
  }

  findMatches() {
    const matched = new Set();

    for (let row = 0; row < this.rows; row += 1) {
      let runStart = 0;

      for (let col = 1; col <= this.cols; col += 1) {
        const current =
          col < this.cols
            ? this.board[row][col]?.type
            : null;

        const previous =
          this.board[row][col - 1]?.type ?? null;

        if (current !== previous) {
          const length = col - runStart;

          if (previous && length >= 3) {
            for (let c = runStart; c < col; c += 1) {
              matched.add(row + ':' + c);
            }
          }

          runStart = col;
        }
      }
    }

    for (let col = 0; col < this.cols; col += 1) {
      let runStart = 0;

      for (let row = 1; row <= this.rows; row += 1) {
        const current =
          row < this.rows
            ? this.board[row][col]?.type
            : null;

        const previous =
          this.board[row - 1][col]?.type ?? null;

        if (current !== previous) {
          const length = row - runStart;

          if (previous && length >= 3) {
            for (let r = runStart; r < row; r += 1) {
              matched.add(r + ':' + col);
            }
          }

          runStart = row;
        }
      }
    }

    return matched;
  }

  async resolveCascade(initialMatches) {
    let matches = initialMatches;
    let cascade = 1;

    while (matches.size > 0) {
      if (cascade > 1) {
        this.statusText.setText('Каскад ×' + cascade);
      }

      await this.clearMatches(matches, cascade);
      await this.collapseBoard();
      await this.refillBoard();

      matches = this.findMatches();
      cascade += 1;
    }
  }

  clearMatches(matches, cascade) {
    return new Promise(resolve => {
      const cells = [...matches].map(key =>
        key.split(':').map(Number)
      );

      if (cells.length === 0) {
        resolve();
        return;
      }

      this.matchedTotal += cells.length;
      this.scoreText.setText(String(this.matchedTotal));

      const groups = this.buildMatchGroups(cells);
      let groupsRemaining = groups.length;

      const finishGroup = () => {
        groupsRemaining -= 1;
        if (groupsRemaining === 0) resolve();
      };

      groups.forEach(group => {
        const pieces = group
          .map(([row, col]) => ({
            row,
            col,
            piece: this.board[row][col]
          }))
          .filter(item => item.piece?.sprite?.active);

        if (pieces.length === 0) {
          finishGroup();
          return;
        }

        this.animateMatchSchoolDive(
          pieces,
          cascade,
          () => {
            pieces.forEach(({ row, col, piece }) => {
              if (piece.tailTimer) {
                piece.tailTimer.remove(false);
                piece.tailTimer = null;
              }

              if (piece.sprite?.active) {
                piece.sprite.destroy();
              }

              this.board[row][col] = null;
            });

            finishGroup();
          }
        );
      });
    });
  }

  buildMatchGroups(cells) {
    const remaining = new Set(
      cells.map(([row, col]) => row + ':' + col)
    );
    const groups = [];

    while (remaining.size > 0) {
      const first = remaining.values().next().value;
      remaining.delete(first);

      const queue = [first];
      const group = [];

      while (queue.length > 0) {
        const key = queue.shift();
        const [row, col] = key.split(':').map(Number);
        group.push([row, col]);

        const neighbors = [
          [row - 1, col],
          [row + 1, col],
          [row, col - 1],
          [row, col + 1]
        ];

        neighbors.forEach(([nr, nc]) => {
          const neighborKey = nr + ':' + nc;
          if (remaining.has(neighborKey)) {
            remaining.delete(neighborKey);
            queue.push(neighborKey);
          }
        });
      }

      groups.push(group);
    }

    return groups;
  }

  animateMatchSchoolDive(items, cascade, onComplete) {
    const center = items.reduce(
      (acc, item) => {
        acc.x += item.piece.sprite.x;
        acc.y += item.piece.sprite.y;
        return acc;
      },
      { x: 0, y: 0 }
    );

    center.x /= items.length;
    center.y /= items.length;

    // A match should feel like the fish have been startled:
    // one dense cloud of tiny bubbles, then every fish bolts away
    // in its own direction and fades while swimming out of the board.
    this.playEscapeBubbleCloud(
      center.x,
      center.y,
      Phaser.Math.Clamp(10 + items.length * 3, 16, 26),
      30
    );

    const globalAngleOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);
    let remaining = items.length;

    items.forEach((item, index) => {
      const piece = item.piece;
      const sprite = piece.sprite;

      if (piece.idleTimer) {
        piece.idleTimer.remove(false);
        piece.idleTimer = null;
      }

      if (piece.tailTimer) {
        piece.tailTimer.remove(false);
        piece.tailTimer = null;
      }

      this.tweens.killTweensOf(sprite);

      const baseAngle =
        globalAngleOffset +
        (Math.PI * 2 * index) / Math.max(1, items.length);

      const escapeAngle =
        baseAngle + Phaser.Math.FloatBetween(-0.28, 0.28);

      const direction = {
        x: Math.cos(escapeAngle),
        y: Math.sin(escapeAngle)
      };

      const target = this.getEscapeTarget(
        sprite.x,
        sprite.y,
        direction.x,
        direction.y
      );

      const controlDistance = Phaser.Math.Between(36, 64);
      const curveSide = index % 2 === 0 ? 1 : -1;

      const control = {
        x:
          (sprite.x + target.x) / 2 -
          direction.y * controlDistance * curveSide,
        y:
          (sprite.y + target.y) / 2 +
          direction.x * controlDistance * curveSide
      };

      const faceLeft = direction.x < 0;
      const travelAngle = Phaser.Math.RadToDeg(
        Math.atan2(direction.y, Math.abs(direction.x) + 0.0001)
      );

      // Tiny first jolt: the fish "startles" before bolting away.
      sprite.setFlipX(faceLeft);

      this.tweens.add({
        targets: sprite,
        x: sprite.x - direction.x * Phaser.Math.Between(3, 7),
        y: sprite.y - direction.y * Phaser.Math.Between(3, 7),
        angle: -travelAngle * 0.20,
        scaleX: BASE_SCALE * 1.04,
        scaleY: BASE_SCALE * 1.04,
        duration: Phaser.Math.Between(65, 95),
        ease: 'Quad.easeOut',
        onComplete: () => {
          if (!sprite.active) {
            remaining -= 1;
            if (remaining === 0) onComplete();
            return;
          }

          const start = {
            x: sprite.x,
            y: sprite.y
          };

          sprite.setAngle(travelAngle);
          piece.escapeTrailStep = 0;

          this.playEscapeBubbleBurst(
            start.x,
            start.y,
            Phaser.Math.Between(4, 6)
          );

          this.tweens.addCounter({
            from: 0,
            to: 1,
            duration: Phaser.Math.Between(540, 760),
            ease: 'Sine.easeIn',
            onUpdate: tween => {
              if (!sprite.active) return;

              const t = tween.getValue();
              const inv = 1 - t;

              sprite.x =
                inv * inv * start.x +
                2 * inv * t * control.x +
                t * t * target.x;

              sprite.y =
                inv * inv * start.y +
                2 * inv * t * control.y +
                t * t * target.y;

              const tailOut = Math.sin(Math.PI * t);
              sprite.setScale(
                BASE_SCALE * (1 - 0.10 * tailOut - 0.18 * t)
              );

              // Fade only after the fish has visibly started escaping.
              if (t > 0.48) {
                sprite.setAlpha(
                  Phaser.Math.Clamp(
                    0.96 * (1 - (t - 0.48) / 0.52),
                    0,
                    0.96
                  )
                );
              }

              const thresholds = [0.18, 0.38, 0.58, 0.76];
              if (
                piece.escapeTrailStep < thresholds.length &&
                t >= thresholds[piece.escapeTrailStep]
              ) {
                this.playEscapeBubbleBurst(
                  sprite.x,
                  sprite.y,
                  Phaser.Math.Between(3, 5)
                );
                piece.escapeTrailStep += 1;
              }
            },
            onComplete: () => {
              if (sprite.active) {
                this.playEscapeBubbleBurst(
                  sprite.x,
                  sprite.y,
                  Phaser.Math.Between(4, 7)
                );
                sprite.setAlpha(0);
              }

              remaining -= 1;
              if (remaining === 0) onComplete();
            }
          });
        }
      });
    });
  }

  getEscapeTarget(x, y, dx, dy) {
    const left =
      this.boardX - this.cellSize / 2 - Phaser.Math.Between(70, 120);
    const right =
      this.boardX +
      (this.cols - 1) * this.cellSize +
      this.cellSize / 2 +
      Phaser.Math.Between(70, 120);
    const top =
      this.boardY - this.cellSize / 2 - Phaser.Math.Between(70, 110);
    const bottom =
      this.boardY +
      (this.rows - 1) * this.cellSize +
      this.cellSize / 2 +
      Phaser.Math.Between(70, 120);

    const distances = [];

    if (dx > 0.0001) {
      distances.push((right - x) / dx);
    } else if (dx < -0.0001) {
      distances.push((left - x) / dx);
    }

    if (dy > 0.0001) {
      distances.push((bottom - y) / dy);
    } else if (dy < -0.0001) {
      distances.push((top - y) / dy);
    }

    const positive = distances.filter(distance => distance > 0);
    const exitDistance =
      positive.length > 0
        ? Math.min(...positive)
        : Phaser.Math.Between(260, 340);

    const travel =
      exitDistance + Phaser.Math.Between(55, 125);

    return {
      x: x + dx * travel,
      y: y + dy * travel
    };
  }

  playEscapeBubbleCloud(x, y, count = 18, spread = 28) {
    for (let i = 0; i < count; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(3, spread);

      this.spawnTinyEscapeBubble(
        x + Math.cos(angle) * distance,
        y + Math.sin(angle) * distance * 0.65,
        Phaser.Math.Between(-12, 12),
        Phaser.Math.Between(20, 48),
        Phaser.Math.Between(330, 620)
      );
    }

    const mist = this.add.ellipse(
      x,
      y + 3,
      46,
      28,
      0xd8f9ff,
      0.10
    ).setDepth(24);

    this.tweens.add({
      targets: mist,
      scaleX: 1.8,
      scaleY: 1.45,
      alpha: 0,
      duration: 300,
      ease: 'Sine.easeOut',
      onComplete: () => mist.destroy()
    });
  }

  playEscapeBubbleBurst(x, y, count = 4) {
    for (let i = 0; i < count; i += 1) {
      this.spawnTinyEscapeBubble(
        x + Phaser.Math.Between(-7, 7),
        y + Phaser.Math.Between(-5, 6),
        Phaser.Math.Between(-9, 9),
        Phaser.Math.Between(14, 34),
        Phaser.Math.Between(260, 480)
      );
    }
  }

  spawnTinyEscapeBubble(x, y, driftX, rise, duration) {
    const radius = Phaser.Math.FloatBetween(0.8, 2.5);

    const bubble = this.add.circle(
      x,
      y,
      radius,
      0xe9fcff,
      Phaser.Math.FloatBetween(0.10, 0.20)
    )
      .setStrokeStyle(
        Math.max(0.7, radius * 0.34),
        0xe9fcff,
        Phaser.Math.FloatBetween(0.34, 0.58)
      )
      .setDepth(28);

    this.tweens.add({
      targets: bubble,
      x: bubble.x + driftX,
      y: bubble.y - rise,
      alpha: 0,
      scaleX: Phaser.Math.FloatBetween(0.75, 1.25),
      scaleY: Phaser.Math.FloatBetween(0.75, 1.25),
      duration,
      ease: 'Sine.easeOut',
      onComplete: () => bubble.destroy()
    });
  }

  collapseBoard() {
    const tweens = [];

    for (let col = 0; col < this.cols; col += 1) {
      let writeRow = this.rows - 1;

      for (let row = this.rows - 1; row >= 0; row -= 1) {
        const piece = this.board[row][col];
        if (!piece) continue;

        if (row !== writeRow) {
          this.board[writeRow][col] = piece;
          this.board[row][col] = null;

          piece.row = writeRow;
          piece.col = col;

          const target = this.cellCenter(writeRow, col);

          tweens.push(
            new Promise(resolve => {
              this.tweens.add({
                targets: piece.sprite,
                x: target.x,
                y: target.y,
                angle: 0,
                duration: 250 + (writeRow - row) * 45,
                ease: 'Sine.easeOut',
                onComplete: resolve
              });
            })
          );
        }

        writeRow -= 1;
      }

      for (let row = writeRow; row >= 0; row -= 1) {
        this.board[row][col] = null;
      }
    }

    return Promise.all(tweens);
  }

  refillBoard() {
    const tweens = [];

    for (let col = 0; col < this.cols; col += 1) {
      const emptyRows = [];

      for (let row = 0; row < this.rows; row += 1) {
        if (!this.board[row][col]) {
          emptyRows.push(row);
        }
      }

      emptyRows.forEach((row, index) => {
        const type = Phaser.Utils.Array.GetRandom(FISH_TYPES);
        const { x, y } = this.cellCenter(row, col);
        const spawnY =
          this.boardY -
          this.cellSize * (emptyRows.length - index + 0.8);

        const sprite = this.add.sprite(
          x,
          spawnY,
          'fish',
          type + '_f01'
        )
          .setScale(BASE_SCALE)
          .setDepth(10)
          .setFlipX(Phaser.Math.Between(0, 1) === 1);

        const piece = {
          type,
          sprite,
          row,
          col,
          idleTimer: null,
          tailTimer: null,
          tailPose: 0
        };

        this.board[row][col] = piece;
        this.startTailMicroAnimation(piece);

        tweens.push(
          new Promise(resolve => {
            this.tweens.add({
              targets: sprite,
              y,
              duration: 320 + index * 55,
              ease: 'Sine.easeOut',
              onComplete: resolve
            });
          })
        );
      });
    }

    return Promise.all(tweens);
  }

  stopAllIdle() {
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        const piece = this.board[row][col];
        if (piece) {
          this.stopIdle(piece, true);
        }
      }
    }
  }

  restartAllIdle() {
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        const piece = this.board[row][col];
        if (piece) {
          this.startIdle(piece);
        }
      }
    }
  }

  cellCenter(row, col) {
    return {
      x: this.boardX + col * this.cellSize,
      y: this.boardY + row * this.cellSize
    };
  }
}
