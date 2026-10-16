import { AuthGate } from "@/components/auth/auth-gate";
import { AppShell } from "@/components/layout/app-shell";
import dynamic from "next/dynamic";

const ChatAssistant = dynamic(
  () => import("@/components/chat/chat-assistant").then((m) => m.ChatAssistant),
  { ssr: false }
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AppShell>
        {children}
        <ChatAssistant />
      </AppShell>
    </AuthGate>
  );
}
