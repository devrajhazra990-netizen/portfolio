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
  initLiveClock();
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
  const modalCracked = document.getElementById('modal-cracked');

  if (!modal) return;

  const projectDetails = {
    '1': {
      title: 'AI Voice Cloning & Audio Deepfake Detector',
      img: 'assets/voice-cloning.svg',
      desc: 'An advanced dual-capability neural audio intelligence system that clones human voice characteristics with high biometric fidelity and performs real-time audio deepfake classification. The system analyzes raw acoustic frequencies and speech patterns to distinguish between authentic human voices and AI-generated synthetic speech, outputting exact authenticity percentage scores, threat likelihood breakdowns, and spectrogram forensic evidence.',
      cracked: [
        'Acoustic Feature Extraction: Built Mel-frequency cepstral coefficients (MFCCs) and spectral flux pipelines using Librosa & Python to isolate synthetic vocoder artifacts.',
        'Hybrid Classifier Architecture: Engineered and trained a CNN + BiLSTM model detecting micro-tremor deviations and synthetic speech synthesis traces.',
        'Probabilistic Risk Scoring Engine: Implemented statistical risk models calculating real-time authenticity percentage (e.g. 98.4% AI Voice vs Authentic Human) and spoofing threat levels.',
        'Interactive Forensics Dashboard: Developed real-time waveform visualizer, audio recorder/uploader, and risk evaluation meters.'
      ],
      tags: ['Python', 'PyTorch', 'Librosa', 'Deep Learning', 'Audio DSP', 'Voice Cloning', 'Deepfake Detection', 'FastAPI']
    },
    '2': {
      title: 'NetAudit.AI - Intelligent Config & Conflict File Auditor',
      img: 'assets/netaudit.svg',
      desc: 'An automated AI-driven network configuration and multi-file conflict resolution platform. Ingests Git merge conflict files (<<<<<<<, =======, >>>>>>>) and network configuration scripts (BGP, OSPF, ACLs, YAML, JSON). The platform pinpoints exact syntax faults and collisions line-by-line, details the root cause of network failure risks, and automatically synthesizes conflict-free, production-ready configuration patches with side-by-side visual diffs.',
      cracked: [
        'AST & Conflict Parser: Created custom tokenizer to scan multi-branch conflict files and nested network configuration blocks without syntax corruption.',
        'Diagnostic Engine: Formulated heuristic and AI rules detecting IP collisions, overlapping subnets, routing blackholes, and contradictory firewall ACL policies.',
        'Automated Patch Synthesizer: Built the resolution algorithm that synthesizes verified, conflict-free configuration files ready for deployment.',
        'Visual Diff Inspection: Developed interactive "What to Change" side-by-side comparison UI with color-coded syntax highlights and fault mitigation reports.'
      ],
      tags: ['Python', 'AI Diagnostics', 'Network Systems', 'Git Conflict Engine', 'AST Parsing', 'Diff Generator', 'JavaScript']
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

        if (modalCracked && data.cracked) {
          modalCracked.innerHTML = `
            <div class="project-cracked-box ${id === '2' ? 'purple-accent' : ''}" style="margin-top: 1rem; margin-bottom: 1.5rem;">
              <div class="project-cracked-header">
                <i data-lucide="zap"></i> What I Built &amp; Cracked
              </div>
              <ul class="project-cracked-list">
                ${data.cracked.map(point => `<li><i data-lucide="check-circle-2"></i> <span>${point}</span></li>`).join('')}
              </ul>
            </div>
          `;
        }

        modalTags.innerHTML = data.tags
          .map(t => `<span class="tag">${t}</span>`)
          .join('');

        if (window.lucide) lucide.createIcons();

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

/* ==========================================================================
   LIVE REAL-TIME CLOCK FOR LOCATION BAR (IST / KOLKATA)
   ========================================================================== */
function initLiveClock() {
  const clockEl = document.getElementById('live-ist-clock');
  if (!clockEl) return;

  function update() {
    const now = new Date();
    const options = {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    try {
      const timeStr = new Intl.DateTimeFormat('en-IN', options).format(now);
      clockEl.textContent = `${timeStr} IST`;
    } catch (e) {
      clockEl.textContent = now.toLocaleTimeString() + ' IST';
    }
  }

  update();
  setInterval(update, 1000);
}