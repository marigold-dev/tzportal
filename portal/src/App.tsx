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
import { ArchiveOutlined, ArrowDropDown, Badge, CameraRoll, SettingsBackupRestoreOutlined } from '@mui/icons-material';
import { Button, CardHeader, Chip, Grid, makeStyles, Paper, Popover, Select, SelectChangeEvent } from '@mui/material';
import Deposit from './components/Deposit';
import { AccountInfo, NetworkType} from "@airgap/beacon-types";
import Withdraw from './components/Withdraw';
import { Tzip12Module } from "@taquito/tzip12";
import { LAYER2Type, RollupCHUSAI, RollupDEKU, RollupTORU, ROLLUP_TYPE } from './components/TezosUtils';
import styled from '@emotion/styled';
import ConnectButtonL2 from './components/ConnectWalletL2';
import { BeaconWallet } from '@taquito/beacon-wallet';
import DepositWithdrawV2 from './components/DepositWithdrawV2';
import { InMemorySigner } from '@taquito/signer';
import TransferL2 from './components/TransferL2';


export enum PAGES {
  "WELCOME",
  "DEPOSIT",
  "WITHDRAW",
  "DEPOSITWITHDRAWV2"
};

function App() {
  
  const [Tezos, setTezos] = useState<TezosToolkit>(new TezosToolkit(process.env["REACT_APP_TEZOS_NODE"]!));
  const [TezosL2, setTezosL2] = useState<TezosToolkit>(new TezosToolkit(process.env["REACT_APP_TEZOS_NODE"]!));
  
  Tezos.setPackerProvider(new MichelCodecPacker());
  Tezos.addExtension(new Tzip12Module());
  
  const [wallet, setWallet] = useState<BeaconWallet|undefined>();
  
  const [activeAccount, setActiveAccount] = useState<AccountInfo>(); //used to display selected wallet
  const [accounts, setAccounts] = useState<AccountInfo[]>([]); //used to track both wallets

  
  
  const [userAddress, setUserAddress] = useState<string>("");
  const [userL2Address, setUserL2Address] = useState<string>("");//
  
  
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
     let wallet = new BeaconWallet({
      name: "TzPortal",
      preferredNetwork: process.env["REACT_APP_NETWORK"]? NetworkType[process.env["REACT_APP_NETWORK"].toUpperCase() as keyof typeof NetworkType]  : NetworkType.JAKARTANET,
    });
     Tezos.setWalletProvider(wallet);
    setWallet(wallet);  
    }
    
    const disconnectWallet = async (e:any): Promise<void> => {
      setUserAddress("");
      const newAccounts = accounts.filter(a => a.address===userL2Address && a.accountIdentifier===LAYER2Type.L2_DEKU); 
      setAccounts(newAccounts);//keep only L2 if still exists
      if(newAccounts.length==1)setActiveAccount(newAccounts[0])//set a activeAcccount
      await wallet!.disconnect();
      await wallet!.client.destroy();
      console.log("Wallet L1 disconnected");
      await createWallet();
    };

    const disconnectWalletL2 = async (e:any): Promise<void> => {
      setUserL2Address("");
      const newAccounts = accounts.filter(a => a.address===userAddress && a.accountIdentifier!==LAYER2Type.L2_DEKU); 
      setAccounts(newAccounts);//keep only L1 if still exists
      if(newAccounts.length==1)setActiveAccount(newAccounts[0])//set a activeAcccount
      TezosL2.setSignerProvider(undefined);
      console.log("Wallet L2 disconnected");
    };
    
    const [rollupType , setRollupType] = useState<ROLLUP_TYPE>(ROLLUP_TYPE.DEKU);
    const [selectedRollupType , setSelectedRollupType] = useState<string>(ROLLUP_TYPE.DEKU.name);
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
  
  
  React.useEffect(() => { (async () => {
    await createWallet();
  })();
}, []);


return (
  <div style={{backgroundImage : "url('/bg.jpg')" , minHeight: "100vh" ,backgroundSize: "cover"}} >
  
  
  
  {(network != NetworkType.MAINNET)?<div className="banner">WARNING: TEST ONLY {network}</div>:<span />}
  
  <Grid bgcolor="#00000080" >
  <Typography color="secondary.main" variant="h4">TzPortal</Typography>
  
  <Select 
  id="layer2-select"
  defaultValue={ROLLUP_TYPE.DEKU.name}
  value={selectedRollupType}
  label="Rollup type"
  sx={{bgcolor:"white"}}
  onChange={(e : SelectChangeEvent)=>{setSelectedRollupType(e.target.value); setRollupType(ROLLUP_TYPE[e.target.value as keyof typeof ROLLUP_TYPE])}}
  >
  <MenuItem key={ROLLUP_TYPE.DEKU.name} value={ROLLUP_TYPE.DEKU.name}>
  <Chip sx={{border: "none"}}
  avatar={<Avatar alt="Natacha" src="DEKU.png" />}
  label={ROLLUP_TYPE.DEKU.name}
  variant="outlined"
  />
  </MenuItem>
  
  <MenuItem key={ROLLUP_TYPE.CHUSAI.name} value={ROLLUP_TYPE.CHUSAI.name}>
  <Chip sx={{border: "none"}}
  avatar={<Avatar alt="Natacha" src="CHUSAI.png" />}
  label={ROLLUP_TYPE.CHUSAI.name}
  variant="outlined"
  />
  </MenuItem>
  
  <MenuItem key={ROLLUP_TYPE.TORU.name} value={ROLLUP_TYPE.TORU.name}>
  <Chip sx={{border: "none"}}
  avatar={<Avatar alt="Natacha" src="TORU.png" />}
  label={ROLLUP_TYPE.TORU.name}
  variant="outlined"
  />
  </MenuItem>
  
  
  
  
  </Select>
  
  
  <ConnectButton
  Tezos={Tezos}
  setWallet={setWallet}
  userAddress={userAddress}
  setUserAddress={setUserAddress}
  wallet={wallet!}
  disconnectWallet={disconnectWallet}
  activeAccount={activeAccount!}
  setActiveAccount={setActiveAccount}
  accounts={accounts}
  />
  
 
    <ConnectButtonL2 
    userL2Address={userL2Address}
    setUserL2Address={setUserL2Address}
    TezosL2={TezosL2!}
    activeAccount={activeAccount!}
    setActiveAccount={setActiveAccount}
    accounts={accounts}
    disconnectWalletL2={disconnectWalletL2}
    />
    
    </Grid>
    
    
  
    {
      (userAddress && userL2Address)? 
      <DepositWithdrawV2 
      Tezos={Tezos}
      wallet={wallet!}
      TezosL2={TezosL2}
      userAddress={userAddress}
      userL2Address={userL2Address}
      rollupType={rollupType}
      setRollupType={setRollupType}
      rollup={rollup}
      setRollup={setRollup}
      activeAccount={activeAccount}
      setActiveAccount={setActiveAccount}
      accounts={accounts}
      />
      :
      ( !userAddress && userL2Address )? 
      <TransferL2 />
      : 
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
       
    }
    
    
    
    </div>
    
    
    
    );
  }
  
  export default App;