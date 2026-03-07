import express from 'express';
import cors from 'cors';
import { savePrompt, getRecentPrompts, getPromptById } from './storage.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3777');

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ── Health check ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// ── Save prompt (NO AI classification - desktop app handles it) ──
app.post('/api/prompts', async (req, res) => {
  try {
    const { text, source, url, timestamp } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ success: false, error: 'Missing or invalid "text" field' });
      return;
    }

    // Generate ID
    const id = `${source || 'manual'}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Save to Firestore WITHOUT classification
    // Desktop app will classify when it sees classified: false
    const record = await savePrompt(
      id,
      text,
      source || 'manual',
      url || '',
      timestamp || new Date().toISOString()
    );

    res.json({
      success: true,
      promptId: record.id,
      title: record.title,
      category: record.category,
      tags: record.tags,
      classified: record.classified,
    });
  } catch (err) {
    console.error('Error saving prompt:', err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
});

// ── Get recent prompts ──
app.get('/api/prompts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const prompts = await getRecentPrompts(limit);
    res.json(prompts);
  } catch (err) {
    console.error('Error getting prompts:', err);
    res.status(500).json({ error: 'Failed to get prompts' });
  }
});

// ── Get single prompt ──
app.get('/api/prompts/:id', async (req, res) => {
  try {
    const prompt = await getPromptById(req.params.id);
    if (!prompt) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }
    res.json(prompt);
  } catch (err) {
    console.error('Error getting prompt:', err);
    res.status(500).json({ error: 'Failed to get prompt' });
  }
});

// ── Start server ──
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Vukixxx API Server running on http://0.0.0.0:${PORT}`);
  console.log(`  Mode: Capture only (no AI classification)`);
  console.log(`  Storage: Firebase Firestore`);
  console.log(`  Desktop app will classify prompts with classified: false\n`);
});
