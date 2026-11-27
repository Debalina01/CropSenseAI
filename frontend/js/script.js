document.addEventListener('DOMContentLoaded', function () {
  initializeIcons();
  setupTypingAnimation();
  setupScrollAnimations();
  setupNavigation();
  setupFileUpload();
  setupPresetSamples();
  setupAnalysisAction();
  setupContactForm();
});

function initializeIcons() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

function setupTypingAnimation() {
  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const typedParts = Array.from(document.querySelectorAll('[data-typing-text]'));
  if (typedParts.length === 0) return;

  const texts = typedParts.map(function (element) {
    return element.dataset.typingText;
  });
  if (texts.some(function (text) { return !text; })) return;

  typedParts.forEach(function (element) {
    element.textContent = '';
  });

  let partIndex = 0;
  function typeNextPart() {
    const element = typedParts[partIndex];
    const text = texts[partIndex];
    let characterIndex = 0;
    element.classList.add('typing');

    function typeNextCharacter() {
      characterIndex += 1;
      element.textContent = text.slice(0, characterIndex);

      if (characterIndex < text.length) {
        window.setTimeout(typeNextCharacter, 55);
      } else {
        element.classList.remove('typing');
        partIndex += 1;
        if (partIndex < typedParts.length) {
          window.setTimeout(typeNextPart, 180);
        }
      }
    }

    typeNextCharacter();
  }

  typeNextPart();
}

function setupScrollAnimations() {
  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !('IntersectionObserver' in window)) return;

  const sections = Array.from(document.querySelectorAll('main section, main section .section-header'));
  const cards = Array.from(document.querySelectorAll('main section *')).filter(function (element) {
    return Array.from(element.classList).some(function (className) {
      return className.endsWith('-card');
    });
  });
  const animatedElements = Array.from(new Set(sections.concat(cards)));
  const observer = new IntersectionObserver(function (entries, currentObserver) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0,
    rootMargin: '0px 0px -24px 0px'
  });

  animatedElements.forEach(function (element) {
    const siblings = element.parentElement ? Array.from(element.parentElement.children) : [];
    const siblingIndex = siblings.indexOf(element);
    element.style.setProperty('--reveal-delay', Math.min(siblingIndex * 80, 320) + 'ms');
    element.classList.add('scroll-reveal');
    observer.observe(element);
  });
}

function setupNavigation() {
  const menuToggle = document.getElementById('menu-toggle');
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const heroUploadBtn = document.getElementById('hero-upload-trigger');
  const fileInput = document.getElementById('file-input');

  function setMenuOpen(isOpen) {
    if (!navbar || !menuToggle) return;
    navbar.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  }

  if (menuToggle && navbar) {
    menuToggle.addEventListener('click', function () {
      setMenuOpen(!navbar.classList.contains('open'));
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.forEach(function (item) {
        item.classList.remove('active');
      });
      link.classList.add('active');

      if (navbar && navbar.classList.contains('open')) {
        setMenuOpen(false);
      }
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && navbar && navbar.classList.contains('open')) {
      setMenuOpen(false);
      if (menuToggle) menuToggle.focus();
    }
  });

  if (heroUploadBtn && fileInput) {
    heroUploadBtn.addEventListener('click', function () {
      const detectSection = document.getElementById('detection');
      if (detectSection) {
        detectSection.scrollIntoView({ behavior: 'smooth' });
      }
      setTimeout(function () {
        fileInput.click();
      }, 400);
    });
  }

  window.addEventListener('scroll', function () {
    const scrollPosition = window.scrollY + 120;
    const sections = document.querySelectorAll('main section');

    sections.forEach(function (section) {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPosition >= top && scrollPosition < top + height) {
        navLinks.forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  });
}

let currentSelectedFile = null;
let currentSampleData = null;

function setupFileUpload() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-btn');
  const previewContainer = document.getElementById('preview-container');
  const previewImage = document.getElementById('preview-image');
  const previewFilename = document.getElementById('preview-filename');
  const previewFilesize = document.getElementById('preview-filesize');
  const changeImageBtn = document.getElementById('change-image-btn');
  const removeImageBtn = document.getElementById('remove-image-btn');
  const analyzeBtn = document.getElementById('analyze-btn');

  if (browseBtn && fileInput) {
    browseBtn.addEventListener('click', function () {
      fileInput.click();
    });
  }

  if (changeImageBtn && fileInput) {
    changeImageBtn.addEventListener('click', function () {
      fileInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', function (event) {
      const file = event.target.files[0];
      if (file) {
        handleFileSelection(file);
      }
    });
  }

  if (dropZone) {
    dropZone.addEventListener('dragover', function (event) {
      event.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', function () {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', function (event) {
      event.preventDefault();
      dropZone.classList.remove('dragover');

      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        const file = event.dataTransfer.files[0];
        handleFileSelection(file);
      }
    });
  }

  if (removeImageBtn) {
    removeImageBtn.addEventListener('click', function () {
      clearImageSelection();
    });
  }
}

function handleFileSelection(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!validTypes.includes(file.type)) {
    alert('Please select a valid image file (JPG, JPEG, PNG, or WEBP).');
    return;
  }

  currentSelectedFile = file;
  currentSampleData = null;

  const reader = new FileReader();
  reader.onload = function (e) {
    const previewImage = document.getElementById('preview-image');
    const previewFilename = document.getElementById('preview-filename');
    const previewFilesize = document.getElementById('preview-filesize');
    const dropZone = document.getElementById('drop-zone');
    const previewContainer = document.getElementById('preview-container');
    const analyzeBtn = document.getElementById('analyze-btn');

    previewImage.src = e.target.result;
    previewFilename.textContent = file.name;
    previewFilesize.textContent = formatBytes(file.size);

    dropZone.classList.add('hidden');
    previewContainer.classList.remove('hidden');
    analyzeBtn.disabled = false;
  };

  reader.readAsDataURL(file);
}

function clearImageSelection() {
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');
  const previewContainer = document.getElementById('preview-container');
  const previewImage = document.getElementById('preview-image');
  const analyzeBtn = document.getElementById('analyze-btn');
  const resultsSection = document.getElementById('results-section');

  currentSelectedFile = null;
  currentSampleData = null;

  if (fileInput) {
    fileInput.value = '';
  }

  if (previewImage) {
    previewImage.src = '';
  }

  if (previewContainer) {
    previewContainer.classList.add('hidden');
  }

  if (dropZone) {
    dropZone.classList.remove('hidden');
  }

  if (analyzeBtn) {
    analyzeBtn.disabled = true;
  }

  if (resultsSection) {
    resultsSection.classList.add('hidden');
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function setupPresetSamples() {
  const presetButtons = document.querySelectorAll('.preset-btn');
  const dropZone = document.getElementById('drop-zone');
  const previewContainer = document.getElementById('preview-container');
  const previewImage = document.getElementById('preview-image');
  const previewFilename = document.getElementById('preview-filename');
  const previewFilesize = document.getElementById('preview-filesize');
  const analyzeBtn = document.getElementById('analyze-btn');

  const presetCatalog = {
    'preset-tomato': {
      filename: 'sample-tomato-early-blight.jpg',
      filesize: '114 KB',
      imageSrc: 'assets/sample-tomato-blight.jpg'
    },
    'preset-potato': {
      filename: 'sample-potato-late-blight.jpg',
      filesize: '89 KB',
      imageSrc: 'assets/sample-potato-blight.jpg'
    },
    'preset-corn': {
      filename: 'sample-corn-healthy-foliage.jpg',
      filesize: '211 KB',
      imageSrc: 'assets/sample-healthy-leaf.jpg'
    }
  };

  presetButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      const presetId = button.getAttribute('id');
      const data = presetCatalog[presetId];

      if (!data) return;

      currentSampleData = data;
      currentSelectedFile = null;

      previewImage.src = data.imageSrc;
      previewFilename.textContent = data.filename;
      previewFilesize.textContent = data.filesize;

      dropZone.classList.add('hidden');
      previewContainer.classList.remove('hidden');
      analyzeBtn.disabled = false;

      previewContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });
}

function setupAnalysisAction() {
  const analyzeBtn = document.getElementById('analyze-btn');
  const analyzeText = document.getElementById('analyze-text');
  const analyzeSpinner = document.getElementById('analyze-spinner');
  const resultsSection = document.getElementById('results-section');
  const previewImage = document.getElementById('preview-image');

  if (!analyzeBtn) return;

  function setLoading(isLoading) {
    analyzeBtn.disabled = isLoading;
    analyzeBtn.setAttribute('aria-busy', String(isLoading));
    analyzeText.textContent = isLoading ? 'Analyzing image...' : 'Analyze Image';
    if (analyzeSpinner) analyzeSpinner.classList.toggle('hidden', !isLoading);
  }

  analyzeBtn.addEventListener('click', async function () {
    setLoading(true);

    const formData = new FormData();

    try {
      if (currentSelectedFile) {
        formData.append('file', currentSelectedFile, currentSelectedFile.name);
      } else if (currentSampleData && currentSampleData.imageSrc) {
        const sampleResponse = await fetch(currentSampleData.imageSrc);
        if (!sampleResponse.ok) {
          throw new Error('Unable to load the selected sample image.');
        }
        const sampleBlob = await sampleResponse.blob();
        const sampleFile = new File([sampleBlob], currentSampleData.filename, {
          type: sampleBlob.type || 'image/jpeg'
        });
        formData.append('file', sampleFile, currentSampleData.filename);
      } else {
        alert('Please select or upload an image first.');
        setLoading(false);
        return;
      }

      dispatchDashboardEvent('cropsense:prediction-start', {
        imageUrl: previewImage ? previewImage.src : ''
      });
      if (resultsSection) {
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      const response = await fetch('/predict', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(function () { return {}; });
        const errorDetail = errorData.detail || 'Prediction failed with status ' + response.status;
        throw new Error(errorDetail);
      }

      const predictionData = await response.json();
      if (!predictionData || predictionData.success !== true) {
        throw new Error('The prediction API returned an invalid response.');
      }
      displayAnalysisResults(predictionData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected prediction error occurred.';
      if (resultsSection) {
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      dispatchDashboardEvent('cropsense:prediction-error', { message: message });
    } finally {
      setLoading(false);
    }
  });
}

function dispatchDashboardEvent(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
}

function displayAnalysisResults(data) {
  const previewImage = document.getElementById('preview-image');
  dispatchDashboardEvent('cropsense:prediction-success', {
    prediction: data,
    imageUrl: previewImage ? previewImage.src : ''
  });
}

function setupContactForm() {
  const contactForm = document.getElementById('contact-form');
  const nameInput = document.getElementById('contact-name');
  const emailInput = document.getElementById('contact-email');
  const messageInput = document.getElementById('contact-message');

  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const messageError = document.getElementById('message-error');

  const formSuccessCard = document.getElementById('form-success-card');
  const successUserName = document.getElementById('success-user-name');
  const sendAnotherBtn = document.getElementById('send-another-btn');

  if (!contactForm) return;

  contactForm.addEventListener('submit', function (event) {
    event.preventDefault();

    let isValid = true;

    nameError.classList.remove('visible');
    emailError.classList.remove('visible');
    messageError.classList.remove('visible');

    nameInput.classList.remove('input-error');
    emailInput.classList.remove('input-error');
    messageInput.classList.remove('input-error');

    if (!nameInput.value || nameInput.value.trim().length === 0) {
      nameError.classList.add('visible');
      nameInput.classList.add('input-error');
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value || !emailRegex.test(emailInput.value.trim())) {
      emailError.classList.add('visible');
      emailInput.classList.add('input-error');
      isValid = false;
    }

    if (!messageInput.value || messageInput.value.trim().length < 10) {
      messageError.classList.add('visible');
      messageInput.classList.add('input-error');
      isValid = false;
    }

    if (isValid) {
      const enteredName = nameInput.value.trim();
      successUserName.textContent = 'Thank you, ' + enteredName + '. Our agronomy and AI engineering team has received your message and will review it promptly.';

      contactForm.classList.add('hidden');
      formSuccessCard.classList.remove('hidden');
      initializeIcons();
    }
  });

  if (sendAnotherBtn) {
    sendAnotherBtn.addEventListener('click', function () {
      contactForm.reset();
      formSuccessCard.classList.add('hidden');
      contactForm.classList.remove('hidden');
      nameInput.focus();
    });
  }
}
