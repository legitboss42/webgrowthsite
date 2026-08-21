"use client";
import { createClient } from "@supabase/supabase-js";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPostComposer({ owner, articles = [] }: { owner: boolean; articles?: Array<{slug:string;title:string}> }) {
  const router=useRouter(); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  async function submit(formData:FormData){setBusy(true);setError("");try{
    const article=String(formData.get("article")||"");
    if(owner&&article){const generated=await fetch("/api/scheduler/articles/",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({slug:article})});const post=await generated.json();if(!generated.ok)throw new Error(post.error);router.push(`/scheduler/posts/${post.postId}/`);return}
    const file=formData.get("media") as File; if(!file?.size) throw new Error("Choose a video or photo.");
    const kind=file.type.startsWith("video/")?"VIDEO":"PHOTO";
    const create=await fetch("/api/scheduler/uploads/",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"create",kind,filename:file.name,mimeType:file.type,byteSize:file.size})});
    const target=await create.json(); if(!create.ok) throw new Error(target.error);
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if(!url||!key) throw new Error("Upload service is not configured.");
    const supabase=createClient(url,key); const uploaded=await supabase.storage.from("tiktok-scheduler-media").uploadToSignedUrl(target.path,target.token,file,{contentType:file.type});
    if(uploaded.error) throw new Error("Upload failed.");
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",await file.arrayBuffer()))).map(v=>v.toString(16).padStart(2,"0")).join("");
    const finalized=await fetch("/api/scheduler/uploads/",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"finalize",assetId:target.assetId,checksum:hash})});
    const final=await finalized.json(); if(!finalized.ok) throw new Error(final.error);
    const created=await fetch("/api/scheduler/posts/",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"create",mediaIds:[target.assetId],title:String(formData.get("title")||""),caption:String(formData.get("caption")||"")})});
    const post=await created.json();if(!created.ok)throw new Error(post.error);router.push(`/scheduler/posts/${post.postId}/`);
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to create post.");setBusy(false)}}
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(new FormData(event.currentTarget));
  }
  return <form onSubmit={handleSubmit} className="mt-9 space-y-6 rounded-[2rem] border border-white/10 bg-white/[.035] p-6 sm:p-8">
    {owner&&articles.length?<label className="block"><span className="mb-2 block text-sm text-white/60">Owner-only article source</span><select name="article" defaultValue="" className="w-full rounded-xl border border-white/15 bg-[#111617] p-3"><option value="">Upload media instead</option>{articles.map(a=><option key={a.slug} value={a.slug}>{a.title}</option>)}</select></label>:null}
    <label className="block"><span className="mb-2 block text-sm text-white/60">Original video or photo</span><input name="media" type="file" accept="video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp" className="w-full rounded-xl border border-dashed border-white/20 p-5" /></label>
    <label className="block"><span className="mb-2 block text-sm text-white/60">Title</span><input name="title" maxLength={90} required className="w-full rounded-xl border border-white/15 bg-[#111617] p-3"/></label>
    <label className="block"><span className="mb-2 block text-sm text-white/60">Caption</span><textarea name="caption" rows={5} className="w-full rounded-xl border border-white/15 bg-[#111617] p-3"/></label>
    {error?<p role="alert" className="text-[#ff8b9a]">{error}</p>:null}<button disabled={busy} className="rounded-full bg-[#62f5e6] px-6 py-3 font-bold text-black disabled:opacity-50">{busy?"Preparing…":"Create preview"}</button>
  </form>
}
