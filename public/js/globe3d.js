/**
 * Pragyentra LLP — 3D Interactive Shipping Globe & Trade Lanes Visualizer
 * Powered by Three.js (r128)
 */

class ShippingGlobe3D {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.options = options;
    this.portsData = null;
    this.activeFilter = 'ALL';
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.globeGroup = null;
    this.arcsGroup = null;
    this.markersGroup = null;
    this.particlesGroup = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.portMarkersList = [];
    this.activeArcs = [];
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.autoRotateSpeed = 0.002;
    this.isHovering = false;
    this.tooltipEl = document.getElementById('globeTooltip');

    this.init();
  }

  async init() {
    try {
      // 1. Fetch ports data
      const res = await fetch('/api/ports');
      const json = await res.json();
      if (json.success) {
        this.portsData = json.data;
      }
    } catch (e) {
      console.warn('Using fallback ports data', e);
    }

    this.setupScene();
    this.buildGlobe();
    this.buildPortMarkers();
    this.buildShippingArcs();
    this.setupEvents();
    this.animate();
  }

  setupScene() {
    const width = this.container.clientWidth || 500;
    const height = this.container.clientHeight || 420;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 50, 240);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(150, 200, 150);
    this.scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0x10b981, 0.8);
    dirLight2.position.set(-150, -100, -150);
    this.scene.add(dirLight2);

    this.globeGroup = new THREE.Group();
    this.arcsGroup = new THREE.Group();
    this.markersGroup = new THREE.Group();
    this.particlesGroup = new THREE.Group();

    this.globeGroup.add(this.arcsGroup);
    this.globeGroup.add(this.markersGroup);
    this.globeGroup.add(this.particlesGroup);
    this.scene.add(this.globeGroup);

    // Orient initially to India (Lat ~20 N, Long ~75 E)
    this.globeGroup.rotation.y = -1.2;
    this.globeGroup.rotation.x = 0.25;
  }

  buildGlobe() {
    const radius = 70;

    // 1. Base Earth Sphere
    const sphereGeo = new THREE.SphereGeometry(radius, 64, 64);
    
    // Procedural Earth surface canvas with stylized dark ocean & glowing continents
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Deep ocean background
    ctx.fillStyle = '#081426';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stylized longitude & latitude grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Stylized continent clusters
    this.drawStylizedContinents(ctx, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    const sphereMat = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 25,
      specular: 0x1e3a8a,
      emissive: 0x051329,
      emissiveIntensity: 0.4
    });

    const globeMesh = new THREE.Mesh(sphereGeo, sphereMat);
    this.globeGroup.add(globeMesh);

    // 2. Glowing Outer Atmosphere Rim
    const atmosphereGeo = new THREE.SphereGeometry(radius * 1.035, 48, 48);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    this.globeGroup.add(atmosphereMesh);
  }

  drawStylizedContinents(ctx, w, h) {
    ctx.fillStyle = 'rgba(19, 42, 74, 0.95)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.5;

    // Rough continent polygon centers for visual grounding
    const landmasses = [
      // India & South Asia
      { cx: w * 0.71, cy: h * 0.42, r: 90 },
      // Southeast Asia
      { cx: w * 0.79, cy: h * 0.52, r: 80 },
      // Middle East
      { cx: w * 0.63, cy: h * 0.38, r: 70 },
      // Europe
      { cx: w * 0.54, cy: h * 0.28, r: 95 },
      // Africa
      { cx: w * 0.53, cy: h * 0.55, r: 130 },
      // North America
      { cx: w * 0.25, cy: h * 0.32, r: 140 },
      // South America
      { cx: w * 0.33, cy: h * 0.68, r: 105 },
      // Australia
      { cx: w * 0.86, cy: h * 0.72, r: 85 }
    ];

    landmasses.forEach(land => {
      ctx.beginPath();
      ctx.arc(land.cx, land.cy, land.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Add scatter nodes representing industrial export zones
      for (let i = 0; i < 35; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * land.r * 0.85;
        const px = land.cx + Math.cos(ang) * dist;
        const py = land.cy + Math.sin(ang) * dist;
        ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  // Convert GPS (lat, lng) to 3D Cartesian Coordinates on Sphere
  latLngToVector3(lat, lng, radius = 70) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  }

  buildPortMarkers() {
    if (!this.portsData) return;
    const radius = 70.8;

    // 1. Indian Origin Ports (Emerald Glowing Nodes)
    (this.portsData.indianPorts || []).forEach(port => {
      const pos = this.latLngToVector3(port.lat, port.lng, radius);

      // Core beacon
      const beaconGeo = new THREE.SphereGeometry(1.6, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.copy(pos);
      beaconMesh.userData = {
        name: port.name,
        country: 'India (Origin Gateway)',
        type: port.type,
        draft: port.draft,
        isOrigin: true
      };
      this.markersGroup.add(beaconMesh);
      this.portMarkersList.push(beaconMesh);

      // Pulsing Ring
      const ringGeo = new THREE.RingGeometry(2.0, 3.2, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(0, 0, 0);
      this.markersGroup.add(ringMesh);
    });

    // 2. Global Destination Ports (Azure Blue Nodes)
    (this.portsData.destinationPorts || []).forEach(port => {
      const pos = this.latLngToVector3(port.lat, port.lng, radius);

      const beaconGeo = new THREE.SphereGeometry(1.4, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.copy(pos);
      beaconMesh.userData = {
        name: port.name,
        country: `${port.country} (${port.region})`,
        transitDays: port.transitDays ? port.transitDays.INMUN || 20 : 20,
        primaryCommodities: port.primaryCommodities ? port.primaryCommodities.join(', ') : 'Industrial & Agro Cargo',
        isOrigin: false
      };
      this.markersGroup.add(beaconMesh);
      this.portMarkersList.push(beaconMesh);
    });
  }

  buildShippingArcs() {
    if (!this.portsData) return;
    const radius = 70.5;
    const originPort = this.portsData.indianPorts[0] || { lat: 22.74, lng: 69.70 }; // Mundra Port

    (this.portsData.destinationPorts || []).forEach(dest => {
      const startVec = this.latLngToVector3(originPort.lat, originPort.lng, radius);
      const endVec = this.latLngToVector3(dest.lat, dest.lng, radius);

      // Parabolic midpoint elevated above Earth surface
      const distance = startVec.distanceTo(endVec);
      const elevation = Math.min(Math.max(distance * 0.35, 12), 40);

      const midVec = startVec.clone().add(endVec).multiplyScalar(0.5);
      const midLength = midVec.length();
      midVec.normalize().multiplyScalar(midLength + elevation);

      const curve = new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);
      const points = curve.getPoints(50);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);

      // Glow Arc Line
      const curveMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.6,
        linewidth: 1.5
      });
      const arcLine = new THREE.Line(curveGeo, curveMat);
      arcLine.userData = {
        region: dest.region,
        destName: dest.name
      };
      this.arcsGroup.add(arcLine);
      this.activeArcs.push(arcLine);

      // Animated Trade Pulse Particle traveling along the curve
      const particleGeo = new THREE.SphereGeometry(0.9, 8, 8);
      const particleMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const particleMesh = new THREE.Mesh(particleGeo, particleMat);
      particleMesh.userData = {
        curve,
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.003
      };
      this.particlesGroup.add(particleMesh);
    });
  }

  filterRoutes(region) {
    this.activeFilter = region;
    this.activeArcs.forEach(arc => {
      if (region === 'ALL') {
        arc.visible = true;
      } else {
        arc.visible = arc.userData.region.toUpperCase().includes(region.toUpperCase());
      }
    });
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
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / dom.clientWidth) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / dom.clientHeight) * 2 + 1;

      if (this.isDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        this.globeGroup.rotation.y += deltaX * 0.005;
        this.globeGroup.rotation.x += deltaY * 0.005;

        // Clamp x rotation to prevent flipping upside down
        this.globeGroup.rotation.x = Math.max(-0.8, Math.min(0.8, this.globeGroup.rotation.x));

        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }

      this.checkRaycast(e);
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
        const deltaY = e.touches[0].clientY - touchStartY;
        this.globeGroup.rotation.y += deltaX * 0.006;
        this.globeGroup.rotation.x += deltaY * 0.006;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  checkRaycast(e) {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.portMarkersList);

    if (intersects.length > 0) {
      const item = intersects[0].object;
      const d = item.userData;
      this.isHovering = true;

      if (this.tooltipEl) {
        this.tooltipEl.style.opacity = '1';
        this.tooltipEl.innerHTML = d.isOrigin ? `
          <div style="font-weight:700; color:#34d399; margin-bottom:4px;">⚓ ${d.name}</div>
          <div style="font-size:0.75rem; color:#e2e8f0;">${d.country}</div>
          <div style="font-size:0.75rem; color:#94a3b8; margin-top:4px;">Draft: ${d.draft || 'Deepwater'}</div>
          <div style="font-size:0.7rem; color:#38bdf8; margin-top:2px;">Prime Western Export Gateway</div>
        ` : `
          <div style="font-weight:700; color:#38bdf8; margin-bottom:4px;">🌐 ${d.name}</div>
          <div style="font-size:0.75rem; color:#e2e8f0;">${d.country}</div>
          <div style="font-size:0.75rem; color:#34d399; margin-top:4px;">Direct Sea Transit: ~${d.transitDays} Days</div>
          <div style="font-size:0.7rem; color:#cbd5e1; margin-top:2px;">Cargo: ${d.primaryCommodities}</div>
        `;
      }
    } else {
      this.isHovering = false;
      if (this.tooltipEl) {
        this.tooltipEl.style.opacity = '0.9';
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Continuous subtle rotation unless user drags or hovers
    if (!this.isDragging && !this.isHovering) {
      this.globeGroup.rotation.y += this.autoRotateSpeed;
    }

    // Update trade particles
    this.particlesGroup.children.forEach(p => {
      p.userData.progress += p.userData.speed;
      if (p.userData.progress > 1) {
        p.userData.progress = 0;
      }
      const pt = p.userData.curve.getPoint(p.userData.progress);
      p.position.copy(pt);
    });

    this.renderer.render(this.scene, this.camera);
  }
}

// Global initialization
window.ShippingGlobe3D = ShippingGlobe3D;
