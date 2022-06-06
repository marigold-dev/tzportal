import { useState } from 'react';
import './App.css';
import ConnectButton from './components/ConnectWallet';
import DisconnectButton from './components/DisconnectWallet';
import { MichelCodecPacker, TezosToolkit } from '@taquito/taquito';

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
import { ArchiveOutlined, SettingsBackupRestoreOutlined } from '@mui/icons-material';
import { Button } from '@mui/material';
import Deposit from './components/Deposit';
import { NetworkType} from "@airgap/beacon-types";
import Withdraw from './components/Withdraw';


export enum PAGES {
  "WELCOME",
  "DEPOSIT",
  "WITHDRAW"
};

function App() {

  const [Tezos, setTezos] = useState<TezosToolkit>(new TezosToolkit(process.env["REACT_APP_TEZOS_NODE"]!));
  Tezos.setPackerProvider(new MichelCodecPacker());
  const [wallet, setWallet] = useState<any>(null);
  const [userAddress, setUserAddress] = useState<string>("");
  const [userBalance, setUserBalance] = useState<number>(0);
  const [userCtezBalance, setUserCtezBalance] = useState<number>(0);
  const [activePage, setActivePage] = useState<PAGES>(PAGES.WELCOME);

  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  let network = process.env["REACT_APP_NETWORK"]? NetworkType[process.env["REACT_APP_NETWORK"].toUpperCase() as keyof typeof NetworkType] : NetworkType.JAKARTANET;

  return (
    <div style={{backgroundImage : "url('/bg.jpg')" , minHeight: "100vh" ,backgroundSize: "cover"}} >
      {(network != NetworkType.MAINNET)?<div className="banner">WARNING: TEST ONLY {network}</div>:<span />}

      <Box bgcolor="#00000080"  
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          padding : "0.4em"
        }}
      >
        <Typography color="secondary.main" variant="h4">TzPortal</Typography>

        {userAddress !== "" ? 

          <div>
          
          <Tooltip enterTouchDelay={0} title="DEPOSIT">
          <Button onClick={()=>setActivePage(PAGES.DEPOSIT)}>
          <ArchiveOutlined  color={activePage === PAGES.DEPOSIT ? "primary" : "secondary"}  sx={{ width: 32, height: 32 }}/>
          </Button>
          </Tooltip>

          <Tooltip enterTouchDelay={0} title="WITHDRAW">
          <Button onClick={()=>setActivePage(PAGES.WITHDRAW)}>
          <SettingsBackupRestoreOutlined  color={activePage === PAGES.WITHDRAW ? "primary" : "secondary"}  sx={{ width: 32, height: 32 }}/>
          </Button>
          </Tooltip>

          <Tooltip title="Account settings">
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{ ml: 2 }}
            aria-controls={open ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <MenuIcon color="secondary" sx={{ width: 32, height: 32 }} />
          </IconButton>
        </Tooltip></div> : <ConnectButton
          Tezos={Tezos}
          setWallet={setWallet}
          setUserAddress={setUserAddress}
          setUserBalance={setUserBalance}
          setUserCtezBalance={setUserCtezBalance}
          setActivePage={setActivePage}
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
          <Avatar /> {<div className="address"><span className="address1">{userAddress.substring(0,userAddress.length/2)}</span><span className="address2">{userAddress.substring(userAddress.length/2)}</span></div> }
        </MenuItem>
        <Divider />

        <MenuItem>
          <AccountBalanceWalletIcon /> &nbsp; {userBalance} mutez
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
            setUserCtezBalance={setUserCtezBalance}
            setWallet={setWallet}
            setActivePage={setActivePage}
          />
        </MenuItem>
      </Menu>

      {activePage === PAGES.DEPOSIT?
      <Deposit
      Tezos={Tezos}
      wallet={wallet}
      userAddress={userAddress}
      />
      :
      activePage === PAGES.WITHDRAW ? 
      <Withdraw 
      Tezos={Tezos}
      wallet={wallet}
      userAddress={userAddress}
      />
      :
      activePage === PAGES.WELCOME ? 
      <Box color="primary.main" alignContent={"space-between"} textAlign={"center"} sx={{ margin: "1em", padding : "1em",  backgroundColor : "#FFFFFFAA"}} >
      <h1>Tezos Layer 1&2 bridge</h1>
      <p>Transfer tokens via deposit and withdrawal operations</p>
      <p>Designed for :</p>
      <ul style={{listStylePosition: "inside"}}>
        <li>TORU rollups : <a href="https://tezos.gitlab.io/alpha/transaction_rollups.html">TORU documentation</a></li>
        <li>DEKU rollups : <a href="https://www.marigold.dev/project/deku-sidechain">DEKU documentation</a></li>
      </ul>
      </Box>
      : "PAGE NOT FOUND" 
    }



    </div>



  );
}

export default App;