import { CloudIcon } from '@heroicons/react/24/solid'

function CloudBadge() {
  return (
    <span
      className={`inline-flex gap-1 text-xs font-semibold text-white px-2 py-0.5 rounded-md bg-gray-600`}
    >
      <CloudIcon className={'inline-block'} width={20} height={20} />
      Cloud
    </span>
  );
}

export default CloudBadge;
