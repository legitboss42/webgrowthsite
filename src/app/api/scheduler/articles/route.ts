import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isOwnerOpenId } from "@/lib/scheduler/config";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import { getPost, isPublicBlogSlug } from "@/lib/posts";
import { buildTikTokPhotoDraftContent } from "@/lib/tiktokPublishing";

export async function POST(request: Request) {
  const jar=await cookies(); const session=readSchedulerSession(jar.get(SCHEDULER_SESSION_COOKIE)?.value);
  if(!session) return NextResponse.json({error:"Authentication required."},{status:401});
  if(!isOwnerOpenId(session.openId)) return NextResponse.json({error:"Owner access required."},{status:403});
  if(!isSameOriginMutation(request.headers.get("origin"),request.url)) return NextResponse.json({error:"Invalid request origin."},{status:403});
  const body=await request.json().catch(()=>null) as {slug?:string}|null; const slug=String(body?.slug||"");
  if(!isPublicBlogSlug(slug)) return NextResponse.json({error:"Article not found."},{status:404});
  const article=getPost(slug); if(!article) return NextResponse.json({error:"Article not found."},{status:404});
  const draft=buildTikTokPhotoDraftContent(article); const db=createSchedulerSupabaseClient();
  const assets=draft.slides.map((slide,index)=>({id:crypto.randomUUID(),user_id:session.userId,kind:"PHOTO",storage_path:`article:${slug}:${index}`,original_filename:`${slug}-${index+1}.png`,mime_type:"image/png",byte_size:1,checksum:createHash("sha256").update(JSON.stringify(slide)).digest("hex"),validation_status:"VALID",article_slug:slug}));
  const {error:assetError}=await db.from("media_assets").insert(assets); if(assetError)return NextResponse.json({error:"Unable to prepare article media."},{status:502});
  const {data:post,error}=await db.from("scheduled_posts").insert({user_id:session.userId,kind:"PHOTO",title:draft.title,caption:draft.description,status:"NEEDS_APPROVAL"}).select().single();
  if(error||!post)return NextResponse.json({error:"Unable to create article post."},{status:502});
  await db.from("post_media").insert(assets.map((asset,position)=>({post_id:post.id,media_id:asset.id,position})));
  return NextResponse.json({postId:post.id},{status:201});
}
