import {
  Activity,
  BookOpen,
  Briefcase,
  Target,
  ListChecks,
  Zap,
  Home,
  Menu,
  Calendar,
  Settings,
  ChevronLeft,
  Check,
  Pencil,
  Trash,
  AlertTriangle,
  Search,
  Plus,
  X,
  type LucideProps,
} from "lucide-react";
import type { PlanIcon, GoalType } from "@/lib/types";

export {
  Activity,
  BookOpen,
  Briefcase,
  Target,
  ListChecks,
  Zap,
  Home,
  Menu,
  Calendar,
  Settings,
  ChevronLeft,
  Check,
  Pencil,
  Trash,
  AlertTriangle,
  Search,
  Plus,
  X,
};

const PLAN_ICON_MAP: Record<PlanIcon, typeof Activity> = {
  pulse: Activity,
  book: BookOpen,
  briefcase: Briefcase,
};

export function PlanIconGlyph({ icon, ...rest }: { icon: PlanIcon } & LucideProps) {
  const Cmp = PLAN_ICON_MAP[icon];
  return <Cmp {...rest} />;
}

const GOAL_ICON_MAP: Record<GoalType, typeof Target> = {
  numeric: Target,
  task: ListChecks,
  habit: Zap,
};

export function GoalIconGlyph({ type, ...rest }: { type: GoalType } & LucideProps) {
  const Cmp = GOAL_ICON_MAP[type];
  return <Cmp {...rest} />;
}
