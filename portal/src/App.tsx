import { useState } from 'react';
import './App.css';
import ConnectButton from './components/ConnectWallet';
import DisconnectButton from './components/DisconnectWallet';
import { MichelCodecPacker, TezosToolkit, Wallet } from '@taquito/taquito';

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
import { ArchiveOutlined, ArrowDropDown, CameraRoll, SettingsBackupRestoreOutlined } from '@mui/icons-material';
import { Button, CardHeader, Paper, Popover } from '@mui/material';
import Deposit from './components/Deposit';
import { AccountInfo, NetworkType} from "@airgap/beacon-types";
import Withdraw from './components/Withdraw';
import { Tzip12Module } from "@taquito/tzip12";
import { RollupCHUSAI, RollupDEKU, RollupTORU, ROLLUP_TYPE } from './components/TezosUtils';
import styled from '@emotion/styled';
import ConnectButtonL2 from './components/ConnectWalletL2';
import { BeaconWallet } from '@taquito/beacon-wallet';


export enum PAGES {
  "WELCOME",
  "DEPOSIT",
  "WITHDRAW"
};

function App() {
  
  const [Tezos, setTezos] = useState<TezosToolkit>(new TezosToolkit(process.env["REACT_APP_TEZOS_NODE"]!));
  Tezos.setPackerProvider(new MichelCodecPacker());
  Tezos.addExtension(new Tzip12Module());
  
  const [wallet, setWallet] = useState<BeaconWallet|undefined>();
  
  const [activeAccount, setActiveAccount] = useState<AccountInfo>();
  
  
  
  const [userAddress, setUserAddress] = useState<string>("");
  const [userL2Address, setUserL2Address] = useState<string>("");
  const [userBalance, setUserBalance] = useState<number>(0);
  const [userL2Balance, setUserL2Balance] = useState<number>(0);
  
  
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
  
  
  const createWallet = async () => {
    // creates a wallet instance if not exists
    
    let wallet = new BeaconWallet({
      name: "TzPortal",
      preferredNetwork: process.env["REACT_APP_NETWORK"]? NetworkType[process.env["REACT_APP_NETWORK"].toUpperCase() as keyof typeof NetworkType]  : NetworkType.JAKARTANET,
    });
    
    Tezos.setWalletProvider(wallet);
    setWallet(wallet);

    const accounts :AccountInfo[] = await wallet.client.getAccounts();
    if(accounts.length>2) wallet.client.removeAllAccounts();

    // checks if wallet was connected before
    const activeAccount = await wallet.client.getActiveAccount();
    if (activeAccount && (activeAccount.network.rpcUrl === process.env["REACT_APP_TEZOS_NODE"]!)) {
     
      console.log("activeAccount is a L1");
      setActiveAccount(activeAccount);
      console.log(activeAccount);
      setUserAddress(activeAccount.address);
      const balance = await Tezos.tz.getBalance(activeAccount.address);
      setUserBalance(balance.toNumber());

      console.log("searching for the Layer 2");
      const l2Account = accounts.find((a)=>{return a.network.rpcUrl ===  process.env["REACT_APP_DEKU_NODE"]!} );
      if(l2Account){
        console.log("Found Layer 2 account");
        setUserL2Address(l2Account.address);
      }

    } if (activeAccount && (activeAccount.network.rpcUrl === process.env["REACT_APP_DEKU_NODE"]!)){
      console.log("we have a L2 here");
      setActiveAccount(activeAccount);
      console.log(activeAccount);
      setUserL2Address(activeAccount.address);

      console.log("searching for the Layer 1");
      const l1Account = accounts.find((a)=>{return a.network.rpcUrl ===  process.env["REACT_APP_TEZOS_NODE"]!} );
      if(l1Account){
        console.log("Found Layer 1 account");
        setUserAddress(l1Account.address);
      }
    }else {
      wallet.client.removeAllAccounts();
    }
  }

  const disconnectWallet = async (): Promise<void> => {
    setUserAddress("");
    setUserBalance(0);
    setUserL2Address("");
    setUserL2Balance(0);
    await wallet!.disconnect();
    console.log("wallet disconnected");
    await createWallet();
};
  
  const [rollupType , setRollupType] = useState<ROLLUP_TYPE>(ROLLUP_TYPE.DEKU);
  const [rollup , setRollup] = useState<RollupTORU | RollupDEKU | RollupCHUSAI>();
  
  
  //POPUP
  const [selectRollupPopupAnchorEl, setSelectRollupPopupAnchorEl] = React.useState<null | HTMLElement>(null);
  const showSelectRollupPopup = (event : React.MouseEvent<HTMLButtonElement>) => {
    setSelectRollupPopupAnchorEl(event.currentTarget);
  };
  const closeSelectRollupPopup = () => {
    setSelectRollupPopupAnchorEl(null);
  };
  const selectRollupPopupOpen = Boolean(selectRollupPopupAnchorEl);
  
  //just needed for the selectRollupPopup selection
  const HoverBox = styled(Box)`&:hover {background-color: #a9a9a9;}`;
  
  
  
  //effects



  React.useEffect(() => { (async () => {
    await createWallet();
  })();
}, []);


return (
  <div style={{backgroundImage : "url('/bg.jpg')" , minHeight: "100vh" ,backgroundSize: "cover"}} >
  
  
  <Popover
  id="selectRollupPopup"
  open={selectRollupPopupOpen}
  anchorEl={selectRollupPopupAnchorEl}
  onClose={closeSelectRollupPopup}
  anchorOrigin={{
    vertical: 'top',
    horizontal: 'left',
  }}
  >
  <Paper title="Choose rollup or sidechain" sx={{padding : 1}} elevation={3}>
  <HoverBox onClick={()=>{setRollupType(ROLLUP_TYPE.DEKU);closeSelectRollupPopup();}}>{ROLLUP_TYPE.DEKU.name} : {ROLLUP_TYPE.DEKU.address}</HoverBox>
  <hr />
  <HoverBox onClick={()=>{setRollupType(ROLLUP_TYPE.TORU);closeSelectRollupPopup();}}>{ROLLUP_TYPE.TORU.name} : {ROLLUP_TYPE.TORU.address}</HoverBox>
  <hr />
  <HoverBox onClick={()=>{setRollupType(ROLLUP_TYPE.CHUSAI);closeSelectRollupPopup();}}>{ROLLUP_TYPE.CHUSAI.name} : {ROLLUP_TYPE.CHUSAI.address}</HoverBox>
  </Paper>
  </Popover>
  
  
  {(network != NetworkType.MAINNET)?<div className="banner">WARNING: TEST ONLY {network}</div>:<span />}
  
  <Box bgcolor="#00000080"  
  sx={{
    display: 'flex',
    justifyContent: 'space-between',
    padding : "0.4em"
  }}
  >
  <Typography color="secondary.main" variant="h4">TzPortal</Typography>
  
  <CardHeader 
  sx={{color:"secondary.main",backgroundColor:"primary.main"}}
  avatar={<Avatar aria-label="recipe"><CameraRoll /></Avatar>}
  action={
    <IconButton aria-label="settings" onClick={(e)=>showSelectRollupPopup(e)}>
    <ArrowDropDown />
    </IconButton>
  }
  title={rollupType.name}
  subheader={<div className="address"><span className="address1">{rollupType.address.substring(0,rollupType.address.length/2)}</span><span className="address2">{rollupType.address.substring(rollupType.address.length/2)}</span></div> }
  />
  
  
  <ConnectButton
  Tezos={Tezos}
  setWallet={setWallet}
  userAddress={userAddress}
  setUserAddress={setUserAddress}
  setUserBalance={setUserBalance}
  wallet={wallet!}
  disconnectWallet={disconnectWallet}
  activeAccount={activeAccount!}
  setActiveAccount={setActiveAccount}
  />
  
  {userAddress?
    <ConnectButtonL2 
    userL2Address={userL2Address}
    setUserL2Address={setUserL2Address}
    setUserL2Balance={setUserL2Balance}
    wallet={wallet!}
    activeAccount={activeAccount!}
    setActiveAccount={setActiveAccount}
    />:""}
    
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
    wallet={wallet!}
    setUserAddress={setUserAddress}
    setUserBalance={setUserBalance}
    setWallet={setWallet}
    setActivePage={setActivePage}
    />
    </MenuItem>
    </Menu>
    
    {activePage === PAGES.DEPOSIT?
      <Deposit
      Tezos={Tezos}
      wallet={wallet!}
      userAddress={userAddress}
      rollupType={rollupType}
      setRollupType={setRollupType}
      rollup={rollup}
      setRollup={setRollup}
      />
      :
      activePage === PAGES.WITHDRAW ? 
      <Withdraw 
      Tezos={Tezos}
      wallet={wallet!}
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
      <li>DEKU sidechain : <a href="https://www.marigold.dev/project/deku-sidechain">DEKU documentation</a></li>
      <li>CHUSAI rollups : <a href="https://github.com/marigold-dev/chusai">CHUSAI documentation</a></li>
      </ul>
      </Box>
      : "PAGE NOT FOUND" 
    }
    
    
    
    </div>
    
    
    
    );
  }
  
  export default App;