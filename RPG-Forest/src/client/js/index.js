import Phaser from 'phaser';
import BootScene from './game/scenes/bootscene';
import MainScene from './game/scenes/mainscene';
import GameOverScene from './game/scenes/GameOverScene';

const logo = document.getElementById('logo');
if (logo) logo.style.display = 'none';

const connectBtn = document.getElementById('my-connect-button');
if (connectBtn) {
  connectBtn.textContent = 'Connect MetaMask (optional)';
  connectBtn.style.fontSize = '12px';
  connectBtn.style.padding = '6px 12px';
  connectBtn.style.opacity = '0.7';
  connectBtn.addEventListener('click', async () => {
    if (!window.ethereum) {
      connectBtn.textContent = 'MetaMask not found';
      connectBtn.disabled = true;
      return;
    }
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      connectBtn.textContent = '\u2713 Wallet connected';
      connectBtn.disabled = true;
      connectBtn.style.opacity = '0.5';
    } catch (err) {
      connectBtn.textContent = 'Connection denied';
    }
  });
}

const config = {
  type: Phaser.AUTO,
  backgroundColor: '#060e06',
  parent: 'game-container',
  scene: [BootScene, MainScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  render: {
    antialias: false,
    pixelArt: true,
  },
};

new Phaser.Game(config);
