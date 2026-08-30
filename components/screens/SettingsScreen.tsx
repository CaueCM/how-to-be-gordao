"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useAppStore } from "@/lib/store";
import { Screen, SectionLabel } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Check, AlertTriangle } from "@/components/icons";
import { reschedulePlan, type RescheduleResult } from "@/lib/actions";

export function SettingsScreen() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Você";
  const userEmail = session?.user?.email || "";
  const calendarConnected = !!session?.calendarConnected;

  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const toggleNotifications = useAppStore((s) => s.toggleNotifications);
  const unitPreference = useAppStore((s) => s.unitPreference);
  const setUnitPreference = useAppStore((s) => s.setUnitPreference);
  const weekStart = useAppStore((s) => s.weekStart);
  const setWeekStart = useAppStore((s) => s.setWeekStart);
  const emptyDemo = useAppStore((s) => s.emptyDemo);
  const toggleEmptyDemo = useAppStore((s) => s.toggleEmptyDemo);
  const openOnboarding = useAppStore((s) => s.openOnboarding);
  const plans = useAppStore((s) => s.plans);
  const loadPlans = useAppStore((s) => s.loadPlans);

  const trainingPlan = plans.find((p) => p.name.toLowerCase().includes("corrida"));
  const [confirming, setConfirming] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [result, setResult] = useState<RescheduleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReschedule() {
    if (!trainingPlan) return;
    setRescheduling(true);
    setError(null);
    try {
      const res = await reschedulePlan(trainingPlan.id);
      setResult(res);
      setConfirming(false);
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não rolou. Tenta de novo.");
    } finally {
      setRescheduling(false);
    }
  }


  return (
    <Screen>
      <h1 className="text-[23px] font-light text-[var(--color-text)]">Ajustes</h1>

      <div className="flex flex-col gap-3">
        <SectionLabel>Conta</SectionLabel>
        <div className="flex items-center gap-3 rounded-[22px] bg-[var(--surface-card)] p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-text)] text-[14px] font-bold text-white">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-[var(--color-text)]">{userName}</p>
            <p className="truncate text-[11px] text-[var(--color-neutral-400)]">{userEmail}</p>
          </div>
          <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/" })}>
            Cair fora
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>Google Calendar</SectionLabel>
        <div className="flex items-center gap-3 rounded-[22px] bg-[var(--surface-card)] p-5">
          {calendarConnected ? (
            <Check size={18} strokeWidth={2.2} color="var(--color-success)" />
          ) : (
            <AlertTriangle size={18} strokeWidth={2.2} color="var(--color-danger)" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[var(--color-text)]">
              {calendarConnected ? "Conectado" : "Desconectado"}
            </p>
            <p className="text-[11px] text-[var(--color-neutral-400)]">
              {calendarConnected ? "Desconectar sai da sua conta também, sem meio-termo" : "Controla se os lembretes chegam, esperto"}
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() =>
              calendarConnected ? signOut({ callbackUrl: "/" }) : signIn("google", { callbackUrl: "/" })
            }
          >
            {calendarConnected ? "Desconectar" : "Reconectar"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>Preferências</SectionLabel>
        <div className="flex flex-col gap-4 rounded-[22px] bg-[var(--surface-card)] p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-[var(--color-text)]">Unidade padrão</span>
            <Select
              value={unitPreference}
              onChange={(e) => setUnitPreference(e.target.value as typeof unitPreference)}
              className="w-auto min-w-[120px]"
            >
              <option value="kg">kg</option>
              <option value="lb">lb</option>
              <option value="páginas">páginas</option>
            </Select>
          </div>

          <label className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-[var(--color-text)]">Notificação pra te encher o saco</span>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={toggleNotifications}
              className="h-5 w-5 accent-[var(--color-text)]"
            />
          </label>

          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-[var(--color-text)]">Início da semana</span>
            <SegmentedControl
              value={weekStart}
              onChange={setWeekStart}
              options={[
                { value: "sunday", label: "Dom" },
                { value: "monday", label: "Seg" },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>Ajuda</SectionLabel>
        <button
          onClick={openOnboarding}
          className="flex items-center justify-between gap-3 rounded-[22px] bg-[var(--surface-card)] p-5 text-left transition-transform active:scale-[0.98]"
        >
          <div>
            <p className="text-[13px] font-semibold text-[var(--color-text)]">Como usar o app</p>
            <p className="text-[11px] text-[var(--color-neutral-400)]">Reveja o tutorial rapidinho</p>
          </div>
          <span className="text-[18px] text-[var(--color-neutral-400)]">›</span>
        </button>
      </div>

      {trainingPlan && (
        <div className="flex flex-col gap-3">
          <SectionLabel>Bloco de treino</SectionLabel>
          <div className="flex flex-col gap-4 rounded-[22px] bg-[var(--surface-card)] p-5">
            <div>
              <p className="text-[13px] font-semibold text-[var(--color-text)]">Replanejar até a São Silvestre</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-neutral-400)]">
                Reconstrói 18 semanas partindo do zero, de 31/08 até a prova em 31/12. Apaga os
                treinos que você nunca fez e mantém os que já têm registro.
              </p>
            </div>

            {result ? (
              <div className="rounded-[14px] bg-[var(--color-success)]/10 p-4">
                <p className="text-[12px] font-semibold text-[var(--color-text)]">Plano refeito</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-neutral-400)]">
                  {result.created} treinos criados, de {result.firstDay} até {result.raceDay}.
                  {" "}{result.deleted} apagados, {result.kept} preservados com histórico.
                </p>
              </div>
            ) : confirming ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2 rounded-[14px] bg-[var(--color-danger)]/10 p-4">
                  <AlertTriangle size={16} strokeWidth={2.2} color="var(--color-danger)" />
                  <p className="text-[11px] leading-relaxed text-[var(--color-text)]">
                    Isso apaga os treinos não feitos de &ldquo;{trainingPlan.name}&rdquo; e recria o
                    bloco inteiro. Não dá pra desfazer.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleReschedule} disabled={rescheduling}>
                    {rescheduling ? "Refazendo..." : "Confirmar"}
                  </Button>
                  <Button variant="secondary" onClick={() => setConfirming(false)} disabled={rescheduling}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setConfirming(true)}>
                Replanejar
              </Button>
            )}

            {error && <p className="text-[11px] text-[var(--color-danger)]">{error}</p>}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <SectionLabel>Modo zueira</SectionLabel>
        <label className="flex items-center justify-between gap-3 rounded-[22px] bg-[var(--surface-card)] p-5">
          <span className="text-[13px] text-[var(--color-text)]">Mostrar tudo vazio</span>
          <input
            type="checkbox"
            checked={emptyDemo}
            onChange={toggleEmptyDemo}
            className="h-5 w-5 accent-[var(--color-text)]"
          />
        </label>
      </div>
    </Screen>
  );
}
