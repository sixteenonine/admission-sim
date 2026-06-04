// ฟังก์ชันช่วยถอดรหัส Base64URL
function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) { str += '='; }
  return atob(str);
}

function base64UrlEncode(arrayBuffer) {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ฟังก์ชันยืนยันความถูกต้องของ JWT
async function verifyJWT(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('รูปแบบ Token ไม่ถูกต้อง');

  const [headerB64, payloadB64, signatureB64] = parts;
  const dataToSign = `${headerB64}.${payloadB64}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(dataToSign));
  const expectedSignatureB64 = base64UrlEncode(signature);

  if (signatureB64 !== expectedSignatureB64) {
    throw new Error('ลายเซ็นดิจิทัลไม่ถูกต้อง');
  }

  const payload = JSON.parse(base64UrlDecode(payloadB64));
  
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('Token หมดอายุแล้ว');
  }

  return payload;
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // 1. กำหนดเส้นทางที่ปล่อยผ่านได้โดยไม่ต้องตรวจบัตร (Public Routes)
  const publicPaths = [
    '/api/auth/google',
    '/api/login',
    '/api/register',
    '/api/payment/webhook',
    '/api/stories/list',     
    '/api/vocab/list',
    '/api/vocab/meta'
    , '/api/vocab/decks'
    , '/api/vocab/sync-to-kv'
  ];

  // ถ้าเป็น Public Route ให้ปล่อยผ่านไปทำงานต่อได้เลย
  if (publicPaths.some(path => url.pathname.startsWith(path))) {
    return context.next();
  }

  // 2. ดึงค่าคุกกี้ auth_token
  try {
    const cookieHeader = context.request.headers.get('Cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]*)/);
    const token = match ? match[1] : null;

    if (!token) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized: ไม่พบข้อมูลการเข้าสู่ระบบ" }), { 
      status: 401, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      });
    }

    // 3. ตรวจสอบและถอดรหัส JWT
    const secretKey = context.env.JWT_SECRET;
    if (!secretKey) {
      return new Response(JSON.stringify({ status: "error", message: "Server Error: JWT config missing" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
    const payload = await verifyJWT(token, secretKey);

    // 4. ป้องกันการแฮ็ก API หลังบ้าน
    const adminEmail = context.env.ADMIN_EMAIL || 'sixteenonine99@gmail.com'; 
    if (url.pathname.startsWith('/api/admin')) {
      if (payload.email !== adminEmail) {
        return new Response(JSON.stringify({ status: "error", message: "Forbidden: เฉพาะผู้ดูแลระบบเท่านั้น" }), { status: 403, headers: { "Content-Type": "application/json" } });
      }
    }

    // 4. แนบข้อมูลผู้ใช้ (userId) ส่งต่อไปให้ API ตัวอื่นใช้งาน
    context.data = { user: payload };

    return context.next();
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: `Forbidden: ${error.message}` }), { 
      status: 403, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
  }
}