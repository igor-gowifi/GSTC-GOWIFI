import { useEffect, useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';

type AssignmentAvailability = 'checking' | 'unavailable' | 'available';
type AssignmentRole = 'os' | 'agendamento';
const schedulingAssigneeLabel = 'Responsável pelo agendamento';

export function useAssignmentAvailability(
  enabled: boolean,
  role: AssignmentRole = 'os',
): AssignmentAvailability {
  const utils = trpc.useUtils();
  const previousAvailability = useRef<boolean | undefined>(undefined);
  const availabilityProcedure = role === 'agendamento'
    ? 'schedulingAssignmentAvailable'
    : 'assignmentAvailable';
  const { data, isPending } = trpc.solicitacoes[availabilityProcedure].useQuery(undefined, {
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: query => query.state.data === true ? false : 30_000,
  });

  useEffect(() => {
    if (previousAvailability.current === false && data === true) {
      void utils.solicitacoes.invalidate();
    }
    previousAvailability.current = data;
  }, [data, utils]);

  if (data === true) return 'available';
  return isPending ? 'checking' : 'unavailable';
}

type AssigneeSelectProps = {
  availability: AssignmentAvailability;
  role?: AssignmentRole;
  value: string | null;
  onChange: (value: string | null) => void;
  selectedName?: string | null;
  disabled?: boolean;
  pending?: boolean;
};

export function SolicitacaoAssigneeSelect({
  availability,
  role = 'os',
  value,
  onChange,
  selectedName,
  disabled,
  pending,
}: AssigneeSelectProps) {
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const canAssign = availability === 'available';
  const isScheduling = role === 'agendamento';
  const assigneesProcedure = isScheduling ? 'schedulingAssignees' : 'assignees';
  const { data: assignees = [], isFetching, isError } = trpc.solicitacoes[assigneesProcedure].useQuery(
    undefined,
    { enabled: open && canAssign, staleTime: 60_000 },
  );
  const displayName = selectedName || assignees.find(user => user.id === value)?.name;
  const placeholder = canAssign
    ? 'Sem atribuição'
    : availability === 'checking' ? 'Verificando disponibilidade…' : 'Atribuição indisponível';

  return (
    <div className="min-w-0">
      <label htmlFor={inputId} className="text-muted-foreground">
        {isScheduling ? schedulingAssigneeLabel : 'Responsável pela OS'}
      </label>
      <Select
        value={value ?? ''}
        onValueChange={next => onChange(next === 'unassigned' ? null : next)}
        open={open && canAssign}
        onOpenChange={setOpen}
        disabled={disabled || pending || !canAssign}
      >
        <SelectTrigger id={inputId} size="sm" className="mt-1 w-full min-w-0" aria-busy={pending}>
          <SelectValue className="min-w-0 truncate" placeholder={pending ? 'Salvando…' : placeholder}>
            {pending ? 'Salvando…' : displayName || (value === 'me' ? 'Atribuir a mim' : 'Usuário indisponível')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {!isScheduling && <SelectItem value="me">Atribuir a mim</SelectItem>}
          {open && assignees.map(user => (
            <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
          ))}
          {isFetching && (
            <SelectItem value="loading" disabled>Carregando usuários…</SelectItem>
          )}
          {isError && (
            <SelectItem value="error" disabled>Não foi possível carregar os usuários</SelectItem>
          )}
          {!isScheduling && <SelectItem value="unassigned">Sem atribuição</SelectItem>}
        </SelectContent>
      </Select>
    </div>
  );
}

type ResponsavelSolicitacaoProps = {
  id: string;
  availability: AssignmentAvailability;
  role?: AssignmentRole;
  assigneeId: string | null;
  assigneeName: string | null;
  disabled?: boolean;
};

export function ResponsavelSolicitacao({
  id,
  availability,
  role = 'os',
  assigneeId,
  assigneeName,
  disabled,
}: ResponsavelSolicitacaoProps) {
  const utils = trpc.useUtils();
  const refreshSolicitacao = () => Promise.all([
    utils.solicitacoes.filter.invalidate(),
    utils.solicitacoes.list.invalidate(),
    utils.solicitacoes.getById.invalidate({ id }),
  ]);
  const mutation = trpc.solicitacoes.assign.useMutation({
    onSuccess: async (_, input) => {
      await refreshSolicitacao();
      toast.success(input.assigneeId ? 'Responsável atualizado' : 'Atribuição removida');
    },
    onError: error => toast.error(error.message),
  });
  const schedulingMutation = trpc.solicitacoes.assignScheduler.useMutation({
    onSuccess: async (_, input) => {
      await refreshSolicitacao();
      toast.success(input.schedulerId ? 'Responsável pelo agendamento atualizado' : 'Atribuição removida');
    },
    onError: error => toast.error(error.message),
  });

  return (
    <SolicitacaoAssigneeSelect
      availability={availability}
      role={role}
      value={assigneeId}
      selectedName={assigneeName}
      onChange={value => {
        if (value === assigneeId) return;
        if (role === 'agendamento') {
          schedulingMutation.mutate({ id, schedulerId: value });
        } else {
          mutation.mutate({ id, assigneeId: value });
        }
      }}
      pending={role === 'agendamento' ? schedulingMutation.isPending : mutation.isPending}
      disabled={disabled}
    />
  );
}

export function ResponsavelAgendamento({
  editable,
  ...props
}: Omit<ResponsavelSolicitacaoProps, 'role'> & { editable: boolean }) {
  if (editable) {
    return <ResponsavelSolicitacao {...props} role="agendamento" />;
  }

  return (
    <div className="min-w-0">
      <p className="text-muted-foreground">{schedulingAssigneeLabel}</p>
      <p className="font-medium break-words">
        {props.assigneeName || 'Sem atribuição'}
      </p>
    </div>
  );
}
