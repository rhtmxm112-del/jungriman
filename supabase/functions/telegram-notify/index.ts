import "https://deno.land/x/xhr@0.1.0/mod.ts"; // CORS 등 통신 안정성을 위한 폴리필

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-secret',
};

Deno.serve(async (req) => {
  // 1. 브라우저가 보낸 사전 요청(OPTIONS) 처리 (CORS 해결)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // 2. 프론트엔드에서 보낸 데이터 읽기
    const { message } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "메시지 내용이 비어있어!" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // 3. 환경변수 가져오기
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");

    if (!BOT_TOKEN || !CHAT_ID) {
      return new Response(JSON.stringify({ error: "서버 환경변수 세팅 누락" }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // 4. 텔레그램 API 호출하고 결과 기다리기
    const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
      }),
    });

    const tgData = await tgResponse.json();

    // 5. 성공 응답 반환
    return new Response(JSON.stringify({ success: true, tgData }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});