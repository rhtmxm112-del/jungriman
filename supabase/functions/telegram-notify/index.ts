import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

console.log("텔레그램 알림 함수 기동 완료!");

export default {
  // 클라이언트(index.html)에서 누구나 안전하게 찌를 수 있도록 'publishable' 권한 허용
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    try {
      // 1. 프론트엔드(index.html)에서 보낸 메시지 데이터 본문 읽기
      const { message } = await req.json();

      if (!message) {
        return new Response(JSON.stringify({ error: "메시지 내용이 비어있어!" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 2. Supabase Vault(환경변수)에 숨겨둔 텔레그램 비밀 키 가져오기
      const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
      const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");

      if (!BOT_TOKEN || !CHAT_ID) {
        console.error("환경변수 설정 누락: TELEGRAM_BOT_TOKEN 또는 TELEGRAM_CHAT_ID를 확인해줘.");
        return new Response(JSON.stringify({ error: "서버 환경변수 세팅이 덜 됐어." }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 3. 서버 측에서 안전하게 텔레그램 API 호출 (이제 토큰은 절대 외부에 노출 안 됨)
      const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
        }),
      });

      const tgResult = await tgResponse.json();

      return Response.json({
        success: tgResponse.ok,
        tele_response: tgResult
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
};