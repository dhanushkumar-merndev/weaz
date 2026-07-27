import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/api";
import { getRazorpay } from "@/lib/razorpay";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { enrollment_id } = body;

  if (!enrollment_id) {
    return NextResponse.json({ error: "Missing enrollment_id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: enrollment, error } = await supabase
    .from("enrollments")
    .select("*, programs!inner(price_paise)")
    .eq("id", enrollment_id)
    .eq("user_id", user.id)
    .single();

  if (error || !enrollment) {
    return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
  }

  const amount = (enrollment.programs as { price_paise: number }).price_paise;

  const order = await getRazorpay().orders.create({
    amount,
    currency: "INR",
    receipt: enrollment_id,
    notes: {
      user_id: user.id,
      enrollment_id,
    },
  });

  await supabase
    .from("enrollments")
    .update({ razorpay_order_id: order.id })
    .eq("id", enrollment_id);

  return NextResponse.json({
    order_id: order.id,
    amount: order.amount,
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });
}
