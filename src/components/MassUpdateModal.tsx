import React, { useCallback, useRef } from 'react';
import Modal from 'react-modal';
import JSONEditor from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css';

const MassUpdateModal = ({
                           isOpen,
                           onRequestClose,
                           tableName,
                           onSubmit
                         }) => {
  const jsonEditorRef = useRef<JSONEditor | null>(null);

  // Create/Destroy the JSON editor
  const editorContainerRefCallback = useCallback(
    (node) => {
      if (node && isOpen) {
        // Create a JSONEditor instance
        jsonEditorRef.current = new JSONEditor(node, {
          mode: 'tree',
          modes: ['code', 'tree']
        });
        // Set an empty object or minimal defaults
        jsonEditorRef.current.set({});
      } else {
        // Cleanup
        if (jsonEditorRef.current) {
          jsonEditorRef.current.destroy();
          jsonEditorRef.current = null;
        }
      }
    },
    [isOpen]
  );

  const handleSubmit = useCallback(() => {
    if (!jsonEditorRef.current) return;
    try {
      const data = jsonEditorRef.current.get();
      onSubmit(data);
      onRequestClose();
    } catch (err) {
      console.error('Invalid JSON data:', err);
      alert('Invalid JSON data. Please correct it and try again.');
    }
  }, [onSubmit, onRequestClose]);

  return (
    <Modal
      parentSelector={() => document.querySelector('.indexeddb-debug-bar')}
      appElement={document.querySelector('.indexeddb-debug-bar')}
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Mass Update Modal"
      className="bg-white p-4 max-w-xl mx-auto mt-20 rounded shadow-lg outline-none"
      overlayClassName="fixed inset-0 z-[1000] bg-black bg-opacity-50 flex items-center justify-center"
    >
      <h2 className="text-xl font-bold mb-4">
        Mass Update for Table <em>{tableName}</em>
      </h2>
      <p className="text-sm text-gray-600 mb-2">
        Enter the fields you want to update (JSON).
      </p>
      <div
        ref={editorContainerRefCallback}
        className="h-64 w-[500px] overflow-auto border border-gray-300"
      />
      <div className="flex justify-end mt-4">
        <button
          onClick={onRequestClose}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Submit
        </button>
      </div>
    </Modal>
  );
};

export default MassUpdateModal;
