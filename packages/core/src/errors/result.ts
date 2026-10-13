import type { AppError } from "./app-error";

export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E = AppError> = { readonly ok: false; readonly error: E };
export type Result<T, E = AppError> = Ok<T> | Err<E>;

export type OkInput<T> = { value: T };
export type ErrInput<E> = { error: E };

export function ok<T>({ value }: OkInput<T>): Ok<T> {
  return { ok: true, value };
}

export function err<E = AppError>({ error }: ErrInput<E>): Err<E> {
  return { ok: false, error };
}
