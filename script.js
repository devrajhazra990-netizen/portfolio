/* ==========================================================================
   3D PORTFOLIO INTERACTIVE JAVASCRIPT & THREE.JS ENGINE
   Author: Devraj
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Safe Lucide initialization
  try {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  } catch (err) {
    console.warn('Lucide icons failed to initialize:', err);
  }

  // Safe Three.js initialization
  try {
    initThreeJSScene();
  } catch (err) {
    console.warn('Three.js scene failed to initialize:', err);
  }

  // Init Interactive Components
  init3DTilt();
  initFilterSystem();
  initModals();
  initContactForm();
  initNavbarScroll();
});

/* ==========================================================================
   THREE.JS 3D SCENE SETUP
   ========================================================================== */
function initThreeJSScene() {
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas || !window.THREE) return;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070a12, 0.0015);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 1. Create Particle Constellation
  const particleCount = 2000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const colorCyan = new THREE.Color(0x00f3ff);
  const colorPurple = new THREE.Color(0xa855f7);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 120;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 120;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 120;

    const mixedColor = colorCyan.clone().lerp(colorPurple, Math.random());
    colors[i * 3] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.25,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending
  });

  const particleSystem = new THREE.Points(geometry, particleMaterial);
  scene.add(particleSystem);

  // 2. Create Floating 3D Geometric Meshes
  const meshGroup = new THREE.Group();

  // Icosahedron Wireframe
  const icoGeo = new THREE.IcosahedronGeometry(6, 1);
  const icoMat = new THREE.MeshStandardMaterial({
    color: 0x00f3ff,
    wireframe: true,
    emissive: 0x00f3ff,
    emissiveIntensity: 0.3,
    roughness: 0.2,
    metalness: 0.8
  });
  const icoMesh = new THREE.Mesh(icoGeo, icoMat);
  icoMesh.position.set(-20, 10, -10);
  meshGroup.add(icoMesh);

  // Torus Knot Wireframe
  const torusGeo = new THREE.TorusKnotGeometry(4.5, 1.2, 100, 16);
  const torusMat = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    wireframe: true,
    emissive: 0xa855f7,
    emissiveIntensity: 0.4
  });
  const torusMesh = new THREE.Mesh(torusGeo, torusMat);
  torusMesh.position.set(22, -12, -15);
  meshGroup.add(torusMesh);

  scene.add(meshGroup);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0x00f3ff, 2, 100);
  pointLight1.position.set(20, 20, 20);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xa855f7, 2, 100);
  pointLight2.position.set(-20, -20, -10);
  scene.add(pointLight2);

  // Mouse Parallax Engine
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;

  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX) * 0.01;
    mouseY = (event.clientY - windowHalfY) * 0.01;
  });

  // Scroll Parallax Engine
  let scrollY = 0;
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  });

  // Render Loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Smooth lerp mouse tracking
    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;

    camera.position.x = targetX * 1.5;
    camera.position.y = -targetY * 1.5 + (scrollY * -0.01);
    camera.lookAt(scene.position);

    // Rotate Meshes
    icoMesh.rotation.x = elapsedTime * 0.3;
    icoMesh.rotation.y = elapsedTime * 0.4;

    torusMesh.rotation.x = elapsedTime * 0.2;
    torusMesh.rotation.z = elapsedTime * 0.3;

    // Rotate Particles
    particleSystem.rotation.y = elapsedTime * 0.03;
    particleSystem.rotation.x = elapsedTime * 0.015;

    renderer.render(scene, camera);
  }

  animate();

  // Window Resize Listener
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/* ==========================================================================
   VANILLA 3D CARD TILT PHYSICS ENGINE
   ========================================================================== */
function init3DTilt() {
  const cards = document.querySelectorAll('.glass-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  });
}

/* ==========================================================================
   FILTER SYSTEM FOR SKILLS & PROJECTS
   ========================================================================== */
function initFilterSystem() {
  // Skill Tabs Filter
  const skillTabs = document.querySelectorAll('.skills-tabs .tab-btn');
  const skillCards = document.querySelectorAll('.skills-grid .skill-card');

  skillTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      skillTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.dataset.filter;

      skillCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'block';
          card.style.opacity = '1';
        } else {
          card.style.display = 'none';
          card.style.opacity = '0';
        }
      });
    });
  });

  // Project Filter
  const projectBtns = document.querySelectorAll('.projects-filter .filter-btn');
  const projectCards = document.querySelectorAll('.projects-grid .project-card');

  projectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      projectBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      projectCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'flex';
          card.style.opacity = '1';
        } else {
          card.style.display = 'none';
          card.style.opacity = '0';
        }
      });
    });
  });
}

/* ==========================================================================
   PROJECT MODALS CONTROLLER
   ========================================================================== */
function initModals() {
  const modal = document.getElementById('project-modal');
  const modalClose = document.getElementById('modal-close');
  const modalTitle = document.getElementById('modal-title');
  const modalImg = document.getElementById('modal-img');
  const modalDesc = document.getElementById('modal-desc');
  const modalTags = document.getElementById('modal-tags');

  if (!modal) return;

  const projectDetails = {
    '1': {
      title: 'Aether 3D Mesh & Scene Editor',
      img: 'assets/project1.jpg',
      desc: 'A high-performance browser-based 3D scene builder built with Three.js, WebGL, and React. Features real-time PBR material editing, shadow maps, camera viewports, GLTF/GLB export, and custom GLSL shader node creation.',
      tags: ['Three.js', 'WebGL', 'GLSL Shaders', 'React', 'TypeScript']
    },
    '2': {
      title: 'NeuralVision AI Data Analytics Suite',
      img: 'assets/project2.jpg',
      desc: 'Real-time AI analytics dashboard visualizing millions of live telemetry events using 3D chart surfaces, WebGL canvas shaders, Node.js backend pipelines, and WebSocket telemetry streaming.',
      tags: ['WebGL Data Viz', 'Node.js', 'WebSockets', 'Tailwind CSS', 'Python']
    },
    '3': {
      title: 'Nexus XR WebGL E-Commerce Platform',
      img: 'assets/project3.jpg',
      desc: 'Immersive WebXR 3D product showcase enabling consumers to view digital twin items in full 360-degree interactive 3D, customize colors in real-time, and project products directly into their room via WebXR AR camera APIs.',
      tags: ['WebXR', 'Three.js', 'Canvas API', 'Stripe API', 'GSAP']
    }
  };

  document.querySelectorAll('.open-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      const data = projectDetails[id];

      if (data) {
        modalTitle.textContent = data.title;
        modalImg.src = data.img;
        modalDesc.textContent = data.desc;

        modalTags.innerHTML = data.tags
          .map(t => `<span class="tag">${t}</span>`)
          .join('');

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  };

  if (modalClose) modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });
}

/* ==========================================================================
   CONTACT FORM SIMULATION
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const statusMsg = document.getElementById('form-status');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Sending...`;
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      btn.innerHTML = `<i data-lucide="check-circle-2"></i> Message Sent!`;
      if (window.lucide) lucide.createIcons();
      btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';

      if (statusMsg) {
        statusMsg.textContent = 'Thank you! Your message has been sent successfully. I will get back to you shortly.';
        statusMsg.style.color = '#10b981';
      }

      form.reset();

      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalText;
        btn.style.background = '';
        if (window.lucide) lucide.createIcons();
        if (statusMsg) statusMsg.textContent = '';
      }, 4000);
    }, 1500);
  });
}

/* ==========================================================================
   NAVBAR ACTIVE SCROLL HIGHLIGHT
   ========================================================================== */
function initNavbarScroll() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });
}