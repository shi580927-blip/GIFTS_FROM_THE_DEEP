import TestFishAtlasScene from './scenes/TestFishAtlasScene.js?v=20260921-static-sway-v2';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1000,
  height: 720,
  backgroundColor: '#06283a',
  transparent: false,
  antialias: true,
  pixelArt: false,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [TestFishAtlasScene]
};

const game = new Phaser.Game(config);

window.game = game;
