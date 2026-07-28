"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useAppStore } from "@/lib/store";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { DashboardScreen } from "@/components/screens/DashboardScreen";
import { MissionsScreen } from "@/components/screens/MissionsScreen";
import { PlanDetailScreen } from "@/components/screens/PlanDetailScreen";
import { GoalDetailScreen } from "@/components/screens/GoalDetailScreen";
import { CalendarScreen } from "@/components/screens/CalendarScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { TabBar } from "@/components/ui/TabBar";
import { Fab } from "@/components/ui/Fab";
import { NewGoalWizard } from "@/components/wizard/NewGoalWizard";
import { CheckinModal } from "@/components/checkin/CheckinModal";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { Button } from "@/components/ui/Button";

function LoadErrorScreen({ message }: { message: string }) {
  const loadPlans = useAppStore((s) => s.loadPlans);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-7 text-center">
      <p className="text-[16px] font-semibold text-[var(--color-text)]">Deu ruim pra carregar seus dados</p>
      <p className="text-[13px] text-[var(--color-neutral-500)]">{message}</p>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => void loadPlans()}>
          Tentar de novo
        </Button>
        <Button onClick={() => signOut({ callbackUrl: "/" })}>Sair e logar de novo</Button>
      </div>
    </div>
  );
}

export default function Home() {
  const { status } = useSession();
  const screen = useAppStore((s) => s.screen);
  const openWizard = useAppStore((s) => s.openWizard);
  const selectedPlanId = useAppStore((s) => s.selectedPlanId);
  const plansLoaded = useAppStore((s) => s.plansLoaded);
  const plansError = useAppStore((s) => s.plansError);
  const loadPlans = useAppStore((s) => s.loadPlans);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  const openOnboarding = useAppStore((s) => s.openOnboarding);

  useEffect(() => {
    if (status === "authenticated") void loadPlans();
  }, [status, loadPlans]);

  useEffect(() => {
    if (plansLoaded && !hasOnboarded) openOnboarding();
  }, [plansLoaded, hasOnboarded, openOnboarding]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[430px]" style={{ background: "var(--screen-grad)" }}>
      {status === "loading" ? null : status !== "authenticated" ? (
        <LoginScreen />
      ) : plansError ? (
        <LoadErrorScreen message={plansError} />
      ) : !plansLoaded ? null : (
        <>
          {screen === "dashboard" && <DashboardScreen />}
          {screen === "plans" && <MissionsScreen />}
          {screen === "planDetail" && <PlanDetailScreen />}
          {screen === "goalDetail" && <GoalDetailScreen />}
          {screen === "calendar" && <CalendarScreen />}
          {screen === "settings" && <SettingsScreen />}

          {["dashboard", "plans", "planDetail"].includes(screen) && (
            <Fab onClick={() => openWizard(screen === "planDetail" ? selectedPlanId : null)} />
          )}
          <TabBar />
          <NewGoalWizard />
          <CheckinModal />
          <OnboardingFlow />
        </>
      )}
    </div>
  );
}
