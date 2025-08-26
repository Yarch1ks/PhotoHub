declare module '@radix-ui/react-slot' {
  export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
    asChild?: boolean;
  }

  export const Slot: React.FC<SlotProps>;
  export function Slot(props: SlotProps): React.ReactElement;
}