import { SectionHeading, Surface } from "@handan/ui";

import { AdminPanel } from "../../components/admin-panel";

export const metadata = {
  title: "后台管理",
  description: "管理景点、美食和导游提示内容。",
};

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-10 md:px-8">
      <Surface className="p-6">
        <SectionHeading
          eyebrow="Admin"
          title="内容后台"
          description="在这里更新景点、美食和导游提示内容，方便网站保持最新。"
        />
      </Surface>
      <AdminPanel />
    </div>
  );
}
