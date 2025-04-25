interface JsonViewProps {
  json: string;
}

function JsonView({ json }: JsonViewProps) {
  const maxLength = 200; // set your threshold here
  const isLong = json.length > maxLength;
  const displayText = isLong ? json.substring(0, maxLength) + '...' : json;

  const handleClick = () => {
    alert(json);
  };

  return (
    <div onClick={handleClick} style={{ cursor: 'pointer' }}>
      {displayText}
    </div>
  );
}

export default JsonView;
