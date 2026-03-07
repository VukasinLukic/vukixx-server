import { db } from './firebase-config.js';
import { FieldValue } from 'firebase-admin/firestore';

const COLLECTION = 'prompts';

export interface PromptRecord {
  id: string;
  text: string;
  title: string;
  category: string;
  tags: string[];
  source: string;
  sourceUrl: string;
  classified: boolean;
  confidence: number;
  created: string;
}

/**
 * Save prompt to Firestore WITHOUT AI classification.
 * Desktop app will classify when it sees classified: false.
 */
export async function savePrompt(
  id: string,
  text: string,
  source: string,
  sourceUrl: string,
  timestamp: string
): Promise<PromptRecord> {
  const record: PromptRecord = {
    id,
    text,
    title: '',           // Empty - desktop app will generate
    category: 'other',   // Default - desktop app will classify
    tags: [],            // Empty - desktop app will generate
    source,
    sourceUrl,
    classified: false,   // 🚩 CRITICAL: tells desktop app to classify
    confidence: 0,
    created: timestamp,
  };

  await db.collection(COLLECTION).doc(id).set({
    text: record.text,
    title: record.title,
    category: record.category,
    tags: record.tags,
    source: record.source,
    sourceUrl: record.sourceUrl,
    classified: record.classified,
    confidence: record.confidence,
    created: new Date(timestamp),
    updated: FieldValue.serverTimestamp(),
  });

  return record;
}

export async function getRecentPrompts(limit = 10): Promise<PromptRecord[]> {
  const snapshot = await db
    .collection(COLLECTION)
    .orderBy('created', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      text: data.text,
      title: data.title || '',
      category: data.category || 'other',
      tags: data.tags ?? [],
      source: data.source,
      sourceUrl: data.sourceUrl,
      classified: data.classified ?? false,
      confidence: data.confidence ?? 0,
      created: data.created?.toDate?.()?.toISOString?.() ?? data.created,
    };
  });
}

export async function getPromptById(id: string): Promise<PromptRecord | null> {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  return {
    id: doc.id,
    text: data.text,
    title: data.title || '',
    category: data.category || 'other',
    tags: data.tags ?? [],
    source: data.source,
    sourceUrl: data.sourceUrl,
    classified: data.classified ?? false,
    confidence: data.confidence ?? 0,
    created: data.created?.toDate?.()?.toISOString?.() ?? data.created,
  };
}
