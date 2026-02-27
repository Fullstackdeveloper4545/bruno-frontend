import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ConfirmDeleteButtonProps = {
  onConfirm: () => void | Promise<void>;
  entityName?: string;
  title?: string;
  description?: string;
  triggerLabel?: string;
  confirmLabel?: string;
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
};

export const ConfirmDeleteButton = ({
  onConfirm,
  entityName = "this item",
  title,
  description,
  triggerLabel = "Delete",
  confirmLabel = "Delete",
  size = "sm",
  disabled = false,
}: ConfirmDeleteButtonProps) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="destructive" size={size} disabled={disabled}>
        {triggerLabel}
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title || `Delete ${entityName}?`}</AlertDialogTitle>
        <AlertDialogDescription>
          {description || `This action cannot be undone. ${entityName} will be permanently deleted.`}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={() => void onConfirm()}
        >
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
