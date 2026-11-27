import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import DiagnosticDashboard from './DiagnosticDashboard.jsx';
import './styles.css';

function resetAnalysis() {
  const removeImageButton = document.getElementById('remove-image-btn');
  if (removeImageButton) removeImageButton.click();

  const detectionSection = document.getElementById('detection');
  if (detectionSection) {
    detectionSection.scrollIntoView({ behavior: 'smooth' });
  }
}

function DashboardRoot() {
  const [view, setView] = useState({ status: 'idle' });

  useEffect(function () {
    function handleStart(event) {
      setView({
        status: 'loading',
        imageUrl: event.detail && event.detail.imageUrl ? event.detail.imageUrl : ''
      });
    }

    function handleSuccess(event) {
      setView({ status: 'success', ...event.detail });
    }

    function handleError(event) {
      setView({ status: 'error', message: event.detail.message });
    }

    window.addEventListener('cropsense:prediction-start', handleStart);
    window.addEventListener('cropsense:prediction-success', handleSuccess);
    window.addEventListener('cropsense:prediction-error', handleError);

    return function () {
      window.removeEventListener('cropsense:prediction-start', handleStart);
      window.removeEventListener('cropsense:prediction-success', handleSuccess);
      window.removeEventListener('cropsense:prediction-error', handleError);
    };
  }, []);

  return <DiagnosticDashboard view={view} onReset={resetAnalysis} />;
}

const dashboardRoot = document.getElementById('diagnostic-dashboard');
if (dashboardRoot) {
  createRoot(dashboardRoot).render(<DashboardRoot />);
}
