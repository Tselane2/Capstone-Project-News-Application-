/**
 * Notification service — fired whenever editorial events occur.
 *
 * In production these would call a real email provider (e.g. SendGrid) and
 * post to the X (Twitter) API. For now both channels are stubbed so the
 * feature can be unit-tested without external dependencies.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ArticleApprovedPayload {
  articleId: number;
  articleTitle: string;
  authorEmail: string;
  authorUsername: string;
}

export interface NotificationResult {
  email: { sent: boolean; to: string; subject: string };
  xPost: { posted: boolean; text: string };
}

// ── Email channel ─────────────────────────────────────────────────────────────

/**
 * Send an approval notification email to the article's author.
 * Stub implementation — logs to stdout instead of calling an SMTP/API provider.
 */
export async function sendApprovalEmail(
  payload: ArticleApprovedPayload,
): Promise<{ sent: boolean; to: string; subject: string }> {
  const subject = `Your article "${payload.articleTitle}" has been published!`;
  const body = [
    `Hi ${payload.authorUsername},`,
    "",
    `Great news — your article "${payload.articleTitle}" has been approved by our editorial team and is now live on The Press Room.`,
    "",
    "Keep writing!",
    "The Press Room Editorial Team",
  ].join("\n");

  // In production: await emailProvider.send({ to: payload.authorEmail, subject, body })
  console.log(`[EMAIL] To: ${payload.authorEmail} | Subject: ${subject}`);
  console.log(`[EMAIL] Body:\n${body}`);

  return { sent: true, to: payload.authorEmail, subject };
}

// ── X (Twitter) channel ───────────────────────────────────────────────────────

/**
 * Post a promotion tweet when an article goes live.
 * Stub implementation — logs to stdout instead of calling the X API.
 */
export async function postApprovalToX(
  payload: ArticleApprovedPayload,
): Promise<{ posted: boolean; text: string }> {
  const text = `📰 New article just published on The Press Room by @${payload.authorUsername}: "${payload.articleTitle}" #ThePressRoom #journalism`;

  // In production: await xClient.v2.tweet(text)
  console.log(`[X POST] ${text}`);

  return { posted: true, text };
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

/**
 * Fire all approval notifications in parallel.
 * Called by the article approval route after an editor approves an article.
 */
export async function notifyArticleApproved(
  payload: ArticleApprovedPayload,
): Promise<NotificationResult> {
  const [email, xPost] = await Promise.all([
    sendApprovalEmail(payload),
    postApprovalToX(payload),
  ]);
  return { email, xPost };
}
