import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

dotenv.config();

const PORT = Number.parseInt(process.env.PORT, 10) || 3001;
const IPSTACK_BASE_URL = 'https://api.ipstack.com';
const IPSTACK_API_KEY = process.env.IPSTACK_API_KEY;

const app = express();
app.set('trust proxy', true);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sampleResponsePath = path.join(__dirname, 'data', 'sample-response.json');

if (!IPSTACK_API_KEY) {
  console.warn('⚠️  IPSTACK_API_KEY is not set. Requests to the proxy will fail until it is configured.');
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/lookup/sample', async (_req, res) => {
  try {
    const buffer = await fs.readFile(sampleResponsePath, 'utf-8');
    const sample = JSON.parse(buffer);
    res.json(sample);
  } catch (error) {
    console.error('Failed to load sample response', error);
    res.status(500).json({
      error: 'Failed to load sample response',
    });
  }
});

app.get('/lookup', async (req, res) => {
  if (!IPSTACK_API_KEY) {
    res.status(500).json({ error: 'Server misconfiguration: IPSTACK_API_KEY is missing.' });
    return;
  }

  const { ip = 'check', ...query } = req.query;

  try {
    const response = await axios.get(`${IPSTACK_BASE_URL}/${encodeURIComponent(String(ip))}`, {
      params: {
        access_key: IPSTACK_API_KEY,
        ...query,
      },
      timeout: 7000,
    });

    const data = response.data;

    if (data && typeof data === 'object' && data.success === false) {
      res.status(502).json({
        error: 'Upstream ipstack error',
        details: data.error || null,
      });
      return;
    }

    res.json(data);
  } catch (error) {
    const status = error.response?.status || 502;
    res.status(status).json({
      error: 'Failed to fetch data from ipstack',
      details: error.response?.data || error.message,
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error' });
});

app.listen(PORT, () => {
  console.log(`ipstack proxy listening on port ${PORT}`);
});
