"use client";

import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { StepDots } from "@/components/ui/StepDots";
import { IconBox } from "@/components/ui/IconBox";
import { X, Target, ListChecks, Zap, Check, Home, Menu, Calendar, Settings } from "@/components/icons";

const SLIDES = [
  {
    title: "Missões primeiro, metas depois",
    body: "Já criamos três missões pra você: Saúde, Leitura e Carreira. Entra numa delas e cria a primeira meta — é ali que a coisa acontece.",
    icons: [Target],
  },
  {
    title: "Número, tarefa ou hábito",
    body: "Número é pra peso, páginas, R$... Tarefa é quando tem prazo e sub-tarefas. Hábito é quando é repetir sem parar de vez em quando.",
    icons: [Target, ListChecks, Zap],
  },
  {
    title: "Registrar progresso é obrigatório",
    body: "Toca em \"Registrar progresso\" sempre que fizer alguma coisa. É isso que mantém a sequência viva e o gráfico honesto — sem registro, sem crédito.",
    icons: [Check],
  },
  {
    title: "Se perder, olha aqui embaixo",
    body: "Início mostra o resumo do dia. Missões lista tudo. Agenda organiza os prazos. Ajustes tem esse tutorial de novo, caso esqueça — sem desculpa.",
    icons: [Home, Menu, Calendar, Settings],
  },
];

export function OnboardingFlow() {
  const onboardingOpen = useAppStore((s) => s.onboardingOpen);
  const onboardingStep = useAppStore((s) => s.onboardingStep);
  const onboardingNext = useAppStore((s) => s.onboardingNext);
  const onboardingBack = useAppStore((s) => s.onboardingBack);
  const finishOnboarding = useAppStore((s) => s.finishOnboarding);

  if (!onboardingOpen) return null;

  const slide = SLIDES[onboardingStep];
  const isLast = onboardingStep === SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 mx-auto flex w-full max-w-[430px] flex-col justify-center p-7 animate-fade-in"
      style={{ background: "var(--screen-grad)" }}
    >
      <button
        onClick={finishOnboarding}
        aria-label="Fechar tutorial"
        className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-btn-secondary)] transition-transform active:scale-90"
      >
        <X size={16} strokeWidth={2.2} color="var(--color-text)" />
      </button>

      <div key={onboardingStep} className="animate-screen-in flex flex-col items-center text-center">
        <div className="mb-6 flex items-center gap-3">
          {slide.icons.map((Icon, i) => (
            <IconBox key={i} size={52}>
              <Icon size={22} strokeWidth={2.2} color="var(--color-text)" />
            </IconBox>
          ))}
        </div>
        <h2 className="text-[23px] font-light leading-tight text-[var(--color-text)]">{slide.title}</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-text)]" style={{ opacity: 0.7 }}>
          {slide.body}
        </p>
      </div>

      <div className="mt-10 flex items-center gap-2">
        {onboardingStep > 0 && (
          <Button variant="ghost" onClick={onboardingBack}>
            Voltar
          </Button>
        )}
        <Button block onClick={isLast ? finishOnboarding : onboardingNext}>
          {isLast ? "Bora, chega de enrolar" : "Próximo"}
        </Button>
      </div>

      <div className="mt-6">
        <StepDots total={SLIDES.length} step={onboardingStep} />
      </div>
    </div>
  );
}
