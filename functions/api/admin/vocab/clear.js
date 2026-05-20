export async function onRequestPost(context) {
  try {
    await context.env.DB.prepare("DELETE FROM vocab_repository").run();
    return new Response(JSON.stringify({ status: "success", message: "ล้างข้อมูลเก่าเรียบร้อย" }));
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500 });
  }
}