import React from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Image,
  Leaf,
  LoaderCircle,
  Printer,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';

function getConfidence(prediction) {
  if (typeof prediction.confidence !== 'number' ||
      !Number.isFinite(prediction.confidence) ||
      prediction.confidence < 0 ||
      prediction.confidence > 1) {
    return null;
  }
  return prediction.confidence * 100;
}

function StatusTag({ status }) {
  const isHealthy = status === 'healthy';
  const isInfected = status === 'infected';
  const Icon = isHealthy ? CheckCircle2 : AlertTriangle;
  const text = isHealthy ? 'Healthy foliage' : isInfected ? 'Infected foliage' : 'Status unavailable';
  const tone = isHealthy
    ? 'border-green-200 bg-green-50 text-green-800'
    : isInfected
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-slate-200 bg-slate-100 text-slate-600';

  return (
    <span className={'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ' + tone}>
      <Icon aria-hidden="true" size={16} />
      {text}
    </span>
  );
}

function MetricCard({ label, value, description, icon: Icon, children }) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
          {value && <p className="mt-2 break-words text-xl font-bold leading-tight text-slate-900">{value}</p>}
          {description && <p className="mt-1 break-words text-sm text-slate-500">{description}</p>}
          {children}
        </div>
        <Icon aria-hidden="true" className="mt-0.5 shrink-0 text-slate-400" size={19} />
      </div>
    </article>
  );
}

function LoadingDashboard({ imageUrl }) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-slate-700">
        <LoaderCircle aria-hidden="true" className="animate-spin text-green-700" size={20} />
        <div>
          <p className="font-semibold text-slate-900">Analyzing leaf image</p>
          <p className="text-sm text-slate-500">Waiting for the prediction API response…</p>
        </div>
      </div>
      <figure className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        {imageUrl ? (
          <img src={imageUrl} alt="Leaf image being analyzed" className="aspect-[4/3] w-full object-contain" />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center text-slate-400">
            <Image aria-hidden="true" size={36} />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-slate-800 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          Analyzing
        </span>
      </figure>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, function (_, index) {
          return <div key={index} className="h-32 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />;
        })}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, function (_, index) {
          return <div key={index} className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />;
        })}
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-red-800" role="alert">
      <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
      <div>
        <h3 className="font-semibold">Prediction unavailable</h3>
        <p className="mt-1 text-sm">{message || 'The prediction request could not be completed.'}</p>
        <p className="mt-2 text-sm text-red-700">Check the image and backend connection, then run the analysis again.</p>
      </div>
    </div>
  );
}

function AdvisoryCard({ title, text }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text || 'Not provided by the prediction API.'}</p>
    </article>
  );
}

function DiagnosticDashboard({ view, onReset }) {
  const prediction = view.prediction;
  const imageUrl = view.imageUrl;
  const statusValue = prediction && typeof prediction.status === 'string'
    ? prediction.status.toLowerCase()
    : '';
  const status = statusValue === 'healthy'
    ? 'healthy'
    : statusValue === 'infected'
      ? 'infected'
      : 'unknown';
  const confidence = prediction ? getConfidence(prediction) : null;

  if (view.status === 'loading') return <LoadingDashboard imageUrl={view.imageUrl} />;
  if (view.status === 'error') {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <ErrorState message={view.message} />
      </div>
    );
  }
  if (view.status !== 'success' || !prediction) return null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-green-800">Diagnostic report</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Prediction analysis</h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-800">
          <BadgeCheck aria-hidden="true" size={17} />
          Analysis complete
        </span>
      </div>

      <figure className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Leaf submitted for crop disease analysis"
            className="aspect-[4/3] w-full object-contain"
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center text-slate-400">
            <Image aria-hidden="true" size={36} />
          </div>
        )}
        <span className={
          'absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white ' +
          (status === 'healthy' ? 'bg-green-700' : status === 'infected' ? 'bg-red-700' : 'bg-slate-600')
        }>
          {status === 'healthy' ? 'Healthy' : status === 'infected' ? 'Infected' : 'Status unavailable'}
        </span>
      </figure>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Identified crop"
          value={prediction.crop || 'Unavailable'}
          description={prediction.botanical || 'Botanical name not returned'}
          icon={Leaf}
        />
        <MetricCard
          label="Detected disease"
          value={prediction.disease || 'Unavailable'}
          description={prediction.raw_class || 'Class identifier not returned'}
          icon={AlertTriangle}
        />
        <MetricCard label="Health status" icon={status === 'healthy' ? CheckCircle2 : AlertTriangle}>
          <div className="mt-3"><StatusTag status={status} /></div>
        </MetricCard>
        <MetricCard label="Confidence score" icon={BadgeCheck}>
          <p className="mt-2 text-2xl font-bold leading-tight text-slate-900">
            {confidence === null ? 'Unavailable' : confidence.toFixed(1) + '%'}
          </p>
          {confidence !== null && (
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-label="Model confidence"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={confidence}
            >
              <div className="h-full rounded-full bg-green-700" style={{ width: confidence + '%' }} />
            </div>
          )}
        </MetricCard>
      </div>

      <section aria-labelledby="advisory-heading">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck aria-hidden="true" className="text-slate-500" size={18} />
          <h3 id="advisory-heading" className="font-semibold text-slate-900">Agronomic advisory</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <AdvisoryCard title="Disease overview" text={prediction.description} />
          <AdvisoryCard title="Recommended treatment" text={prediction.treatment} />
          <AdvisoryCard title="Prevention" text={prediction.prevention} />
        </div>
      </section>

      <div className="dashboard-actions flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
        <button type="button" className="dashboard-action-button inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-semibold" onClick={onReset}>
          <RotateCcw aria-hidden="true" size={16} />
          Analyze another image
        </button>
        <button type="button" className="dashboard-action-button inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-semibold" onClick={function () { window.print(); }}>
          <Printer aria-hidden="true" size={16} />
          Print report
        </button>
      </div>
    </div>
  );
}

export default DiagnosticDashboard;
