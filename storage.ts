import { db } from './firebase-config.js';
import { FieldValue } from 'firebase-admin/firestore';
import type { ClassificationResult } from './classifier.js';

const COLLECTION = 'prompts';

export interface PromptRecord {
  id: string;
  text: string;
  title: string;
  category: string;
  tags: string[];
  source: string;
  sourceUrl: string;
  created: string;
}

export async function savePrompt(
  id: string,
  text: string,
  source: string,
  sourceUrl: string,
  timestamp: string,
  classification: ClassificationResult
): Promise<PromptRecord> {
  const record: PromptRecord = {
    id,
    text,
    title: classification.title,
    category: classification.category,
    tags: classification.tags,
    source,
    sourceUrl,
    created: timestamp,
  };

  await db.collection(COLLECTION).doc(id).set({
    text: record.text,
    title: record.title,
    category: record.category,
    tags: record.tags,
    source: record.source,
    sourceUrl: record.sourceUrl,
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
      title: data.title,
      category: data.category,
      tags: data.tags ?? [],
      source: data.source,
      sourceUrl: data.sourceUrl,
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
    title: data.title,
    category: data.category,
    tags: data.tags ?? [],
    source: data.source,
    sourceUrl: data.sourceUrl,
    created: data.created?.toDate?.()?.toISOString?.() ?? data.created,
  };
}
