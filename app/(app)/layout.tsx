import { AuthGate } from "@/components/auth/auth-gate";
import { AppShell } from "@/components/layout/app-shell";
import { ChatAssistant } from "@/components/chat/chat-assistant-client";
import { ChatRouteGuard } from "@/components/chat/chat-route-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AppShell>
        <ChatRouteGuard />
        {children}
        <ChatAssistant />
      </AppShell>
    </AuthGate>
  );
}
