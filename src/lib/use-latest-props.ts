import { useState, type Dispatch, type SetStateAction } from "react";

export function useLatestProps<T>(value: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(value);
  const [prev, setPrev] = useState(value);
  if (value !== prev) {
    setPrev(value);
    setState(value);
  }
  return [state, setState];
}
