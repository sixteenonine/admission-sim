export async function onRequestPost(context) {
  // สร้างคุกกี้เปล่าที่หมดอายุทันที (Max-Age=0) เพื่อเขียนทับคุกกี้เดิม
  const isProd = new URL(context.request.url).protocol === 'https:';
  const cookieString = `auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${isProd ? '; Secure' : ''}`;

  return new Response(JSON.stringify({ status: "success", message: "Logged out successfully" }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookieString
    }
  });
}