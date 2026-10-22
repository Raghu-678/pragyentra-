/**
 * Pragyentra LLP — 3D Interactive Shipping Container & Pallet Stuffing Visualizer
 * Powered by Three.js (r128)
 */

class CargoContainer3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.containerGroup = null;
    this.palletsGroup = null;
    this.doorsGroup = null;
    this.leftDoor = null;
    this.rightDoor = null;

    this.doorsOpen = false;
    this.xRayMode = false;
    this.currentType = '20GP'; // '20GP' or '40HC'

    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 500;
    const height = this.container.clientHeight || 380;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    this.camera.position.set(28, 22, 38);
    this.camera.lookAt(0, 4, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(40, 50, 40);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    fillLight.position.set(-30, 20, -30);
    this.scene.add(fillLight);

    // Shadow Floor Plane
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshBasicMaterial({
      color: 0x050d1a,
      side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = Math.PI / 2;
    floor.position.y = -0.05;
    this.scene.add(floor);

    // Grid on floor
    const gridHelper = new THREE.GridHelper(60, 20, 0x1e3a8a, 0x0f294d);
    gridHelper.position.y = 0;
    this.scene.add(gridHelper);

    this.containerGroup = new THREE.Group();
    this.scene.add(this.containerGroup);

    this.buildContainer();
    this.setupEvents();
    this.animate();
  }

  buildContainer() {
    // Clear previous
    while (this.containerGroup.children.length > 0) {
      this.containerGroup.remove(this.containerGroup.children[0]);
    }

    const is40 = this.currentType === '40HC';
    const length = is40 ? 32 : 18;
    const height = is40 ? 7.6 : 6.8;
    const width = 7.0;

    // Outer Container Material (Deep Maritime Navy or Emerald Industrial)
    const shellMat = new THREE.MeshStandardMaterial({
      color: 0x0f2744,
      metalness: 0.65,
      roughness: 0.35,
      transparent: this.xRayMode,
      opacity: this.xRayMode ? 0.35 : 1.0
    });

    // Roof & Floor
    const roofFloorMat = new THREE.MeshStandardMaterial({
      color: 0x1a365d,
      metalness: 0.5,
      roughness: 0.5,
      transparent: this.xRayMode,
      opacity: this.xRayMode ? 0.35 : 1.0
    });

    // 1. Bottom Floor Bed
    const floorGeo = new THREE.BoxGeometry(length, 0.4, width);
    const floorMesh = new THREE.Mesh(floorGeo, roofFloorMat);
    floorMesh.position.set(0, 0.2, 0);
    this.containerGroup.add(floorMesh);

    // Wood floor interior planking
    const woodGeo = new THREE.BoxGeometry(length - 0.4, 0.05, width - 0.4);
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0xa16207,
      roughness: 0.8
    });
    const woodMesh = new THREE.Mesh(woodGeo, woodMat);
    woodMesh.position.set(0, 0.42, 0);
    this.containerGroup.add(woodMesh);

    // 2. Roof
    const roofGeo = new THREE.BoxGeometry(length, 0.3, width);
    const roofMesh = new THREE.Mesh(roofGeo, roofFloorMat);
    roofMesh.position.set(0, height + 0.15, 0);
    this.containerGroup.add(roofMesh);

    // 3. Front Wall (Closed end)
    const frontGeo = new THREE.BoxGeometry(0.3, height, width);
    const frontMesh = new THREE.Mesh(frontGeo, shellMat);
    frontMesh.position.set(-length / 2 + 0.15, height / 2, 0);
    this.containerGroup.add(frontMesh);

    // 4. Side Walls with Corrugated ribs
    this.buildSideWall(-width / 2 + 0.15, length, height, shellMat);
    this.buildSideWall(width / 2 - 0.15, length, height, shellMat);

    // 5. Corner Lock Castings (ISO standard)
    this.buildCornerCastings(length, height, width);

    // 6. Rear Cargo Doors (Hinged at the edges)
    this.buildRearDoors(length, height, width);

    // 7. Internal Cargo Pallets Stacked Inside!
    this.buildCargoPallets(length, height, width);
  }

  buildSideWall(zPos, length, height, mat) {
    const wallGroup = new THREE.Group();
    // Flat backing
    const backGeo = new THREE.BoxGeometry(length, height, 0.15);
    const backMesh = new THREE.Mesh(backGeo, mat);
    backMesh.position.set(0, height / 2, zPos);
    wallGroup.add(backMesh);

    // Vertical corrugated ribs
    const ribCount = Math.floor(length * 1.5);
    const ribSpacing = (length - 1) / ribCount;
    const ribGeo = new THREE.BoxGeometry(0.2, height - 0.4, 0.25);

    for (let i = 0; i <= ribCount; i++) {
      const ribMesh = new THREE.Mesh(ribGeo, mat);
      ribMesh.position.set(-length / 2 + 0.5 + i * ribSpacing, height / 2, zPos + (zPos > 0 ? 0.05 : -0.05));
      wallGroup.add(ribMesh);
    }

    this.containerGroup.add(wallGroup);
  }

  buildCornerCastings(length, height, width) {
    const castGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const castMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });

    const xOffsets = [-length / 2 + 0.35, length / 2 - 0.35];
    const yOffsets = [0.35, height - 0.05];
    const zOffsets = [-width / 2 + 0.35, width / 2 - 0.35];

    xOffsets.forEach(x => {
      yOffsets.forEach(y => {
        zOffsets.forEach(z => {
          const cast = new THREE.Mesh(castGeo, castMat);
          cast.position.set(x, y, z);
          this.containerGroup.add(cast);
        });
      });
    });
  }

  buildRearDoors(length, height, width) {
    this.doorsGroup = new THREE.Group();
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x059669, // Emerald green export doors
      metalness: 0.5,
      roughness: 0.4
    });

    const doorW = width / 2 - 0.15;
    const doorH = height - 0.4;
    const doorThick = 0.2;

    // Left Door Pivot
    this.leftDoorPivot = new THREE.Group();
    this.leftDoorPivot.position.set(length / 2, height / 2, -width / 2 + 0.15);

    const leftMesh = new THREE.Mesh(new THREE.BoxGeometry(doorThick, doorH, doorW), doorMat);
    leftMesh.position.set(0, 0, doorW / 2);
    this.leftDoorPivot.add(leftMesh);
    this.doorsGroup.add(this.leftDoorPivot);

    // Right Door Pivot
    this.rightDoorPivot = new THREE.Group();
    this.rightDoorPivot.position.set(length / 2, height / 2, width / 2 - 0.15);

    const rightMesh = new THREE.Mesh(new THREE.BoxGeometry(doorThick, doorH, doorW), doorMat);
    rightMesh.position.set(0, 0, -doorW / 2);
    this.rightDoorPivot.add(rightMesh);
    this.doorsGroup.add(this.rightDoorPivot);

    this.containerGroup.add(this.doorsGroup);
  }

  buildCargoPallets(length, height, width) {
    this.palletsGroup = new THREE.Group();

    // Standard Euro Pallet dimensions scaled (approx 2.4 length units x 1.8 width units)
    const palletW = 2.0;
    const palletL = 2.4;
    const rows = Math.floor((length - 2.5) / palletL);
    const cols = 2;

    const woodPalletMat = new THREE.MeshStandardMaterial({ color: 0xc2884a, roughness: 0.9 });
    const cartonMat = new THREE.MeshStandardMaterial({ color: 0xdfab73, roughness: 0.8 });
    const wrapMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      roughness: 0.2
    });

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = -length / 2 + 1.8 + r * (palletL + 0.2);
        const pz = -width / 2 + 1.8 + c * (palletW + 0.4);

        const singlePallet = new THREE.Group();
        singlePallet.position.set(px, 0.45, pz);

        // Wooden Pallet Base
        const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(palletL, 0.3, palletW), woodPalletMat);
        baseMesh.position.y = 0.15;
        singlePallet.add(baseMesh);

        // Stacked Export Cargo Cartons (2 tiers)
        const cartonBlock = new THREE.Mesh(new THREE.BoxGeometry(palletL - 0.1, 3.2, palletW - 0.1), cartonMat);
        cartonBlock.position.y = 1.85;
        singlePallet.add(cartonBlock);

        // Clear Shrink-wrap Plastic Film overlay
        const wrapBlock = new THREE.Mesh(new THREE.BoxGeometry(palletL, 3.25, palletW), wrapMat);
        wrapBlock.position.y = 1.85;
        singlePallet.add(wrapBlock);

        this.palletsGroup.add(singlePallet);
      }
    }

    this.containerGroup.add(this.palletsGroup);
  }

  toggleDoors() {
    this.doorsOpen = !this.doorsOpen;
    const targetAngle = this.doorsOpen ? Math.PI * 0.65 : 0;

    // Smooth transition
    const startLeft = this.leftDoorPivot.rotation.y;
    const startRight = this.rightDoorPivot.rotation.y;
    const startTime = performance.now();
    const duration = 600;

    const animateDoors = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out

      this.leftDoorPivot.rotation.y = startLeft + (-targetAngle - startLeft) * ease;
      this.rightDoorPivot.rotation.y = startRight + (targetAngle - startRight) * ease;

      if (progress < 1) {
        requestAnimationFrame(animateDoors);
      }
    };
    requestAnimationFrame(animateDoors);
  }

  toggleXRay() {
    this.xRayMode = !this.xRayMode;
    this.buildContainer();
  }

  switchContainerType(type) {
    this.currentType = type;
    this.buildContainer();
  }

  setupEvents() {
    const dom = this.renderer.domElement;

    dom.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    dom.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        this.containerGroup.rotation.y += deltaX * 0.008;
        this.camera.position.y += deltaY * 0.08;
        this.camera.position.y = Math.max(10, Math.min(50, this.camera.position.y));
        this.camera.lookAt(0, 4, 0);

        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    // Touch support for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    });
    dom.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - touchStartX;
        this.containerGroup.rotation.y += deltaX * 0.008;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    });

    window.addEventListener('resize', () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (!this.isDragging) {
      this.containerGroup.rotation.y += 0.002;
    }
    this.renderer.render(this.scene, this.camera);
  }
}

// Global initialization
window.CargoContainer3D = CargoContainer3D;
