const DockIcon = ({ variant = 'top', width = 20, ...props }) => {
  switch (variant) {
    case 'bottom':
      return (
        <svg
          width={width}
          height={width}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          {...props}
        >
          <g id="Complete">
            <g id="sidebar-bottom">
              <rect
                data-name="Square"
                fill="none"
                height="18"
                rx="2"
                ry="2"
                stroke="currentColor"
                strokeMiterlimit="10"
                strokeWidth="2"
                width="18"
                x="3"
                y="3"
              />
              <line
                fill="none"
                stroke="currentColor"
                strokeMiterlimit="10"
                strokeWidth="2"
                x1="21"
                x2="3"
                y1="15"
                y2="15"
              />
            </g>
          </g>
        </svg>
      );
    case 'left':
      return (
        <svg
          width={width}
          height={width}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          {...props}
        >
          <g id="Complete">
            <g id="sidebar-left">
              <rect
                data-name="Square"
                fill="none"
                height="18"
                rx="2"
                ry="2"
                stroke="currentColor"
                strokeMiterlimit="10"
                strokeWidth="2"
                width="18"
                x="3"
                y="3"
              />
              <line
                fill="none"
                stroke="currentColor"
                strokeMiterlimit="10"
                strokeWidth="2"
                x1="9"
                x2="9"
                y1="21"
                y2="3"
              />
            </g>
          </g>
        </svg>
      );
    case 'right':
      return (
        <svg
          width={width}
          height={width}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          {...props}
        >
          <g id="Complete">
            <g id="sidebar-right">
              <rect
                data-name="Square"
                fill="none"
                height="18"
                rx="2"
                ry="2"
                stroke="currentColor"
                strokeMiterlimit="10"
                strokeWidth="2"
                width="18"
                x="3"
                y="3"
              />
              <line
                fill="none"
                stroke="currentColor"
                strokeMiterlimit="10"
                strokeWidth="2"
                x1="15"
                x2="15"
                y1="21"
                y2="3"
              />
            </g>
          </g>
        </svg>
      );
    case 'top':
    default:
      return (
        <svg
          width={width}
          height={width}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          {...props}
        >
          <g id="Complete">
            <g id="sidebar-top">
              <rect
                data-name="Square"
                fill="none"
                height="18"
                rx="2"
                ry="2"
                stroke="currentColor"
                strokeMiterlimit="10"
                strokeWidth="2"
                width="18"
                x="3"
                y="3"
              />
              <line
                fill="none"
                stroke="currentColor"
                strokeMiterlimit="10"
                strokeWidth="2"
                x1="21"
                x2="3"
                y1="9"
                y2="9"
              />
            </g>
          </g>
        </svg>
      );
  }
};

export default DockIcon;
