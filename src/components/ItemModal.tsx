import {useCallback, useEffect, useRef, useState} from 'react';
import Modal from 'react-modal';
import JSONEditor from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css';
import {Table} from "dexie";
import DiceIcon from "./icons/DiceIcon.tsx";
import generateGuid from "../utils/helpers.ts";
import omit from 'lodash.omit'

const ItemModal = ({
                     isOpen,
                     isOutboundKeyTable,
                     onClose,
                     table,
                     onSubmit,
                     initialData = null, // null => Add mode, non-null => Edit mode
                   } : {
  isOpen?: boolean;
  isOutboundKeyTable?: boolean;
  onClose: () => void;
  table: Table;
  onSubmit: (data: any, key?: string) => void;
  initialData: any;
}) => {
  const [outboundKey, setOutboundKey] = useState('');
  useEffect(() => {
    Modal.setAppElement('.indexeddb-debug-bar');
  }, []);

  useEffect(() => {
    if (isOpen)
      setOutboundKey('')
  }, [isOpen])

  const jsonEditorRef = useRef(null);

  // Helper to build an empty schema-based object if we're adding a new item
  const getDefaultData = useCallback(() => {
    const defaultData:Record<string, string> = {};
    const primKey = table?.schema?.primKey?.keyPath;
    if (primKey) {
      if (typeof primKey === 'string') {
        defaultData[primKey] = '';
      } else if (Array.isArray(primKey)) {
        primKey.forEach(k => defaultData[k] = '')
      }
    }
    table?.schema?.indexes?.forEach((index) => {
      const keyPath = index.keyPath;
      if (typeof keyPath === 'string') {
        defaultData[keyPath] = '';
      } else if (Array.isArray(keyPath)) {
        keyPath.forEach((k) => {
          defaultData[k] = '';
        });
      }
    });
    return defaultData;
  }, [table]);

  /**
   * This ref callback is called once the <div> for the editor is mounted,
   * and again when it unmounts. We create the JSONEditor on mount and
   * immediately set its contents (no separate useEffect needed).
   */
  const editorContainerRefCallback = useCallback(
    (node) => {
      if (node !== null && isOpen) {
        // Create the JSONEditor
        jsonEditorRef.current = new JSONEditor(node, {
          mode: 'tree',
          modes: ['tree','text'],
        });

        // Immediately set data (add or edit)
        if (initialData) {
          // Edit mode => load the existing row data
          jsonEditorRef.current.set(omit(initialData, ['__outbound_key']));
          setOutboundKey(initialData?.__outbound_key);
        } else {
          // Add mode => load an empty object with defaults
          jsonEditorRef.current.set(getDefaultData());
        }
      } else {
        // Cleanup if node is null (unmounting)
        if (jsonEditorRef.current) {
          jsonEditorRef.current.destroy();
          jsonEditorRef.current = null;
        }
      }
    },
    [isOpen, initialData, getDefaultData]
  );

  // Handle the user pressing "Submit" in the modal
  const handleSubmit = useCallback(() => {
    try {
      const data = jsonEditorRef.current?.get();
      onSubmit(data, outboundKey);
    } catch (err) {
      console.error('Invalid JSON data:', err);
      alert('Invalid JSON data. Please correct it and try again.');
    }
  }, [onClose, onSubmit, outboundKey]);

  // Decide which title to show, based on add vs. edit
  const modalTitle = initialData
    ? `Edit Item in ${table?.name}`
    : `Add New Item to ${table?.name}`;

  return (
    <Modal
      parentSelector={() => document.querySelector('.indexeddb-debug-bar')}
      appElement={document.querySelector('.indexeddb-debug-bar')}
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Item Modal"
      className="bg-white p-4 max-w-xl mx-auto rounded shadow-lg outline-none"
      overlayClassName="fixed z-[100] inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <h2 className="text-xl font-bold mb-4">{modalTitle}</h2>
      {isOutboundKeyTable &&
        <div className={'flex mb-4 gap-1'}>
          <input className={'border-gray-200 border-2 rounded-lg p-2 flex-1'} value={outboundKey}
                 onChange={e => setOutboundKey(e.target.value)} type={'text'} placeholder={'Object Key'}/>
          <button onClick={() => setOutboundKey(generateGuid())} className={'bg-blue-500 text-white rounded-lg px-3 flex items-center justify-center gap-1'}>
            <DiceIcon />
            Generate</button>
        </div>
      }
      {/* The ref callback that creates/destroys the JSONEditor */}
      <div ref={editorContainerRefCallback} className="h-[450px] max-h-[70dvh] w-[500px] overflow-auto border" />

      <div className="flex justify-end mt-4">
        <button
          onClick={onClose}
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

export default ItemModal;
