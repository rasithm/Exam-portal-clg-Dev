// backend/src/services/judge0Service.js
import axios from 'axios';

const USE_HOSTED_JUDGE0 = true;
const JUDGE0_BASE_URL = USE_HOSTED_JUDGE0
  ? 'https://judge0-ce.p.rapidapi.com'
  : 'http://localhost:2358';

const JUDGE0_HEADERS = USE_HOSTED_JUDGE0
  ? {
      'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      'Content-Type': 'application/json',
    }
  : {
      'Content-Type': 'application/json',
    };

export async function submitToJudge0({ sourceCode, languageId, stdin }) {
  const payload = {
    source_code: sourceCode,
    language_id: languageId,
    stdin: stdin || '',
    base64_encoded: false,
    wait: true
  };

  const res = await axios.post(
    `${JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=true`,
    payload,
    { headers: JUDGE0_HEADERS }
  );

  return res.data;
}

export async function fetchJudge0Languages() {
  const res = await axios.get(`${JUDGE0_BASE_URL}/languages`, {
    headers: JUDGE0_HEADERS,
  });
  return res.data;
}
