import JSONEditor from "jsoneditor";
import 'jsoneditor/dist/jsoneditor.min.css'
import { useEffect, useRef } from "react";

export default function JSONInput({ onChange, value, initialJson }: {onChange: (newVal: string) => void; value: any; initialJson: any}) {
  const elRef = useRef<any>();

  useEffect(() => {
    if (elRef.current) {
      const container: any = elRef.current;
      const options: any = {
        modes: ['tree', 'code', 'text', 'preview'],
        onChangeText(text: string) {
          if (onChange) {
            onChange(text);
          }
        },
      };
      const editor = new JSONEditor(container, options);
      if (value) {
        editor.setText(value);
      } else {
        if (initialJson) {
          editor.set(initialJson);
        }
      }
    }
  }, [elRef.current]);

  return (
    <div>
      <div ref={elRef}></div>
    </div>
  );
}
