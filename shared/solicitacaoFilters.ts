export function canFilterByAssignee(role?: string) {
  return role === 'analista' || role === 'adminmaster';
}

export function canFilterByScheduler(role?: string) {
  return role === 'admin' || role === 'adminmaster';
}
