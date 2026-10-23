import { ActionButton } from './ActionButton';

export function SettingsActions({
  dirty,
  onApply,
  onClose,
}: {
  dirty: boolean;
  onApply: () => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-actions settings-actions">
      <ActionButton
        onClick={() => {
          onApply();
          onClose();
        }}
      >
        OK
      </ActionButton>
      <ActionButton onClick={onClose}>Cancel</ActionButton>
      <ActionButton disabled={!dirty} onClick={onApply}>
        Apply
      </ActionButton>
    </div>
  );
}
