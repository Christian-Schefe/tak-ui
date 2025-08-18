import { useSettings } from '../settings';
import { Modal, type ModalInheritedProps } from './Modal';

export function SettingsDialog({ isOpen, onClose }: ModalInheritedProps) {
  const { boardType, setBoardType } = useSettings();

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="p-4 rounded-lg flex flex-col gap-2"
    >
      <h1 className="font-bold text-lg text-center">Settings</h1>
      <div className="flex items-center">
        <p className="px-4">Board Type:</p>
        <button
          onClick={() => setBoardType('2d')}
          className={`py-2 px-4 m-1 bg-surface-500 hover:bg-surface-550 outline-primary-500 rounded-md ${boardType === '2d' ? 'outline-2' : ''}`}
        >
          2D
        </button>
        <button
          onClick={() => setBoardType('3d')}
          className={`py-2 px-4 m-1 bg-surface-500 hover:bg-surface-550 outline-primary-500 rounded-md ${boardType === '3d' ? 'outline-2' : ''}`}
        >
          3D
        </button>
      </div>
    </Modal>
  );
}
