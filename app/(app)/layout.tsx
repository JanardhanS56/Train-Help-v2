import { AuthGate } from "@/components/auth/auth-gate";
import { AppShell } from "@/components/layout/app-shell";
import { ChatAssistant } from "@/components/chat/chat-assistant-client";

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
