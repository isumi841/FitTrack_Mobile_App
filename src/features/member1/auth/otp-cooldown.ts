const resendAvailableAt = new Map<string, number>();

// Keep the timestamp across the signup/verification routes and screen refocuses.
// The backend remains responsible for enforcing its resend rate limit.
export function startOtpCooldown(email: string, seconds = 60): number {
  const deadline = Date.now() + Math.max(0, seconds) * 1_000;
  resendAvailableAt.set(email, deadline);
  return deadline;
}

export function getOtpCooldown(email: string): number {
  const deadline = resendAvailableAt.get(email) ?? 0;
  if (deadline <= Date.now()) resendAvailableAt.delete(email);
  return deadline;
}

export function clearOtpCooldown(email: string): void {
  resendAvailableAt.delete(email);
}
