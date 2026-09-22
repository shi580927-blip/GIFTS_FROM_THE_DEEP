import { BLOCKERS } from '../config/blockers.js?v=20260922-blockers-v2';
import {
  playBlockerDamageFX,
  playBlockerDestroyFX
} from '../fx/blockerFx.js?v=20260922-blocker-fx-v1';

const FISH_TYPES = [
  'fish_01_goldfish',
  'fish_02_blue_tang',
  'fish_03_moorish_idol',
  'fish_04_white_angelfish',
  'fish_05_yellow_tang',
  'fish_06_clownfish'
];


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

    this.load.atlas(
      'blockers_all',
      'assets/atlas/blockers/blockers_all_atlas.png?v=20260922-blockers-v2',
      'assets/atlas/blockers/blockers_all_atlas.json?v=20260922-blockers-v2'
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
    this.blockers = [];
    this.blockersEnabled =
      new URLSearchParams(window.location.search).get('blockers') !== '0';
    this.selected = null;
    this.busy = false;
    this.moves = 20;
    this.matchedTotal = 0;

    this.createBackdrop();
    this.createHud();
    this.createBoard();
    if (this.blockersEnabled) {
      this.createPlayableBlockers();
    }

    this.input.on('pointerdown', pointer => {
      if (this.busy) return;

      const cell = this.pointerToCell(pointer.x, pointer.y);
      if (!cell) {
        this.clearSelection();
        return;
      }

      const piece = this.board[cell.row]?.[cell.col];
      if (!piece) return;

      if (this.cellBlocksSwap(cell.row, cell.col)) {
        this.clearSelection();
        this.statusText.setText('Эта рыба пока заблокирована');
        return;
      }

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

    this.add.text(805, 124, 'PLAYABLE · BLOCKERS v1', {
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
      'Тест: базовый match-3 + препятствия\nрыбы: sway без покадрового idle',
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
      frozenByBlocker: false
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

    return piece;
  }

  startIdle(piece) {
    const sprite = piece?.sprite;
    if (!sprite?.active) return;

    this.stopIdle(piece, false);

    if (piece.frozenByBlocker) {
      const frozenCenter = this.cellCenter(piece.row, piece.col);
      sprite.setPosition(frozenCenter.x, frozenCenter.y);
      sprite.setAngle(0);
      sprite.setScale(BASE_SCALE);
      sprite.setAlpha(0.96);
      return;
    }

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

  createPlayableBlockers() {
    for (let row = 0; row < this.rows; row += 1) {
      this.blockers[row] = Array(this.cols).fill(null);
    }

    const placements = [
      { type: 'seaweed', row: 1, col: 2 },
      { type: 'sand', row: 2, col: 5 },
      { type: 'rock', row: 3, col: 1 },
      { type: 'shell', row: 4, col: 6 },
      { type: 'net', row: 5, col: 3 },
      { type: 'ice', row: 6, col: 5 }
    ];

    placements.forEach(def => this.addPlayableBlocker(def));
    this.syncOverlayFreezeState();
  }

  addPlayableBlocker({ type, row, col }) {
    const cfg = BLOCKERS[type];
    if (!cfg) return;

    const { x, y } = this.cellCenter(row, col);
    const piece = this.board[row]?.[col];

    if (cfg.layer === 'solid' && piece) {
      this.stopIdle(piece, false);
      if (piece.sprite?.active) piece.sprite.destroy();
      this.board[row][col] = null;
    }

    const sprite = this.add.sprite(x, y, cfg.atlas, cfg.frames[0]);
    const blockerScale = {
      seaweed: 0.178,
      sand: 0.184,
      rock: 0.176,
      shell: 0.176,
      net: 0.166,
      ice: 0.184
    };

    sprite
      .setScale(blockerScale[type] || 0.178)
      .setDepth(18);

    if (type === 'sand') sprite.setAlpha(0.84);
    if (type === 'ice') sprite.setAlpha(0.88);
    if (type === 'net') sprite.setAlpha(0.94);

    if (type === 'seaweed') {
      this.tweens.add({
        targets: sprite,
        angle: { from: -1.0, to: 1.0 },
        scaleX: {
          from: sprite.scaleX * 0.988,
          to: sprite.scaleX * 1.012
        },
        duration: 2850,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    this.blockers[row][col] = {
      type,
      row,
      col,
      cfg,
      sprite,
      stage: 0,
      alive: true
    };
  }

  isSolidBlocker(row, col) {
    const blocker = this.blockers?.[row]?.[col];
    return Boolean(blocker?.alive && blocker.cfg.layer === 'solid');
  }

  cellBlocksSwap(row, col) {
    const blocker = this.blockers?.[row]?.[col];
    return Boolean(blocker?.alive && blocker.cfg.blocksSwap);
  }

  syncOverlayFreezeState() {
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        const piece = this.board[row]?.[col];
        if (!piece) continue;

        const blocker = this.blockers?.[row]?.[col];
        const frozen = Boolean(
          blocker?.alive && blocker.cfg.layer === 'overlay'
        );

        piece.frozenByBlocker = frozen;

        if (frozen) {
          this.stopIdle(piece, true);
        }
      }
    }
  }

  damageBlockersFromMatches(matches) {
    if (!this.blockersEnabled || !matches?.size) return;

    const isMatched = (row, col) => matches.has(row + ':' + col);
    const adjacentMatched = (row, col) =>
      isMatched(row - 1, col) ||
      isMatched(row + 1, col) ||
      isMatched(row, col - 1) ||
      isMatched(row, col + 1);

    const hits = [];

    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        const blocker = this.blockers?.[row]?.[col];
        if (!blocker?.alive) continue;

        let hit = false;

        switch (blocker.cfg.damageRule) {
          case 'adjacent_match':
            hit = adjacentMatched(row, col);
            break;
          case 'match_on_cell':
          case 'match_captured_fish':
          case 'match_on_cell_or_hit':
            hit = isMatched(row, col);
            break;
        }

        if (hit) hits.push(blocker);
      }
    }

    hits.forEach(blocker => this.damagePlayableBlocker(blocker));
  }

  damagePlayableBlocker(blocker) {
    if (!blocker?.alive) return;

    const { type, row, col, cfg, sprite } = blocker;
    const { x, y } = this.cellCenter(row, col);
    const finalHit = blocker.stage + 1 >= cfg.frames.length;

    if (finalHit) {
      playBlockerDestroyFX(this, type, x, y);
    } else {
      playBlockerDamageFX(this, type, x, y);
    }

    this.tweens.add({
      targets: sprite,
      scaleX: sprite.scaleX * 0.92,
      scaleY: sprite.scaleY * 0.92,
      duration: 85,
      yoyo: true,
      ease: 'Quad.easeOut'
    });

    blocker.stage += 1;

    if (blocker.stage < cfg.frames.length) {
      sprite.setFrame(cfg.frames[blocker.stage]);
      return;
    }

    blocker.alive = false;
    this.blockers[row][col] = null;

    const piece = this.board[row]?.[col];
    if (piece && cfg.layer === 'overlay') {
      piece.frozenByBlocker = false;
    }

    this.tweens.add({
      targets: sprite,
      alpha: 0,
      duration: 240,
      delay: 45,
      onComplete: () => {
        if (sprite.active) sprite.destroy();
      }
    });
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

    if (this.cellBlocksSwap(r1, c1) || this.cellBlocksSwap(r2, c2)) {
      this.statusText.setText('Препятствие блокирует перестановку');
      return;
    }

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

      this.damageBlockersFromMatches(matches);
      await this.clearMatches(matches, cascade);
      await this.collapseBoard();
      await this.refillBoard();
      this.syncOverlayFreezeState();

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

    this.playEscapeBubbleCloud(
      center.x,
      center.y,
      Phaser.Math.Clamp(12 + items.length * 4, 18, 32),
      34
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

      this.tweens.killTweensOf(sprite);

      const baseAngle =
        globalAngleOffset +
        (Math.PI * 2 * index) / Math.max(1, items.length);

      const escapeAngle =
        baseAngle + Phaser.Math.FloatBetween(-0.32, 0.32);

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

      sprite.setFlipX(direction.x < 0);

      this.tweens.add({
        targets: sprite,
        x: sprite.x - direction.x * Phaser.Math.Between(4, 8),
        y: sprite.y - direction.y * Phaser.Math.Between(4, 8),
        scaleX: BASE_SCALE * 1.04,
        scaleY: BASE_SCALE * 1.04,
        duration: Phaser.Math.Between(80, 110),
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

          const travelX = target.x - start.x;
          const travelY = target.y - start.y;
          const normal = {
            x: -direction.y,
            y: direction.x
          };

          const sideSign = index % 2 === 0 ? 1 : -1;
          const sideA = Phaser.Math.Between(24, 42) * sideSign;
          const sideB = Phaser.Math.Between(18, 36) * -sideSign;

          const cp1 = {
            x: start.x + travelX * 0.28 + normal.x * sideA,
            y: start.y + travelY * 0.28 + normal.y * sideA
          };

          const cp2 = {
            x: start.x + travelX * 0.66 + normal.x * sideB,
            y: start.y + travelY * 0.66 + normal.y * sideB
          };

          const curve = new Phaser.Curves.CubicBezier(
            new Phaser.Math.Vector2(start.x, start.y),
            new Phaser.Math.Vector2(cp1.x, cp1.y),
            new Phaser.Math.Vector2(cp2.x, cp2.y),
            new Phaser.Math.Vector2(target.x, target.y)
          );

          this.playEscapeBubbleBurst(
            start.x,
            start.y,
            Phaser.Math.Between(5, 7)
          );

          piece.escapeTrailStep = 0;

          this.tweens.addCounter({
            from: 0,
            to: 1,
            duration: Phaser.Math.Between(980, 1320),
            ease: 'Sine.easeInOut',
            onUpdate: tween => {
              if (!sprite.active) return;

              const t = tween.getValue();
              const point = curve.getPoint(t);
              sprite.x = point.x;
              sprite.y = point.y;

              const lookAhead = Math.min(1, t + 0.025);
              const nextPoint = curve.getPoint(lookAhead);
              const dx = nextPoint.x - point.x;
              const dy = nextPoint.y - point.y;

              sprite.setFlipX(dx < 0);

              const angle = Phaser.Math.RadToDeg(
                Math.atan2(dy, Math.abs(dx) + 0.0001)
              );
              sprite.setAngle(angle);

              const pulse = Math.sin(Math.PI * t);
              sprite.setScale(
                BASE_SCALE * (1 - 0.05 * pulse - 0.14 * t)
              );

              if (t > 0.58) {
                sprite.setAlpha(
                  Phaser.Math.Clamp(
                    0.96 * (1 - (t - 0.58) / 0.42),
                    0,
                    0.96
                  )
                );
              } else {
                sprite.setAlpha(0.96);
              }

              const thresholds = [0.14, 0.28, 0.44, 0.60, 0.76, 0.90];
              if (
                piece.escapeTrailStep < thresholds.length &&
                t >= thresholds[piece.escapeTrailStep]
              ) {
                this.playEscapeBubbleBurst(
                  sprite.x,
                  sprite.y,
                  Phaser.Math.Between(4, 7)
                );
                piece.escapeTrailStep += 1;
              }
            },
            onComplete: () => {
              if (sprite.active) {
                this.playEscapeBubbleBurst(
                  sprite.x,
                  sprite.y,
                  Phaser.Math.Between(5, 8)
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
      this.boardX - this.cellSize / 2 - Phaser.Math.Between(85, 145);
    const right =
      this.boardX +
      (this.cols - 1) * this.cellSize +
      this.cellSize / 2 +
      Phaser.Math.Between(85, 145);
    const top =
      this.boardY - this.cellSize / 2 - Phaser.Math.Between(85, 135);
    const bottom =
      this.boardY +
      (this.rows - 1) * this.cellSize +
      this.cellSize / 2 +
      Phaser.Math.Between(85, 145);

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
        : Phaser.Math.Between(280, 360);

    const travel =
      exitDistance + Phaser.Math.Between(70, 130);

    return {
      x: x + dx * travel,
      y: y + dy * travel
    };
  }

  playEscapeBubbleCloud(x, y, count = 20, spread = 30) {
    for (let i = 0; i < count; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(3, spread);

      this.spawnTinyEscapeBubble(
        x + Math.cos(angle) * distance,
        y + Math.sin(angle) * distance * 0.65,
        Phaser.Math.Between(-13, 13),
        Phaser.Math.Between(22, 52),
        Phaser.Math.Between(360, 700)
      );
    }

    const mist = this.add.ellipse(
      x,
      y + 3,
      52,
      30,
      0xd8f9ff,
      0.10
    ).setDepth(24);

    this.tweens.add({
      targets: mist,
      scaleX: 1.9,
      scaleY: 1.5,
      alpha: 0,
      duration: 360,
      ease: 'Sine.easeOut',
      onComplete: () => mist.destroy()
    });
  }

  playEscapeBubbleBurst(x, y, count = 5) {
    for (let i = 0; i < count; i += 1) {
      this.spawnTinyEscapeBubble(
        x + Phaser.Math.Between(-8, 8),
        y + Phaser.Math.Between(-6, 6),
        Phaser.Math.Between(-10, 10),
        Phaser.Math.Between(16, 38),
        Phaser.Math.Between(300, 520)
      );
    }
  }

  spawnTinyEscapeBubble(x, y, driftX, rise, duration) {
    const radius = Phaser.Math.FloatBetween(0.8, 2.3);

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
      let segmentBottom = this.rows - 1;

      for (let separator = this.rows - 1; separator >= -1; separator -= 1) {
        const isSeparator =
          separator === -1 || this.isSolidBlocker(separator, col);

        if (!isSeparator) continue;

        const segmentTop = separator + 1;
        let writeRow = segmentBottom;

        for (let row = segmentBottom; row >= segmentTop; row -= 1) {
          const piece = this.board[row][col];
          if (!piece) continue;

          if (row !== writeRow) {
            this.board[writeRow][col] = piece;
            this.board[row][col] = null;

            piece.row = writeRow;
            piece.col = col;
            piece.frozenByBlocker = false;

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

        for (let row = writeRow; row >= segmentTop; row -= 1) {
          this.board[row][col] = null;
        }

        segmentBottom = separator - 1;
      }
    }

    return Promise.all(tweens);
  }

  refillBoard() {
    const tweens = [];

    for (let col = 0; col < this.cols; col += 1) {
      let segmentBottom = this.rows - 1;

      for (let separator = this.rows - 1; separator >= -1; separator -= 1) {
        const isSeparator =
          separator === -1 || this.isSolidBlocker(separator, col);

        if (!isSeparator) continue;

        const segmentTop = separator + 1;
        const emptyRows = [];

        for (let row = segmentTop; row <= segmentBottom; row += 1) {
          if (!this.board[row][col]) {
            emptyRows.push(row);
          }
        }

        emptyRows.forEach((row, index) => {
          const type = Phaser.Utils.Array.GetRandom(FISH_TYPES);
          const { x, y } = this.cellCenter(row, col);
          const segmentTopY = this.cellCenter(segmentTop, col).y;
          const spawnY =
            segmentTopY -
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
            frozenByBlocker: false
          };

          this.board[row][col] = piece;

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

        segmentBottom = separator - 1;
      }
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
        if (piece && !piece.frozenByBlocker) {
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
