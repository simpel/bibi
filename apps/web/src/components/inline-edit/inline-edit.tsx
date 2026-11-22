"use client";

import { createContext, useContext } from "react";

type InlineEdit = { close: () => void };

/** The open editor's way back to the view, given by `EditableFact` and `EditableSection`. */
export const InlineEditContext = createContext<InlineEdit>({ close: () => {} });

/** Closes the editor this form sits in (after a save or on Cancel). */
export const useInlineEdit = (): InlineEdit => useContext(InlineEditContext);
