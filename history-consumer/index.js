export default {
  async queue(batch, env) {
    if (batch.messages.length === 0) return;

    const statements = [];
    const stmt = env.DB.prepare(
      "INSERT OR REPLACE INTO exam_history (id, user_id, mode, score, reflection_data) VALUES (?, ?, ?, ?, ?)"
    );

    for (const msg of batch.messages) {
      const { historyId, userId, mode, score, reflectionData } = msg.body;
      statements.push(
        stmt.bind(historyId, userId, mode, score, JSON.stringify(reflectionData))
      );
    }

    // มัดรวม Insert ทีเดียว (Bulk Write) ช่วยเซฟ Cost ของ D1
    await env.DB.batch(statements);
  }
};