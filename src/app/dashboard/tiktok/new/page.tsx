import { redirect } from "next/navigation";
import NewPostComposer from "@/components/scheduler/NewPostComposer";
import { DashboardHeading } from "@/components/dashboard/DashboardShell";
import { requireWebGrowthDashboardSession } from "@/lib/dashboardSession";
import { isOwnerOpenId } from "@/lib/scheduler/config";
import { getPublicPosts } from "@/lib/posts";

export default async function DashboardTikTokNewPage() {
  const { session } = await requireWebGrowthDashboardSession();
  if (!session.schedulerUserId || !session.tiktokOpenId) redirect("/dashboard/tiktok/");
  const owner = isOwnerOpenId(session.tiktokOpenId);
  const articles = owner ? getPublicPosts().map(({ slug, title }) => ({ slug, title })) : [];
  return <main><DashboardHeading eyebrow="TikTok Publishing / Create" title="Create a TikTok post" description="Upload media manually or, for the Web Growth owner, start from a published article. Both paths create records in the same scheduler queue." /><div className="mt-7"><NewPostComposer owner={owner} articles={articles} /></div></main>;
}
