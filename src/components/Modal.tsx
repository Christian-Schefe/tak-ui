import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';

export type ModalProps = {
  hideCloseButton?: boolean;
  children?: React.ReactNode;
  className?: string;
  disableAutoClose?: boolean;
} & ModalInheritedProps;

export type ModalInheritedProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function Modal({
  isOpen,
  onClose,
  children,
  hideCloseButton,
  disableAutoClose,
  className,
}: ModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal fixed left-0 right-0 top-0 bottom-0 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 }}
      onClick={disableAutoClose ? undefined : onClose}
    >
      <div
        className={`modal-content bg-surface-500 relative max-w-4xl w-full md:w-1/2 max-h-4/5 ${className ?? ''}`}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {!hideCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 hover:bg-surface-550 rounded-md"
          >
            <FaTimes className="w-full h-full p-2" />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
