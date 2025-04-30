import React, { useEffect, useState, useRef } from 'react';
import Modal from 'react-modal';
import { motion } from 'framer-motion';
import { ClipboardIcon, ArrowUturnLeftIcon, CheckIcon } from '@heroicons/react/24/outline';

interface ChangeRecord {
  data: any;
  changedAt: Date | null;
}

interface RowChangeHistoryModalProps {
  isOpen?: boolean;
  onClose: () => void;
  changeHistory: [rowKey: string, ChangeRecord[]];
  onRollback?: (data: any) => Promise<void>;
}

const RowChangeHistoryModal: React.FC<RowChangeHistoryModalProps> = ({
                                                                       onRollback,
                                                                       isOpen,
                                                                       onClose,
                                                                       changeHistory,
                                                                     }) => {
  useEffect(() => {
    Modal.setAppElement('.indexeddb-debug-bar');
  }, []);

  // State to track which row's copy button should show a check mark.
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  // State to track whether the first item should be highlighted.
  const [highlightFirst, setHighlightFirst] = useState(false);

  // Ref for the scrollable container
  const containerRef = useRef<HTMLDivElement>(null);

  const modalTitle = 'Change History';

  // Show check icon for 2 seconds when copying data.
  const handleCopy = (data: any, index: number) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      .then(() => {
        setCopiedIndex(index);
        setTimeout(() => {
          setCopiedIndex(null);
        }, 2000);
      })
      .catch((error) => {
        console.error('Copy failed:', error);
      });
  };

  const handleRollback = async (change: any) => {
    await onRollback?.(change.data);
    // Scroll the container to the top after rollback.
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    // Activate highlight for the first item for 2 seconds.
    setHighlightFirst(true);
    setTimeout(() => {
      setHighlightFirst(false);
    }, 2000);
  };

  return (
    <Modal
      parentSelector={() => document.querySelector('.indexeddb-debug-bar')}
      appElement={document.querySelector('.indexeddb-debug-bar')}
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Change History Modal"
      className="bg-white p-6 max-w-3xl mx-auto rounded-lg shadow-xl outline-none"
      overlayClassName="fixed z-[10001] inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      {/* Modal header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{modalTitle}</h2>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Timeline list */}
      <div ref={containerRef} className="max-h-[70dvh] w-[500px] max-w-[80dvw] overflow-y-auto">
        <div className="relative border-l border-gray-300">
          <div className="absolute -left-2.5 top-0 bg-blue-500 rounded-full h-5 w-5 border border-white"></div>
          {changeHistory && changeHistory[1]?.slice()?.reverse()?.map((change, index) => (
            <motion.div
              key={index}
              initial={{ backgroundColor: "rgba(255,76,88,0)" }}
              animate={{ backgroundColor: (index === 0 && highlightFirst) ? "rgba(255,76,88,0.30)" : "rgba(255,76,88,0)" }}
              transition={{ duration: 0.3 }}
              className="relative mb-5 ml-4 rounded-md"
            >
              {/* Action buttons */}
              <div className="absolute top-7 right-1 flex space-x-0.5">
                <button
                  title={'Copy'}
                  onClick={() => handleCopy(change.data, index)}
                  className="p-1 text-gray-600 hover:text-gray-800"
                >
                  {copiedIndex === index ? (
                    <CheckIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ClipboardIcon className="h-5 w-5" />
                  )}
                </button>
                <button title={'Rollback'} onClick={() => handleRollback(change)} className="p-1 text-gray-600 hover:text-gray-800">
                  <ArrowUturnLeftIcon className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm text-gray-500 px-1 pt-1">
                {change.changedAt ? new Date(change.changedAt).toLocaleString() : 'Unknown date'}
              </p>
              <pre className="mt-1 p-3 bg-gray-100 rounded text-sm overflow-x-auto">
                {JSON.stringify(change.data, null, 2)}
              </pre>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer with close button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="bg-gray-500 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default RowChangeHistoryModal;
