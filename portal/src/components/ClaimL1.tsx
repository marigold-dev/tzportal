import React, { useState, useEffect, MouseEvent, Fragment, useRef, SetStateAction, Dispatch } from "react";
import { BigMapAbstraction, compose, Contract, OpKind, TezosToolkit, WalletContract, WalletOperationBatch, WalletParamsWithKind } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import Button from "@mui/material/Button";
import { Avatar, Backdrop, Badge, Box, Card, CardContent, CardHeader, Chip, CircularProgress, Divider, Grid, IconButton, InputAdornment, InputLabel, ListItem, MenuItem, Paper, Popover, Select, SelectChangeEvent, Stack, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import { AccountBalanceWallet, AccountCircle, AddShoppingCartOutlined, ArrowDropDown, CameraRoll, SwapCallsRounded, SwapHorizontalCircleOutlined, SwapHorizOutlined, SwapHorizRounded } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { TransactionInvalidBeaconError } from "./TransactionInvalidBeaconError";
import {  ContractFAParameters, ContractFAStorage, ContractParameters, ContractStorage, ContractXTZParameters } from "./TicketerContractUtils";
import {  getBytes, getTokenBytes, LAYER2Type, RollupCHUSAI, RollupDEKU, RollupTORU, ROLLUP_TYPE, TezosUtils, TOKEN_TYPE } from "./TezosUtils";
import { FA12Contract } from "./fa12Contract";
import BigNumber from 'bignumber.js';
import {  styled } from "@mui/system";
import { OperationContentsAndResultTransaction , OperationResultTransaction} from "@taquito/rpc";
import UserWallet from "./UserWallet";
import RollupBox, { RollupBoxComponentType } from "./RollupBox";
import { TokenMetadata, tzip12, Tzip12ContractAbstraction } from "@taquito/tzip12";
import { tzip16 } from "@taquito/tzip16";
import { FA2Contract } from "./fa2Contract";
import { AccountInfo, NetworkType} from "@airgap/beacon-types";
import { RollupParameters, RollupParametersDEKU, RollupParametersTORU } from "./RollupParameters";



type ClaimL1Props = {
};

const ClaimL1 = ({
}: ClaimL1Props): JSX.Element => {
    
    
    return (
        <Grid container  borderRadius={5}
    spacing={2}
    color="primary.main" 
    width="auto"
    sx={{ margin : "20vh 20vw", padding : "2em"}}
    bgcolor="secondary.main">
        
        ClaimL1   
        
        
        </Grid>
        );
    };
    
    export default ClaimL1;
    
    
    