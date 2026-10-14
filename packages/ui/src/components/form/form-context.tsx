"use client";

import { createContext, useContext } from "react";
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
  useFormState,
} from "react-hook-form";

/** react-hook-form's `FormProvider`; wrap the form with `<Form {...form}>`. */
export const Form = FormProvider;

type FormFieldContextValue = { name: string };
type FormItemContextValue = { id: string };

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

export const FormItemContext = createContext<FormItemContextValue | null>(null);

/** shadcn's `FormField`; renamed to avoid clashing with the plain `FormField` wrapper. */
export function FormController<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  // Output of the resolver (e.g. a zod schema that transforms raw form strings).
  TTransformedValues = TFieldValues,
>(props: ControllerProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

export function useFormField() {
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext?.name });
  if (!fieldContext || !itemContext) {
    throw new Error("useFormField must be used within <FormController> and <FormItem>");
  }
  const { id } = itemContext;
  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...getFieldState(fieldContext.name, formState),
  };
}
