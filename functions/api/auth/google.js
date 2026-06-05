// ฟังก์ชันช่วยเข้ารหัส Base64URL
function base64UrlEncode(arrayBuffer) {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ฟังก์ชันสร้าง JWT ด้วย Web Crypto API
async function createJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encoder = new TextEncoder();
  
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const dataToSign = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(dataToSign));
  const signatureB64 = base64UrlEncode(signature);

  return `${dataToSign}.${signatureB64}`;
}

export async function onRequestPost(context) {
  try {
    if (!context.env.DB) {
      throw new Error("ไม่พบการเชื่อมต่อฐานข้อมูล (context.env.DB is undefined)");
    }
    
    const db = context.env.DB;
    // ดึง Secret Key สำหรับสร้าง JWT
    const secretKey = context.env.JWT_SECRET || "bearwithyou-local-secret-key-2026";
    const userInfo = await context.request.json();

    // ⚠️ ช่องโหว่สำคัญ: ตอนนี้ระบบรับ JSON จากหน้าบ้านโดยตรง (ใครก็ยิง API ปลอมอีเมลเข้ามาได้)
    // การอุดรอยรั่วขั้นต่อไป: ต้องรับเป็น Google ID Token (credential) แล้วเอามายืนยันผ่าน API ของ Google ก่อน
    if (!userInfo || !userInfo.email) {
      throw new Error("ไม่พบข้อมูล Email จาก Google");
    }

    let user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(userInfo.email).first();
    const avatarUrl = userInfo.picture || null;

    if (!user) {
      const newId = crypto.randomUUID();
      const displayName = userInfo.name || userInfo.email.split('@')[0];
      
      await db.prepare(
        "INSERT INTO users (id, email, display_name, avatar_id, plan_tier, avatar_url) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(newId, userInfo.email, displayName, 1, 'common', avatarUrl).run();

      user = { 
        id: newId, email: userInfo.email, display_name: displayName, 
        avatar_id: 1, plan_tier: 'common', avatar_url: avatarUrl 
      };
    } else {
      if (avatarUrl && user.avatar_url !== avatarUrl) {
        await db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").bind(avatarUrl, user.id).run();
        user.avatar_url = avatarUrl;
      }
    }

    // สร้าง Payload สำหรับ JWT (อายุ 2 ชั่วโมง)
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + (2 * 60 * 60); 
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.plan_tier || 'common',
      iat,
      exp
    };

    const token = await createJWT(payload, secretKey);

    // เขียนข้อมูลผู้ใช้ลง KV ทันที (Write-Through Cache) เพื่อให้หน้า check.js ไม่ต้องดึง D1
    const userProfile = { 
      id: user.id, email: user.email, display_name: user.display_name, 
      avatar_id: user.avatar_id, avatar_url: user.avatar_url, plan_tier: user.plan_tier, 
      plan_expire_at: user.plan_expire_at, generation: user.generation, 
      target_uni: user.target_uni, target_fac: user.target_fac, created_at: user.created_at 
    };
    context.waitUntil(context.env.APP_KV.put(`user_profile_${user.id}`, JSON.stringify(userProfile)));

    // ตั้งค่า HttpOnly Cookie (ป้องกัน XSS) พร้อมระบบป้องกัน CSRF
    const isProd = new URL(context.request.url).protocol === 'https:';
    // ปรับ SameSite เป็น Lax เพื่อให้ Cookie ไม่หลุดเวลา Refresh
    const cookieString = `auth_token=${token}; HttpOnly; Path=/; Max-Age=${2 * 60 * 60}; SameSite=Lax${isProd ? '; Secure' : ''}`;
    return new Response(JSON.stringify({ 
      status: "success", 
      user: { 
        id: user.id, 
        email: user.email, 
        displayName: user.display_name, 
        avatar_id: user.avatar_id,
        avatar_url: user.avatar_url,
        plan_tier: user.plan_tier,
        plan_expire_at: user.plan_expire_at,
        generation: user.generation,
        target_uni: user.target_uni,
        target_fac: user.target_fac,
        created_at: user.created_at
      } 
    }), { 
      headers: { 
        "Content-Type": "application/json",
        "Set-Cookie": cookieString
      } 
    });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message || "Unknown Error" }), { 
      status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
}