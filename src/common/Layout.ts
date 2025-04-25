export default interface Layout {
  position?: 'top' | 'bottom' | 'left' | 'right' | undefined;
  isCollapsed?: boolean;
  isFullScreen?: boolean;
  isMinimized?: boolean;
}
