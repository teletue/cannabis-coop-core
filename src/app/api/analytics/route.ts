import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Daily rotating salt for session hashing (resets on server restart or daily basis)
let dailySalt = crypto.randomBytes(16).toString('hex');
let lastSaltRotationDate = new Date().getUTCDate();

function getSessionHash(userAgent: string) {
  const currentDay = new Date().getUTCDate();
  if (currentDay !== lastSaltRotationDate) {
    dailySalt = crypto.randomBytes(16).toString('hex');
    lastSaltRotationDate = currentDay;
  }
  
  // Create an irreversible hash of User-Agent + Daily Salt.
  // This acts as a single-day session ID without tracking users across days.
  return crypto
    .createHash('sha256')
    .update(`${userAgent}-${dailySalt}`)
    .digest('hex')
    .substring(0, 16);
}

export async function POST(request: Request) {
  try {
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const body = await request.json();
    const { url, elementId, eventType, timestamp } = body;

    if (!url) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    // Generate anonymous session identifier (expires in 24 hours, cannot be reversed)
    const anonSessionId = getSessionHash(userAgent);

    const eventData = {
      sessionId: anonSessionId,
      url: url.substring(0, 500), // Protect against overflow attacks
      elementId: elementId ? elementId.substring(0, 100) : null,
      eventType: eventType ? eventType.substring(0, 50) : 'view',
      timestamp: timestamp || Date.now(),
    };

    // Log the event. In production, this can be streamed to a queue, PostgreSQL,
    // or file storage. For simplicity and compliance, we write to a local log file.
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logPath = path.join(logDir, 'analytics.jsonl');
    fs.appendFileSync(logPath, JSON.stringify(eventData) + '\n', 'utf8');

    return NextResponse.json({ success: true, logged: eventData.sessionId });
  } catch (error) {
    console.error('Failed to log analytic event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
