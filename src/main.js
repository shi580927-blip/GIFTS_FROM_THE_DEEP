import TestFishAtlasScene from './scenes/TestFishAtlasScene.js?v=20260921-static-sway-v3';
import SpecialElementsTestScene from './scenes/SpecialElementsTestScene.js?v=20260921-specials-v2';

const params = new URLSearchParams(window.location.search);
const view = params.get('view');
const SceneClass = view === 'specials' ? SpecialElementsTestScene : TestFishAtlasScene;

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
  scene: [SceneClass]
};

const game = new Phaser.Game(config);
window.game = game;
