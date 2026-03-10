import { useEffect, useState } from 'react';
import {
  Server, Brain, Database, CheckCircle2, XCircle, Loader2,
  Save, Plus, Trash2, RefreshCw, Camera
} from 'lucide-react';
import { settingsApi, cameraApi, type CameraConfig, type HealthStatus } from '../lib/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────────────────
// Settings Page — System configuration, camera management, health checks
// ─────────────────────────────────────────────────────────────────────────────

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [cameras,  setCameras]  = useState<CameraConfig[]>([]);
  const [health,   setHealth]   = useState<HealthStatus | null>(null);
  const [models,   setModels]   = useState<string[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [newCam,   setNewCam]   = useState({ name: '', type: 'webcam', source: '0' });

  useEffect(() => {
    Promise.all([
      settingsApi.get(),
      cameraApi.list(),
      settingsApi.health(),
      settingsApi.models(),
    ]).then(([s, c, h, m]) => {
      setSettings(s.data);
      setCameras(c.data.cameras);
      setHealth(h.data);
      setModels(m.data.models);
    }).finally(() => setLoading(false));
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await settingsApi.update(settings);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const checkHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await settingsApi.health();
      setHealth(res.data);
    } finally {
      setCheckingHealth(false);
    }
  };

  const addCamera = async () => {
    if (!newCam.name || !newCam.source) return;
    try {
      const res = await cameraApi.add({
        name: newCam.name,
        type: newCam.type as 'webcam' | 'rtsp' | 'usb',
        source: newCam.source,
        enabled: true,
        motionDetection: false,
        scheduledCapture: false,
        scheduleInterval: 60,
      });
      setCameras(prev => [...prev, res.data]);
      setNewCam({ name: '', type: 'webcam', source: '0' });
      toast.success('Camera added');
    } catch {
      toast.error('Failed to add camera');
    }
  };

  const removeCamera = async (id: string) => {
    if (!window.confirm('Remove this camera?')) return;
    try {
      await cameraApi.delete(id);
      setCameras(prev => prev.filter(c => c.id !== id));
      toast.success('Camera removed');
    } catch {
      toast.error('Failed to remove camera');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const StatusDot = ({ ok }: { ok: boolean }) =>
    ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
       : <XCircle     className="w-4 h-4 text-red-400" />;

  return (
    <div className="p-8 animate-fade-in max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Configure AI services, cameras, and storage</p>
        </div>
        <button onClick={saveSettings} disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
      </div>

      {/* System Health */}
      <section className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-brand-400" /> Service Health
          </h2>
          <button onClick={checkHealth} disabled={checkingHealth} className="btn-secondary text-xs">
            <RefreshCw className={clsx('w-3.5 h-3.5', checkingHealth && 'animate-spin')} />
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'API Server',  key: 'api'    as const },
            { label: 'Ollama AI',   key: 'ollama' as const },
            { label: 'Qdrant',      key: 'qdrant' as const },
          ].map(({ label, key }) => (
            <div key={key} className="flex items-center gap-2 p-3 rounded-lg bg-surface border border-surface-border">
              {health ? <StatusDot ok={health[key] === 'ok'} /> : <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className={clsx('text-xs', health?.[key] === 'ok' ? 'text-emerald-400' : 'text-red-400')}>
                  {health?.[key] || 'checking…'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Settings */}
      <section className="card mb-6">
        <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-brand-400" /> AI Configuration
        </h2>
        <div className="space-y-4">
          <SettingField
            label="Ollama URL"
            description="URL of your local Ollama server"
            value={settings['ollama_url'] || ''}
            onChange={v => setSettings(s => ({ ...s, ollama_url: v }))}
          />
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1">Vision Model</label>
            <p className="text-xs text-gray-500 mb-2">Model used for image analysis (must support vision)</p>
            {models.length > 0 ? (
              <select
                className="input"
                value={settings['ollama_model'] || ''}
                onChange={e => setSettings(s => ({ ...s, ollama_model: e.target.value }))}
              >
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <input
                type="text"
                className="input"
                value={settings['ollama_model'] || ''}
                onChange={e => setSettings(s => ({ ...s, ollama_model: e.target.value }))}
                placeholder="e.g. llava"
              />
            )}
          </div>
          <SettingField
            label="Qdrant URL"
            description="URL of your Qdrant vector database"
            value={settings['qdrant_url'] || ''}
            onChange={v => setSettings(s => ({ ...s, qdrant_url: v }))}
          />
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-surface-border">
            <div>
              <p className="text-sm font-medium text-white">Auto-analyze captures</p>
              <p className="text-xs text-gray-500">Run AI analysis immediately after capture</p>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, ai_auto_analyze: s['ai_auto_analyze'] === '1' ? '0' : '1' }))}
              className={clsx(
                'relative w-11 h-6 rounded-full transition-colors duration-200',
                settings['ai_auto_analyze'] === '1' ? 'bg-brand-600' : 'bg-surface-border'
              )}
            >
              <div className={clsx(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                settings['ai_auto_analyze'] === '1' ? 'translate-x-5' : 'translate-x-0.5'
              )} />
            </button>
          </div>
        </div>
      </section>

      {/* Cameras */}
      <section className="card mb-6">
        <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
          <Camera className="w-4 h-4 text-brand-400" /> Cameras
        </h2>
        <div className="space-y-2 mb-4">
          {cameras.map(cam => (
            <div key={cam.id} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-surface-border">
              <div className="flex items-center gap-3">
                <div className={clsx('w-2 h-2 rounded-full', cam.enabled ? 'bg-emerald-500' : 'bg-gray-500')} />
                <div>
                  <p className="text-sm font-medium text-white">{cam.name}</p>
                  <p className="text-xs text-gray-500">{cam.type} • source: {String(cam.source)}</p>
                </div>
              </div>
              <button onClick={() => removeCamera(cam.id)} className="btn-danger !px-2 !py-1.5 text-xs">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add camera form */}
        <div className="border-t border-surface-border pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Add Camera</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              placeholder="Camera name"
              className="input text-sm"
              value={newCam.name}
              onChange={e => setNewCam(n => ({ ...n, name: e.target.value }))}
            />
            <select
              className="input text-sm"
              value={newCam.type}
              onChange={e => setNewCam(n => ({ ...n, type: e.target.value }))}
            >
              <option value="webcam">Webcam</option>
              <option value="rtsp">RTSP</option>
              <option value="usb">USB</option>
            </select>
            <input
              type="text"
              placeholder={newCam.type === 'rtsp' ? 'rtsp://...' : 'Device index (0)'}
              className="input text-sm"
              value={newCam.source}
              onChange={e => setNewCam(n => ({ ...n, source: e.target.value }))}
            />
          </div>
          <button onClick={addCamera} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> Add Camera
          </button>
        </div>
      </section>

      {/* Storage */}
      <section className="card">
        <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-brand-400" /> Storage
        </h2>
        <SettingField
          label="Media Storage Path"
          description="Where captured files are stored on disk"
          value={settings['media_path'] || ''}
          onChange={v => setSettings(s => ({ ...s, media_path: v }))}
        />
      </section>
    </div>
  );
}

function SettingField({
  label, description, value, onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-300 block mb-1">{label}</label>
      {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}
      <input
        type="text"
        className="input font-mono text-sm"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
