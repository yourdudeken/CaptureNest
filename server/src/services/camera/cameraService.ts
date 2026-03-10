import { getDb } from '../../db/database';
import { CameraConfig } from '../../types';
import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────────────
// Camera Management Service
// Tracks configured cameras (webcam, USB, RTSP) in the database.
// ─────────────────────────────────────────────────────────────────────────────

interface CameraRow {
  id: string;
  name: string;
  type: 'webcam' | 'rtsp' | 'usb';
  source: string;
  enabled: 0 | 1;
  motion_detection: 0 | 1;
  scheduled_capture: 0 | 1;
  schedule_interval: number;
}

function rowToConfig(row: CameraRow): CameraConfig {
  return {
    id:               row.id,
    name:             row.name,
    type:             row.type,
    source:           isNaN(Number(row.source)) ? row.source : Number(row.source),
    enabled:          row.enabled === 1,
    motionDetection:  row.motion_detection === 1,
    scheduledCapture: row.scheduled_capture === 1,
    scheduleInterval: row.schedule_interval,
  };
}

export function listCameras(): CameraConfig[] {
  const rows = getDb().prepare('SELECT * FROM cameras').all() as CameraRow[];
  return rows.map(rowToConfig);
}

export function getCameraById(id: string): CameraConfig | null {
  const row = getDb().prepare('SELECT * FROM cameras WHERE id = ?').get(id) as CameraRow | undefined;
  return row ? rowToConfig(row) : null;
}

export function addCamera(data: Omit<CameraConfig, 'id'>): CameraConfig {
  const id = uuidv4();
  getDb().prepare(`
    INSERT INTO cameras (id, name, type, source, enabled, motion_detection, scheduled_capture, schedule_interval)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name,
    data.type,
    String(data.source),
    data.enabled ? 1 : 0,
    data.motionDetection ? 1 : 0,
    data.scheduledCapture ? 1 : 0,
    data.scheduleInterval,
  );

  return getCameraById(id)!;
}

export function updateCamera(id: string, updates: Partial<Omit<CameraConfig, 'id'>>): CameraConfig | null {
  const existing = getCameraById(id);
  if (!existing) return null;

  const merged = { ...existing, ...updates };
  getDb().prepare(`
    UPDATE cameras SET name = ?, type = ?, source = ?, enabled = ?, motion_detection = ?, scheduled_capture = ?, schedule_interval = ?
    WHERE id = ?
  `).run(
    merged.name,
    merged.type,
    String(merged.source),
    merged.enabled ? 1 : 0,
    merged.motionDetection ? 1 : 0,
    merged.scheduledCapture ? 1 : 0,
    merged.scheduleInterval,
    id,
  );

  return getCameraById(id);
}

export function deleteCamera(id: string): boolean {
  const result = getDb().prepare('DELETE FROM cameras WHERE id = ?').run(id);
  return result.changes > 0;
}
