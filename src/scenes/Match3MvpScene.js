const FISH_TYPES = [
  'fish_01_goldfish',
  'fish_02_blue_tang',
  'fish_03_moorish_idol',
  'fish_04_white_angelfish',
  'fish_05_yellow_tang',
  'fish_06_clownfish'
];

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

    this.add.text(805, 124, 'PLAYABLE MVP', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
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

    this.resetHit = this.add.zone(805, 532, 140, 44).setInteractive({ useHandCursor: true });
    this.add.text(805, 532, 'ЗАНОВО', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.resetHit.on('pointerdown', () => {
      this.scene.restart();
    });

    this.add.text(805, 592, 'Технический игровой срез\nбез финального баланса уровня', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#75aebd',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5);
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
        this.board[row][col] = this.makePiece(row, col, type, y - Phaser.Math.Between(0, 18));
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
      candidates = candidates.filter(t => t !== left1);
    }

    const up1 = row >= 1 ? this.board[row - 1]?.[col]?.type : null;
    const up2 = row >= 2 ? this.board[row - 2]?.[col]?.type : null;
    if (up1 && up1 === up2) {
      candidates = candidates.filter(t => t !== up1);
    }

    return Phaser.Utils.Array.GetRandom(candidates);
  }

  makePiece(row, col, type, spawnY = null) {
    const { x, y } = this.cellCenter(row, col);
    const sprite = this.add.sprite(x, spawnY ?? y, 'fish', type + '_f01')
      .setScale(0.19)
      .setDepth(10)
      .setFlipX(Phaser.Math.Between(0, 1) === 1);

    const piece = {
      type,
      sprite,
      row,
      col
    };

    this.startIdle(piece);

    if (spawnY !== null && spawnY !== y) {
      this.tweens.add({
        targets: sprite,
        y,
        duration: 280,
        ease: 'Sine.easeOut'
      });
    }

    return piece;
  }

  startIdle(piece) {
    const sprite = piece.sprite;
    this.tweens.killTweensOf(sprite);
    const { x, y } = this.cellCenter(piece.row, piece.col);
    sprite.setPosition(x, y);
    sprite.setAngle(0);

    const cycle = () => {
      if (!sprite.active || this.busy) return;
      const flip = sprite.flipX ? -1 : 1;

      this.tweens.add({
        targets: sprite,
        y: y + Phaser.Math.FloatBetween(-3.2, 3.2),
        angle: flip * Phaser.Math.FloatBetween(-0.9, 0.9),
        duration: Phaser.Math.Between(2600, 4200),
        yoyo: true,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          if (!sprite.active || this.busy) return;
          this.time.delayedCall(Phaser.Math.Between(100, 480), cycle);
        }
      });
    };

    this.time.delayedCall(Phaser.Math.Between(0, 700), cycle);
  }

  stopIdle(piece) {
    if (!piece?.sprite) return;
    this.tweens.killTweensOf(piece.sprite);
    piece.sprite.setAngle(0);
    const { x, y } = this.cellCenter(piece.row, piece.col);
    piece.sprite.setPosition(x, y);
  }

  pointerToCell(x, y) {
    const col = Math.floor((x - (this.boardX - this.cellSize / 2)) / this.cellSize);
    const row = Math.floor((y - (this.boardY - this.cellSize / 2)) / this.cellSize);

    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;

    const center = this.cellCenter(row, col);
    if (
      Math.abs(x - center.x) > this.cellSize / 2 ||
      Math.abs(y - center.y) > this.cellSize / 2
    ) return null;

    return { row, col };
  }

  selectCell(row, col) {
    this.selected = { row, col };
    const { x, y } = this.cellCenter(row, col);
    this.selectionRing.setPosition(x, y).setVisible(true);

    this.tweens.killTweensOf(this.selectionRing);
    this.selectionRing.setScale(1);
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
    this.selectionRing.setVisible(false).setAlpha(1).setScale(1);
  }

  async trySwap(r1, c1, r2, c2) {
    if (this.busy || this.moves <= 0) return;

    this.busy = true;
    this.stopAllIdle();

    await this.animateSwap(r1, c1, r2, c2);

    const matches = this.findMatches();

    if (matches.size === 0) {
      await this.animateSwap(r1, c1, r2, c2);
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

  animateSwap(r1, c1, r2, c2) {
    return new Promise(resolve => {
      const a = this.board[r1][c1];
      const b = this.board[r2][c2];
      if (!a || !b) {
        resolve();
        return;
      }

      this.board[r1][c1] = b;
      this.board[r2][c2] = a;

      a.row = r2;
      a.col = c2;
      b.row = r1;
      b.col = c1;

      const pa = this.cellCenter(a.row, a.col);
      const pb = this.cellCenter(b.row, b.col);

      let done = 0;
      const finish = () => {
        done += 1;
        if (done === 2) resolve();
      };

      this.tweens.add({
        targets: a.sprite,
        x: pa.x,
        y: pa.y,
        scaleX: a.sprite.scaleX * 0.96,
        duration: 220,
        ease: 'Sine.easeInOut',
        onComplete: finish
      });

      this.tweens.add({
        targets: b.sprite,
        x: pb.x,
        y: pb.y,
        scaleX: b.sprite.scaleX * 0.96,
        duration: 220,
        ease: 'Sine.easeInOut',
        onComplete: finish
      });
    });
  }

  findMatches() {
    const matched = new Set();

    for (let row = 0; row < this.rows; row += 1) {
      let runStart = 0;

      for (let col = 1; col <= this.cols; col += 1) {
        const current = col < this.cols ? this.board[row][col]?.type : null;
        const previous = this.board[row][col - 1]?.type ?? null;

        if (current !== previous) {
          const length = col - runStart;
          if (previous && length >= 3) {
            for (let c = runStart; c < col; c += 1) matched.add(row + ':' + c);
          }
          runStart = col;
        }
      }
    }

    for (let col = 0; col < this.cols; col += 1) {
      let runStart = 0;

      for (let row = 1; row <= this.rows; row += 1) {
        const current = row < this.rows ? this.board[row][col]?.type : null;
        const previous = this.board[row - 1][col]?.type ?? null;

        if (current !== previous) {
          const length = row - runStart;
          if (previous && length >= 3) {
            for (let r = runStart; r < row; r += 1) matched.add(r + ':' + col);
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
      const cells = [...matches].map(key => key.split(':').map(Number));
      if (cells.length === 0) {
        resolve();
        return;
      }

      this.matchedTotal += cells.length;
      this.scoreText.setText(String(this.matchedTotal));

      let remaining = cells.length;

      cells.forEach(([row, col]) => {
        const piece = this.board[row][col];
        if (!piece) {
          remaining -= 1;
          if (remaining === 0) resolve();
          return;
        }

        this.playMatchFx(piece.sprite.x, piece.sprite.y, cascade);

        this.tweens.add({
          targets: piece.sprite,
          alpha: 0,
          scaleX: piece.sprite.scaleX * 0.35,
          scaleY: piece.sprite.scaleY * 0.35,
          duration: 240,
          ease: 'Back.easeIn',
          onComplete: () => {
            piece.sprite.destroy();
            this.board[row][col] = null;
            remaining -= 1;
            if (remaining === 0) resolve();
          }
        });
      });
    });
  }

  playMatchFx(x, y, cascade) {
    const ring = this.add.ellipse(x, y, 18, 10, 0x000000, 0)
      .setStrokeStyle(2, 0xb9f5ff, 0.45)
      .setDepth(25);

    this.tweens.add({
      targets: ring,
      scaleX: 3.0 + cascade * 0.12,
      scaleY: 2.2 + cascade * 0.08,
      alpha: 0,
      duration: 330,
      ease: 'Sine.easeOut',
      onComplete: () => ring.destroy()
    });

    for (let i = 0; i < 3; i += 1) {
      const bubble = this.add.circle(
        x + Phaser.Math.Between(-14, 14),
        y + Phaser.Math.Between(-8, 8),
        Phaser.Math.Between(2, 4),
        0xdffaff,
        0.18
      ).setStrokeStyle(1, 0xdffaff, 0.55).setDepth(26);

      this.tweens.add({
        targets: bubble,
        x: bubble.x + Phaser.Math.Between(-10, 10),
        y: bubble.y - Phaser.Math.Between(20, 42),
        alpha: 0,
        duration: Phaser.Math.Between(340, 520),
        ease: 'Sine.easeOut',
        onComplete: () => bubble.destroy()
      });
    }
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

          tweens.push(new Promise(resolve => {
            this.tweens.add({
              targets: piece.sprite,
              x: target.x,
              y: target.y,
              duration: 250 + (writeRow - row) * 45,
              ease: 'Sine.easeOut',
              onComplete: resolve
            });
          }));
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
        if (!this.board[row][col]) emptyRows.push(row);
      }

      emptyRows.forEach((row, index) => {
        const type = Phaser.Utils.Array.GetRandom(FISH_TYPES);
        const { x, y } = this.cellCenter(row, col);
        const spawnY = this.boardY - this.cellSize * (emptyRows.length - index + 0.8);

        const sprite = this.add.sprite(x, spawnY, 'fish', type + '_f01')
          .setScale(0.19)
          .setDepth(10)
          .setFlipX(Phaser.Math.Between(0, 1) === 1);

        const piece = { type, sprite, row, col };
        this.board[row][col] = piece;

        tweens.push(new Promise(resolve => {
          this.tweens.add({
            targets: sprite,
            y,
            duration: 320 + index * 55,
            ease: 'Sine.easeOut',
            onComplete: resolve
          });
        }));
      });
    }

    return Promise.all(tweens);
  }

  stopAllIdle() {
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        const piece = this.board[row][col];
        if (piece) this.stopIdle(piece);
      }
    }
  }

  restartAllIdle() {
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        const piece = this.board[row][col];
        if (piece) this.startIdle(piece);
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
