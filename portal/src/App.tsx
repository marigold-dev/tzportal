import { useState } from 'react';
import './App.css';
import ConnectButton from './ConnectWallet';
import DisconnectButton from './DisconnectWallet';
import { TezosToolkit } from '@taquito/taquito';

import * as React from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import MenuIcon from '@mui/icons-material/Menu';

function App() {

  const [Tezos, setTezos] = useState<TezosToolkit>(new TezosToolkit("https://hangzhounet.tezos.marigold.dev"));
  const [wallet, setWallet] = useState<any>(null);
  const [userAddress, setUserAddress] = useState<string>("");
  const [userBalance, setUserBalance] = useState<number>(0);

  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };


  return (
    <React.Fragment>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          backgroundColor: 'gray',
        }}
      >
        <Typography sx={{ minWidth: 100 }}>TzPortal</Typography>

        {userAddress != "" ? <Tooltip title="Account settings">
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{ ml: 2 }}
            aria-controls={open ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <MenuIcon sx={{ width: 32, height: 32 }} />
          </IconButton>
        </Tooltip> : <ConnectButton
          Tezos={Tezos}
          setWallet={setWallet}
          setUserAddress={setUserAddress}
          setUserBalance={setUserBalance}
          wallet={wallet}
        />}

      </Box>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem>
          <Avatar /> {userAddress}
        </MenuItem>
        <Divider />

        <MenuItem>
          <AccountBalanceWalletIcon />  {userBalance}
        </MenuItem>
        <Divider />


        <MenuItem>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <DisconnectButton
            wallet={wallet}
            setUserAddress={setUserAddress}
            setUserBalance={setUserBalance}
            setWallet={setWallet}
          />
        </MenuItem>
      </Menu>


      <Box>

        BODY IS HERE


      </Box>




    </React.Fragment>



  );
}

export default App;