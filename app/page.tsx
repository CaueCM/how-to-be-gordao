"use client";

import { useSession } from "next-auth/react";
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

export default function Home() {
  const { status } = useSession();
  const screen = useAppStore((s) => s.screen);
  const openWizard = useAppStore((s) => s.openWizard);
  const selectedPlanId = useAppStore((s) => s.selectedPlanId);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[430px]" style={{ background: "var(--screen-grad)" }}>
      {status === "loading" ? null : status !== "authenticated" ? (
        <LoginScreen />
      ) : (
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
        </>
      )}
    </div>
  );
}
