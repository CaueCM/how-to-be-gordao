"use client";

import { signIn } from "next-auth/react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";

function BrandLockup() {
  return (
    <div className="flex flex-col items-center gap-[14px] mb-[38px]">
      <div className="grid grid-cols-2 gap-[5px]">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="block h-1 w-1 rounded-full bg-[var(--color-text)]" />
        ))}
      </div>
      <span
        className="text-[15px] font-extrabold uppercase text-[var(--color-text)]"
        style={{ letterSpacing: "0.42em", paddingLeft: "0.42em" }}
      >
        GORDÃO
      </span>
    </div>
  );
}

function StepDots({ step }: { step: 0 | 1 }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <span className="block h-[3px] w-7 rounded-full" style={{ background: step === 0 ? "var(--color-text)" : "var(--color-neutral-300)" }} />
      <span className="block h-[3px] w-7 rounded-full" style={{ background: step === 1 ? "var(--color-text)" : "var(--color-neutral-300)" }} />
    </div>
  );
}

export function LoginScreen() {
  const loginStep = useAppStore((s) => s.loginStep);
  const goLoginStep = useAppStore((s) => s.goLoginStep);

  return (
    <div className="min-h-screen flex flex-col justify-center p-7">
      <BrandLockup />

      {loginStep === 0 ? (
        <>
          <h1 className="text-[29px] font-light leading-tight text-[var(--color-text)]">
            Como ser uma pessoa menos lixo, sem enrolação.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-text)]" style={{ opacity: 0.7 }}>
            Para de ser um bagaço. Cria missões de saúde, leitura e trampo e a gente quebra tudo em
            passo miúdo, direto na sua agenda, pra você não ter desculpa de vagabundo.
          </p>
          <Button block className="mt-8" onClick={() => goLoginStep(1)}>
            Bora nessa
          </Button>
          <StepDots step={0} />
        </>
      ) : (
        <>
          <h2 className="text-[25px] font-light leading-tight text-[var(--color-text)]">
            Conecta o Google Calendar aí
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-text)]" style={{ opacity: 0.7 }}>
            A gente só quer acesso pra lotar sua agenda de lembretes chatos e te cobrar até você
            fazer. Desconecta quando quiser, medroso — é só ir em Ajustes.
          </p>
          <Button block className="mt-8" onClick={() => signIn("google", { callbackUrl: "/" })}>
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[4px] bg-white text-[12px] font-bold text-[var(--color-text)]">
              G
            </span>
            Entrar com Google
          </Button>
          <Button variant="ghost" block className="mt-2" onClick={() => goLoginStep(0)}>
            Voltar
          </Button>
          <StepDots step={1} />
        </>
      )}
    </div>
  );
}
