import assert from 'node:assert/strict';
import test from 'node:test';
import { readGLMEventStream, streamTarotInterpretation } from './glmClient';

function createByteStream(chunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach(chunk => controller.enqueue(chunk));
      controller.close();
    },
  });
}

test('reads GLM SSE content across arbitrary byte boundaries', async () => {
  const encoded = new TextEncoder().encode([
    'data: {"choices":[{"delta":{"content":"你"}}]}\r\n\r\n',
    'data: {"choices":[{"delta":{"content":"好"}}]}\n\n',
    'data: [DONE]\n\n',
  ].join(''));
  const chunks = [encoded.slice(0, 47), encoded.slice(47, 53), encoded.slice(53, 91), encoded.slice(91)];
  const deltas: Array<{ delta: string; fullText: string }> = [];

  const result = await readGLMEventStream(createByteStream(chunks), (delta, fullText) => {
    deltas.push({ delta, fullText });
  });

  assert.equal(result, '你好');
  assert.deepEqual(deltas, [
    { delta: '你', fullText: '你' },
    { delta: '好', fullText: '你好' },
  ]);
});

test('accepts a final SSE event without a trailing separator', async () => {
  const encoded = new TextEncoder().encode('data: {"choices":[{"delta":{"content":"final"}}]}');
  const result = await readGLMEventStream(createByteStream([encoded]));

  assert.equal(result, 'final');
});

test('surfaces errors embedded in the event stream', async () => {
  const encoded = new TextEncoder().encode('data: {"error":{"message":"quota exceeded"}}\n\n');

  await assert.rejects(
    readGLMEventStream(createByteStream([encoded])),
    /quota exceeded/,
  );
});

test('requests GLM streaming mode and forwards incremental text', async t => {
  const originalFetch = globalThis.fetch;
  const encoded = new TextEncoder().encode([
    'data: {"choices":[{"delta":{"content":"星"}}]}\n\n',
    'data: {"choices":[{"delta":{"content":"光"}}]}\n\n',
    'data: [DONE]\n\n',
  ].join(''));
  let requestBody: any = null;

  globalThis.fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(createByteStream([encoded]), {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    });
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const updates: string[] = [];
  const result = await streamTarotInterpretation(
    {
      settings: { apiKey: 'test-key', model: 'GLM-4.7-Flash' },
      spreadName: '三张牌牌阵',
      question: '测试问题',
      language: 'zh',
      cardsDrawn: [
        {
          name: 'The Star',
          displayName: '星星',
          positionName: '未来',
          isUpright: true,
          keywords: ['希望'],
          arcana: '大阿卡那',
          description: '希望与疗愈。',
        },
      ],
    },
    { onDelta: (_delta, fullText) => updates.push(fullText) },
  );

  assert.equal(requestBody.stream, true);
  assert.equal(result, '星光');
  assert.deepEqual(updates, ['星', '星光']);
});
