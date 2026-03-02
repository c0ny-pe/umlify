import { styled } from "@mui/system";

interface ContextMenuProps {
  top: number;
  left: number;
}

const ContextMenu = styled('div')<ContextMenuProps>(({ top, left }) => ({
  zIndex: 99999,
  position: 'absolute',
  width: '200px',
  backgroundColor: '#383838',
  borderRadius: '2px',
  boxSizing: 'border-box',
  top: `${top}px`,
  left: `${left}px`,
  '& ul': {
    boxSizing: 'border-box',
    padding: '10px',
    margin: 0,
    listStyle: 'none',
  },
  '& ul li': {
    fontSize: '13px',
    color: 'white',
    padding: '12px 8px'
  },
  '& ul li:hover': {
    cursor: 'pointer',
    backgroundColor: '#000000'
  }
}));

export default ContextMenu;