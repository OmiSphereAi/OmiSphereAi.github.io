import Database from 'better-sqlite3';
import path from 'path';
import type { AnalysisResult } from './types';

const DB_PATH = path.join(process.cwd(), 'omnisphere.db');

let _db: Database.Database | null = null;

function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.exec(`
      CREATE TABLE IF NOT EXISTS analyses (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        platform TEXT NOT NULL,
        video_id TEXT,
        video_title TEXT,
        video_thumbnail TEXT,
        channel_name TEXT,
        analyzed_at TEXT NOT NULL,
        total_comments INTEGER DEFAULT 0,
        bot_count INTEGER DEFAULT 0,
        suspicious_count INTEGER DEFAULT 0,
        human_count INTEGER DEFAULT 0,
        is_public INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        analysis_id TEXT NOT NULL,
        author TEXT NOT NULL,
        text TEXT NOT NULL,
        bot_score INTEGER NOT NULL,
        classification TEXT NOT NULL,
        signals TEXT NOT NULL,
        like_count INTEGER DEFAULT 0,
        published_at TEXT,
        is_reply INTEGER DEFAULT 0,
        cluster_id TEXT,
        FOREIGN KEY (analysis_id) REFERENCES analyses(id)
      );

      CREATE TABLE IF NOT EXISTS clusters (
        id TEXT PRIMARY KEY,
        analysis_id TEXT NOT NULL,
        narrative TEXT NOT NULL,
        comment_count INTEGER NOT NULL,
        confidence REAL NOT NULL,
        sample_comments TEXT NOT NULL,
        FOREIGN KEY (analysis_id) REFERENCES analyses(id)
      );
    `);
  }
  return _db;
}

export function saveAnalysis(result: AnalysisResult) {
  const db = getDb();

  db.prepare(`
    INSERT OR REPLACE INTO analyses
    (id, url, platform, video_id, video_title, video_thumbnail, channel_name, analyzed_at, total_comments, bot_count, suspicious_count, human_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    result.id, result.url, result.platform, result.video.id,
    result.video.title, result.video.thumbnail, result.video.channelName,
    result.analyzedAt, result.stats.total, result.stats.bots,
    result.stats.suspicious, result.stats.humans
  );

  const insertComment = db.prepare(`
    INSERT OR REPLACE INTO comments (id, analysis_id, author, text, bot_score, classification, signals, like_count, published_at, is_reply, cluster_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of result.comments) {
    insertComment.run(c.id, result.id, c.author, c.text, c.botScore, c.classification, JSON.stringify(c.signals), c.likeCount, c.publishedAt, c.isReply ? 1 : 0, c.clusterId || null);
  }

  const insertCluster = db.prepare(`
    INSERT OR REPLACE INTO clusters (id, analysis_id, narrative, comment_count, confidence, sample_comments)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const cl of result.clusters) {
    insertCluster.run(cl.id, result.id, cl.narrative, cl.commentCount, cl.confidence, JSON.stringify(cl.sampleComments));
  }
}

export function getRecentAnalyses(limit = 10) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM analyses ORDER BY analyzed_at DESC LIMIT ?
  `).all(limit);
}

export function getPublicClusters() {
  const db = getDb();
  return db.prepare(`
    SELECT c.*, a.video_title, a.channel_name, a.analyzed_at
    FROM clusters c
    JOIN analyses a ON c.analysis_id = a.id
    WHERE a.is_public = 1
    ORDER BY c.confidence DESC
    LIMIT 20
  `).all();
}

export function getAnalysisById(id: string) {
  const db = getDb();
  const analysis = db.prepare('SELECT * FROM analyses WHERE id = ?').get(id);
  if (!analysis) return null;
  const comments = db.prepare('SELECT * FROM comments WHERE analysis_id = ? ORDER BY bot_score DESC').all(id);
  const clusters = db.prepare('SELECT * FROM clusters WHERE analysis_id = ?').all(id);
  return { analysis, comments, clusters };
}

export function getDashboardStats() {
  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as count FROM analyses').get() as { count: number } | undefined)?.count || 0;
  const totalComments = (db.prepare('SELECT SUM(total_comments) as sum FROM analyses').get() as { sum: number } | undefined)?.sum || 0;
  const totalBots = (db.prepare('SELECT SUM(bot_count) as sum FROM analyses').get() as { sum: number } | undefined)?.sum || 0;
  const totalClusters = (db.prepare('SELECT COUNT(*) as count FROM clusters').get() as { count: number } | undefined)?.count || 0;
  return { totalAnalyses: total, totalComments, totalBots, totalClusters };
}
