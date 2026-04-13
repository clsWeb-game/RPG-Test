import * as THREE from 'three';

export default class ThreeMap {
  constructor() {
    this.scene = new THREE.Scene();
    // Set up camera, renderer, lights, and any 3D objects here
  }

  render(renderer, camera) {
    renderer.render(this.scene, camera);
  }
}
