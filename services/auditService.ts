import { db } from '../shared/config';
import { push, ref, update } from 'firebase/database';

export type ResolveAuditRecordOptions = {
  auditId?: string | null;
  eventType: string;
  flow: string;
  status: 'approved' | 'rejected';
  decisionType?: string;
  message?: string | null;
  linked?: Record<string, any>;
  input?: Record<string, any>;
  timestamp: number;
};

export const resolveAuditRecord = (
  ip: string,
  safeIp: string,
  options: ResolveAuditRecordOptions
) => {
  if (!db) return;

  const {
    auditId,
    eventType,
    flow,
    status,
    decisionType,
    message,
    linked = {},
    input = {},
    timestamp
  } = options;

  const normalizedAuditId = String(auditId || '').trim();
  const decisionPatch = {
    status,
    decisionType: decisionType || status,
    decisionMessage: message || null,
    decisionAt: timestamp,
    updatedAt: timestamp
  };

  if (normalizedAuditId) {
    update(ref(db, `auditLog/${normalizedAuditId}`), decisionPatch);
    update(ref(db, `users/${safeIp}/auditLog/${normalizedAuditId}`), decisionPatch);
    return;
  }

  // Backward-compatible fallback when there is no linked auditId yet.
  const auditRef = push(ref(db, 'auditLog'));
  const fallbackAuditId = auditRef.key || `audit_${timestamp}`;
  const record = {
    auditId: fallbackAuditId,
    ip,
    safeIp,
    eventType,
    flow,
    input,
    linked,
    status,
    decisionType: decisionType || status,
    createdAt: timestamp,
    decisionAt: timestamp,
    updatedAt: timestamp,
    decisionMessage: message || null
  };

  const updates: Record<string, any> = {};
  updates[`auditLog/${fallbackAuditId}`] = record;
  updates[`users/${safeIp}/auditLog/${fallbackAuditId}`] = record;
  update(ref(db), updates);
};
