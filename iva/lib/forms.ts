export type ActionState = {
  status?: "success" | "error";
  message?: string;
};

export const initialActionState: ActionState = {};
