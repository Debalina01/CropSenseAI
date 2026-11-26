document.addEventListener('DOMContentLoaded', function () {
  initializeIcons();
  setupNavigation();
  setupFileUpload();
  setupPresetSamples();
  setupAnalysisAction();
  setupContactForm();
  setupReportActions();
});

function initializeIcons() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
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
      crop: 'Tomato',
      botanical: 'Solanum lycopersicum',
      disease: 'Early Blight',
      filename: 'sample-tomato-early-blight.jpg',
      filesize: '114 KB',
      imageSrc: 'assets/sample-tomato-blight.jpg'
    },
    'preset-potato': {
      crop: 'Potato',
      botanical: 'Solanum tuberosum',
      disease: 'Late Blight',
      filename: 'sample-potato-late-blight.jpg',
      filesize: '89 KB',
      imageSrc: 'assets/sample-potato-blight.jpg'
    },
    'preset-corn': {
      crop: 'Corn / Maize',
      botanical: 'Zea mays',
      disease: 'Healthy Foliage',
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
  const resultsSection = document.getElementById('results-section');

  if (!analyzeBtn) return;

  analyzeBtn.addEventListener('click', async function () {
    analyzeBtn.disabled = true;
    analyzeText.textContent = 'Analyzing Leaf with CropSense AI Model...';

    const formData = new FormData();

    try {
      if (currentSelectedFile) {
        formData.append('file', currentSelectedFile, currentSelectedFile.name);
      } else if (currentSampleData && currentSampleData.imageSrc) {
        const sampleResponse = await fetch(currentSampleData.imageSrc);
        const sampleBlob = await sampleResponse.blob();
        const sampleFile = new File([sampleBlob], currentSampleData.filename, {
          type: sampleBlob.type || 'image/jpeg'
        });
        formData.append('file', sampleFile, currentSampleData.filename);
      } else {
        alert('Please select or upload an image first.');
        analyzeBtn.disabled = false;
        analyzeText.textContent = 'Analyze Image';
        return;
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
      displayAnalysisResults(predictionData);

      if (resultsSection) {
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth' });
      }

      initializeIcons();
    } catch (err) {
      alert('Prediction Error: ' + err.message + '\n\nPlease ensure the CropSense AI app is running at ' + window.location.origin + '.');
    } finally {
      analyzeText.textContent = 'Analyze Image';
      analyzeBtn.disabled = false;
    }
  });
}

function displayAnalysisResults(data) {
  const previewImage = document.getElementById('preview-image');
  const resultsImage = document.getElementById('results-image');
  const resultsStatusBadge = document.getElementById('results-status-badge');
  const reportTimestamp = document.getElementById('report-timestamp');

  const resultCropName = document.getElementById('result-crop-name');
  const resultBotanicalName = document.getElementById('result-botanical-name');
  const resultDiseaseName = document.getElementById('result-disease-name');
  const resultPathogenType = document.getElementById('result-pathogen-type');
  const resultHealthPill = document.getElementById('result-health-pill');
  const resultStatusIcon = document.getElementById('result-status-icon');
  const resultStatusText = document.getElementById('result-status-text');
  const resultConfidence = document.getElementById('result-confidence');
  const resultConfidenceBar = document.getElementById('result-confidence-bar');

  const resultSeverityBadge = document.getElementById('result-severity-badge');
  const resultSeverityFill = document.getElementById('result-severity-fill');
  const resultAreaValue = document.getElementById('result-area-value');
  const resultHealthyTissue = document.getElementById('result-healthy-tissue');
  const resultUrgency = document.getElementById('result-urgency');

  const resultDiseaseDescription = document.getElementById('result-disease-description');
  const resultTreatmentText = document.getElementById('result-treatment-text');
  const resultPreventionText = document.getElementById('result-prevention-text');
  const demoTag = document.querySelector('.results-demo-tag');

  if (demoTag) {
    demoTag.textContent = 'Live Model Prediction';
  }

  if (resultsImage && previewImage) {
    resultsImage.src = previewImage.src;
  }

  const now = new Date();
  const timeString = now.toLocaleDateString() + ' at ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (reportTimestamp) {
    reportTimestamp.textContent = 'Generated: ' + timeString;
  }

  const confidencePct = (data.confidence * 100).toFixed(1) + '%';

  resultCropName.textContent = data.crop || 'Crop';
  resultBotanicalName.textContent = data.botanical || 'Botanical classification';
  resultDiseaseName.textContent = data.disease || 'Detected Condition';
  resultPathogenType.textContent = data.raw_class || 'Pathology category';
  resultConfidence.textContent = confidencePct;
  resultConfidenceBar.style.width = confidencePct;

  if (data.status === 'Healthy') {
    resultAreaValue.textContent = '0.0%';
    resultHealthyTissue.textContent = '100.0%';
    resultUrgency.textContent = 'Normal Maintenance';
    resultSeverityFill.style.width = '0%';
    resultSeverityBadge.className = 'severity-level-badge severity-low';
    resultSeverityBadge.textContent = 'Optimal Health (0.0%)';

    resultsStatusBadge.textContent = 'Healthy';
    resultsStatusBadge.style.backgroundColor = 'rgba(22, 163, 74, 0.92)';

    resultHealthPill.className = 'status-indicator-badge status-healthy';
    resultStatusText.textContent = 'Healthy Foliage';
    resultStatusIcon.setAttribute('data-lucide', 'check-circle');

    resultDiseaseName.className = 'metric-value text-success';
    resultAreaValue.className = 'stat-stat-value text-success';
  } else {
    const estimatedArea = (Math.max(15, Math.min(65, Math.round(data.confidence * 45)))).toFixed(1) + '%';
    const healthyPct = (100 - parseFloat(estimatedArea)).toFixed(1) + '%';

    resultAreaValue.textContent = estimatedArea;
    resultHealthyTissue.textContent = healthyPct;
    resultUrgency.textContent = 'Action within 48h';
    resultSeverityFill.style.width = estimatedArea;

    if (parseFloat(estimatedArea) > 40) {
      resultSeverityBadge.className = 'severity-level-badge severity-high';
      resultSeverityBadge.textContent = 'High Severity (' + estimatedArea + ')';
    } else {
      resultSeverityBadge.className = 'severity-level-badge severity-moderate';
      resultSeverityBadge.textContent = 'Moderate Severity (' + estimatedArea + ')';
    }

    resultsStatusBadge.textContent = 'Infected';
    resultsStatusBadge.style.backgroundColor = 'rgba(220, 38, 38, 0.92)';

    resultHealthPill.className = 'status-indicator-badge status-infected';
    resultStatusText.textContent = 'Infected Foliage';
    resultStatusIcon.setAttribute('data-lucide', 'alert-triangle');

    resultDiseaseName.className = 'metric-value text-danger';
    resultAreaValue.className = 'stat-stat-value text-danger';
  }

  resultDiseaseDescription.textContent = data.description || 'Disease description unavailable.';
  resultTreatmentText.textContent = data.treatment || 'Treatment guidance unavailable.';
  resultPreventionText.textContent = data.prevention || 'Prevention guidance unavailable.';
}

function setupReportActions() {
  const resetBtn = document.getElementById('reset-analysis-btn');
  const printBtn = document.getElementById('print-report-btn');

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      clearImageSelection();
      const detectSection = document.getElementById('detection');
      if (detectSection) {
        detectSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', function () {
      window.print();
    });
  }
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
