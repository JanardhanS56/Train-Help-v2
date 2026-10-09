import { AppShell } from "@/components/layout/app-shell";
import { ChatAssistant } from "@/components/chat/chat-assistant";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
      <ChatAssistant />
    </AppShell>
  );
}
